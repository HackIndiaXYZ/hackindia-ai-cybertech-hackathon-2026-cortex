"""
Forecast service — implements the 4-step fallback chain.

Fallback order:
  1. primary       — environment_analyzer / design_ml (existing model)
  2. api           — Open-Meteo 7-day forecast from weather_service
  3. automl_backup — FLAML-trained per-location model (or seasonal naive)
  4. seasonal_naive — from stored history

Each step is guarded by:
  - A 5-second asyncio timeout
  - Exception catching
  - NaN / out-of-range output validation

The response always carries: source, is_fallback, generated_at, model_version.

NOTE: The primary model in this project is the environment classifier, not a
temperature forecaster. "Primary" here means: attempt the live weather API
forecast (which gives temp_max/min for 7 days from Open-Meteo) as the primary
source. If that fails, try AutoML. This preserves the existing app behaviour
untouched.
"""

import asyncio
import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.schemas.forecast_schema import ForecastDayItem, ForecastResponse
from app.services import automl_forecaster, backfill_service, history_store
from app.services.backfill_service import make_location_key

logger = logging.getLogger(__name__)

_FORECAST_TIMEOUT_S: float = 5.0  # configurable, matches spec requirement


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_valid_temp(val: Optional[float]) -> bool:
    if val is None or (isinstance(val, float) and math.isnan(val)):
        return False
    return -60.0 <= val <= 60.0


def _validate_forecast_days(days: List[dict], horizon: int) -> bool:
    """Return True only if we have at least one day with a valid temperature."""
    if not days:
        return False
    valid_count = sum(
        1
        for d in days
        if _is_valid_temp(d.get("temp_mean")) or _is_valid_temp(d.get("temp_max"))
    )
    return valid_count >= min(1, horizon)


def _items_from_daily_api(
    daily_forecast, horizon: int
) -> Optional[List[ForecastDayItem]]:
    """
    Build ForecastDayItem list from WeatherInfo.daily_forecast (WeatherService).
    Returns None if the forecast is empty or invalid.
    """
    if not daily_forecast:
        return None

    items = []
    for item in daily_forecast[:horizon]:
        # temp_mean approximated as average of max/min when not directly available
        temp_mean = None
        if item.temp_max is not None and item.temp_min is not None:
            temp_mean = round((item.temp_max + item.temp_min) / 2, 2)
        items.append(
            ForecastDayItem(
                date=item.date,
                temp_max=item.temp_max,
                temp_min=item.temp_min,
                temp_mean=temp_mean,
                humidity=None,
                precipitation=None,
            )
        )
    if not items:
        return None
    return items


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def get_forecast(
    lat: float,
    lng: float,
    horizon: int = 1,
    location_name: Optional[str] = None,
) -> ForecastResponse:
    """
    Produce a temperature forecast following the fallback chain.

    Chain:
      "primary" (live API 7-day forecast from Open-Meteo, already called by
                 the existing /analyze endpoint)
        → "api"  (retry/dedicated weather API call)
        → "automl_backup" (FLAML or seasonal naive from local history)
        → "seasonal_naive" (last-resort, always available if history > 3 rows)

    Never raises — returns a valid ForecastResponse at every step.
    """
    location_key = make_location_key(lat, lng)
    location_label = location_name or location_key
    generated_at = _now_iso()

    # ── Step 1: primary / api — live weather service ─────────────────────────
    try:
        api_result = await asyncio.wait_for(
            _fetch_api_forecast(lat, lng, horizon),
            timeout=_FORECAST_TIMEOUT_S,
        )
        if api_result:
            is_primary = True  # live API is the best we have for temperature
            return ForecastResponse(
                location=location_label,
                horizon=horizon,
                forecast=api_result,
                source="primary",
                is_fallback=False,
                generated_at=generated_at,
                model_version=None,
                warning=None,
            )
    except asyncio.TimeoutError:
        logger.warning("API forecast timed out for %s (%.1fs)", location_key, _FORECAST_TIMEOUT_S)
    except Exception as exc:  # noqa: BLE001
        logger.warning("API forecast failed for %s: %s", location_key, exc)

    # ── Step 2: AutoML backup ─────────────────────────────────────────────────
    try:
        automl_days = await asyncio.wait_for(
            asyncio.to_thread(automl_forecaster.forecast_automl, lat, lng, horizon),
            timeout=_FORECAST_TIMEOUT_S,
        )
        if automl_days and _validate_forecast_days(automl_days, horizon):
            bundles = automl_forecaster.load_model(location_key)
            bundle = bundles.get(horizon) if bundles else None
            version = bundle.get("version") if bundle else None
            accepted = bundle.get("accepted") if bundle else False
            source = "automl_backup" if accepted else "seasonal_naive"

            items = [
                ForecastDayItem(
                    date=d.get("date", ""),
                    temp_max=d.get("temp_max"),
                    temp_min=d.get("temp_min"),
                    temp_mean=d.get("temp_mean"),
                    humidity=d.get("humidity"),
                    precipitation=d.get("precipitation"),
                )
                for d in automl_days
            ]

            return ForecastResponse(
                location=location_label,
                horizon=horizon,
                forecast=items,
                source=source,
                is_fallback=True,
                generated_at=generated_at,
                model_version=version,
                warning=(
                    "Backup forecast: primary API was unavailable. "
                    "AutoML on past temperature is a statistical backup — "
                    "accuracy drops after day 3–4 and is NOT a replacement "
                    "for a numerical weather model."
                ),
            )
    except asyncio.TimeoutError:
        logger.warning("AutoML forecast timed out for %s", location_key)
    except Exception as exc:  # noqa: BLE001
        logger.warning("AutoML forecast failed for %s: %s", location_key, exc)

    # ── Step 3: Seasonal naive (last resort) ──────────────────────────────────
    try:
        rows = history_store.query_history(location_key)
        if len(rows) >= 3:
            import pandas as pd
            df = pd.DataFrame([r.model_dump() for r in rows])
            sn_days = automl_forecaster._seasonal_naive_forecast(df, horizon)
            if not sn_days.empty:
                items = [
                    ForecastDayItem(
                        date=row_s["date"],
                        temp_max=row_s.get("temp_max"),
                        temp_min=row_s.get("temp_min"),
                        temp_mean=row_s.get("temp_mean"),
                        humidity=row_s.get("humidity"),
                        precipitation=row_s.get("precipitation"),
                    )
                    for _, row_s in sn_days.iterrows()
                ]
                return ForecastResponse(
                    location=location_label,
                    horizon=horizon,
                    forecast=items,
                    source="seasonal_naive",
                    is_fallback=True,
                    generated_at=generated_at,
                    model_version=None,
                    warning=(
                        "Seasonal naive fallback: all forecast sources failed. "
                        "Values are averages of the same day-of-year from stored history."
                    ),
                )
    except Exception as exc:  # noqa: BLE001
        logger.error("Seasonal naive fallback failed for %s: %s", location_key, exc)

    # ── Nothing worked ────────────────────────────────────────────────────────
    logger.error("All forecast sources failed for %s horizon=%d", location_key, horizon)
    return ForecastResponse(
        location=location_label,
        horizon=horizon,
        forecast=[],
        source="seasonal_naive",
        is_fallback=True,
        generated_at=generated_at,
        model_version=None,
        warning="All forecast sources exhausted. No data available.",
    )


async def _fetch_api_forecast(
    lat: float, lng: float, horizon: int
) -> Optional[List[ForecastDayItem]]:
    """
    Call the existing weather_service to get the Open-Meteo 7-day daily forecast.
    Reuses the already-existing get_weather() — no duplication.
    """
    from app.services.weather_service import get_weather  # avoid circular at module level

    weather = await get_weather(lat, lng)
    if not weather or not weather.daily_forecast:
        return None

    items = _items_from_daily_api(weather.daily_forecast, horizon)
    if not items:
        return None

    # Validate all returned temps
    for item in items:
        if not (_is_valid_temp(item.temp_max) or _is_valid_temp(item.temp_min)):
            raise ValueError(f"Invalid temperature in API forecast item {item.date}")

    return items
