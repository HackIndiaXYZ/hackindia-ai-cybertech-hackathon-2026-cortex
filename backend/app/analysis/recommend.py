"""
Shelter requirements recommendation engine.

Maps bioclimatic zones (HOT_DRY, WARM_HUMID, COMPOSITE, TEMPERATE, COLD)
and weather alerts (heatwave, cold_wave, heavy_rain) to architectural strategies
and emergency tips.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load strategy data from JSON files (Rule 2: never hardcode constants)
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
ZONES_FILE = os.path.join(DATA_DIR, "zones.json")
TIPS_FILE = os.path.join(DATA_DIR, "weather_tips.json")

ELEMENT_TITLES: Dict[str, str] = {
    "orientation": "Orientation",
    "layout": "Building Layout",
    "walls": "Wall Construction",
    "roof": "Roof Design",
    "windows": "Windows & Glazing",
    "shading": "Shading Devices",
    "ventilation": "Ventilation Strategy",
    "landscape": "Landscaping",
}


def _load_json_data(file_path: str) -> Dict[str, Any]:
    """Helper to safely load a JSON data file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Failed to load JSON file %s: %s", file_path, exc)
        return {}


ZONES_DATA = _load_json_data(ZONES_FILE)
TIPS_DATA = _load_json_data(TIPS_FILE)


def normalize_zone_key(raw_zone: str) -> str:
    """Normalizes variations like 'Hot-Dry' or 'hot_dry' to standard 'HOT_DRY'."""
    return raw_zone.strip().upper().replace("-", "_").replace(" ", "_")


def normalize_alert_key(raw_alert: str) -> str:
    """Normalizes alert strings like 'heat-wave' to 'heatwave' or 'cold-wave' to 'cold_wave'."""
    cleaned = raw_alert.strip().lower().replace("-", "_").replace(" ", "_")
    if cleaned in ("heat_wave", "extreme_heat"):
        return "heatwave"
    if cleaned in ("coldwave", "extreme_cold"):
        return "cold_wave"
    if cleaned in ("rain", "heavy_rainfall", "flood"):
        return "heavy_rain"
    return cleaned


def get_requirements(
    zone: str,
    alerts: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Returns shelter strategies and weather hazard tips for the given zone.

    Args:
        zone: Climate zone identifier (HOT_DRY, WARM_HUMID, COMPOSITE, TEMPERATE, COLD).
        alerts: Optional list of active alerts (e.g., ['heatwave', 'heavy_rain']).

    Returns:
        {
            "zone": str,
            "zone_name": str,
            "description": str,
            "strategies": [
                {
                    "element": str,
                    "value": str,
                    "reason": str,
                    "id": str,
                    "title": str,
                    "recommendation": str,
                    "iconType": str
                }
            ],
            "tips": List[Dict[str, Any]],
            "source": str,
            "verified": bool
        }
    """
    normalized_zone = normalize_zone_key(zone)

    if normalized_zone not in ZONES_DATA:
        valid_zones = list(ZONES_DATA.keys())
        raise ValueError(
            f"Unknown climate zone '{zone}'. Must be one of: {', '.join(valid_zones)}"
        )

    zone_info = ZONES_DATA[normalized_zone]
    strategies_dict: Dict[str, Dict[str, str]] = zone_info.get("strategies", {})

    # Build strategies list compatible with both {element, value, reason} and frontend Requirement shape
    strategies_list = []
    # Explicit order matching architectural priority
    ordered_elements = [
        "orientation",
        "layout",
        "walls",
        "roof",
        "windows",
        "shading",
        "ventilation",
        "landscape",
    ]

    for elem in ordered_elements:
        if elem in strategies_dict:
            strat = strategies_dict[elem]
            val = strat.get("value", "")
            reas = strat.get("reason", "")
            strategies_list.append({
                "element": elem,
                "value": val,
                "reason": reas,
                # UI compatibility fields for frontend/client/src/mock/requirements.ts:
                "id": f"req-{elem}",
                "title": ELEMENT_TITLES.get(elem, elem.capitalize()),
                "recommendation": val,
                "iconType": elem,
            })

    # Assemble extra weather tips
    collected_tips: List[Dict[str, Any]] = []
    if alerts:
        alerts_dict = TIPS_DATA.get("alerts", {})
        for raw_alert in alerts:
            alert_key = normalize_alert_key(raw_alert)
            if alert_key in alerts_dict:
                for tip in alerts_dict[alert_key]:
                    advice_text = tip.get("advice", "")
                    collected_tips.append({
                        "alert": alert_key,
                        "hazard": alert_key,
                        "id": tip.get("id"),
                        "title": tip.get("title"),
                        "advice": advice_text,
                        "tip": advice_text,
                        "reason": tip.get("reason", ""),
                        "priority": tip.get("priority", "high"),
                    })

    return {
        "zone": normalized_zone,
        "name": zone_info.get("name", normalized_zone),
        "zone_name": zone_info.get("name", normalized_zone),
        "description": zone_info.get("description", ""),
        "strategies": strategies_list,
        "tips": collected_tips,
        "source": zone_info.get("source", "NBC 2016 Part 11 & ECBC 2017 Guidelines"),
        "verified": zone_info.get("verified", False),
    }
