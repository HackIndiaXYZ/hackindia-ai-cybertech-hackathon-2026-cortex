"""
Pydantic schemas for the Shelter Requirements Engine (/api/requirements).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class RequirementsRequest(BaseModel):
    """Input payload for shelter requirement recommendations."""

    zone: str = Field(
        ...,
        description="Climate zone (HOT_DRY, WARM_HUMID, COMPOSITE, TEMPERATE, COLD).",
        examples=["HOT_DRY"],
    )
    alerts: Optional[List[str]] = Field(
        default=None,
        description="Optional list of active severe weather conditions (e.g. heatwave, cold_wave, heavy_rain).",
        examples=[["heatwave"]],
    )


class StrategyItem(BaseModel):
    """Architectural passive strategy for a specific building element."""

    element: str = Field(
        ...,
        description="Building element (layout, walls, roof, windows, shading, ventilation, orientation, landscape).",
    )
    value: str = Field(
        ...,
        description="Specific passive architectural recommendation.",
    )
    reason: str = Field(
        ...,
        description="Bioclimatic reason explaining the design rationale.",
    )
    # Additional fields for frontend/client/src/mock/requirements.ts drop-in compatibility:
    id: Optional[str] = Field(None, description="Component ID for UI binding.")
    title: Optional[str] = Field(None, description="Formatted element title.")
    recommendation: Optional[str] = Field(None, description="Alias matching frontend Requirement interface.")
    iconType: Optional[str] = Field(None, description="Icon type identifier matching element.")


class WeatherTipItem(BaseModel):
    """Actionable safety advisory triggered by severe weather conditions."""

    alert: str = Field(..., description="Hazard trigger (heatwave, cold_wave, heavy_rain).")
    hazard: Optional[str] = Field(None, description="Hazard trigger alias.")
    id: str = Field(..., description="Unique tip identifier.")
    title: str = Field(..., description="Action title.")
    advice: str = Field(..., description="Actionable recommendation.")
    tip: Optional[str] = Field(None, description="Actionable advice alias.")
    reason: str = Field(..., description="Technical rationale.")
    priority: Optional[str] = Field("high", description="Tip priority level.")


class RequirementsResponse(BaseModel):
    """Complete shelter passive design recommendations and emergency tips."""

    zone: str = Field(..., description="Standardized climate zone.")
    name: Optional[str] = Field(None, description="Human-readable zone title.")
    zone_name: Optional[str] = Field(None, description="Human-readable zone title alias.")
    description: str = Field(..., description="Brief climatic description.")
    strategies: List[StrategyItem] = Field(..., description="Ordered list of passive architectural strategies.")
    tips: List[WeatherTipItem] = Field(default_factory=list, description="Emergency weather hazard tips.")
    source: str = Field(
        default="NBC 2016 Part 11 & ECBC 2017 Guidelines",
        description="Authoritative reference source.",
    )
    verified: bool = Field(
        default=False,
        description="Empirical field verification flag.",
    )
