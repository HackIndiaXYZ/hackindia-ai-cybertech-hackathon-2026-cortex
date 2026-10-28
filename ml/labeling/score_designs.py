"""
score_designs.py
----------------
Deterministic, physically motivated scoring function that computes four target scores
(comfort, cost, safety, sustainability) from 0 to 100 for any (climate features, design) pair.

Physical Rationale & Reference Provenance:
- Comfort: Based on NBC 2016 Part 8 (Lighting & Ventilation) and ECBC 2017 Section 4.
  - Hot-dry climates reward high thermal mass, small windows, deep shading, courtyard microclimates, and night ventilation.
  - Warm-humid climates reward low thermal mass, large shaded apertures, cross-ventilation, and elevated floors.
  - Cold climates reward high envelope insulation, thermal mass, mixed/controlled ventilation, and solar passive glazing.
  - Composite climates reward dual-season envelope flexibility.
- Cost: Inverted scale (100 = most affordable / highest cost efficiency; 0 = most expensive).
  - Derived from baseline estimated_cost_level (1 to 5), vernacular vs. high-embodied materials, and roof structural complexity.
  - Sourced from CPWD Plinth Area Rates and NBC 2016 Part 2.
- Safety: Structural resilience against moisture, wind, snow, and flooding based on NBC 2016 Part 6 & BIS IS:875.
  - High rainfall rewards sloped roofs (steep gable, hipped stilted) and raised floors; penalizes flat/parapet roofs and unshielded earth.
  - High wind rewards aerodynamic hipped roofs and massive masonry; penalizes unanchored light framing.
  - Cold snow risk rewards steep gable roof shedding; penalizes flat roofs subject to snow ponding.
- Sustainability: Embodied carbon and operational passive savings based on GRIHA V.2019 Criterion 13 and ECBC 2017.
  - Low embodied carbon bio/earth materials (bamboo, adobe, rammed earth, mud ferro-cement) receive high bonuses.
  - Climate-matched passive envelopes receive operational energy conservation bonuses.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

# Path resolution
_RULES_PATH = Path(__file__).resolve().parent.parent / "config" / "label_rules.json"

_rules_cache: Optional[Dict[str, Any]] = None


def load_rules(path: Path = _RULES_PATH) -> Dict[str, Any]:
    """Loads and caches label rules configuration from JSON."""
    global _rules_cache
    if _rules_cache is None:
        if not path.exists():
            raise FileNotFoundError(f"Label rules file not found at {path}")
        with path.open(encoding="utf-8") as f:
            _rules_cache = json.load(f)
    return _rules_cache


def score_comfort(climate: Dict[str, float], design: Dict[str, Any], rules: Optional[Dict[str, Any]] = None) -> float:
    """
    Computes thermal comfort score (0-100) based on bioclimatic envelope alignment.
    """
    if rules is None:
        rules = load_rules()

    c_rules = rules["comfort_rules"]
    score = float(c_rules.get("base_score", 55.0))

    # Extract climate features
    hottest_max = float(climate.get("hottest_month_max", 30.0))
    coldest_min = float(climate.get("coldest_month_min", 15.0))
    humidity = float(climate.get("hot_season_humidity", 50.0))
    days_above_40 = float(climate.get("days_above_40", 0.0))
    days_below_5 = float(climate.get("days_below_5", 0.0))

    # Extract design features
    t_mass = str(design.get("thermal_mass", "medium")).lower()
    vent = str(design.get("ventilation", "mixed")).lower()
    wwr = float(design.get("window_to_wall_ratio", 0.25))
    shading = str(design.get("shading_depth", "medium")).lower()
    insul = str(design.get("insulation", "medium")).lower()
    has_courtyard = bool(design.get("has_courtyard", False))
    raised_floor = bool(design.get("raised_floor", False))
    roof = str(design.get("roof_type", "hybrid_composite")).lower()

    is_hot_dry = (hottest_max >= 34.0 or days_above_40 >= 10.0) and (humidity <= 48.0)
    is_warm_humid = (humidity >= 60.0) and (hottest_max >= 27.0)
    is_cold = (coldest_min <= 6.0) or (days_below_5 >= 10.0)
    is_composite = (days_above_40 >= 8.0) and (days_below_5 >= 5.0)

    # 1. Hot-Dry Climate Response
    if is_hot_dry:
        hd = c_rules["hot_dry"]
        score += hd["thermal_mass_adjustments"].get(t_mass, 0.0)
        score += hd["ventilation_adjustments"].get(vent, 0.0)
        score += hd["shading_adjustments"].get(shading, 0.0)

        # WWR penalty for excessive glazing in hot-dry sun
        wwr_adj = -16.0
        for bracket in hd["wwr_adjustments"]:
            if wwr <= bracket["max_wwr"]:
                wwr_adj = bracket["score"]
                break
        score += wwr_adj

        if has_courtyard:
            score += hd.get("courtyard_bonus", 10.0)

    # 2. Warm-Humid Climate Response
    elif is_warm_humid:
        wh = c_rules["warm_humid"]
        score += wh["ventilation_adjustments"].get(vent, 0.0)
        score += wh["thermal_mass_adjustments"].get(t_mass, 0.0)
        score += wh["shading_adjustments"].get(shading, 0.0)

        # WWR bonus for ample natural cross-ventilation apertures
        wwr_adj = 16.0
        for bracket in wh["wwr_adjustments"]:
            if wwr <= bracket["max_wwr"]:
                wwr_adj = bracket["score"]
                break
        score += wwr_adj

        if raised_floor:
            score += wh.get("raised_floor_bonus", 8.0)

    # 3. Cold Climate Response
    elif is_cold:
        cc = c_rules["cold_climate"]
        score += cc["insulation_adjustments"].get(insul, 0.0)
        score += cc["thermal_mass_adjustments"].get(t_mass, 0.0)
        score += cc["ventilation_adjustments"].get(vent, 0.0)

        if has_courtyard:
            score += cc.get("courtyard_penalty", -10.0)

        if roof == "monopitch_solar" or (0.20 <= wwr <= 0.38 and shading != "high"):
            score += cc.get("solar_glazing_bonus", {}).get("score", 6.0)

    # 4. Composite Climate Response (or moderate transition)
    elif is_composite:
        cp = c_rules["composite_climate"]
        score += cp["thermal_mass_adjustments"].get(t_mass, 0.0)
        score += cp["insulation_adjustments"].get(insul, 0.0)
        if has_courtyard:
            score += cp.get("courtyard_bonus", 8.0)
        if vent == "mixed":
            score += cp.get("ventilation_mixed_bonus", 8.0)
    else:
        # Temperate / Moderate baseline
        if t_mass in ["medium", "high"]:
            score += 5.0
        if vent in ["cross", "mixed"]:
            score += 5.0

    return float(max(5.0, min(98.0, score)))


def score_cost(climate: Dict[str, float], design: Dict[str, Any], rules: Optional[Dict[str, Any]] = None) -> float:
    """
    Computes cost efficiency score (0-100, where 100 is most affordable / low capital cost).
    """
    if rules is None:
        rules = load_rules()

    cost_rules = rules["cost_rules"]
    cost_level = str(design.get("estimated_cost_level", 3))
    base_scores = cost_rules["base_scores_by_cost_level"]
    score = float(base_scores.get(cost_level, 60.0))

    wall_mat = str(design.get("wall_material", "")).lower()
    roof_type = str(design.get("roof_type", "")).lower()

    mat_adjustments = cost_rules["material_cost_adjustments"]
    score += float(mat_adjustments.get(wall_mat, 0.0))

    roof_adjustments = cost_rules["roof_cost_adjustments"]
    score += float(roof_adjustments.get(roof_type, 0.0))

    return float(max(5.0, min(98.0, score)))


def score_safety(climate: Dict[str, float], design: Dict[str, Any], rules: Optional[Dict[str, Any]] = None) -> float:
    """
    Computes structural safety and environmental resilience score (0-100).
    """
    if rules is None:
        rules = load_rules()

    safety_rules = rules["safety_rules"]
    score = float(safety_rules.get("base_score", 60.0))

    annual_rain = float(climate.get("annual_rain", 800.0))
    wind_mean = float(climate.get("wind_mean", 15.0))
    days_below_5 = float(climate.get("days_below_5", 0.0))

    roof_type = str(design.get("roof_type", "")).lower()
    raised_floor = bool(design.get("raised_floor", False))
    shading = str(design.get("shading_depth", "medium")).lower()
    wall_mat = str(design.get("wall_material", "")).lower()

    # 1. Rainfall / Monsoon / Flood Resilience
    rain_rules = safety_rules["rainfall_resilience"]
    if annual_rain >= rain_rules.get("heavy_rain_threshold_mm", 1200.0):
        if roof_type in ["steep_gable", "hipped_stilted"]:
            score += rain_rules.get("sloped_roof_bonus", 14.0)
        elif roof_type in ["parapet_courtyard"]:
            score += rain_rules.get("flat_roof_penalty", -14.0)

        if raised_floor:
            score += rain_rules.get("raised_floor_bonus", 18.0)

        shading_bonus = rain_rules.get("shading_overhang_bonus", {}).get(shading, 0.0)
        score += shading_bonus

        if annual_rain >= rain_rules.get("extreme_rain_threshold_mm", 2000.0):
            if wall_mat in ["adobe_mud_brick", "woven_bamboo"] and not raised_floor:
                score += rain_rules.get("unprotected_earth_in_extreme_rain_penalty", -12.0)

    # 2. Wind Resilience
    wind_rules = safety_rules["wind_resilience"]
    if wind_mean >= wind_rules.get("high_wind_threshold_kmh", 22.0):
        if roof_type in ["hipped_stilted", "hybrid_composite"]:
            score += wind_rules.get("aerodynamic_hipped_roof_bonus", 10.0)
        if any(w in wall_mat for w in ["stone", "brick", "masonry", "concrete"]):
            score += wind_rules.get("massive_masonry_bonus", 8.0)
        elif any(w in wall_mat for w in ["woven_bamboo", "timber_slatted"]):
            score += wind_rules.get("light_envelope_penalty", -8.0)

    # 3. Snow / Freezing Resilience
    snow_rules = safety_rules["snow_resilience"]
    if days_below_5 >= snow_rules.get("snow_risk_cold_days_threshold", 15.0):
        if roof_type == "steep_gable":
            score += snow_rules.get("steep_gable_bonus", 16.0)
        elif roof_type in ["parapet_courtyard"]:
            score += snow_rules.get("flat_parapet_snow_penalty", -14.0)

    return float(max(5.0, min(98.0, score)))


def score_sustainability(climate: Dict[str, float], design: Dict[str, Any], rules: Optional[Dict[str, Any]] = None) -> float:
    """
    Computes sustainability and embodied/operational carbon score (0-100).
    """
    if rules is None:
        rules = load_rules()

    sust_rules = rules["sustainability_rules"]
    score = float(sust_rules.get("base_score", 50.0))

    wall_mat = str(design.get("wall_material", "")).lower()
    roof_type = str(design.get("roof_type", "")).lower()
    t_mass = str(design.get("thermal_mass", "medium")).lower()
    insul = str(design.get("insulation", "medium")).lower()
    vent = str(design.get("ventilation", "mixed")).lower()

    # 1. Embodied Carbon / Low-Impact Vernacular Materials
    mat_scores = sust_rules["embodied_carbon_material_scores"]
    score += float(mat_scores.get(wall_mat, 4.0))

    # 2. Operational Passive Energy Savings Match
    hottest_max = float(climate.get("hottest_month_max", 30.0))
    coldest_min = float(climate.get("coldest_month_min", 15.0))
    humidity = float(climate.get("hot_season_humidity", 50.0))

    passive_bonuses = sust_rules.get("passive_energy_savings", {})

    # Hot-dry passive cooling saving (avoids continuous AC chiller power)
    if hottest_max >= 34.0 and humidity <= 48.0 and t_mass == "high" and vent in ["night", "stack"]:
        score += float(passive_bonuses.get("hot_dry_passive_cooling_match", 10.0))

    # Warm-humid natural ventilation saving (avoids high AC consumption)
    if humidity >= 60.0 and vent == "cross" and t_mass == "low":
        score += float(passive_bonuses.get("warm_humid_passive_cooling_match", 10.0))

    # Cold climate heating energy reduction
    if coldest_min <= 6.0 and insul == "high":
        score += float(passive_bonuses.get("cold_insulation_heating_match", 12.0))

    # Solar energy generation
    if roof_type == "monopitch_solar":
        score += float(passive_bonuses.get("solar_roof_generation_bonus", 8.0))

    return float(max(5.0, min(98.0, score)))


def score_design(
    climate: Dict[str, float],
    design: Union[Dict[str, Any], Any],
    rules: Optional[Dict[str, Any]] = None,
) -> Dict[str, float]:
    """
    Computes all four targets (comfort, cost, safety, sustainability) for a
    (climate features, design) pair, clipped to [0, 100].

    Parameters:
        climate: dict of climate feature values (lat, temps, humidity, rain, wind, solar, etc.)
        design: dict or CatalogueDesign object containing architectural parameters.
        rules: optional pre-loaded rules dict (loaded from config if omitted).

    Returns:
        dict with keys: 'comfort', 'cost', 'safety', 'sustainability' (each float 0.0 - 100.0).
    """
    if hasattr(design, "model_dump"):
        d_dict = design.model_dump()
    elif hasattr(design, "__dict__"):
        d_dict = design.__dict__
    else:
        d_dict = dict(design)

    if rules is None:
        rules = load_rules()

    comfort = score_comfort(climate, d_dict, rules)
    cost = score_cost(climate, d_dict, rules)
    safety = score_safety(climate, d_dict, rules)
    sustainability = score_sustainability(climate, d_dict, rules)

    return {
        "comfort": round(comfort, 2),
        "cost": round(cost, 2),
        "safety": round(safety, 2),
        "sustainability": round(sustainability, 2),
    }
