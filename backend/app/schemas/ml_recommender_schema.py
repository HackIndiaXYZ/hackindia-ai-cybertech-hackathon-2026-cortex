"""
Pydantic Schemas for the ML Vernacular Shelter Design Recommender.

Defines structured contracts for ML inference requests, per-design prediction scores,
feature explanations, and model provenance metadata.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class MLRecommendRequest(BaseModel):
    """
    Request payload for ML design recommendations.
    Accepts coordinates (and optional directly supplied climate indicators).
    """

    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude in decimal degrees.")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude in decimal degrees.")
    lat: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Latitude alias.")
    lon: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Longitude alias.")
    temperature: Optional[float] = Field(None, description="Observed or forecast temperature in °C.")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Observed or forecast relative humidity in %.")
    wind_speed: Optional[float] = Field(None, ge=0.0, description="Wind speed in km/h.")
    rainfall: Optional[float] = Field(None, ge=0.0, description="Precipitation in mm.")
    climate_zone: Optional[str] = Field(None, description="Optional known bioclimatic zone (e.g. HOT_DRY, COMPOSITE).")
    top_n: int = Field(default=3, ge=1, le=7, description="Number of top designs to return (1 to 7).")

    @model_validator(mode="after")
    def resolve_coordinates(self) -> "MLRecommendRequest":
        final_lat = self.latitude if self.latitude is not None else self.lat
        final_lon = self.longitude if self.longitude is not None else self.lon
        self.latitude = final_lat
        self.longitude = final_lon
        return self


class MLDesignPrediction(BaseModel):
    """Individual design prediction score and architectural insights."""

    id: str = Field(..., description="Unique vernacular design archetype ID.")
    name: str = Field(..., description="Vernacular design title.")
    origin_zone: str = Field(..., description="Originating bioclimatic zone.")
    predicted_score: float = Field(..., ge=0.0, le=100.0, description="ML predicted suitability score (0-100).")
    match_level: str = Field(..., description="'High Match', 'Moderate Match', or 'Low Match'.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence estimate (0-1).")
    strengths: List[str] = Field(default_factory=list, description="Key architectural advantages for site conditions.")
    why_recommended: str = Field(..., description="Bioclimatic rationale explaining the ML prediction.")
    rank: int = Field(..., ge=1, le=7, description="Recommendation ranking order (1 is best).")


class MLModelMetadata(BaseModel):
    """Metadata detailing the trained model architecture and data provenance."""

    model_type: str = Field(default="Multi-Output Random Forest Regressor")
    model_version: str = Field(default="1.0.0")
    test_r2: float = Field(..., description="R² test score on held-out validation set.")
    test_mae: float = Field(..., description="Mean absolute error on held-out validation set.")
    training_sample_count: int = Field(default=2500)
    source: str = Field(
        default="NBC 2016 Part 8 (Lighting & Ventilation) & ECBC 2017 Bioclimatic Design Guidelines"
    )
    verified: bool = Field(default=False)
    honesty_notice: str = Field(
        default="Training labels are generated using a documented mathematical scoring formulation plus Gaussian noise; the model learns to approximate this function across continuous multi-dimensional climate space and is not empirical proof of real-world physical performance."
    )


class MLRecommendResponse(BaseModel):
    """Response containing ranked design predictions and input climate features."""

    predictions: List[MLDesignPrediction] = Field(..., description="Ranked list of top recommended designs.")
    input_climate_features: Dict[str, float] = Field(..., description="Normalized climate features passed to the ML model.")
    model_metadata: MLModelMetadata
    source: str = Field(default="NBC 2016 Part 8 / ECBC 2017 & Random Forest ML Recommender")
    verified: bool = Field(default=False)
    disclaimer: str = Field(
        default="Guidance only. Consult a certified architect and local building codes before commencing construction."
    )
