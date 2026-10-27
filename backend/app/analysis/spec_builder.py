"""
Design Specification & Bioclimatic Layout Generator.

Generates 2D architectural concept specifications (plotSize, orientation, rooms,
doors, windows, courtyard, wall_thickness, roof_type, overhang) optimized for
five primary bioclimatic zones (HOT_DRY, WARM_HUMID, COLD, COMPOSITE, TEMPERATE).

Passive Design Principles Applied:
1. Long axis East-West to minimize low morning/afternoon direct solar exposure.
2. Habitable bedrooms and living spaces placed on the cooler or solar-harvesting side.
3. Thermal buffer zones (kitchen, utilities, bathrooms) placed on harsh solar exposures.
4. Small aperture windows on harsh/hot facades; generous openings on shaded breeze facades.
5. Central evaporative courtyard in HOT_DRY and COMPOSITE zones for nocturnal stack cooling.
6. Rigorous geometric bounds and non-overlap verification (concept plan only).
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)

RULES_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "spec_rules.json"
)

VALID_ZONES = {"HOT_DRY", "WARM_HUMID", "COLD", "COMPOSITE", "TEMPERATE"}


def load_spec_rules() -> Dict[str, Any]:
    """Loads externalized bioclimatic envelope rules from spec_rules.json."""
    try:
        with open(RULES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load spec_rules.json (%s), using safe defaults", exc)
        return {
            "source": "Fallback spec rules",
            "verified": False,
            "min_plot_width": 8.0,
            "max_plot_width": 100.0,
            "min_plot_length": 8.0,
            "max_plot_length": 100.0,
            "min_bedrooms": 1,
            "max_bedrooms": 5,
            "zones": {},
        }


def normalize_zone(zone: str) -> str:
    """Normalizes input zone string to standard uppercase key."""
    if not zone or not isinstance(zone, str):
        raise ValueError("Zone must be a non-empty string.")
    cleaned = zone.strip().upper().replace("-", "_").replace(" ", "_")
    if cleaned not in VALID_ZONES:
        raise ValueError(
            f"Invalid climate zone '{zone}'. Expected one of: {', '.join(sorted(VALID_ZONES))}"
        )
    return cleaned


def validate_layout(
    rooms: List[Dict[str, Any]],
    plot_width: float,
    plot_length: float,
) -> None:
    """
    Validates that:
    1. Every room is fully within [0, plot_width] x [0, plot_length].
    2. No two distinct rooms overlap in interior area (> 1e-4 m^2).
    """
    for r in rooms:
        rx, ry, rw, rl = r["x"], r["y"], r["w"], r["l"]
        if rx < -1e-5 or ry < -1e-5:
            raise ValueError(
                f"Room '{r.get('id', 'unknown')}' has negative coordinates: x={rx}, y={ry}"
            )
        if (rx + rw) > (plot_width + 1e-4) or (ry + rl) > (plot_length + 1e-4):
            raise ValueError(
                f"Room '{r.get('id', 'unknown')}' ({r.get('name')}) exceeds plot boundaries: "
                f"x={rx}, y={ry}, w={rw}, l={rl} on plot {plot_width}x{plot_length}"
            )
        if rw <= 0 or rl <= 0:
            raise ValueError(
                f"Room '{r.get('id', 'unknown')}' has invalid non-positive dimensions: w={rw}, l={rl}"
            )

    n = len(rooms)
    for i in range(n):
        for j in range(i + 1, n):
            r1, r2 = rooms[i], rooms[j]
            x_overlap = max(
                0.0,
                min(r1["x"] + r1["w"], r2["x"] + r2["w"]) - max(r1["x"], r2["x"]),
            )
            y_overlap = max(
                0.0,
                min(r1["y"] + r1["l"], r2["y"] + r2["l"]) - max(r1["y"], r2["y"]),
            )
            overlap_area = x_overlap * y_overlap
            if overlap_area > 1e-4:
                raise ValueError(
                    f"Room overlap detected between '{r1.get('id')}' and '{r2.get('id')}': "
                    f"intersection area {overlap_area:.4f} m^2"
                )


def _round_dims(val: float) -> float:
    """Rounds dimension to 2 decimal places for clean floating display."""
    return round(float(val), 2)


def _build_hot_dry_layout(
    pw: float, pl: float, bedrooms: int
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    HOT_DRY: Compact inward-looking courtyard layout.
    - Central courtyard for microclimate cooling.
    - Living on North/shaded side.
    - Kitchen on West buffer with small aperture.
    - Master Bedroom on East.
    - Additional bedrooms and utilities on South/West buffers.
    """
    mx = max(1.0, round(0.06 * pw, 2))
    my = max(1.0, round(0.06 * pl, 2))
    uw = pw - 2 * mx
    ul = pl - 2 * my

    # Row heights
    h1 = _round_dims(ul * 0.28)  # Living row
    h2 = _round_dims(ul * 0.44)  # Courtyard & flank rooms
    h3 = _round_dims(ul - h1 - h2)  # South buffer / secondary bedrooms

    y1 = my
    y2 = my + h1
    y3 = my + h1 + h2

    # Column widths for middle row
    w_kitchen = _round_dims(uw * 0.28)
    w_court = _round_dims(uw * 0.44)
    w_bed1 = _round_dims(uw - w_kitchen - w_court)

    rooms: List[Dict[str, Any]] = []

    # 1. Living room (spans north facade, shaded from intense south heat)
    rooms.append({
        "id": "living",
        "name": "Living & Family Lounge",
        "label": "Living & Family Lounge",
        "type": "living",
        "x": mx,
        "y": y1,
        "w": uw,
        "l": h1,
        "doors": [
            {"x": _round_dims(mx + uw * 0.5), "y": y1, "width": 1.2, "orientation": "horizontal"},
            {"x": _round_dims(mx + uw * 0.5), "y": y2, "width": 1.2, "orientation": "horizontal"},
        ],
        "windows": [
            {"x": _round_dims(mx + uw * 0.2), "y": y1, "width": 1.2, "orientation": "horizontal"},
            {"x": _round_dims(mx + uw * 0.8), "y": y1, "width": 1.2, "orientation": "horizontal"},
        ],
        "details": "North-oriented living hall. Protected from harsh desert solar radiation with thick adobe/brick envelope.",
    })

    # 2. Kitchen (west buffer)
    rooms.append({
        "id": "kitchen",
        "name": "Kitchen",
        "label": "Kitchen",
        "type": "kitchen",
        "x": mx,
        "y": y2,
        "w": w_kitchen,
        "l": h2,
        "doors": [
            {"x": _round_dims(mx + w_kitchen), "y": _round_dims(y2 + h2 * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "windows": [
            {"x": mx, "y": _round_dims(y2 + h2 * 0.5), "width": 0.8, "orientation": "vertical"}  # Small window on hot west
        ],
        "details": "West-placed thermal buffer with small shaded aperture. Dedicated thermal flue for cooking heat exhaust.",
    })

    # 3. Central Courtyard
    court_info = {
        "present": True,
        "type": "central_cooling",
        "width": w_court,
        "length": h2,
        "details": "Open-to-sky courtyard providing nocturnal radiation cooling and diurnal shaded oasis.",
    }
    rooms.append({
        "id": "courtyard",
        "name": "Central Shaded Courtyard",
        "label": "Central Shaded Courtyard",
        "type": "courtyard",
        "x": _round_dims(mx + w_kitchen),
        "y": y2,
        "w": w_court,
        "l": h2,
        "doors": [],
        "windows": [],
        "details": "Microclimate cooling core. Radiates heat to cold night desert sky, drawing cool air into bedrooms.",
    })

    # 4. Master Bedroom (East cooler side)
    rooms.append({
        "id": "bed1",
        "name": "Master Bedroom",
        "label": "Master Bedroom",
        "type": "bedroom",
        "x": _round_dims(mx + w_kitchen + w_court),
        "y": y2,
        "w": w_bed1,
        "l": h2,
        "doors": [
            {"x": _round_dims(mx + w_kitchen + w_court), "y": _round_dims(y2 + h2 * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "windows": [
            {"x": _round_dims(mx + uw), "y": _round_dims(y2 + h2 * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "details": "East-facing bedroom. Catches gentle morning sunlight, cooled by evening desert breeze.",
    })

    # 5. Row 3: South rooms based on bedroom count
    if bedrooms <= 1:
        wb = _round_dims(uw * 0.40)
        wu = _round_dims(uw - wb)
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": mx,
            "y": y3,
            "w": wb,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb * 0.5), "y": y3, "width": 0.9, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "Naturally ventilated wet services block.",
        })
        rooms.append({
            "id": "utility",
            "name": "Utility & Water Storage",
            "label": "Utility & Water Storage",
            "type": "utility",
            "x": _round_dims(mx + wb),
            "y": y3,
            "w": wu,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb), "y": _round_dims(y3 + h3 * 0.5), "width": 1.0, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb + wu * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "Southern buffer zone housing cistern storage.",
        })
    elif bedrooms == 2:
        wb2 = _round_dims(uw * 0.45)
        wbath = _round_dims(uw * 0.25)
        wut = _round_dims(uw - wb2 - wbath)

        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": mx,
            "y": y3,
            "w": wb2,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb2 * 0.5), "y": _round_dims(y3 + h3), "width": 1.0, "orientation": "horizontal"}],
            "details": "Night ventilated guest/child bedroom linked to courtyard breeze corridor.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + wb2),
            "y": y3,
            "w": wbath,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 + wbath * 0.5), "y": y3, "width": 0.9, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb2 + wbath * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "Centralized plumbing and greywater recovery.",
        })
        rooms.append({
            "id": "utility",
            "name": "Utility Buffer",
            "label": "Utility Buffer",
            "type": "utility",
            "x": _round_dims(mx + wb2 + wbath),
            "y": y3,
            "w": wut,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 + wbath), "y": _round_dims(y3 + h3 * 0.5), "width": 1.0, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb2 + wbath + wut * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "Western solar buffer absorbing late afternoon desert heat.",
        })
    else:  # 3+ bedrooms
        wb2 = _round_dims(uw * 0.35)
        wb3 = _round_dims(uw * 0.35)
        wbath = _round_dims(uw * 0.15)
        wut = _round_dims(uw - wb2 - wb3 - wbath)

        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": mx,
            "y": y3,
            "w": wb2,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb2 * 0.5), "y": _round_dims(y3 + h3), "width": 1.0, "orientation": "horizontal"}],
            "details": "Courtyard-adjacent bedroom with high thermal inertia.",
        })
        rooms.append({
            "id": "bed3",
            "name": "Bedroom 3",
            "label": "Bedroom 3",
            "type": "bedroom",
            "x": _round_dims(mx + wb2),
            "y": y3,
            "w": wb3,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 + wb3 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb2 + wb3 * 0.5), "y": _round_dims(y3 + h3), "width": 1.0, "orientation": "horizontal"}],
            "details": "South-facing bedroom with recessed deep-set windows.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + wb2 + wb3),
            "y": y3,
            "w": wbath,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 + wb3 + wbath * 0.5), "y": y3, "width": 0.9, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb2 + wb3 + wbath * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "Water-efficient bathroom.",
        })
        rooms.append({
            "id": "utility",
            "name": "Utility Buffer",
            "label": "Utility Buffer",
            "type": "utility",
            "x": _round_dims(mx + wb2 + wb3 + wbath),
            "y": y3,
            "w": wut,
            "l": h3,
            "doors": [{"x": _round_dims(mx + wb2 + wb3 + wbath), "y": _round_dims(y3 + h3 * 0.5), "width": 1.0, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb2 + wb3 + wbath + wut * 0.5), "y": _round_dims(y3 + h3), "width": 0.8, "orientation": "horizontal"}],
            "details": "South-west corner buffer.",
        })

    return rooms, court_info


def _build_composite_layout(
    pw: float, pl: float, bedrooms: int
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    COMPOSITE: Adaptable courtyard plan responding to extreme hot summers and cool winters.
    - Central courtyard for diurnal cooling and cross ventilation.
    - Balanced glazing on North and South.
    - Kitchen and utilities act as buffer on West.
    """
    rooms, _ = _build_hot_dry_layout(pw, pl, bedrooms)
    court_info = {
        "present": True,
        "type": "seasonal_adaptable",
        "width": rooms[2]["w"],
        "length": rooms[2]["l"],
        "details": "Central courtyard with operable seasonal shading louvers for hot-dry summer and cold winter transition.",
    }
    rooms[0]["name"] = "Living & Dining Hall"
    rooms[0]["label"] = "Living & Dining Hall"
    rooms[0]["details"] = "Dual-exposure living area capturing north daylight and courtyard microclimate breezes."
    return rooms, court_info


def _build_warm_humid_layout(
    pw: float, pl: float, bedrooms: int
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    WARM_HUMID: Linear East-West stretched plan maximizing cross-ventilation.
    - Full-width front shaded verandah corridor.
    - Large operable windows on opposite facades.
    - No central courtyard (open continuous air corridor).
    """
    mx = max(1.0, round(0.06 * pw, 2))
    my = max(1.0, round(0.06 * pl, 2))
    uw = pw - 2 * mx
    ul = pl - 2 * my

    h_verandah = _round_dims(ul * 0.18)
    h_living = _round_dims(ul * 0.40)
    h_bed = _round_dims(ul - h_verandah - h_living)

    y1 = my
    y2 = my + h_verandah
    y3 = my + h_verandah + h_living

    rooms: List[Dict[str, Any]] = []

    # 1. Shaded Verandah Corridor
    rooms.append({
        "id": "verandah",
        "name": "Shaded Verandah",
        "label": "Shaded Verandah",
        "type": "corridor",
        "x": mx,
        "y": y1,
        "w": uw,
        "l": h_verandah,
        "doors": [
            {"x": _round_dims(mx + uw * 0.3), "y": y1, "width": 1.5, "orientation": "horizontal"},
            {"x": _round_dims(mx + uw * 0.7), "y": y1, "width": 1.5, "orientation": "horizontal"},
        ],
        "windows": [],
        "details": "Full-width shaded verandah. Protects walls from high tropical sun and torrential monsoon rain.",
    })

    # 2. Living & Kitchen Row
    w_living = _round_dims(uw * 0.60)
    w_kitchen = _round_dims(uw - w_living)

    rooms.append({
        "id": "living",
        "name": "Open Living & Dining",
        "label": "Open Living & Dining",
        "type": "living",
        "x": mx,
        "y": y2,
        "w": w_living,
        "l": h_living,
        "doors": [
            {"x": _round_dims(mx + w_living * 0.5), "y": y2, "width": 1.5, "orientation": "horizontal"},
            {"x": _round_dims(mx + w_living * 0.5), "y": y3, "width": 1.2, "orientation": "horizontal"},
        ],
        "windows": [
            {"x": mx, "y": _round_dims(y2 + h_living * 0.5), "width": 2.0, "orientation": "vertical"},
        ],
        "details": "Continuous open layout for maximum wind scoop cross-ventilation.",
    })
    rooms.append({
        "id": "kitchen",
        "name": "Kitchen",
        "label": "Kitchen",
        "type": "kitchen",
        "x": _round_dims(mx + w_living),
        "y": y2,
        "w": w_kitchen,
        "l": h_living,
        "doors": [
            {"x": _round_dims(mx + w_living), "y": _round_dims(y2 + h_living * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "windows": [
            {"x": _round_dims(mx + uw), "y": _round_dims(y2 + h_living * 0.5), "width": 1.8, "orientation": "vertical"}
        ],
        "details": "Operable louvres aligned with prevailing wind corridor to flush cooking vapor.",
    })

    # 3. Bedroom row
    if bedrooms <= 1:
        wb1 = _round_dims(uw * 0.70)
        wbath = _round_dims(uw - wb1)
        rooms.append({
            "id": "bed1",
            "name": "Master Bedroom",
            "label": "Master Bedroom",
            "type": "bedroom",
            "x": mx,
            "y": y3,
            "w": wb1,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 * 0.5), "y": y3, "width": 1.2, "orientation": "horizontal"}],
            "windows": [
                {"x": mx, "y": _round_dims(y3 + h_bed * 0.5), "width": 2.2, "orientation": "vertical"},
                {"x": _round_dims(mx + wb1 * 0.5), "y": _round_dims(y3 + h_bed), "width": 2.5, "orientation": "horizontal"},
            ],
            "details": "High cross-ventilation master bedroom with dual louvred window openings.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + wb1),
            "y": y3,
            "w": wbath,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1), "y": _round_dims(y3 + h_bed * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb1 + wbath * 0.5), "y": _round_dims(y3 + h_bed), "width": 1.0, "orientation": "horizontal"}],
            "details": "Naturally ventilated bathroom.",
        })
    elif bedrooms == 2:
        wb1 = _round_dims(uw * 0.42)
        wb2 = _round_dims(uw * 0.38)
        wbath = _round_dims(uw - wb1 - wb2)
        rooms.append({
            "id": "bed1",
            "name": "Master Bedroom",
            "label": "Master Bedroom",
            "type": "bedroom",
            "x": mx,
            "y": y3,
            "w": wb1,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 * 0.5), "y": y3, "width": 1.2, "orientation": "horizontal"}],
            "windows": [
                {"x": mx, "y": _round_dims(y3 + h_bed * 0.5), "width": 2.0, "orientation": "vertical"},
                {"x": _round_dims(mx + wb1 * 0.5), "y": _round_dims(y3 + h_bed), "width": 2.2, "orientation": "horizontal"},
            ],
            "details": "Dual wall louvers ensuring continuous air movement through sleeping zone.",
        })
        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": _round_dims(mx + wb1),
            "y": y3,
            "w": wb2,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb1 + wb2 * 0.5), "y": _round_dims(y3 + h_bed), "width": 2.0, "orientation": "horizontal"}],
            "details": "Rear breeze capture bedroom with shaded eaves.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + wb1 + wb2),
            "y": y3,
            "w": wbath,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 + wb2), "y": _round_dims(y3 + h_bed * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb1 + wb2 + wbath * 0.5), "y": _round_dims(y3 + h_bed), "width": 1.0, "orientation": "horizontal"}],
            "details": "Ventilated bathroom with greywater drainage.",
        })
    else:  # 3+ bedrooms
        wb1 = _round_dims(uw * 0.35)
        wb2 = _round_dims(uw * 0.28)
        wb3 = _round_dims(uw * 0.22)
        wbath = _round_dims(uw - wb1 - wb2 - wb3)
        rooms.append({
            "id": "bed1",
            "name": "Master Bedroom",
            "label": "Master Bedroom",
            "type": "bedroom",
            "x": mx,
            "y": y3,
            "w": wb1,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 * 0.5), "y": y3, "width": 1.2, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb1 * 0.5), "y": _round_dims(y3 + h_bed), "width": 2.0, "orientation": "horizontal"}],
            "details": "Cross-ventilated sleeping quarter.",
        })
        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": _round_dims(mx + wb1),
            "y": y3,
            "w": wb2,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb1 + wb2 * 0.5), "y": _round_dims(y3 + h_bed), "width": 1.8, "orientation": "horizontal"}],
            "details": "Natural airflow bedroom with operable louvers.",
        })
        rooms.append({
            "id": "bed3",
            "name": "Bedroom 3",
            "label": "Bedroom 3",
            "type": "bedroom",
            "x": _round_dims(mx + wb1 + wb2),
            "y": y3,
            "w": wb3,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 + wb2 + wb3 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + wb1 + wb2 + wb3 * 0.5), "y": _round_dims(y3 + h_bed), "width": 1.8, "orientation": "horizontal"}],
            "details": "Air-circulating bedroom.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + wb1 + wb2 + wb3),
            "y": y3,
            "w": wbath,
            "l": h_bed,
            "doors": [{"x": _round_dims(mx + wb1 + wb2 + wb3), "y": _round_dims(y3 + h_bed * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + wb1 + wb2 + wb3 + wbath * 0.5), "y": _round_dims(y3 + h_bed), "width": 1.0, "orientation": "horizontal"}],
            "details": "Ventilated bathroom.",
        })

    court_info = {"present": False}
    return rooms, court_info


def _build_cold_layout(
    pw: float, pl: float, bedrooms: int
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    COLD: Highly compact alpine thermal envelope.
    - Entry airlock vestibule on cold north facade.
    - Living area with stone thermal core in middle.
    - Habitable rooms on south facade with maximized passive solar aperture.
    - Thick insulated envelope and draft seals.
    """
    mx = max(1.0, round(0.06 * pw, 2))
    my = max(1.0, round(0.06 * pl, 2))
    uw = pw - 2 * mx
    ul = pl - 2 * my

    h_lobby = _round_dims(ul * 0.18)
    h_living = _round_dims(ul * 0.42)
    h_south = _round_dims(ul - h_lobby - h_living)

    y1 = my
    y2 = my + h_lobby
    y3 = my + h_lobby + h_living

    rooms: List[Dict[str, Any]] = []

    # 1. Entry Lobby / Airlock
    w_lobby = _round_dims(uw * 0.40)
    w_store = _round_dims(uw - w_lobby)

    rooms.append({
        "id": "lobby",
        "name": "Protected Entry Airlock",
        "label": "Protected Entry Airlock",
        "type": "corridor",
        "x": mx,
        "y": y1,
        "w": w_lobby,
        "l": h_lobby,
        "doors": [
            {"x": _round_dims(mx + w_lobby * 0.5), "y": y1, "width": 1.2, "orientation": "horizontal"},
            {"x": _round_dims(mx + w_lobby * 0.5), "y": y2, "width": 1.2, "orientation": "horizontal"},
        ],
        "windows": [],
        "details": "Double-door airlock vestibule preventing icy winter gusts from stripping indoor heated air.",
    })
    rooms.append({
        "id": "utility",
        "name": "Pellet & Fuel Store",
        "label": "Pellet & Fuel Store",
        "type": "utility",
        "x": _round_dims(mx + w_lobby),
        "y": y1,
        "w": w_store,
        "l": h_lobby,
        "doors": [
            {"x": _round_dims(mx + w_lobby), "y": _round_dims(y1 + h_lobby * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "windows": [
            {"x": _round_dims(mx + w_lobby + w_store * 0.5), "y": y1, "width": 0.8, "orientation": "horizontal"}
        ],
        "details": "Northern unheated buffer zone insulating against freezing cold blasts.",
    })

    # 2. Living Area with Central Thermal Hearth
    rooms.append({
        "id": "living",
        "name": "Heated Central Living Hall",
        "label": "Heated Central Living Hall",
        "type": "living",
        "x": mx,
        "y": y2,
        "w": uw,
        "l": h_living,
        "doors": [
            {"x": _round_dims(mx + w_lobby * 0.5), "y": y2, "width": 1.2, "orientation": "horizontal"},
            {"x": _round_dims(mx + uw * 0.5), "y": y3, "width": 1.2, "orientation": "horizontal"},
        ],
        "windows": [
            {"x": mx, "y": _round_dims(y2 + h_living * 0.5), "width": 0.8, "orientation": "vertical"},  # small east/west
        ],
        "details": "Central gathering space anchored by masonry thermal storage core.",
    })

    # 3. South Solar Harvest Bedrooms & Kitchen
    w_kitchen = _round_dims(uw * 0.32)
    w_rem = _round_dims(uw - w_kitchen)

    rooms.append({
        "id": "kitchen",
        "name": "Kitchen",
        "label": "Kitchen",
        "type": "kitchen",
        "x": mx,
        "y": y3,
        "w": w_kitchen,
        "l": h_south,
        "doors": [
            {"x": _round_dims(mx + w_kitchen), "y": _round_dims(y3 + h_south * 0.5), "width": 1.0, "orientation": "vertical"}
        ],
        "windows": [
            {"x": _round_dims(mx + w_kitchen * 0.5), "y": _round_dims(y3 + h_south), "width": 1.2, "orientation": "horizontal"}
        ],
        "details": "Compact kitchen utilizing cooking heat to warm adjacent living zones.",
    })

    if bedrooms <= 1:
        wbath = _round_dims(w_rem * 0.30)
        wb1 = _round_dims(w_rem - wbath)
        rooms.append({
            "id": "bed1",
            "name": "Master Solar Bedroom",
            "label": "Master Solar Bedroom",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen),
            "y": y3,
            "w": wb1,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": y3, "width": 1.1, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": _round_dims(y3 + h_south), "width": 2.8, "orientation": "horizontal"}],
            "details": "Large south-facing double glazed solar window capturing maximum winter daytime warmth.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + w_kitchen + wb1),
            "y": y3,
            "w": wbath,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1), "y": _round_dims(y3 + h_south * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wbath * 0.5), "y": _round_dims(y3 + h_south), "width": 0.8, "orientation": "horizontal"}],
            "details": "Insulated internal bathroom.",
        })
    elif bedrooms == 2:
        wb1 = _round_dims(w_rem * 0.44)
        wb2 = _round_dims(w_rem * 0.36)
        wbath = _round_dims(w_rem - wb1 - wb2)
        rooms.append({
            "id": "bed1",
            "name": "Master Solar Bedroom",
            "label": "Master Solar Bedroom",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen),
            "y": y3,
            "w": wb1,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": y3, "width": 1.1, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": _round_dims(y3 + h_south), "width": 2.5, "orientation": "horizontal"}],
            "details": "Direct gain south glazing with insulated night shutters.",
        })
        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen + wb1),
            "y": y3,
            "w": wb2,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 * 0.5), "y": _round_dims(y3 + h_south), "width": 2.0, "orientation": "horizontal"}],
            "details": "Passive solar bedroom harvesting low winter angle sunshine.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + w_kitchen + wb1 + wb2),
            "y": y3,
            "w": wbath,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2), "y": _round_dims(y3 + h_south * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 + wbath * 0.5), "y": _round_dims(y3 + h_south), "width": 0.8, "orientation": "horizontal"}],
            "details": "Internally protected frost-free wet block.",
        })
    else:  # 3+ bedrooms
        wb1 = _round_dims(w_rem * 0.36)
        wb2 = _round_dims(w_rem * 0.28)
        wb3 = _round_dims(w_rem * 0.20)
        wbath = _round_dims(w_rem - wb1 - wb2 - wb3)
        rooms.append({
            "id": "bed1",
            "name": "Master Solar Bedroom",
            "label": "Master Solar Bedroom",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen),
            "y": y3,
            "w": wb1,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": y3, "width": 1.1, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 * 0.5), "y": _round_dims(y3 + h_south), "width": 2.2, "orientation": "horizontal"}],
            "details": "South passive solar room.",
        })
        rooms.append({
            "id": "bed2",
            "name": "Bedroom 2",
            "label": "Bedroom 2",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen + wb1),
            "y": y3,
            "w": wb2,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 * 0.5), "y": _round_dims(y3 + h_south), "width": 1.8, "orientation": "horizontal"}],
            "details": "South sunshine bedroom.",
        })
        rooms.append({
            "id": "bed3",
            "name": "Bedroom 3",
            "label": "Bedroom 3",
            "type": "bedroom",
            "x": _round_dims(mx + w_kitchen + wb1 + wb2),
            "y": y3,
            "w": wb3,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 + wb3 * 0.5), "y": y3, "width": 1.0, "orientation": "horizontal"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 + wb3 * 0.5), "y": _round_dims(y3 + h_south), "width": 1.6, "orientation": "horizontal"}],
            "details": "Compact solar bedroom.",
        })
        rooms.append({
            "id": "bath",
            "name": "Bathroom",
            "label": "Bathroom",
            "type": "bathroom",
            "x": _round_dims(mx + w_kitchen + wb1 + wb2 + wb3),
            "y": y3,
            "w": wbath,
            "l": h_south,
            "doors": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 + wb3), "y": _round_dims(y3 + h_south * 0.5), "width": 0.9, "orientation": "vertical"}],
            "windows": [{"x": _round_dims(mx + w_kitchen + wb1 + wb2 + wb3 + wbath * 0.5), "y": _round_dims(y3 + h_south), "width": 0.8, "orientation": "horizontal"}],
            "details": "Bathroom block.",
        })

    court_info = {"present": False}
    return rooms, court_info


def _build_temperate_layout(
    pw: float, pl: float, bedrooms: int
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    TEMPERATE: Open balanced layout integrating natural daylight and seasonal outdoor living.
    """
    rooms, _ = _build_warm_humid_layout(pw, pl, bedrooms)
    rooms[0]["name"] = "Semi-Covered Terrace / Patio"
    rooms[0]["label"] = "Semi-Covered Terrace / Patio"
    rooms[0]["details"] = "Indoor-outdoor living terrace catching year-round gentle daylight and breezes."
    court_info = {"present": False}
    return rooms, court_info


def build_spec(
    zone: str,
    design: Optional[Union[str, Dict[str, Any]]] = None,
    plot_width: float = 14.0,
    plot_length: float = 16.0,
    bedrooms: int = 2,
) -> Dict[str, Any]:
    """
    Generates a bioclimatically optimized design specification.

    Parameters:
    - zone: Bioclimatic classification (HOT_DRY, WARM_HUMID, COLD, COMPOSITE, TEMPERATE)
    - design: Optional design combination identifier or dictionary
    - plot_width: Plot width in meters (>= 8.0, <= 100.0)
    - plot_length: Plot length in meters (>= 8.0, <= 100.0)
    - bedrooms: Number of bedrooms (1 to 5)

    Returns:
    Dict matching frontend PlanSpec contract and climate shelter visualization parameters.
    """
    norm_zone = normalize_zone(zone)

    pw = float(plot_width)
    pl = float(plot_length)
    beds = int(bedrooms)

    rules = load_spec_rules()
    min_pw = float(rules.get("min_plot_width", 8.0))
    max_pw = float(rules.get("max_plot_width", 100.0))
    min_pl = float(rules.get("min_plot_length", 8.0))
    max_pl = float(rules.get("max_plot_length", 100.0))
    min_beds = int(rules.get("min_bedrooms", 1))
    max_beds = int(rules.get("max_bedrooms", 5))

    if pw < min_pw or pw > max_pw:
        raise ValueError(f"plot_width ({pw}m) must be between {min_pw} and {max_pw} meters.")
    if pl < min_pl or pl > max_pl:
        raise ValueError(f"plot_length ({pl}m) must be between {min_pl} and {max_pl} meters.")
    if beds < min_beds or beds > max_beds:
        raise ValueError(f"bedrooms ({beds}) must be between {min_beds} and {max_beds}.")

    configured_zones = rules.get("zones", {})
    if norm_zone in configured_zones:
        profile = configured_zones[norm_zone]
    else:
        # Fallback profile
        profile = {
            "roof_type": "hybrid_composite",
            "overhang": 0.8,
            "wall_thickness": 0.30,
            "orientation": 0.0,
            "notes": ["Fallback bioclimatic envelope baseline."],
        }

    # Generate rooms according to bioclimatic archetype
    if norm_zone == "HOT_DRY":
        rooms, court = _build_hot_dry_layout(pw, pl, beds)
    elif norm_zone == "COMPOSITE":
        rooms, court = _build_composite_layout(pw, pl, beds)
    elif norm_zone == "WARM_HUMID":
        rooms, court = _build_warm_humid_layout(pw, pl, beds)
    elif norm_zone == "COLD":
        rooms, court = _build_cold_layout(pw, pl, beds)
    else:  # TEMPERATE
        rooms, court = _build_temperate_layout(pw, pl, beds)

    # Validate mathematical bounds and non-overlap
    validate_layout(rooms, pw, pl)

    # Format design summary if passed
    design_str = None
    if isinstance(design, str):
        design_str = design
    elif isinstance(design, dict):
        design_str = design.get("name") or design.get("id")

    return {
        "zone": norm_zone,
        "plotSize": {"w": pw, "l": pl},
        "orientation": profile["orientation"],
        "rooms": rooms,
        "courtyard": court,
        "wall_thickness": profile["wall_thickness"],
        "roof_type": profile["roof_type"],
        "overhang": profile["overhang"],
        "concept_only": True,
        "notes": profile["notes"],
        "design_summary": design_str,
    }
