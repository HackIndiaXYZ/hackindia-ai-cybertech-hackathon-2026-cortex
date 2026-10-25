"""
Pydantic schemas for the /api/analyze endpoint.
Defines request validation and the stable response contract.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------


class LocationRequest(BaseModel):
    """Validated input carrying geographic coordinates."""

    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude in decimal degrees (-90 to 90).",
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude in decimal degrees (-180 to 180).",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"latitude": 34.1526, "longitude": 77.5771}]
        }
    }


# ---------------------------------------------------------------------------
# Response sub-models
# ---------------------------------------------------------------------------


class LocationInfo(BaseModel):
    """Reverse-geocoded location information."""

    latitude: float
    longitude: float
    name: Optional[str] = None
    country: Optional[str] = None


class WeatherInfo(BaseModel):
    """Current weather observation at the requested location."""

    temperature: Optional[float] = Field(None, description="Air temperature in °C.")
    humidity: Optional[int] = Field(None, description="Relative humidity in %.")
    wind_speed: Optional[float] = Field(None, description="Wind speed in km/h.")
    rainfall: Optional[float] = Field(None, description="Hourly rainfall in mm.")
    cloud_cover: Optional[int] = Field(None, description="Cloud cover in %.")


class FloodInfo(BaseModel):
    """Flood risk assessment derived from GloFAS river-discharge data."""

    risk: str = Field(
        description=(
            "Application-level flood-risk estimate: Low, Moderate, High, "
            "or Insufficient Data."
        )
    )
    status: str = Field(
        description="Indicates whether flood data was available or not."
    )


class AnalysisInfo(BaseModel):
    """Environmental classification derived from weather observations."""

    classification: str = Field(
        description=(
            "Application-level environmental category (not an official scientific "
            "climate classification): Cold, Moderate, Hot-Dry, Hot-Humid, "
            "Cold-Humid, Variable, or Insufficient Data."
        )
    )
    conditions: List[str] = Field(
        default_factory=list,
        description="List of notable environmental conditions observed.",
    )
    summary: str = Field(
        default="",
        description="Short human-readable summary of the environmental conditions.",
    )


# ---------------------------------------------------------------------------
# Top-level response
# ---------------------------------------------------------------------------


class AnalysisResponse(BaseModel):
    """Unified response returned by POST /api/analyze."""

    location: LocationInfo
    weather: WeatherInfo
    flood: FloodInfo
    analysis: AnalysisInfo

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "location": {
                        "latitude": 34.1526,
                        "longitude": 77.5771,
                        "name": "Leh",
                        "country": "India",
                    },
                    "weather": {
                        "temperature": 5.2,
                        "humidity": 62,
                        "wind_speed": 8.4,
                        "rainfall": 0.2,
                        "cloud_cover": 35,
                    },
                    "flood": {"risk": "Low", "status": "Available"},
                    "analysis": {
                        "classification": "Cold",
                        "conditions": ["Low temperature"],
                        "summary": "Cold conditions with moderate humidity.",
                    },
                }
            ]
        }
    }


# ---------------------------------------------------------------------------
# Error response
# ---------------------------------------------------------------------------


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
