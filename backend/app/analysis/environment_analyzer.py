"""
Environmental analyzer.

Transforms raw weather observations into an application-level classification,
a list of notable conditions, and a short human-readable summary.

Classification categories are NOT an official scientific climate classification.
They are application-level convenience labels.
"""

import logging
from typing import List, Optional

from app.analysis.rules import (
    CLASSIFICATION_RULES,
    COLD_TEMP_THRESHOLD,
    HEAVY_RAIN_THRESHOLD,
    HIGH_HUMIDITY_THRESHOLD,
    HIGH_WIND_THRESHOLD,
    HOT_TEMP_THRESHOLD,
    LOW_HUMIDITY_THRESHOLD,
)
from app.schemas.analysis_schema import AnalysisInfo

logger = logging.getLogger(__name__)


def _classify(temperature: float, humidity: float) -> str:
    """Return the first matching classification from the ordered rule list."""
    for rule in CLASSIFICATION_RULES:
        temp_ok = (rule.temp_max is None or temperature < rule.temp_max) and (
            rule.temp_min is None or temperature >= rule.temp_min
        )
        hum_ok = (rule.humidity_max is None or humidity < rule.humidity_max) and (
            rule.humidity_min is None or humidity >= rule.humidity_min
        )
        if temp_ok and hum_ok:
            return rule.classification
    return "Variable"


def _detect_conditions(
    temperature: Optional[float],
    humidity: Optional[float],
    wind_speed: Optional[float],
    rainfall: Optional[float],
) -> List[str]:
    """Return a list of human-readable condition labels."""
    conditions: List[str] = []

    if temperature is not None:
        if temperature < COLD_TEMP_THRESHOLD:
            conditions.append("Low temperature")
        elif temperature >= HOT_TEMP_THRESHOLD:
            conditions.append("High temperature")

    if humidity is not None:
        if humidity >= HIGH_HUMIDITY_THRESHOLD:
            conditions.append("High humidity")
        elif humidity < LOW_HUMIDITY_THRESHOLD:
            conditions.append("Low humidity")

    if wind_speed is not None and wind_speed >= HIGH_WIND_THRESHOLD:
        conditions.append("High wind speed")

    if rainfall is not None and rainfall >= HEAVY_RAIN_THRESHOLD:
        conditions.append("Heavy rainfall")

    return conditions


def _build_summary(
    classification: str,
    conditions: List[str],
    temperature: Optional[float],
    humidity: Optional[float],
) -> str:
    """Compose a short, factual summary sentence."""
    if classification == "Insufficient Data":
        return "Insufficient environmental data to produce a summary."

    parts: List[str] = [f"{classification} conditions"]

    if temperature is not None:
        parts.append(f"temperature {temperature:.1f}°C")

    if humidity is not None:
        parts.append(f"humidity {humidity:.0f}%")

    base = " with ".join(parts[:1]) + (
        " — " + ", ".join(parts[1:]) if len(parts) > 1 else ""
    )

    if conditions:
        base += f". Notable: {', '.join(conditions).lower()}."

    return base


def analyze_environment(
    temperature: Optional[float],
    humidity: Optional[float],
    wind_speed: Optional[float],
    rainfall: Optional[float],
) -> AnalysisInfo:
    """
    Produce an AnalysisInfo object from raw weather values.

    Returns classification = 'Insufficient Data' if temperature or humidity
    are unavailable (they are the minimum required inputs for classification).
    """
    if temperature is None or humidity is None:
        logger.warning("Insufficient weather data for environment classification.")
        return AnalysisInfo(
            classification="Insufficient Data",
            conditions=[],
            summary="Insufficient environmental data to classify the location.",
        )

    classification = _classify(temperature, float(humidity))
    conditions = _detect_conditions(temperature, humidity, wind_speed, rainfall)
    summary = _build_summary(classification, conditions, temperature, humidity)

    logger.debug(
        "Environment analyzed: classification=%s, conditions=%s",
        classification,
        conditions,
    )

    return AnalysisInfo(
        classification=classification,
        conditions=conditions,
        summary=summary,
    )
