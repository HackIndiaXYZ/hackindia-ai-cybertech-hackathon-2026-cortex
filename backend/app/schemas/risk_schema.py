"""
Pydantic schemas for the Thermal Risk API (/api/risk).

Defines input coordinate validation and structured thermal risk assessment responses,
matching both the backend analysis contract and frontend ZoneRiskData.
"""

from typing import Optional
from pydantic import BaseModel, Field


class RiskRequest(BaseModel):
    """Input payload for thermal risk assessment."""

    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude in decimal degrees (-90 to 90).",
        examples=[28.6139],
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude in decimal degrees (-180 to 180).",
        examples=[77.2090],
    )


class ThermalStressDetail(BaseModel):
    """Thermal stress assessment for heat or cold."""

    level: str = Field(
        ...,
        description="Stress severity level (low, medium, high, extreme).",
        examples=["high"],
    )
    score_0_100: int = Field(
        ...,
        ge=0,
        le=100,
        description="Normalized risk score from 0 (negligible) to 100 (extreme).",
        examples=[82],
    )
    reason: str = Field(
        ...,
        description="Bioclimatic justification citing quantitative thresholds and observations.",
    )


class WhyNumbers(BaseModel):
    """Core bioclimatic quantitative drivers matching frontend ZoneRiskData."""

    avgSummerTemp: float = Field(..., description="Average summer mean temperature (°C).")
    avgWinterTemp: float = Field(..., description="Average winter mean temperature (°C).")
    annualRainfall: float = Field(..., description="Average annual precipitation (mm).")


class RiskResponse(BaseModel):
    """Complete thermal risk assessment response."""

    # Core thermal risk evaluation
    heat: ThermalStressDetail
    cold: ThermalStressDetail

    # Frontend ZoneRiskData drop-in compatibility
    zone: str = Field(..., description="Assigned bioclimatic zone.")
    confidence: int = Field(..., ge=0, le=100, description="Prediction confidence percentage (0-100).")
    heatStress: int = Field(..., ge=0, le=100, description="Heat stress score (0-100).")
    coldStress: int = Field(..., ge=0, le=100, description="Cold stress score (0-100).")
    whyNumbers: WhyNumbers
    explanation: str = Field(..., description="Comprehensive explanation of zone and thermal risk.")
    ruleBasedZone: str = Field(..., description="Rule-based classification result.")
    mlZone: str = Field(..., description="Calibrated bioclimatic classification result.")

    # Location and audit metadata
    latitude: Optional[float] = Field(None, description="Query latitude.")
    longitude: Optional[float] = Field(None, description="Query longitude.")
    source: str = Field(
        default="IMD Heat Wave & Cold Wave Criteria (simplified baseline to be calibrated)",
        description="Authoritative reference source.",
    )
    verified: bool = Field(
        default=False,
        description="Empirical verification flag.",
    )
