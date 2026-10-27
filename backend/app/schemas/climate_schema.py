"""
Pydantic schemas for the Climate History API (/api/climate).

Defines structured models for historical climate summaries, data quality,
and derived bioclimatic indicators.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class DataQuality(BaseModel):
    """Data quality and integrity metrics computed during cleaning."""

    total_days: int = Field(..., description="Total calendar days in the query range.")
    missing_percent: float = Field(
        ...,
        description="Percentage of missing or dropped anomalous records prior to interpolation.",
    )
    interpolated_days: int = Field(
        ...,
        description="Count of missing daily data points filled via linear interpolation.",
    )
    source: str = Field(
        default="Open-Meteo Historical Weather Archive API",
        description="Primary data source citation.",
    )
    verified: bool = Field(
        default=False,
        description="Flag indicating empirical field verification status.",
    )


class MonthlyClimateSummary(BaseModel):
    """Aggregated monthly climate metrics over the requested multi-year period."""

    month: int = Field(..., ge=1, le=12, description="Month of year (1-12).")
    month_name: str = Field(..., description="Month name (e.g. January, February).")
    avg_temp_max: Optional[float] = Field(
        None, description="Average daily maximum temperature (°C)."
    )
    avg_temp_min: Optional[float] = Field(
        None, description="Average daily minimum temperature (°C)."
    )
    avg_temp_mean: Optional[float] = Field(
        None, description="Average daily mean temperature (°C)."
    )
    avg_humidity: Optional[float] = Field(
        None, description="Average daily mean relative humidity (%)."
    )
    avg_rainfall: Optional[float] = Field(
        None, description="Average total monthly rainfall across the multi-year period (mm)."
    )
    avg_wind_speed: Optional[float] = Field(
        None, description="Average daily maximum wind speed (km/h)."
    )
    avg_solar_radiation: Optional[float] = Field(
        None, description="Average daily shortwave solar radiation (MJ/m²)."
    )


class ClimateDerivedMetrics(BaseModel):
    """Bioclimatic indicators derived from historical records."""

    hottest_month: int = Field(..., ge=1, le=12, description="Month (1-12) with highest mean temperature.")
    coldest_month: int = Field(..., ge=1, le=12, description="Month (1-12) with lowest mean temperature.")
    annual_rain: float = Field(..., description="Average annual total rainfall (mm).")
    days_above_40: float = Field(
        ..., description="Average days per year where max temperature reaches >= 40°C."
    )
    days_below_5: float = Field(
        ..., description="Average days per year where min temperature falls <= 5°C."
    )
    source: str = Field(
        default="Open-Meteo Historical Weather Archive API",
        description="Data origin reference.",
    )
    verified: bool = Field(
        default=False,
        description="Empirical field verification status.",
    )


class ClimateResponse(BaseModel):
    """Full climate history summary response."""

    latitude: float = Field(..., description="Query latitude in decimal degrees.")
    longitude: float = Field(..., description="Query longitude in decimal degrees.")
    years_analyzed: int = Field(..., description="Number of historical years analyzed.")
    start_date: str = Field(..., description="Analysis period start date (YYYY-MM-DD).")
    end_date: str = Field(..., description="Analysis period end date (YYYY-MM-DD).")
    data_quality: DataQuality
    derived_metrics: ClimateDerivedMetrics
    monthly_summary: List[MonthlyClimateSummary]
    cached: bool = Field(default=False, description="Whether this response was served from cache.")
    source: str = Field(
        default="Open-Meteo Historical Weather Archive API",
        description="Data origin reference.",
    )
    verified: bool = Field(
        default=False,
        description="Empirical verification flag.",
    )
