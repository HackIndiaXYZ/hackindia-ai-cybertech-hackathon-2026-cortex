"""
Climate service for historical weather analysis.

Calls the Open-Meteo Historical Archive API, cleans data with pandas,
interpolates small gaps, computes monthly aggregates and bioclimatic indicators,
and caches results in-memory.
"""

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
import pandas as pd

from app.schemas.climate_schema import (
    ClimateDerivedMetrics,
    ClimateResponse,
    DataQuality,
    MonthlyClimateSummary,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load Configuration from JSON (per Rule 2 & 4: never hardcode constants)
# ---------------------------------------------------------------------------
CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "openmeteo.json"
)

def _load_config() -> Dict[str, Any]:
    """Loads Open-Meteo configuration from backend/app/config/openmeteo.json."""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning("Could not read openmeteo.json (%s), using safe defaults", exc)
        return {
            "source": "Open-Meteo Historical Weather Archive API",
            "verified": False,
            "archive_url": "https://archive-api.open-meteo.com/v1/archive",
            "timeout_seconds": 20.0,
            "max_retries": 2,
            "default_years": 5,
            "daily_variables": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "wind_speed_10m_max",
                "shortwave_radiation_sum",
            ],
            "hourly_variables": ["relative_humidity_2m"],
            "qc_rules": {
                "temperature_min_valid": -90.0,
                "temperature_max_valid": 60.0,
                "interpolation_max_gap_days": 3,
                "hot_day_threshold_c": 40.0,
                "cold_day_threshold_c": 5.0,
            },
            "cache_ttl_seconds": 86400,
            "cache_coord_precision": 2,
        }

CONFIG = _load_config()

# ---------------------------------------------------------------------------
# Simple In-Memory Cache (Key = (lat_rounded, lon_rounded, years))
# ---------------------------------------------------------------------------
_cache: Dict[str, Tuple[float, ClimateResponse]] = {}


def _get_cache_key(lat: float, lon: float, years: int) -> str:
    """Generates a rounded coordinate cache key."""
    precision = CONFIG.get("cache_coord_precision", 2)
    return f"{round(lat, precision)}_{round(lon, precision)}_{years}"


def clear_cache() -> None:
    """Clears the in-memory climate cache (useful for testing)."""
    _cache.clear()


# ---------------------------------------------------------------------------
# Custom Exceptions
# ---------------------------------------------------------------------------
class ClimateServiceError(Exception):
    """Raised when climate data fetching or processing fails."""


# ---------------------------------------------------------------------------
# Core Analysis & Transformation Functions
# ---------------------------------------------------------------------------
def _compute_calendar_date_range(years: int) -> Tuple[str, str]:
    """
    Computes start and end dates for the last N full calendar years.
    For example, in 2026 with years=5, returns ('2021-01-01', '2025-12-31').
    """
    now_year = datetime.now(timezone.utc).year
    end_year = now_year - 1
    start_year = end_year - years + 1
    return f"{start_year}-01-01", f"{end_year}-12-31"


def clean_and_process_climate_data(
    raw_daily: Dict[str, Any],
    raw_hourly: Optional[Dict[str, Any]],
    years: int,
) -> Tuple[DataQuality, ClimateDerivedMetrics, List[MonthlyClimateSummary]]:
    """
    Cleans raw weather records using pandas:
    1. Validates and converts hourly humidity to daily means.
    2. Drops impossible temperature outliers (-90°C to 60°C per QC rules).
    3. Interpolates data gaps of up to 3 days.
    4. Computes data quality metrics, monthly aggregates, and derived indices.
    """
    qc = CONFIG.get("qc_rules", {})
    t_min = qc.get("temperature_min_valid", -90.0)
    t_max = qc.get("temperature_max_valid", 60.0)
    max_gap = qc.get("interpolation_max_gap_days", 3)
    hot_thresh = qc.get("hot_day_threshold_c", 40.0)
    cold_thresh = qc.get("cold_day_threshold_c", 5.0)

    # 1. Build initial daily DataFrame
    df = pd.DataFrame(raw_daily)
    if "time" not in df.columns or df.empty:
        raise ClimateServiceError("Daily weather data is empty or missing 'time' field.")

    df["time"] = pd.to_datetime(df["time"])
    df = df.sort_values("time").reset_index(drop=True)
    total_days = len(df)

    # 2. Process hourly humidity to daily means if provided
    if raw_hourly and "time" in raw_hourly and "relative_humidity_2m" in raw_hourly:
        h_df = pd.DataFrame({
            "time": pd.to_datetime(raw_hourly["time"]),
            "humidity": pd.to_numeric(raw_hourly["relative_humidity_2m"], errors="coerce"),
        })
        h_df["date"] = h_df["time"].dt.date
        daily_hum = h_df.groupby("date")["humidity"].mean().reset_index()
        daily_hum["time"] = pd.to_datetime(daily_hum["date"])
        df = pd.merge(df, daily_hum[["time", "humidity"]], on="time", how="left")
    else:
        df["humidity"] = np.nan

    # 3. Numeric conversion & impossible value screening
    numeric_cols = [
        "temperature_2m_max",
        "temperature_2m_min",
        "temperature_2m_mean",
        "precipitation_sum",
        "wind_speed_10m_max",
        "shortwave_radiation_sum",
        "humidity",
    ]

    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Screen temperature extremes
    temp_cols = ["temperature_2m_max", "temperature_2m_min", "temperature_2m_mean"]
    for col in temp_cols:
        if col in df.columns:
            invalid_mask = (df[col] < t_min) | (df[col] > t_max)
            df.loc[invalid_mask, col] = np.nan

    # Count missing values before interpolation for QC block
    checked_cols = [c for c in numeric_cols if c in df.columns]
    total_cells = total_days * len(checked_cols) if checked_cols else 1
    missing_cells_before = int(df[checked_cols].isna().sum().sum())
    missing_pct = round((missing_cells_before / total_cells) * 100, 2)

    # 4. Interpolate gaps up to max_gap days
    interpolated_cells = 0
    for col in checked_cols:
        before_nulls = int(df[col].isna().sum())
        df[col] = df[col].interpolate(method="linear", limit=max_gap, limit_direction="both")
        after_nulls = int(df[col].isna().sum())
        interpolated_cells += (before_nulls - after_nulls)

    # Build DataQuality object
    data_quality = DataQuality(
        total_days=total_days,
        missing_percent=missing_pct,
        interpolated_days=interpolated_cells,
        source=CONFIG.get("source", "Open-Meteo Historical Weather Archive API"),
        verified=CONFIG.get("verified", False),
    )

    # 5. Calculate monthly summaries (months 1 - 12)
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    df["month"] = df["time"].dt.month

    monthly_summary: List[MonthlyClimateSummary] = []
    for m in range(1, 13):
        m_df = df[df["month"] == m]
        if m_df.empty:
            monthly_summary.append(
                MonthlyClimateSummary(
                    month=m,
                    month_name=month_names[m - 1],
                    avg_temp_max=None,
                    avg_temp_min=None,
                    avg_temp_mean=None,
                    avg_humidity=None,
                    avg_rainfall=None,
                    avg_wind_speed=None,
                    avg_solar_radiation=None,
                )
            )
            continue

        # Average total rainfall per month across N years
        tot_rain_m = m_df["precipitation_sum"].sum(skipna=True)
        avg_rain_m = round(float(tot_rain_m / max(years, 1)), 1) if not pd.isna(tot_rain_m) else None

        summary_item = MonthlyClimateSummary(
            month=m,
            month_name=month_names[m - 1],
            avg_temp_max=round(float(m_df["temperature_2m_max"].mean()), 1) if not m_df["temperature_2m_max"].dropna().empty else None,
            avg_temp_min=round(float(m_df["temperature_2m_min"].mean()), 1) if not m_df["temperature_2m_min"].dropna().empty else None,
            avg_temp_mean=round(float(m_df["temperature_2m_mean"].mean()), 1) if not m_df["temperature_2m_mean"].dropna().empty else None,
            avg_humidity=round(float(m_df["humidity"].mean()), 1) if "humidity" in m_df and not m_df["humidity"].dropna().empty else None,
            avg_rainfall=avg_rain_m,
            avg_wind_speed=round(float(m_df["wind_speed_10m_max"].mean()), 1) if not m_df["wind_speed_10m_max"].dropna().empty else None,
            avg_solar_radiation=round(float(m_df["shortwave_radiation_sum"].mean()), 2) if not m_df["shortwave_radiation_sum"].dropna().empty else None,
        )
        monthly_summary.append(summary_item)

    # 6. Compute derived bioclimatic metrics
    # Hottest and coldest month based on average mean temperature
    valid_months = [item for item in monthly_summary if item.avg_temp_mean is not None]
    if valid_months:
        hottest_m = max(valid_months, key=lambda x: x.avg_temp_mean or -999).month
        coldest_m = min(valid_months, key=lambda x: x.avg_temp_mean or 999).month
    else:
        hottest_m = 6
        coldest_m = 1

    total_rain = df["precipitation_sum"].sum(skipna=True) if "precipitation_sum" in df else 0.0
    annual_rain = round(float(total_rain / max(years, 1)), 1)

    # Count days above hot threshold and below cold threshold per year
    hot_days_count = int((df["temperature_2m_max"] >= hot_thresh).sum()) if "temperature_2m_max" in df else 0
    cold_days_count = int((df["temperature_2m_min"] <= cold_thresh).sum()) if "temperature_2m_min" in df else 0

    derived_metrics = ClimateDerivedMetrics(
        hottest_month=hottest_m,
        coldest_month=coldest_m,
        annual_rain=annual_rain,
        days_above_40=round(hot_days_count / max(years, 1), 1),
        days_below_5=round(cold_days_count / max(years, 1), 1),
        source=CONFIG.get("source", "Open-Meteo Historical Weather Archive API"),
        verified=CONFIG.get("verified", False),
    )

    return data_quality, derived_metrics, monthly_summary


# ---------------------------------------------------------------------------
# API Communication with Retry Logic
# ---------------------------------------------------------------------------
async def _fetch_archive_data(lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Calls the Open-Meteo archive API with timeout and retries (per Rule 8).
    """
    archive_url = CONFIG.get("archive_url", "https://archive-api.open-meteo.com/v1/archive")
    timeout = float(CONFIG.get("timeout_seconds", 20.0))
    max_retries = int(CONFIG.get("max_retries", 2))
    daily_vars = CONFIG.get("daily_variables", [])
    hourly_vars = CONFIG.get("hourly_variables", [])

    params: Dict[str, Any] = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": daily_vars,
        "hourly": hourly_vars,
        "timezone": "UTC",
    }

    last_error: Optional[Exception] = None

    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                logger.info(
                    "Fetching climate archive (attempt %d/%d) for (%.4f, %.4f)",
                    attempt + 1,
                    max_retries + 1,
                    lat,
                    lon,
                )
                response = await client.get(archive_url, params=params)
                response.raise_for_status()
                data = response.json()
                if "daily" not in data:
                    raise ClimateServiceError("Open-Meteo response did not contain 'daily' weather payload.")
                return data

        except (httpx.TimeoutException, httpx.NetworkError) as net_err:
            last_error = net_err
            logger.warning("Network/Timeout attempt %d failed: %s", attempt + 1, net_err)
            if attempt < max_retries:
                time.sleep(0.5)

        except httpx.HTTPStatusError as http_err:
            last_error = http_err
            logger.error("HTTP error from Open-Meteo Archive: %s", http_err)
            # If 4xx client error, don't keep retrying unless it is 429 rate limiting
            if 400 <= http_err.response.status_code < 500 and http_err.response.status_code != 429:
                raise ClimateServiceError(
                    f"Open-Meteo returned status {http_err.response.status_code}: {http_err.response.text}"
                ) from http_err
            if attempt < max_retries:
                time.sleep(1.0)

        except Exception as exc:
            last_error = exc
            logger.error("Unexpected error querying Open-Meteo: %s", exc)
            break

    raise ClimateServiceError(
        f"Failed to fetch climate history after {max_retries + 1} attempts: {last_error}"
    )


# ---------------------------------------------------------------------------
# Public Service Entrypoint
# ---------------------------------------------------------------------------
async def get_climate_summary(lat: float, lon: float, years: int = 5) -> ClimateResponse:
    """
    Public entry point for historical climate summary.
    Checks in-memory cache first, queries Open-Meteo archive API on miss,
    cleans the time-series records, aggregates by month, and caches the result.
    """
    # 1. Check in-memory cache
    cache_key = _get_cache_key(lat, lon, years)
    ttl = CONFIG.get("cache_ttl_seconds", 86400)
    now = time.time()

    if cache_key in _cache:
        cached_time, cached_response = _cache[cache_key]
        if now - cached_time < ttl:
            logger.info("Serving climate summary from cache for %s", cache_key)
            # Return cached response with cached=True flag
            cached_copy = cached_response.model_copy()
            cached_copy.cached = True
            return cached_copy
        else:
            # Expired
            del _cache[cache_key]

    # 2. Compute date range
    start_date, end_date = _compute_calendar_date_range(years)

    # 3. Fetch from Open-Meteo
    raw_data = await _fetch_archive_data(lat, lon, start_date, end_date)

    # 4. Clean and aggregate
    data_quality, derived, monthly = clean_and_process_climate_data(
        raw_daily=raw_data.get("daily", {}),
        raw_hourly=raw_data.get("hourly", {}),
        years=years,
    )

    response = ClimateResponse(
        latitude=lat,
        longitude=lon,
        years_analyzed=years,
        start_date=start_date,
        end_date=end_date,
        data_quality=data_quality,
        derived_metrics=derived,
        monthly_summary=monthly,
        cached=False,
        source=CONFIG.get("source", "Open-Meteo Historical Weather Archive API"),
        verified=CONFIG.get("verified", False),
    )

    # 5. Store in cache
    _cache[cache_key] = (now, response)

    return response
