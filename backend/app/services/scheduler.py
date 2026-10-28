"""
Background scheduler for:
  1. Daily data append  — appends yesterday's weather to each tracked location.
  2. Weekly retraining  — retrains the AutoML model for each tracked location
                         when new data adds >= 7 days since the last training.

Design:
  - Uses Python's built-in threading.Timer (no external scheduler library needed).
  - Never blocks request handling.
  - New locations added via /forecast are registered automatically.
  - Interval settings are read from app.core.config (env-overridable).
"""

import asyncio
import logging
import threading
from datetime import datetime, timezone
from typing import Dict, Set

from app.core.config import settings
from app.services import automl_forecaster, backfill_service, history_store

logger = logging.getLogger(__name__)

# Intervals (seconds). Overridable via env vars.
_DAILY_INTERVAL_S: int = int(getattr(settings, "SCHEDULER_DAILY_INTERVAL_S", 86400))  # 24h
_RETRAIN_INTERVAL_S: int = int(getattr(settings, "SCHEDULER_RETRAIN_INTERVAL_S", 604800))  # 7 days
_RETRAIN_NEW_DATA_ROWS: int = int(getattr(settings, "SCHEDULER_RETRAIN_NEW_DATA_ROWS", 7))

# Registry: location_key → {lat, lng, last_train_rows}
_tracked: Dict[str, dict] = {}
_tracked_lock = threading.Lock()

_daily_timer: threading.Timer = None  # type: ignore[assignment]
_retrain_timer: threading.Timer = None  # type: ignore[assignment]
_started = False


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def register_location(lat: float, lng: float) -> None:
    """Mark a location as tracked for daily updates and retraining."""
    location_key = backfill_service.make_location_key(lat, lng)
    with _tracked_lock:
        if location_key not in _tracked:
            _tracked[location_key] = {
                "lat": lat,
                "lng": lng,
                "last_train_rows": 0,
            }
            logger.info("Scheduler: registered location %s", location_key)


def start_scheduler() -> None:
    """Start both the daily and weekly background timers once."""
    global _started
    if _started:
        return
    _started = True
    logger.info("Background scheduler starting (daily=%ds, retrain=%ds).", _DAILY_INTERVAL_S, _RETRAIN_INTERVAL_S)
    _schedule_daily()
    _schedule_retrain()


def stop_scheduler() -> None:
    """Cancel pending timers (called at app shutdown)."""
    global _daily_timer, _retrain_timer, _started
    _started = False
    if _daily_timer:
        _daily_timer.cancel()
    if _retrain_timer:
        _retrain_timer.cancel()
    logger.info("Background scheduler stopped.")


# ---------------------------------------------------------------------------
# Daily job — append yesterday's data for all tracked locations
# ---------------------------------------------------------------------------

def _schedule_daily() -> None:
    global _daily_timer
    _daily_timer = threading.Timer(_DAILY_INTERVAL_S, _run_daily)
    _daily_timer.daemon = True
    _daily_timer.start()


def _run_daily() -> None:
    """Append yesterday's archive data for every tracked location."""
    logger.info("Daily scheduler tick: appending yesterday's data.")
    with _tracked_lock:
        locations = list(_tracked.values())

    loop = asyncio.new_event_loop()
    try:
        for loc in locations:
            try:
                result = loop.run_until_complete(
                    backfill_service.append_latest_day(loc["lat"], loc["lng"])
                )
                logger.info("Daily append result: %s", result)
            except Exception as exc:  # noqa: BLE001
                logger.error("Daily append failed for %s: %s", loc, exc)
    finally:
        loop.close()

    if _started:
        _schedule_daily()


# ---------------------------------------------------------------------------
# Weekly retrain job — retrain when enough new data has accumulated
# ---------------------------------------------------------------------------

def _schedule_retrain() -> None:
    global _retrain_timer
    _retrain_timer = threading.Timer(_RETRAIN_INTERVAL_S, _run_retrain)
    _retrain_timer.daemon = True
    _retrain_timer.start()


def _run_retrain() -> None:
    """Retrain AutoML models for locations where new rows exceed the threshold."""
    logger.info("Retrain scheduler tick.")
    with _tracked_lock:
        locations = dict(_tracked)

    for location_key, meta in locations.items():
        try:
            current_rows = history_store.count_rows(location_key)
            last_rows = meta.get("last_train_rows", 0)

            if current_rows < automl_forecaster._MIN_TRAINING_ROWS:
                logger.info(
                    "Retrain skipped for %s — %d rows < %d minimum.",
                    location_key,
                    current_rows,
                    automl_forecaster._MIN_TRAINING_ROWS,
                )
                continue

            if current_rows - last_rows < _RETRAIN_NEW_DATA_ROWS:
                logger.info(
                    "Retrain skipped for %s — only %d new rows since last train.",
                    location_key,
                    current_rows - last_rows,
                )
                continue

            logger.info("Starting background retrain for %s (%d rows).", location_key, current_rows)
            t = threading.Thread(
                target=_train_in_thread,
                args=(meta["lat"], meta["lng"], location_key, current_rows),
                daemon=True,
            )
            t.start()

        except Exception as exc:  # noqa: BLE001
            logger.error("Retrain scheduler error for %s: %s", location_key, exc)

    if _started:
        _schedule_retrain()


def _train_in_thread(lat: float, lng: float, location_key: str, rows_at_start: int) -> None:
    """Wrapper to run training and update the last_train_rows counter."""
    try:
        automl_forecaster.train_location(lat, lng)
        with _tracked_lock:
            if location_key in _tracked:
                _tracked[location_key]["last_train_rows"] = rows_at_start
        logger.info("Retrain complete for %s", location_key)
    except Exception as exc:  # noqa: BLE001
        logger.error("Training thread failed for %s: %s", location_key, exc)
