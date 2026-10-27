"""
Thermal Risk Assessment Module.

Evaluates rule-based heat stress and cold stress based on historical climate indicators:
- Heat stress: days_above_40, hottest_month_max, hot-season humidity
- Cold stress: days_below_5, coldest_month_min

Thresholds and weights are loaded strictly from backend/app/config/risk_thresholds.json.
Output shape satisfies both the core risk assessment contract and frontend ZoneRiskData.
"""

import json
import logging
import os
from typing import Any, Dict, List, Tuple, Union

from app.analysis.zone_classifier import classify_zone
from app.schemas.climate_schema import ClimateResponse

logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "risk_thresholds.json"
)


def load_risk_thresholds() -> Dict[str, Any]:
    """Reads thermal risk thresholds from backend/app/config/risk_thresholds.json."""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load risk_thresholds.json (%s), using safe defaults", exc)
        return {
            "source": "Fallback default thresholds",
            "verified": False,
            "heat_stress": {"levels": []},
            "cold_stress": {"levels": []},
        }


def _extract_risk_variables(
    climate_summary: Union[ClimateResponse, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Extracts bioclimatic variables needed for thermal risk assessment:
    - hottest_month_max
    - hot_season_humidity
    - days_above_40
    - coldest_month_min
    - days_below_5
    - avgSummerTemp
    - avgWinterTemp
    - annualRainfall
    - data_confidence
    """
    if hasattr(climate_summary, "model_dump"):
        data = climate_summary.model_dump()
    elif isinstance(climate_summary, dict):
        data = climate_summary
    else:
        data = dict(climate_summary)

    monthly_list: List[Dict[str, Any]] = data.get("monthly_summary", [])
    derived: Dict[str, Any] = data.get("derived_metrics", {})
    quality: Dict[str, Any] = data.get("data_quality", {})

    if not monthly_list:
        raise ValueError("Monthly climate summary is empty, cannot assess thermal risk.")

    # 1. Hottest month maximum temperature & hot season humidity
    valid_max_months = [m for m in monthly_list if m.get("avg_temp_max") is not None]
    if valid_max_months:
        hottest_item = max(valid_max_months, key=lambda x: x["avg_temp_max"])
        hottest_month_max = float(hottest_item["avg_temp_max"])
        hot_season_humidity = float(hottest_item.get("avg_humidity") or 50.0)
    else:
        hottest_month_max = 28.0
        hot_season_humidity = 50.0

    # 2. Coldest month minimum temperature
    valid_min_months = [m for m in monthly_list if m.get("avg_temp_min") is not None]
    if valid_min_months:
        coldest_min_item = min(valid_min_months, key=lambda x: x["avg_temp_min"])
        coldest_month_min = float(coldest_min_item["avg_temp_min"])
    else:
        coldest_month_min = 15.0

    # 3. Derived threshold metrics
    days_above_40 = float(derived.get("days_above_40", 0.0))
    days_below_5 = float(derived.get("days_below_5", 0.0))
    annual_rain = float(derived.get("annual_rain", 0.0))

    # 4. Seasonal mean temperatures for whyNumbers
    mean_temps = [float(m["avg_temp_mean"]) for m in monthly_list if m.get("avg_temp_mean") is not None]
    if mean_temps:
        sorted_means = sorted(mean_temps)
        # Warmest 3 months average
        avg_summer_temp = sum(sorted_means[-3:]) / min(3, len(sorted_means))
        # Coolest 3 months average
        avg_winter_temp = sum(sorted_means[:3]) / min(3, len(sorted_means))
    else:
        avg_summer_temp = hottest_month_max - 5.0
        avg_winter_temp = coldest_month_min + 5.0

    # 5. Prediction confidence derived from missing data percent
    missing_pct = float(quality.get("missing_percent", 0.0))
    confidence = int(max(50, min(100, round(100 - missing_pct * 2))))

    return {
        "hottest_month_max": hottest_month_max,
        "hot_season_humidity": hot_season_humidity,
        "days_above_40": days_above_40,
        "coldest_month_min": coldest_month_min,
        "days_below_5": days_below_5,
        "avgSummerTemp": avg_summer_temp,
        "avgWinterTemp": avg_winter_temp,
        "annualRainfall": annual_rain,
        "confidence": confidence,
    }


def _evaluate_heat_stress(
    vars_dict: Dict[str, Any], levels_cfg: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Calculates heat stress level, score (0-100), and rationale."""
    h_max = vars_dict["hottest_month_max"]
    days_40 = vars_dict["days_above_40"]
    humidity = vars_dict["hot_season_humidity"]

    for rule in levels_cfg:
        lvl = rule.get("level")
        min_sc = int(rule.get("min_score", 0))
        max_sc = int(rule.get("max_score", 100))
        base_sc = float(rule.get("score_base", min_sc))
        max_factor = float(rule.get("score_max_temp_factor", 1.0))
        days_factor = float(rule.get("score_days_factor", 0.5))

        if lvl == "extreme":
            thresh_max = float(rule.get("hottest_month_max_gte", 44.0))
            thresh_days = float(rule.get("days_above_40_gte", 25.0))
            thresh_humid_max = float(rule.get("heat_index_humid_max_gte", 40.0))
            thresh_humid_val = float(rule.get("heat_index_humidity_gte", 50.0))

            matched = (
                (h_max >= thresh_max)
                or (days_40 >= thresh_days)
                or (h_max >= thresh_humid_max and humidity >= thresh_humid_val)
            )
            if matched:
                score = base_sc + max(0.0, h_max - thresh_max) * max_factor + max(0.0, days_40 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"Extreme heat stress: peak max temperature reaches {h_max:.1f}°C with "
                    f"{days_40:.1f} days/year >= 40°C and {humidity:.0f}% relative humidity."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "high":
            thresh_max = float(rule.get("hottest_month_max_gte", 39.0))
            thresh_days = float(rule.get("days_above_40_gte", 8.0))
            thresh_humid_max = float(rule.get("heat_index_humid_max_gte", 36.0))
            thresh_humid_val = float(rule.get("heat_index_humidity_gte", 55.0))

            matched = (
                (h_max >= thresh_max)
                or (days_40 >= thresh_days)
                or (h_max >= thresh_humid_max and humidity >= thresh_humid_val)
            )
            if matched:
                score = base_sc + max(0.0, h_max - thresh_max) * max_factor + max(0.0, days_40 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"High heat stress: peak max temperature is {h_max:.1f}°C with "
                    f"{days_40:.1f} days/year >= 40°C."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "medium":
            thresh_max = float(rule.get("hottest_month_max_gte", 34.0))
            thresh_days = float(rule.get("days_above_40_gte", 1.0))

            matched = (h_max >= thresh_max) or (days_40 >= thresh_days)
            if matched:
                score = base_sc + max(0.0, h_max - thresh_max) * max_factor + max(0.0, days_40 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"Moderate heat stress: summer peak max temperature reaches {h_max:.1f}°C."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "low":
            # Fallback
            score = max(0.0, min(24.0, (h_max - 20.0) * max_factor))
            final_score = int(max(0, min(max_sc, round(score))))
            reason = (
                f"Low heat stress: peak max temperatures remain mild at {h_max:.1f}°C with "
                f"{days_40:.1f} days >= 40°C."
            )
            return {"level": lvl, "score_0_100": final_score, "reason": reason}

    # Safe fallback if config is incomplete
    return {
        "level": "low",
        "score_0_100": 10,
        "reason": f"Low heat stress: peak summer temperatures average {h_max:.1f}°C.",
    }


def _evaluate_cold_stress(
    vars_dict: Dict[str, Any], levels_cfg: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Calculates cold stress level, score (0-100), and rationale."""
    c_min = vars_dict["coldest_month_min"]
    days_5 = vars_dict["days_below_5"]

    for rule in levels_cfg:
        lvl = rule.get("level")
        min_sc = int(rule.get("min_score", 0))
        max_sc = int(rule.get("max_score", 100))
        base_sc = float(rule.get("score_base", min_sc))
        min_factor = float(rule.get("score_min_temp_factor", 1.5))
        days_factor = float(rule.get("score_days_factor", 0.5))

        if lvl == "extreme":
            thresh_min = float(rule.get("coldest_month_min_lte", -2.0))
            thresh_days = float(rule.get("days_below_5_gte", 25.0))

            matched = (c_min <= thresh_min) or (days_5 >= thresh_days)
            if matched:
                score = base_sc + max(0.0, thresh_min - c_min) * min_factor + max(0.0, days_5 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"Extreme cold stress: coldest month minimum drops to {c_min:.1f}°C with "
                    f"{days_5:.1f} days/year <= 5°C."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "high":
            thresh_min = float(rule.get("coldest_month_min_lte", 3.0))
            thresh_days = float(rule.get("days_below_5_gte", 8.0))

            matched = (c_min <= thresh_min) or (days_5 >= thresh_days)
            if matched:
                score = base_sc + max(0.0, thresh_min - c_min) * min_factor + max(0.0, days_5 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"High cold stress: coldest month minimum drops to {c_min:.1f}°C with "
                    f"{days_5:.1f} days/year <= 5°C."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "medium":
            thresh_min = float(rule.get("coldest_month_min_lte", 8.0))
            thresh_days = float(rule.get("days_below_5_gte", 1.0))

            matched = (c_min <= thresh_min) or (days_5 >= thresh_days)
            if matched:
                score = base_sc + max(0.0, thresh_min - c_min) * min_factor + max(0.0, days_5 - thresh_days) * days_factor
                final_score = int(max(min_sc, min(max_sc, round(score))))
                reason = (
                    f"Moderate cold stress: coldest month minimum drops to {c_min:.1f}°C."
                )
                return {"level": lvl, "score_0_100": final_score, "reason": reason}

        elif lvl == "low":
            # Fallback
            score = max(0.0, min(24.0, (15.0 - c_min) * min_factor))
            final_score = int(max(0, min(max_sc, round(score))))
            reason = (
                f"Low cold stress: winter temperatures stay mild with minimum above {c_min:.1f}°C."
            )
            return {"level": lvl, "score_0_100": final_score, "reason": reason}

    # Safe fallback if config is incomplete
    return {
        "level": "low",
        "score_0_100": 10,
        "reason": f"Low cold stress: winter minimum averages {c_min:.1f}°C.",
    }


def assess_risk(
    climate_summary: Union[ClimateResponse, Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Evaluates thermal risk profile from historical climate data.

    Returns a structured dictionary containing:
    - heat: {level, score_0_100, reason}
    - cold: {level, score_0_100, reason}
    - zone: Bioclimatic zone code (e.g. HOT_DRY)
    - confidence: Prediction confidence (0-100)
    - heatStress: Heat stress score (0-100) matching ZoneRiskData
    - coldStress: Cold stress score (0-100) matching ZoneRiskData
    - whyNumbers: {avgSummerTemp, avgWinterTemp, annualRainfall}
    - explanation: Comprehensive climate reasoning
    - ruleBasedZone: Rule-based heuristic zone
    - mlZone: Calibrated bioclimatic zone
    - source: Data source citation
    - verified: Empirical verification flag
    """
    thresholds_data = load_risk_thresholds()
    heat_levels = thresholds_data.get("heat_stress", {}).get("levels", [])
    cold_levels = thresholds_data.get("cold_stress", {}).get("levels", [])

    # Extract diagnostic metrics
    diag_vars = _extract_risk_variables(climate_summary)

    # Evaluate stresses
    heat_eval = _evaluate_heat_stress(diag_vars, heat_levels)
    cold_eval = _evaluate_cold_stress(diag_vars, cold_levels)

    # Bioclimatic zone classification
    zone_result = classify_zone(climate_summary)
    zone_code = zone_result.get("zone", "COMPOSITE")
    zone_reason = zone_result.get("reason", "")

    heat_score = heat_eval["score_0_100"]
    cold_score = cold_eval["score_0_100"]

    explanation = (
        f"{zone_reason} Thermal assessment indicates {heat_eval['level']} heat stress "
        f"({heat_score}/100) and {cold_eval['level']} cold stress ({cold_score}/100)."
    )

    return {
        # Core thermal risk assessment contract
        "heat": heat_eval,
        "cold": cold_eval,

        # Frontend ZoneRiskData contract (frontend/client/src/mock/zoneRisk.ts)
        "zone": zone_code,
        "confidence": diag_vars["confidence"],
        "heatStress": heat_score,
        "coldStress": cold_score,
        "whyNumbers": {
            "avgSummerTemp": round(diag_vars["avgSummerTemp"], 1),
            "avgWinterTemp": round(diag_vars["avgWinterTemp"], 1),
            "annualRainfall": round(diag_vars["annualRainfall"], 1),
        },
        "explanation": explanation,
        "ruleBasedZone": zone_code,
        "mlZone": zone_code,

        # Metadata
        "source": thresholds_data.get(
            "source",
            "IMD Heat Wave & Cold Wave Criteria (simplified baseline to be calibrated)",
        ),
        "verified": thresholds_data.get("verified", False),
    }
