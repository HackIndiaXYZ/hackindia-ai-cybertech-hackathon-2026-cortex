"""
Historical data backfill service.

Fetches the last N years of daily weather from the Open-Meteo Historical Archive
(free, no API key) and inserts/upserts into weather_history via history_store.

Reuses the same archive URL and variable list already used by climate_service.py.
Keeps the same layered structure (service → external API).
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.forecast_schema import WeatherHistoryRow
from app.services import history_store

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants (configurable via settings)
# ---------------------------------------------------------------------------
_ARCHIVE_URL: str = getattr(
    settings,
    "OPEN_METEO_ARCHIVE_URL",
    "https://archive-api.open-meteo.com/v1/archive",
)
_BACKFILL_YEARS: int = getattr(settings, "BACKFILL_YEARS", 3)
_HTTP_TIMEOUT: float = getattr(settings, "HISTORY_HTTP_TIMEOUT", 30.0)

_DAILY_VARS = (
    "temperature_2m_max,"
    "temperature_2m_min,"
    "temperature_2m_mean,"
    "precipitation_sum,"
    "wind_speed_10m_max"
)
# Hourly humidity averaged to daily below
_HOURLY_VARS = "relative_humidity_2m"


def make_location_key(lat: float, lng: float, precision: int = 4) -> str:
    """
    Produce a stable, URL-safe location key from rounded coordinates.
    E.g. 26.45_80.33
    """
    return f"{round(lat, precision)}_{round(lng, precision)}"


async def backfill_location(
    lat: float,
    lng: float,
    years: Optional[int] = None,
    force: bool = False,
) -> dict:
    """
    Fetch up to `years` years of historical daily data from Open-Meteo Archive
    and upsert into weather_history.

    If `force` is False and the location already has >= 90 rows, skip the
    backfill (assume it was done previously).

    Returns a summary dict: {location_key, rows_fetched, accepted, rejected, skipped}.
    """
    years = years or _BACKFILL_YEARS
    location_key = make_location_key(lat, lng)

    existing = history_store.count_rows(location_key)
    if not force and existing >= 90:
        logger.info(
            "Backfill skipped for %s — already has %d rows.", location_key, existing
        )
        return {
            "location_key": location_key,
            "rows_fetched": 0,
            "accepted": 0,
            "rejected": 0,
            "skipped": True,
        }

    now = datetime.now(timezone.utc)
    end_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    start_date = (now - timedelta(days=365 * years)).strftime("%Y-%m-%d")

    logger.info(
        "Starting backfill for %s (%s → %s)", location_key, start_date, end_date
    )

    params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": start_date,
        "end_date": end_date,
        "daily": _DAILY_VARS,
        "hourly": _HOURLY_VARS,
        "timezone": "UTC",
    }

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(_ARCHIVE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException as exc:
        logger.error("Backfill timeout for %s: %s", location_key, exc)
        return {"location_key": location_key, "error": "timeout", "skipped": False}
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Backfill HTTP error %s for %s: %s",
            exc.response.status_code,
            location_key,
            exc.response.text,
        )
        return {"location_key": location_key, "error": str(exc), "skipped": False}
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected backfill error for %s: %s", location_key, exc)
        return {"location_key": location_key, "error": str(exc), "skipped": False}

    rows = _parse_archive_response(data, location_key, lat, lng)
    logger.info("Parsed %d rows for %s", len(rows), location_key)

    summary = history_store.upsert_rows(rows)
    summary["location_key"] = location_key
    summary["rows_fetched"] = len(rows)
    summary["skipped"] = False
    return summary


async def append_latest_day(lat: float, lng: float) -> dict:
    """
    Fetch yesterday's data and upsert it. Called by the daily scheduler.
    """
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    location_key = make_location_key(lat, lng)

    params = {
        "latitude": lat,
        "longitude": lng,
        "start_date": yesterday,
        "end_date": yesterday,
        "daily": _DAILY_VARS,
        "hourly": _HOURLY_VARS,
        "timezone": "UTC",
    }

    try:
        async with httpx.AsyncClient(timeout=_HTTP_TIMEOUT) as client:
            resp = await client.get(_ARCHIVE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "append_latest_day failed for %s on %s: %s", location_key, yesterday, exc
        )
        return {"location_key": location_key, "error": str(exc)}

    rows = _parse_archive_response(data, location_key, lat, lng)
    if not rows:
        logger.warning("No rows parsed for %s on %s", location_key, yesterday)
        return {"location_key": location_key, "rows_fetched": 0}

    summary = history_store.upsert_rows(rows)
    summary["location_key"] = location_key
    summary["rows_fetched"] = len(rows)
    return summary


def save_live_observation(
    lat: float,
    lng: float,
    date: str,
    temp_max: Optional[float],
    temp_min: Optional[float],
    temp_mean: Optional[float],
    humidity: Optional[float],
    precipitation: Optional[float],
    wind: Optional[float],
) -> bool:
    """
    Persist a single live API observation to weather_history.
    Called from the weather_service after a successful live fetch.
    Never raises; returns True on success.
    """
    location_key = make_location_key(lat, lng)
    row = WeatherHistoryRow(
        location_key=location_key,
        lat=lat,
        lng=lng,
        date=date,
        temp_max=temp_max,
        temp_min=temp_min,
        temp_mean=temp_mean,
        humidity=humidity,
        precipitation=precipitation,
        wind=wind,
        source="live_api",
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
    try:
        return history_store.upsert_row(row)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "Failed to save live observation for %s on %s: %s",
            location_key,
            date,
            exc,
        )
        return False


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _parse_archive_response(
    data: dict,
    location_key: str,
    lat: float,
    lng: float,
) -> list:
    """
    Transform a raw Open-Meteo archive response into a list of WeatherHistoryRow.
    Skips days where all temperature columns are None.
    """
    import pandas as pd

    daily = data.get("daily", {})
    hourly = data.get("hourly", {})

    dates = daily.get("time", [])
    if not dates:
        return []

    df = pd.DataFrame(
        {
            "date": dates,
            "temp_max": daily.get("temperature_2m_max", [None] * len(dates)),
            "temp_min": daily.get("temperature_2m_min", [None] * len(dates)),
            "temp_mean": daily.get("temperature_2m_mean", [None] * len(dates)),
            "precipitation": daily.get("precipitation_sum", [None] * len(dates)),
            "wind": daily.get("wind_speed_10m_max", [None] * len(dates)),
        }
    )

    # Aggregate hourly humidity to daily mean
    if hourly and "time" in hourly and "relative_humidity_2m" in hourly:
        h_df = pd.DataFrame(
            {
                "hour": pd.to_datetime(hourly["time"]),
                "humidity": pd.to_numeric(hourly["relative_humidity_2m"], errors="coerce"),
            }
        )
        h_df["date"] = h_df["hour"].dt.strftime("%Y-%m-%d")
        daily_hum = h_df.groupby("date")["humidity"].mean().reset_index()
        daily_hum.columns = ["date", "humidity"]
        df = df.merge(daily_hum, on="date", how="left")
    else:
        df["humidity"] = None

    fetched_at = datetime.now(timezone.utc).isoformat()
    rows = []
    for _, r in df.iterrows():
        rows.append(
            WeatherHistoryRow(
                location_key=location_key,
                lat=lat,
                lng=lng,
                date=str(r["date"]),
                temp_max=_safe_float(r.get("temp_max")),
                temp_min=_safe_float(r.get("temp_min")),
                temp_mean=_safe_float(r.get("temp_mean")),
                humidity=_safe_float(r.get("humidity")),
                precipitation=_safe_float(r.get("precipitation")),
                wind=_safe_float(r.get("wind")),
                source="open_meteo_archive",
                fetched_at=fetched_at,
            )
        )
    return rows


def _safe_float(val) -> Optional[float]:
    """Convert a value to float, returning None for NaN/None."""
    import math

    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (TypeError, ValueError):
        return None
