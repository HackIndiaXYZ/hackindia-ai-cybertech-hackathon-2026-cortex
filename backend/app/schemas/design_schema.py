"""
Pydantic schemas for the Design Ranking Engine (/api/design/rank).

Matches frontend/client/src/mock/designs.ts contracts (DesignScores, DesignModel)
while providing MCDM validation and metadata.
"""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.analysis_schema import LocationInfo


class DesignScores(BaseModel):
    """Normalized criteria scores (0-100) matching frontend DesignScores."""

    comfort: int = Field(..., ge=0, le=100, description="Thermal comfort score (0-100).")
    cost: int = Field(..., ge=0, le=100, description="Cost efficiency score (0-100, inverted so cheaper is higher).")
    safety: int = Field(..., ge=0, le=100, description="Structural safety and weather resilience (0-100).")
    sustainability: int = Field(..., ge=0, le=100, description="Low-carbon sustainability score (0-100).")


class DesignModel(BaseModel):
    """Design recommendation model matching frontend DesignModel."""

    id: str = Field(..., description="Unique design combination identifier.")
    name: str = Field(..., description="Descriptive architectural design title.")
    scores: DesignScores
    totalScore: Optional[int] = Field(None, description="MCDM weighted sum score (0-100).")
    description: str = Field(..., description="Envelope specification summary.")
    reasons: List[str] = Field(default_factory=list, description="Architectural rationale bullet points.")
    components: Optional[Dict[str, str]] = Field(None, description="Component-level breakdown.")


class WeightsInput(BaseModel):
    """Criteria optimization weights (either 0-1 or percentage 0-100)."""

    comfort: float = Field(default=25.0, ge=0.0, description="Thermal comfort priority weight.")
    cost: float = Field(default=25.0, ge=0.0, description="Cost efficiency priority weight.")
    safety: float = Field(default=25.0, ge=0.0, description="Safety and resilience priority weight.")
    sustainability: float = Field(default=25.0, ge=0.0, description="Sustainability priority weight.")

    @model_validator(mode="after")
    def check_non_zero_sum(self) -> "WeightsInput":
        total = self.comfort + self.cost + self.safety + self.sustainability
        if total <= 0:
            raise ValueError("At least one criterion weight must be greater than zero.")
        return self


class DesignRankRequest(BaseModel):
    """Request payload for design ranking."""

    zone: str = Field(
        ...,
        description="Target bioclimatic zone (e.g. HOT_DRY, WARM_HUMID, COMPOSITE, TEMPERATE, COLD).",
        examples=["HOT_DRY"],
    )
    weights: Optional[WeightsInput] = Field(
        default=None,
        description="Priority weights. Defaults to Balanced preset if omitted.",
    )
    top_n: int = Field(
        default=3,
        ge=1,
        le=20,
        description="Number of top designs to return (default 3, max 20).",
    )


class DesignRankResponse(BaseModel):
    """Ranked design recommendations response."""

    zone: str = Field(..., description="Evaluated bioclimatic zone.")
    weights_applied: Dict[str, float] = Field(..., description="Normalized weights (summing to 1.0).")
    designs: List[DesignModel] = Field(..., description="Top ranked design options.")
    total_candidates_evaluated: int = Field(..., description="Number of candidate permutations that passed safety filter.")
    source: str = Field(default="NBC 2016 Part 11 & ECBC 2017 MCDM Design Ranking Baseline")
    verified: bool = Field(default=False)
    placeholder_note: str = Field(
        default="All scores and rankings are provisional heuristics to be verified with structural and thermal simulation models."
    )


# ===========================================================================
# Design Specification & Bioclimatic Layout Schemas (/api/design/spec)
# Compatible with frontend/client/src/mock/planData.ts (PlanSpec, Room, Door, Window)
# and frontend/client/src/viz/climateShelterData.ts
# ===========================================================================


class DoorSpec(BaseModel):
    """Door position and orientation matching frontend Door interface."""

    x: float = Field(..., description="Door anchor X position (meters).")
    y: float = Field(..., description="Door anchor Y position (meters).")
    width: float = Field(..., description="Clear door opening width (meters).")
    orientation: str = Field(..., description="'horizontal' or 'vertical'.")


class WindowSpec(BaseModel):
    """Window position, width, and orientation matching frontend Window interface."""

    x: float = Field(..., description="Window anchor X position (meters).")
    y: float = Field(..., description="Window anchor Y position (meters).")
    width: float = Field(..., description="Aperture opening width (meters).")
    orientation: str = Field(..., description="'horizontal' or 'vertical'.")


class RoomSpec(BaseModel):
    """Room specification matching frontend Room interface and 2D Plan visualizer."""

    id: str = Field(..., description="Unique room identifier (e.g. living, kitchen, bed1).")
    name: str = Field(..., description="Descriptive display name.")
    label: str = Field(..., description="Room label for 2D floor plans.")
    type: str = Field(
        ...,
        description="Room functional category: living, bedroom, kitchen, bathroom, courtyard, corridor, or utility.",
    )
    x: float = Field(..., description="Top-left corner X coordinate (meters).")
    y: float = Field(..., description="Top-left corner Y coordinate (meters).")
    w: float = Field(..., description="Room width along X axis (meters).")
    l: float = Field(..., description="Room length along Y axis (meters).")
    doors: List[DoorSpec] = Field(default_factory=list, description="Doors belonging to this room.")
    windows: List[WindowSpec] = Field(default_factory=list, description="Windows belonging to this room.")
    details: str = Field(..., description="Bioclimatic rationale and passive cooling details.")


class PlotSizeSpec(BaseModel):
    """Plot boundary dimensions."""

    w: float = Field(..., description="Plot width along X axis (meters).")
    l: float = Field(..., description="Plot length along Y axis (meters).")


class CourtyardSpec(BaseModel):
    """Optional central evaporative cooling courtyard details."""

    present: bool = Field(..., description="True if the plan contains a central open courtyard.")
    type: Optional[str] = Field(None, description="Courtyard cooling mechanism or archetype.")
    width: Optional[float] = Field(None, description="Courtyard width (meters).")
    length: Optional[float] = Field(None, description="Courtyard length (meters).")
    details: Optional[str] = Field(None, description="Courtyard microclimatic rationale.")


class DesignSpecRequest(BaseModel):
    """Request payload for generating a bioclimatic design specification."""

    zone: str = Field(
        ...,
        description="Target bioclimatic zone (e.g. HOT_DRY, WARM_HUMID, COLD, COMPOSITE, TEMPERATE).",
        examples=["HOT_DRY"],
    )
    design: Optional[Union[str, Dict[str, Any]]] = Field(
        default=None,
        description="Optional selected design alternative ID or metadata.",
    )
    plot_width: float = Field(
        default=14.0,
        ge=8.0,
        le=100.0,
        description="Site plot width in meters (min 8.0m, max 100.0m).",
    )
    plot_length: float = Field(
        default=16.0,
        ge=8.0,
        le=100.0,
        description="Site plot length in meters (min 8.0m, max 100.0m).",
    )
    bedrooms: int = Field(
        default=2,
        ge=1,
        le=5,
        description="Target number of bedrooms (1 to 5).",
    )


class DesignSpecResponse(BaseModel):
    """
    Generated architectural concept plan specification.

    Explicitly designated concept_only: true (not a stamped structural engineering plan).
    """

    zone: str = Field(..., description="Bioclimatic zone key.")
    plotSize: PlotSizeSpec = Field(..., description="Plot boundary dimensions matching PlanSpec.")
    orientation: float = Field(
        ...,
        description="Building solar passive orientation offset in degrees from True North (0 = North is UP).",
    )
    rooms: List[RoomSpec] = Field(..., description="List of non-overlapping rooms bounded within the plot.")
    courtyard: Optional[CourtyardSpec] = Field(None, description="Courtyard cooling core specification.")
    wall_thickness: float = Field(..., description="Thermal envelope exterior wall thickness in meters.")
    roof_type: str = Field(..., description="Roof archetype matching 3D shelter visualization.")
    overhang: float = Field(..., description="Roof overhang dimension in meters for solar/monsoon shading.")
    concept_only: bool = Field(
        default=True,
        description="Mandatory advisory flag indicating this is an architectural concept layout, not a structural construction plan.",
    )
    notes: List[str] = Field(default_factory=list, description="Passive design principles applied.")
    design_summary: Optional[str] = Field(None, description="Associated envelope candidate reference.")
    source: str = Field(
        default="NBC 2016 Part 8 (Lighting & Ventilation) & ECBC 2017 Passive Guidelines",
        description="Guideline baseline provenance.",
    )
    verified: bool = Field(default=False)


# ===========================================================================
# Design Catalogue Schema — backend/app/data/design_catalogue.json
# Distinct from the MCDM ranking schemas above.
# Used by load_catalogue() in backend/app/analysis/design_catalogue.py.
# ===========================================================================

# plan_archetype must match:
#   PlanZoneKey  in frontend/client/src/mock/planData.ts
#   ActiveClimateArchetype in frontend/client/src/viz/climateShelterData.ts
PlanArchetype = Literal[
    "HOT_DRY",
    "WARM_HUMID",
    "COLD",
    "COMPOSITE",
    "TEMPERATE",
    "NEUTRAL",
]

ShadingDepth = Literal["low", "medium", "high"]
VentilationStrategy = Literal["cross", "night", "stack", "mixed"]
MassLevel = Literal["low", "medium", "high"]


class CatalogueDesign(BaseModel):
    """
    A single vernacular / bioclimatic shelter design in the catalogue
    (backend/app/data/design_catalogue.json).

    Fields are intentionally simple scalars so the ML feature extractor can
    convert them to numeric vectors without parsing complex nested objects.

    Constraints:
    - plan_archetype must be a key used by planData.ts (PlanZoneKey) and
      climateShelterData.ts (ActiveClimateArchetype) so that 2D and 3D
      visualisation buttons keep working.
    - verified must always be False — parameters are research estimates.
    """

    id: str = Field(..., description="Unique slug identifier, e.g. 'courtyard-haveli'.")
    name: str = Field(..., description="Human-readable display name. Must be unique in the catalogue.")

    # --- Envelope -----------------------------------------------------------
    wall_material: str = Field(..., description="Primary wall material slug.")
    roof_type: Literal[
        "steep_gable",
        "parapet_courtyard",
        "hipped_stilted",
        "monopitch_solar",
        "hybrid_composite",
    ] = Field(..., description="Roof typology key used by 3D ClimateShelterConfig.")
    window_to_wall_ratio: float = Field(
        ..., ge=0.01, le=0.90,
        description="Fraction of façade area that is glazed (0.01–0.90).",
    )

    # --- Passive strategies -------------------------------------------------
    shading_depth: ShadingDepth = Field(..., description="Depth of external solar shading.")
    ventilation: VentilationStrategy = Field(..., description="Primary ventilation strategy.")
    thermal_mass: MassLevel = Field(..., description="Thermal mass performance level.")
    insulation: MassLevel = Field(..., description="Insulation performance level.")
    has_courtyard: bool = Field(..., description="True if typology includes a central open courtyard.")
    raised_floor: bool = Field(..., description="True if floor is elevated on stilts or plinth > 0.6 m.")

    # --- Frontend integration -----------------------------------------------
    plan_archetype: PlanArchetype = Field(
        ...,
        description=(
            "Zone key for 2-D plan generator (planData.ts) and 3-D shelter engine "
            "(climateShelterData.ts). Allowed: HOT_DRY | WARM_HUMID | COLD | "
            "COMPOSITE | TEMPERATE | NEUTRAL."
        ),
    )

    # --- Cost & provenance --------------------------------------------------
    estimated_cost_level: int = Field(..., ge=1, le=5, description="Relative cost (1=very low, 5=very high).")
    source: str = Field(..., description="Bibliographic reference(s) for design parameters.")
    verified: bool = Field(
        default=False,
        description="Always False — parameters are research estimates, not measured field data.",
    )

    @field_validator("verified")  # type: ignore[misc]
    @classmethod
    def must_be_false(cls, v: bool) -> bool:
        """Enforce honesty: no entry may be marked verified=true."""
        if v is True:
            raise ValueError(
                "verified must be False — catalogue values are research estimates. "
                "Do not set verified=True without empirical measurement data."
            )
        return v


# ===========================================================================
# ML Design Recommendation Schemas (/api/designs/recommend)
# ===========================================================================


class MLRecommendedDesignScores(BaseModel):
    """Predicted criteria scores (0-100) from the ML surrogate model."""

    comfort: float = Field(..., ge=0.0, le=100.0, description="Predicted thermal comfort score.")
    cost: float = Field(..., ge=0.0, le=100.0, description="Predicted cost efficiency score (100 = most affordable).")
    safety: float = Field(..., ge=0.0, le=100.0, description="Predicted structural safety and resilience score.")
    sustainability: float = Field(..., ge=0.0, le=100.0, description="Predicted sustainability and low-carbon score.")


class MLRecommendedDesign(BaseModel):
    """A ranked design recommendation produced by the ML surrogate model."""

    id: str = Field(..., description="Unique design slug identifier.")
    name: str = Field(..., description="Descriptive architectural design title.")
    plan_archetype: str = Field(..., description="Zone archetype for 2D/3D visualization engines.")
    scores: MLRecommendedDesignScores = Field(..., description="Predicted criterion-level scores (0-100).")
    total: float = Field(..., ge=0.0, le=100.0, description="MCDM weighted total score.")
    reasons: List[str] = Field(default_factory=list, description="Factual bioclimatic design rationale bullet points.")
    rank: int = Field(..., ge=1, description="Recommendation rank position (1 = best fit).")


class MLModelInfo(BaseModel):
    """Metadata regarding the ML surrogate model used for inference."""

    name: str = Field(default="RandomForestRegressor", description="Model architecture title.")
    version: str = Field(default="1.0.0", description="Model version tag.")
    source: str = Field(default="ml", description="Inference engine source descriptor.")


class MLDesignRecommendRequest(BaseModel):
    """Request payload for ML design recommendation."""

    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Site latitude in decimal degrees (-90.0 to 90.0).",
        examples=[26.9124],
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Site longitude in decimal degrees (-180.0 to 180.0).",
        examples=[75.7873],
    )
    weights: Optional[WeightsInput] = Field(
        default=None,
        description="Priority weights. Defaults to Balanced preset (25% each) if omitted.",
    )
    top_n: int = Field(
        default=3,
        ge=1,
        le=25,
        description="Number of top designs to return (default: 3, max: 25).",
    )


class MLDesignRecommendResponse(BaseModel):
    """Full ML design recommendation response matching API contract."""

    location: LocationInfo = Field(..., description="Geocoded location information.")
    features_used: Dict[str, float] = Field(..., description="Validated climate feature values utilized for inference.")
    designs: List[MLRecommendedDesign] = Field(..., description="Ranked list of recommended designs.")
    weights_used: Dict[str, float] = Field(..., description="Normalized weights applied across the 4 criteria.")
    model_info: MLModelInfo = Field(..., description="Active ML surrogate model identity.")

