"""
Classification rules for the environmental analyzer.

Rules are simple data-driven thresholds that map weather observations to an
application-level environmental category.  These categories are NOT an official
scientific climate classification — they are convenience labels used internally
by this application.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ConditionRule:
    """A named condition that fires when a weather threshold is crossed."""

    name: str
    description: str  # Human-readable label added to `conditions` list


@dataclass
class ClassificationRule:
    """Maps a set of weather thresholds to an environmental classification."""

    classification: str
    # Temperature thresholds (°C) — None means "no constraint"
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    # Humidity thresholds (%) — None means "no constraint"
    humidity_max: Optional[float] = None
    humidity_min: Optional[float] = None
    # Priority — lower number is evaluated first
    priority: int = 10


# ---------------------------------------------------------------------------
# Temperature boundary constants
# ---------------------------------------------------------------------------

COLD_TEMP_THRESHOLD: float = 10.0        # °C below this → Cold
HOT_TEMP_THRESHOLD: float = 30.0         # °C above this → Hot
MODERATE_TEMP_MIN: float = 10.0
MODERATE_TEMP_MAX: float = 30.0

# Humidity boundary constants
HIGH_HUMIDITY_THRESHOLD: float = 70.0    # % above this → Humid
LOW_HUMIDITY_THRESHOLD: float = 30.0     # % below this → Dry

# Wind / rain thresholds used for condition tags
HIGH_WIND_THRESHOLD: float = 40.0        # km/h
HEAVY_RAIN_THRESHOLD: float = 5.0        # mm/h

# ---------------------------------------------------------------------------
# Ordered classification rules (evaluated top-to-bottom, first match wins)
# ---------------------------------------------------------------------------

CLASSIFICATION_RULES: List[ClassificationRule] = [
    ClassificationRule(
        classification="Cold",
        temp_max=COLD_TEMP_THRESHOLD,
        humidity_max=HIGH_HUMIDITY_THRESHOLD,
        priority=1,
    ),
    ClassificationRule(
        classification="Cold-Humid",
        temp_max=COLD_TEMP_THRESHOLD,
        humidity_min=HIGH_HUMIDITY_THRESHOLD,
        priority=2,
    ),
    ClassificationRule(
        classification="Hot-Dry",
        temp_min=HOT_TEMP_THRESHOLD,
        humidity_max=LOW_HUMIDITY_THRESHOLD,
        priority=3,
    ),
    ClassificationRule(
        classification="Hot-Humid",
        temp_min=HOT_TEMP_THRESHOLD,
        humidity_min=HIGH_HUMIDITY_THRESHOLD,
        priority=4,
    ),
    ClassificationRule(
        classification="Hot-Dry",  # hot but moderate humidity still tends to be dry
        temp_min=HOT_TEMP_THRESHOLD,
        priority=5,
    ),
    ClassificationRule(
        classification="Moderate",
        temp_min=MODERATE_TEMP_MIN,
        temp_max=MODERATE_TEMP_MAX,
        priority=6,
    ),
    ClassificationRule(
        classification="Variable",
        priority=99,  # catch-all
    ),
]

# ---------------------------------------------------------------------------
# Condition tag rules (multiple can fire simultaneously)
# ---------------------------------------------------------------------------

CONDITION_RULES: List[ConditionRule] = [
    ConditionRule(name="low_temperature", description="Low temperature"),
    ConditionRule(name="high_temperature", description="High temperature"),
    ConditionRule(name="high_humidity", description="High humidity"),
    ConditionRule(name="low_humidity", description="Low humidity"),
    ConditionRule(name="high_wind", description="High wind speed"),
    ConditionRule(name="heavy_rainfall", description="Heavy rainfall"),
]
