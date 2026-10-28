"""
Pydantic schemas for the AutoML backup forecaster system.

Covers:
  - WeatherHistoryRow  : one persisted daily record from weather_history
  - ForecastResponse   : unified forecast with provenance metadata
  - BackupStatusEntry  : per-location model health
  - BackupStatusResponse: GET /backup/status payload
  - HistoryResponse    : GET /history payload
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# History store row
# ---------------------------------------------------------------------------


class WeatherHistoryRow(BaseModel):
    """One validated daily weather record stored in weather_history."""

    location_key: str = Field(description="Stable slug for the location, e.g. '26.45_80.33'.")
    lat: float
    lng: float
    date: str = Field(description="Date in YYYY-MM-DD format.")
    temp_max: Optional[float] = Field(None, description="Maximum temperature in °C.")
    temp_min: Optional[float] = Field(None, description="Minimum temperature in °C.")
    temp_mean: Optional[float] = Field(None, description="Mean temperature in °C.")
    humidity: Optional[float] = Field(None, description="Mean relative humidity in %.")
    precipitation: Optional[float] = Field(None, description="Total precipitation in mm.")
    wind: Optional[float] = Field(None, description="Max wind speed in km/h.")
    source: str = Field(description="Data source tag, e.g. 'open_meteo_archive' or 'live_api'.")
    fetched_at: Optional[str] = Field(None, description="ISO-8601 UTC timestamp of the fetch.")


# ---------------------------------------------------------------------------
# Forecast
# ---------------------------------------------------------------------------


class ForecastDayItem(BaseModel):
    """Forecast values for a single day."""

    date: str = Field(description="Date in YYYY-MM-DD format.")
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    temp_mean: Optional[float] = None
    humidity: Optional[float] = None
    precipitation: Optional[float] = None


class ForecastResponse(BaseModel):
    """
    Unified forecast response following the fallback chain.

    source values: 'primary' | 'api' | 'automl_backup' | 'seasonal_naive'
    is_fallback is True for everything that is NOT the primary model.
    """

    location: str = Field(description="Location key or name.")
    horizon: int = Field(description="Forecast horizon in days (1 or 7).")
    forecast: List[ForecastDayItem] = Field(description="Per-day forecast items.")
    source: str = Field(
        description=(
            "Which forecaster produced this result: "
            "'primary' | 'api' | 'automl_backup' | 'seasonal_naive'."
        )
    )
    is_fallback: bool = Field(
        description="True when the primary model was bypassed."
    )
    generated_at: str = Field(description="ISO-8601 UTC timestamp of generation.")
    model_version: Optional[str] = Field(
        None,
        description="Model version tag (timestamp string) or None for rule-based sources.",
    )
    warning: Optional[str] = Field(
        None,
        description=(
            "Optional human-readable note about data quality or fallback reason. "
            "AutoML on past temperature is a statistical backup — accuracy drops "
            "after day 3-4 and should NOT replace a numerical weather model forecast."
        ),
    )


# ---------------------------------------------------------------------------
# Backup status
# ---------------------------------------------------------------------------


class BackupStatusEntry(BaseModel):
    """Health report for a single location's AutoML backup model."""

    location_key: str
    last_trained_at: Optional[str] = None
    model_version: Optional[str] = None
    mae_day1_temp_mean: Optional[float] = Field(
        None, description="MAE on day-1 temp_mean from walk-forward backtest."
    )
    mae_day7_temp_mean: Optional[float] = Field(
        None, description="MAE on day-7 temp_mean from walk-forward backtest."
    )
    history_rows: int = Field(description="Number of rows in weather_history for this location.")
    model_accepted: Optional[bool] = Field(
        None,
        description=(
            "True if AutoML beat the persistence baseline on MAE. "
            "False means the best baseline is served instead."
        ),
    )
    serving_model: Optional[str] = Field(
        None, description="Which model is actively served: 'automl' or 'persistence' or 'seasonal_naive'."
    )
    extra: Optional[Dict[str, Any]] = None


class BackupStatusResponse(BaseModel):
    """Payload for GET /backup/status."""

    locations: List[BackupStatusEntry]
    generated_at: str


# ---------------------------------------------------------------------------
# History query response
# ---------------------------------------------------------------------------


class HistoryResponse(BaseModel):
    """Payload for GET /history."""

    location_key: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    rows: List[WeatherHistoryRow]
    count: int
