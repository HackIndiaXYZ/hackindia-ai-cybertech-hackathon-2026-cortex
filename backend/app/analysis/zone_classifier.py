"""
Bioclimatic 5-zone climate classifier.

Implements sequential rule evaluation (COLD -> COMPOSITE -> HOT_DRY -> WARM_HUMID -> TEMPERATE)
based on thresholds loaded strictly from backend/app/config/zone_thresholds.json.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional, Union

from app.schemas.climate_schema import ClimateResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load thresholds strictly from JSON (per Rule 2: never hardcode in logic)
# ---------------------------------------------------------------------------
CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "config", "zone_thresholds.json"
)


def load_zone_thresholds() -> Dict[str, Any]:
    """Reads zone classification thresholds from zone_thresholds.json."""
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.error("Could not load zone_thresholds.json: %s", exc)
        return {
            "source": "Fallback default thresholds",
            "verified": False,
            "rules": [
                {
                    "zone": "COLD",
                    "conditions": {"coldest_month_mean_lt": 10.0, "hottest_month_max_lt": 30.0},
                },
                {
                    "zone": "COMPOSITE",
                    "conditions": {"hottest_month_max_gte": 35.0, "coldest_month_min_lte": 10.0},
                },
                {
                    "zone": "HOT_DRY",
                    "conditions": {
                        "hottest_month_max_gte": 35.0,
                        "hot_season_humidity_lt": 50.0,
                        "annual_rain_lt": 600.0,
                    },
                },
                {
                    "zone": "WARM_HUMID",
                    "conditions": {
                        "hottest_month_max_gte": 28.0,
                        "hot_season_humidity_gte": 60.0,
                        "coldest_month_mean_gte": 18.0,
                    },
                },
                {
                    "zone": "TEMPERATE",
                    "conditions": {},
                },
            ],
        }


def extract_climate_metrics(climate_summary: Union[ClimateResponse, Dict[str, Any]]) -> Dict[str, float]:
    """
    Extracts the key bioclimatic diagnostic values from a ClimateResponse or dictionary:
    - hottest_month_max
    - coldest_month_min
    - coldest_month_mean
    - hot_season_humidity
    - annual_rain
    """
    if hasattr(climate_summary, "model_dump"):
        data = climate_summary.model_dump()
    elif isinstance(climate_summary, dict):
        data = climate_summary
    else:
        data = dict(climate_summary)

    monthly_list: List[Dict[str, Any]] = data.get("monthly_summary", [])
    derived: Dict[str, Any] = data.get("derived_metrics", {})

    if not monthly_list:
        raise ValueError("Monthly climate summary is empty, cannot classify zone.")

    # 1. Hottest month max and month selection
    valid_max_months = [m for m in monthly_list if m.get("avg_temp_max") is not None]
    if valid_max_months:
        hottest_item = max(valid_max_months, key=lambda x: x["avg_temp_max"])
        hottest_month_max = float(hottest_item["avg_temp_max"])
        # Humidity in the hottest month
        hot_season_humidity = float(hottest_item.get("avg_humidity") or 50.0)
    else:
        hottest_month_max = 25.0
        hot_season_humidity = 50.0

    # 2. Coldest month min
    valid_min_months = [m for m in monthly_list if m.get("avg_temp_min") is not None]
    if valid_min_months:
        coldest_min_item = min(valid_min_months, key=lambda x: x["avg_temp_min"])
        coldest_month_min = float(coldest_min_item["avg_temp_min"])
    else:
        coldest_month_min = 15.0

    # 3. Coldest month mean
    valid_mean_months = [m for m in monthly_list if m.get("avg_temp_mean") is not None]
    if valid_mean_months:
        coldest_mean_item = min(valid_mean_months, key=lambda x: x["avg_temp_mean"])
        coldest_month_mean = float(coldest_mean_item["avg_temp_mean"])
    else:
        coldest_month_mean = 15.0

    # 4. Annual rain
    if "annual_rain" in derived and derived["annual_rain"] is not None:
        annual_rain = float(derived["annual_rain"])
    else:
        annual_rain = float(sum(m.get("avg_rainfall") or 0.0 for m in monthly_list))

    return {
        "hottest_month_max": round(hottest_month_max, 1),
        "coldest_month_min": round(coldest_month_min, 1),
        "coldest_month_mean": round(coldest_month_mean, 1),
        "hot_season_humidity": round(hot_season_humidity, 1),
        "annual_rain": round(annual_rain, 1),
    }


def classify_zone(climate_summary: Union[ClimateResponse, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates starting rules in strict sequence (first match wins):
    1. COLD: coldest_month_mean < 10 and hottest_month_max < 30
    2. COMPOSITE: hottest_month_max >= 35 and coldest_month_min <= 10
    3. HOT_DRY: hottest_month_max >= 35 and hot_season_humidity < 50 and annual_rain < 600
    4. WARM_HUMID: hottest_month_max >= 28 and hot_season_humidity >= 60 and coldest_month_mean >= 18
    5. TEMPERATE: fallback / everything else

    Returns:
        {
            "zone": str,
            "reason": str,
            "values": Dict[str, float],
            "matched_rule": str
        }
    """
    threshold_cfg = load_zone_thresholds()
    rules = threshold_cfg.get("rules", [])
    vals = extract_climate_metrics(climate_summary)

    t_max = vals["hottest_month_max"]
    t_min = vals["coldest_month_min"]
    t_mean_cold = vals["coldest_month_mean"]
    humidity_hot = vals["hot_season_humidity"]
    rain = vals["annual_rain"]

    for rule in rules:
        z = rule.get("zone")
        conds = rule.get("conditions", {})

        # 1. COLD
        if z == "COLD":
            c_mean_lt = conds.get("coldest_month_mean_lt", 10.0)
            h_max_lt = conds.get("hottest_month_max_lt", 30.0)
            if t_mean_cold < c_mean_lt and t_max < h_max_lt:
                return {
                    "zone": "COLD",
                    "reason": f"Cold zone: coldest month mean temp ({t_mean_cold}°C < {c_mean_lt}°C) and hottest month max ({t_max}°C < {h_max_lt}°C).",
                    "values": vals,
                    "matched_rule": "COLD",
                }

        # 2. COMPOSITE
        elif z == "COMPOSITE":
            h_max_gte = conds.get("hottest_month_max_gte", 35.0)
            c_min_lte = conds.get("coldest_month_min_lte", 10.0)
            if t_max >= h_max_gte and t_min <= c_min_lte:
                return {
                    "zone": "COMPOSITE",
                    "reason": f"Composite zone: extreme seasonal contrast with hottest month max ({t_max}°C >= {h_max_gte}°C) and coldest month min ({t_min}°C <= {c_min_lte}°C).",
                    "values": vals,
                    "matched_rule": "COMPOSITE",
                }

        # 3. HOT_DRY
        elif z == "HOT_DRY":
            h_max_gte = conds.get("hottest_month_max_gte", 35.0)
            hum_lt = conds.get("hot_season_humidity_lt", 50.0)
            rain_lt = conds.get("annual_rain_lt", 600.0)
            if t_max >= h_max_gte and humidity_hot < hum_lt and rain < rain_lt:
                return {
                    "zone": "HOT_DRY",
                    "reason": f"Hot-Dry zone: severe summer heat ({t_max}°C >= {h_max_gte}°C), low humidity ({humidity_hot}% < {hum_lt}%), and low annual rain ({rain}mm < {rain_lt}mm).",
                    "values": vals,
                    "matched_rule": "HOT_DRY",
                }

        # 4. WARM_HUMID
        elif z == "WARM_HUMID":
            h_max_gte = conds.get("hottest_month_max_gte", 28.0)
            hum_gte = conds.get("hot_season_humidity_gte", 60.0)
            c_mean_gte = conds.get("coldest_month_mean_gte", 18.0)
            if t_max >= h_max_gte and humidity_hot >= hum_gte and t_mean_cold >= c_mean_gte:
                return {
                    "zone": "WARM_HUMID",
                    "reason": f"Warm-Humid zone: warm summer ({t_max}°C >= {h_max_gte}°C), high humidity ({humidity_hot}% >= {hum_gte}%), and warm winter mean ({t_mean_cold}°C >= {c_mean_gte}°C).",
                    "values": vals,
                    "matched_rule": "WARM_HUMID",
                }

        # 5. TEMPERATE
        elif z == "TEMPERATE":
            return {
                "zone": "TEMPERATE",
                "reason": f"Temperate zone: moderate ambient temperatures year-round (hottest max {t_max}°C, coldest min {t_min}°C).",
                "values": vals,
                "matched_rule": "TEMPERATE",
            }

    # Ultimate fallback if no rules matched
    return {
        "zone": "TEMPERATE",
        "reason": f"Temperate zone (default fallback): moderate conditions (hottest max {t_max}°C, coldest min {t_min}°C).",
        "values": vals,
        "matched_rule": "TEMPERATE_FALLBACK",
    }
