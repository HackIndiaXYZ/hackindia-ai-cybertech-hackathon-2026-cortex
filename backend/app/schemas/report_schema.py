"""
Report request schema for POST /api/report.

Accepts geographic coordinates, optional MCDM design criteria weights,
and optional plot dimensions.
"""

from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, Field, model_validator


class PlotSizeInput(BaseModel):
    """Plot boundary dimensions."""

    width: Optional[float] = Field(default=None, ge=5.0, le=200.0, description="Plot width (meters).")
    length: Optional[float] = Field(default=None, ge=5.0, le=200.0, description="Plot length (meters).")
    w: Optional[float] = Field(default=None, ge=5.0, le=200.0, description="Plot width alias (meters).")
    l: Optional[float] = Field(default=None, ge=5.0, le=200.0, description="Plot length alias (meters).")

    def get_width(self) -> float:
        return float(self.w if self.w is not None else (self.width or 14.0))

    def get_length(self) -> float:
        return float(self.l if self.l is not None else (self.length or 16.0))


class ReportRequest(BaseModel):
    """
    Request payload for PDF report generation.
    Supports either latitude/longitude or lat/lon parameter naming.
    """

    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude in decimal degrees.")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude in decimal degrees.")
    lat: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude alias.")
    lon: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude alias.")
    weights: Optional[Dict[str, float]] = Field(
        None,
        description="Optional MCDM weights for design ranking (comfort, cost, safety, sustainability).",
    )
    plot_size: Optional[Union[Dict[str, Any], PlotSizeInput]] = Field(
        None,
        description="Optional plot boundary dimensions.",
    )

    @model_validator(mode="after")
    def resolve_coordinates(self) -> "ReportRequest":
        final_lat = self.latitude if self.latitude is not None else self.lat
        final_lon = self.longitude if self.longitude is not None else self.lon

        if final_lat is None or final_lon is None:
            raise ValueError("Coordinates are required: supply latitude/longitude or lat/lon.")

        if not (-90.0 <= final_lat <= 90.0):
            raise ValueError(f"Latitude {final_lat} out of range (-90.0 to 90.0).")
        if not (-180.0 <= final_lon <= 180.0):
            raise ValueError(f"Longitude {final_lon} out of range (-180.0 to 180.0).")

        self.latitude = final_lat
        self.longitude = final_lon
        return self
