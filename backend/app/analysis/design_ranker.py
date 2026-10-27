"""
MCDM Weighted Sum Design Ranking Engine.

Generates design candidates combining wall, roof, window, orientation, and ventilation
strategies, filters candidates by safety constraints, and ranks designs via multi-criteria
decision making (MCDM) weighted sum.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger(__name__)

DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "materials.json"
)
RULES_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "ranking_rules.json"
)
PRESETS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "presets.json"
)

VALID_ZONES = {"COLD", "COMPOSITE", "HOT_DRY", "WARM_HUMID", "TEMPERATE"}


def load_materials() -> Dict[str, Any]:
    """Loads material options from backend/app/data/materials.json."""
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load materials.json (%s), using safe defaults", exc)
        return {
            "source": "Fallback materials",
            "verified": False,
            "walls": [],
            "roof": [],
            "windows": [],
            "orientations": [],
            "ventilations": [],
        }


def load_ranking_rules() -> Dict[str, Any]:
    """Loads ranking rules and safety thresholds from ranking_rules.json."""
    try:
        with open(RULES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load ranking_rules.json (%s), using safe defaults", exc)
        return {
            "source": "Fallback ranking rules",
            "verified": False,
            "min_safety_score": 6.0,
            "default_top_n": 3,
            "max_top_n": 10,
            "component_weights": {
                "wall": 0.35,
                "roof": 0.35,
                "window": 0.15,
                "orientation": 0.075,
                "ventilation": 0.075,
            },
        }


def load_presets() -> Dict[str, Any]:
    """Loads optimization weight presets from presets.json."""
    try:
        with open(PRESETS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load presets.json (%s), using fallback presets", exc)
        return {
            "presets": {
                "Balanced": {
                    "label": "Balanced",
                    "weights": {"comfort": 0.25, "cost": 0.25, "safety": 0.25, "sustainability": 0.25},
                }
            }
        }


def normalize_zone(zone: str) -> str:
    """Standardizes zone identifier (e.g. 'hot-dry' -> 'HOT_DRY')."""
    if not zone or not isinstance(zone, str):
        raise ValueError("Zone must be a non-empty string.")
    cleaned = zone.strip().upper().replace("-", "_").replace(" ", "_")
    if cleaned not in VALID_ZONES:
        raise ValueError(
            f"Invalid climate zone '{zone}'. Must be one of: {', '.join(sorted(VALID_ZONES))}"
        )
    return cleaned


def normalize_weights(weights: Optional[Dict[str, Any]]) -> Dict[str, float]:
    """
    Validates that criteria weights are non-negative and normalizes them to sum to 1.0.
    Supports keys: comfort, cost, safety, sustainability.
    """
    if not weights:
        return {"comfort": 0.25, "cost": 0.25, "safety": 0.25, "sustainability": 0.25}

    required_keys = ["comfort", "cost", "safety", "sustainability"]
    normalized_input: Dict[str, float] = {}

    for k in required_keys:
        if k not in weights:
            raise ValueError(f"Missing required weight key '{k}'.")
        try:
            val = float(weights[k])
        except (TypeError, ValueError) as err:
            raise ValueError(f"Weight '{k}' must be a numeric value.") from err
        if val < 0.0:
            raise ValueError(f"Weight '{k}' cannot be negative (got {val}).")
        normalized_input[k] = val

    total = sum(normalized_input.values())
    if total <= 0.0:
        raise ValueError("Sum of criteria weights must be greater than zero.")

    return {k: round(v / total, 6) for k, v in normalized_input.items()}


def _generate_candidate_reasons(
    wall: Dict[str, Any],
    roof: Dict[str, Any],
    window: Dict[str, Any],
    vent: Dict[str, Any],
    zone: str,
    scores: Dict[str, int],
) -> List[str]:
    """Generates 3-4 concise architectural rationale bullet points."""
    reasons: List[str] = []

    # Specific bioclimatic highlights
    if "adobe" in wall.get("id", "") or "earth" in wall.get("id", ""):
        reasons.append("High thermal mass slows diurnal heat penetration and stabilizes indoor temperature.")
    elif "aac" in wall.get("id", ""):
        reasons.append("AAC blocks provide superior thermal insulation and fire protection.")
    elif "stone" in wall.get("id", ""):
        reasons.append("Dressed stone masonry delivers exceptional durability and natural weathering resistance.")
    elif "brick" in wall.get("id", ""):
        reasons.append("Locally familiar masonry offering reliable thermal inertia and structural support.")

    if "tile" in roof.get("id", ""):
        reasons.append("Sloped clay tiles facilitate monsoon drainage and attic convective cooling.")
    elif "insulated" in roof.get("id", ""):
        reasons.append("Insulated roof mitigates peak summer solar radiation absorption.")

    if "courtyard" in vent.get("id", ""):
        reasons.append("Courtyard stack draws nocturnal breezes to flush daytime heat sinks.")
    elif "cross" in vent.get("id", ""):
        reasons.append("Cross-ventilation layout maximizes natural indoor air velocity.")

    # High performance criteria notes
    if scores.get("comfort", 0) >= 80:
        reasons.append(f"Optimized passive envelope tailored for {zone.replace('_', ' ')} conditions.")
    elif scores.get("cost", 0) >= 75:
        reasons.append("High cost efficiency utilizing affordable local assembly techniques.")
    elif scores.get("sustainability", 0) >= 85:
        reasons.append("Low embodied carbon footprint with sustainable eco-friendly materials.")

    # Deduplicate while preserving order and limit to 3-4 points
    seen = set()
    distinct_reasons = []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            distinct_reasons.append(r)
    return distinct_reasons[:3]


def generate_candidates(zone: str) -> List[Dict[str, Any]]:
    """
    Generates all combinations of wall x roof x window x orientation x ventilation,
    filters out candidates that fail the safety threshold from config, and returns
    valid candidate design options with computed criteria scores (0-100).
    """
    clean_zone = normalize_zone(zone)
    materials = load_materials()
    rules = load_ranking_rules()

    min_safety = float(rules.get("min_safety_score", 6.0))
    comp_weights = rules.get(
        "component_weights",
        {"wall": 0.35, "roof": 0.35, "window": 0.15, "orientation": 0.075, "ventilation": 0.075},
    )

    walls = materials.get("walls", [])
    roofs = materials.get("roof", [])
    windows = materials.get("windows", [])
    orientations = materials.get("orientations", [])
    ventilations = materials.get("ventilations", [])

    candidates: List[Dict[str, Any]] = []

    for w in walls:
        for r in roofs:
            for win in windows:
                for ori in orientations:
                    for vent in ventilations:
                        # Aggregate raw scores (0-10) using component weights
                        comfort_raw = (
                            w["comfort_by_zone"].get(clean_zone, 5.0) * comp_weights["wall"]
                            + r["comfort_by_zone"].get(clean_zone, 5.0) * comp_weights["roof"]
                            + win["comfort_by_zone"].get(clean_zone, 5.0) * comp_weights["window"]
                            + ori["comfort_by_zone"].get(clean_zone, 5.0) * comp_weights["orientation"]
                            + vent["comfort_by_zone"].get(clean_zone, 5.0) * comp_weights["ventilation"]
                        )

                        cost_raw = (
                            w["cost"] * comp_weights["wall"]
                            + r["cost"] * comp_weights["roof"]
                            + win["cost"] * comp_weights["window"]
                            + ori["cost"] * comp_weights["orientation"]
                            + vent["cost"] * comp_weights["ventilation"]
                        )

                        safety_raw = (
                            w["safety"] * comp_weights["wall"]
                            + r["safety"] * comp_weights["roof"]
                            + win["safety"] * comp_weights["window"]
                            + ori["safety"] * comp_weights["orientation"]
                            + vent["safety"] * comp_weights["ventilation"]
                        )

                        sustainability_raw = (
                            w["sustainability"] * comp_weights["wall"]
                            + r["sustainability"] * comp_weights["roof"]
                            + win["sustainability"] * comp_weights["window"]
                            + ori["sustainability"] * comp_weights["orientation"]
                            + vent["sustainability"] * comp_weights["ventilation"]
                        )

                        # Safety Rule Filter: reject candidates with safety below threshold
                        if safety_raw < min_safety:
                            continue

                        # Convert to 0-100 scale:
                        # Cost is inverted: cheaper is better (cost_score = (10 - cost_raw) * 10)
                        comfort_score = int(round(max(0.0, min(10.0, comfort_raw)) * 10))
                        cost_score = int(round(max(0.0, min(10.0, 10.0 - cost_raw)) * 10))
                        safety_score = int(round(max(0.0, min(10.0, safety_raw)) * 10))
                        sustainability_score = int(round(max(0.0, min(10.0, sustainability_raw)) * 10))

                        scores = {
                            "comfort": comfort_score,
                            "cost": cost_score,
                            "safety": safety_score,
                            "sustainability": sustainability_score,
                        }

                        design_id = f"design-{w['id']}-{r['id']}-{win['id']}-{ori['id']}-{vent['id']}"
                        
                        # Friendly architectural name and description
                        name = f"{w['name'].split('(')[0].strip()} & {r['name'].replace('Standard ', '')}"
                        description = (
                            f"{w['name']} walls with {r['name']}, {win['name']}, "
                            f"{ori['name']}, and {vent['name']}."
                        )

                        reasons = _generate_candidate_reasons(w, r, win, vent, clean_zone, scores)

                        candidate = {
                            "id": design_id,
                            "name": name,
                            "scores": scores,
                            "description": description,
                            "reasons": reasons,
                            "components": {
                                "wall": w["name"],
                                "roof": r["name"],
                                "window": win["name"],
                                "orientation": ori["name"],
                                "ventilation": vent["name"],
                            },
                            "raw_metrics": {
                                "comfort_10": round(comfort_raw, 2),
                                "cost_10": round(cost_raw, 2),
                                "safety_10": round(safety_raw, 2),
                                "sustainability_10": round(sustainability_raw, 2),
                            },
                        }
                        candidates.append(candidate)

    return candidates


def rank_designs(
    zone: str,
    weights: Optional[Dict[str, Any]] = None,
    top_n: int = 3,
) -> Dict[str, Any]:
    """
    Ranks design candidates using Multi-Criteria Decision Making (MCDM) weighted sum.

    Score = w1*comfort + w2*cost_score + w3*safety + w4*sustainability
    where cost_score is inverted (cheaper materials yield higher cost scores).

    Returns top N design options matching frontend DesignModel contract.
    """
    clean_zone = normalize_zone(zone)
    norm_weights = normalize_weights(weights)
    candidates = generate_candidates(clean_zone)

    if not candidates:
        raise ValueError(f"No design candidates passed safety criteria for zone {clean_zone}.")

    w_comfort = norm_weights["comfort"]
    w_cost = norm_weights["cost"]
    w_safety = norm_weights["safety"]
    w_sust = norm_weights["sustainability"]

    scored_candidates = []
    for cand in candidates:
        sc = cand["scores"]
        total = (
            w_comfort * sc["comfort"]
            + w_cost * sc["cost"]
            + w_safety * sc["safety"]
            + w_sust * sc["sustainability"]
        )
        total_round = int(round(total))
        cand_with_score = dict(cand)
        cand_with_score["totalScore"] = total_round
        scored_candidates.append(cand_with_score)

    # Sort descending by totalScore; secondary tie-breaker comfort, then safety
    scored_candidates.sort(
        key=lambda x: (
            x["totalScore"],
            x["scores"]["comfort"],
            x["scores"]["safety"],
            x["scores"]["sustainability"],
        ),
        reverse=True,
    )

    top_results = scored_candidates[: max(1, top_n)]

    return {
        "zone": clean_zone,
        "weights_applied": norm_weights,
        "designs": top_results,
        "total_candidates_evaluated": len(candidates),
        "source": "NBC 2016 Part 11 & ECBC 2017 MCDM Design Ranking Baseline",
        "verified": False,
        "placeholder_note": "All scores and rankings are provisional heuristics to be verified with structural and thermal simulation models.",
    }
