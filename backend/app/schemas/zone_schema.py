"""
Pydantic schemas for the 5-Zone Climate Classification endpoint (/api/zone).
"""

from typing import Any, Dict
from pydantic import BaseModel, Field, model_validator


class ZoneRequest(BaseModel):
    """
    Coordinates for zone classification.
    Accepts either (latitude, longitude) or (lat, lon).
    """

    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude in decimal degrees (-90.0 to 90.0).",
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude in decimal degrees (-180.0 to 180.0).",
    )

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Allow lat/lon shorthand
            if "lat" in data and "latitude" not in data:
                data["latitude"] = data["lat"]
            if "lon" in data and "longitude" not in data:
                data["longitude"] = data["lon"]
        return data

    model_config = {
        "json_schema_extra": {
            "examples": [{"lat": 26.45, "lon": 80.33}]
        }
    }


class ZoneDiagnosticValues(BaseModel):
    """Extracted climate metrics used to evaluate the classification rules."""

    hottest_month_max: float = Field(..., description="Highest monthly average maximum temperature (°C).")
    coldest_month_min: float = Field(..., description="Lowest monthly average minimum temperature (°C).")
    coldest_month_mean: float = Field(..., description="Lowest monthly average mean temperature (°C).")
    hot_season_humidity: float = Field(..., description="Average relative humidity in the hottest month (%).")
    annual_rain: float = Field(..., description="Average annual total precipitation (mm).")


class ZoneResponse(BaseModel):
    """Result of the 5-zone bioclimatic classification."""

    zone: str = Field(..., description="Assigned zone: COLD, COMPOSITE, HOT_DRY, WARM_HUMID, or TEMPERATE.")
    reason: str = Field(..., description="Human-readable explanation with exact diagnostic values.")
    values: ZoneDiagnosticValues
    matched_rule: str = Field(..., description="Rule identifier that matched.")
    latitude: float
    longitude: float
    source: str = Field(
        default="Simplified starting values to be calibrated",
        description="Origin of classification thresholds.",
    )
    verified: bool = Field(
        default=False,
        description="Empirical calibration flag.",
    )
