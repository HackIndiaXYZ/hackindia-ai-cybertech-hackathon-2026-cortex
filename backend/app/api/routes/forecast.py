"""
Forecast and history API routes.

New endpoints (matches existing project route style):
  GET /api/history       — stored daily weather records
  GET /api/forecast      — fallback-chain temperature forecast
  GET /api/backup/status — AutoML model health per location

These routes do NOT modify any existing route or response contract.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.analysis_schema import ErrorDetail
from app.schemas.forecast_schema import (
    BackupStatusEntry,
    BackupStatusResponse,
    ForecastResponse,
    HistoryResponse,
)
from app.services import automl_forecaster, backfill_service, history_store, scheduler
from app.services.backfill_service import make_location_key
from app.services.forecast_service import get_forecast

router = APIRouter()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# GET /history
# ---------------------------------------------------------------------------


@router.get(
    "/history",
    response_model=HistoryResponse,
    summary="Get stored daily weather history",
    description=(
        "Returns daily weather records stored in the local SQLite database "
        "for the nearest tracked location key. "
        "Use `from` and `to` (YYYY-MM-DD) to filter by date range."
    ),
    responses={
        200: {"description": "History records returned."},
        422: {"description": "Validation error."},
    },
)
async def get_history(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude."),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude."),
    from_date: Optional[str] = Query(None, alias="from", description="Start date YYYY-MM-DD."),
    to_date: Optional[str] = Query(None, alias="to", description="End date YYYY-MM-DD."),
) -> HistoryResponse:
    location_key = make_location_key(lat, lng)
    rows = history_store.query_history(location_key, from_date=from_date, to_date=to_date)
    return HistoryResponse(
        location_key=location_key,
        from_date=from_date,
        to_date=to_date,
        rows=rows,
        count=len(rows),
    )


# ---------------------------------------------------------------------------
# GET /forecast
# ---------------------------------------------------------------------------


@router.get(
    "/forecast",
    response_model=ForecastResponse,
    summary="Get climate forecast following the fallback chain",
    description=(
        "Returns a temperature forecast for the given location and horizon. "
        "Fallback order: live weather API → AutoML backup → seasonal naive. "
        "The `source` field and `is_fallback` flag indicate which step was used. "
        "Show a 'Backup forecast' badge in the UI only when `is_fallback` is true.\n\n"
        "**Important**: The AutoML backup is a statistical model based on past temperature "
        "patterns — it is NOT a numerical weather model. Accuracy degrades after day 3–4."
    ),
    responses={
        200: {"description": "Forecast returned."},
        422: {"description": "Validation error."},
    },
)
async def forecast_endpoint(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude."),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude."),
    horizon: int = Query(1, ge=1, le=7, description="Forecast horizon in days (1 or 7)."),
    location: Optional[str] = Query(None, description="Human-readable location name (optional)."),
) -> ForecastResponse:
    # Register for daily updates and future retraining
    scheduler.register_location(lat, lng)

    # Trigger a backfill if the location is new (non-blocking in background)
    import asyncio
    import threading

    location_key = make_location_key(lat, lng)
    row_count = history_store.count_rows(location_key)
    if row_count == 0:
        logger.info(
            "New location %s — triggering background backfill.", location_key
        )
        def _backfill():
            loop = asyncio.new_event_loop()
            try:
                loop.run_until_complete(backfill_service.backfill_location(lat, lng))
            finally:
                loop.close()

        t = threading.Thread(target=_backfill, daemon=True)
        t.start()

    return await get_forecast(lat=lat, lng=lng, horizon=horizon, location_name=location)


# ---------------------------------------------------------------------------
# GET /backup/status
# ---------------------------------------------------------------------------


@router.get(
    "/backup/status",
    response_model=BackupStatusResponse,
    summary="AutoML backup model health report",
    description=(
        "Returns the last training time, model version, MAE metrics, and history "
        "row count for every tracked location."
    ),
    responses={200: {"description": "Status report returned."}},
    tags=["Forecast Backup"],
)
async def backup_status() -> BackupStatusResponse:
    location_keys = history_store.get_all_location_keys()
    entries = []

    for location_key in location_keys:
        row_count = history_store.count_rows(location_key)
        metrics = automl_forecaster.get_location_status(location_key)

        entry = BackupStatusEntry(
            location_key=location_key,
            history_rows=row_count,
            last_trained_at=metrics.get("trained_at"),
            model_version=metrics.get("version"),
        )

        # Pull MAE for day-1 and day-7 from metrics.json
        h1 = metrics.get("horizons", {}).get("h1", {})
        h7 = metrics.get("horizons", {}).get("h7", {})
        bt1 = h1.get("backtest_metrics", {})
        bt7 = h7.get("backtest_metrics", {})
        entry.mae_day1_temp_mean = bt1.get("automl_mae")
        entry.mae_day7_temp_mean = bt7.get("automl_mae")
        entry.model_accepted = h1.get("accepted") or h7.get("accepted")

        # Determine what is being served
        bundles = automl_forecaster.load_model(location_key)
        if bundles:
            h1_bundle = bundles.get(1, {})
            serving = "automl" if h1_bundle.get("accepted") else "seasonal_naive"
        else:
            serving = "seasonal_naive" if row_count >= 3 else "none"
        entry.serving_model = serving

        entries.append(entry)

    return BackupStatusResponse(
        locations=entries,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
