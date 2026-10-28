"""
test_design_dataset.py
-----------------------
Unit and integration tests for the ML Design Recommender dataset generation pipeline:
- Validates backend/app/config/design_features.json schema and feature ordering.
- Tests scoring functions in ml/labeling/score_designs.py across extreme climate regimes.
- Tests ml/build_design_dataset.py data generation and differentiation checks.
"""

import json
import sys
from pathlib import Path
import numpy as np
import pytest

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

FEATURES_CONFIG_PATH = ROOT_DIR / "backend" / "app" / "config" / "design_features.json"
LABEL_RULES_PATH = ROOT_DIR / "ml" / "config" / "label_rules.json"
CLIMATE_RANGES_PATH = ROOT_DIR / "ml" / "config" / "climate_ranges.json"
DATASET_PATH = ROOT_DIR / "ml" / "data" / "processed" / "design_training.csv"

from ml.labeling.score_designs import (
    load_rules,
    score_comfort,
    score_cost,
    score_safety,
    score_sustainability,
    score_design,
)
from ml.build_design_dataset import (
    load_feature_order,
    load_designs,
    load_climate_ranges,
    sample_climate_points,
)


def test_design_features_json_structure():
    """Verify that design_features.json has all required fields and correct order."""
    assert FEATURES_CONFIG_PATH.exists(), f"Missing {FEATURES_CONFIG_PATH}"
    with FEATURES_CONFIG_PATH.open(encoding="utf-8") as f:
        data = json.load(f)

    assert "feature_order" in data
    assert "features" in data
    assert data["verified"] is False
    assert "NBC" in data["source"] or "ECBC" in data["source"]

    expected_order = [
        "latitude",
        "hottest_month_max",
        "coldest_month_min",
        "coldest_month_mean",
        "hot_season_humidity",
        "annual_rain",
        "wind_mean",
        "solar_mean",
        "days_above_40",
        "days_below_5",
    ]
    assert data["feature_order"] == expected_order
    assert len(data["features"]) == len(expected_order)

    feature_names = [item["name"] for item in data["features"]]
    assert feature_names == expected_order


def test_label_rules_json_structure():
    """Verify that label_rules.json defines all rule groups with source and unverified status."""
    assert LABEL_RULES_PATH.exists(), f"Missing {LABEL_RULES_PATH}"
    rules = load_rules(LABEL_RULES_PATH)

    for group_name in ["comfort_rules", "cost_rules", "safety_rules", "sustainability_rules"]:
        assert group_name in rules, f"Missing {group_name} in label_rules.json"
        group = rules[group_name]
        assert group.get("verified") is False, f"{group_name} must have verified=false"
        assert "source" in group, f"{group_name} must have a citation source"
        assert any(ref in group["source"] for ref in ["NBC", "ECBC", "GRIHA", "CPWD", "BIS"])


def test_scoring_hot_dry_climate():
    """Courtyard Haveli / Earthship should achieve superior comfort in hot-dry climates over light porous stilt designs."""
    hot_dry_climate = {
        "latitude": 26.9,
        "hottest_month_max": 44.0,
        "coldest_month_min": 10.0,
        "coldest_month_mean": 16.0,
        "hot_season_humidity": 22.0,
        "annual_rain": 250.0,
        "wind_mean": 18.0,
        "solar_mean": 26.0,
        "days_above_40": 55.0,
        "days_below_5": 0.0,
    }

    designs = {d["id"]: d for d in load_designs()}
    haveli = designs["courtyard-haveli"]
    bamboo = designs["bamboo-longhouse"]

    haveli_scores = score_design(hot_dry_climate, haveli)
    bamboo_scores = score_design(hot_dry_climate, bamboo)

    # In hot dry desert, courtyard haveli with thick stone mass & courtyard must score much higher in comfort than porous light bamboo
    assert haveli_scores["comfort"] > 85.0
    assert bamboo_scores["comfort"] < 40.0
    assert haveli_scores["comfort"] > bamboo_scores["comfort"] + 40.0


def test_scoring_warm_humid_climate():
    """Bamboo Longhouse / Malay Kampung should outperform heavy masonry in warm-humid tropical conditions."""
    warm_humid_climate = {
        "latitude": 9.9,
        "hottest_month_max": 33.0,
        "coldest_month_min": 24.0,
        "coldest_month_mean": 27.0,
        "hot_season_humidity": 85.0,
        "annual_rain": 2800.0,
        "wind_mean": 18.0,
        "solar_mean": 19.0,
        "days_above_40": 0.0,
        "days_below_5": 0.0,
    }

    designs = {d["id"]: d for d in load_designs()}
    kampung = designs["malay-kampung"]
    adobe = designs["adobe-cluster"]

    kampung_scores = score_design(warm_humid_climate, kampung)
    adobe_scores = score_design(warm_humid_climate, adobe)

    # In warm humid, cross-ventilation + elevated floor outperforms heavy earth cluster
    assert kampung_scores["comfort"] > 80.0
    assert kampung_scores["safety"] > adobe_scores["safety"]  # raised stilt floor sheds heavy monsoon rain
    assert kampung_scores["comfort"] > adobe_scores["comfort"]


def test_scoring_cold_climate():
    """Alpine Chalet with high insulation and steep gables must score high in cold snow-prone climates."""
    cold_climate = {
        "latitude": 34.1,
        "hottest_month_max": 24.0,
        "coldest_month_min": -15.0,
        "coldest_month_mean": -6.0,
        "hot_season_humidity": 45.0,
        "annual_rain": 200.0,
        "wind_mean": 20.0,
        "solar_mean": 22.0,
        "days_above_40": 0.0,
        "days_below_5": 140.0,
    }

    designs = {d["id"]: d for d in load_designs()}
    chalet = designs["alpine-chalet"]
    kampung = designs["malay-kampung"]

    chalet_scores = score_design(cold_climate, chalet)
    kampung_scores = score_design(cold_climate, kampung)

    assert chalet_scores["comfort"] > 85.0
    assert kampung_scores["comfort"] < 35.0
    assert chalet_scores["safety"] > kampung_scores["safety"]


def test_processed_dataset_integrity():
    """Verify that the generated design_training.csv exists, has >= 400 unique climates, 25 designs, and correct columns."""
    assert DATASET_PATH.exists(), f"Dataset file not found at {DATASET_PATH}"
    import pandas as pd

    df = pd.read_csv(DATASET_PATH)
    assert len(df) >= 10000
    assert df["climate_group"].nunique() >= 400
    assert df["design_id"].nunique() == 25

    expected_features = load_feature_order()
    for feat in expected_features:
        assert feat in df.columns, f"Missing feature {feat} in CSV"

    for target in ["target_comfort", "target_cost", "target_safety", "target_sustainability"]:
        assert target in df.columns
        assert (df[target] >= 0.0).all() and (df[target] <= 100.0).all()


def test_trained_model_artifact_and_prediction():
    """Verify that design_model_v1.joblib can be loaded and successfully infers 4 scores."""
    import joblib
    import pandas as pd

    model_path = ROOT_DIR / "backend" / "app" / "models" / "design_model_v1.joblib"
    assert model_path.exists(), f"Model artifact missing at {model_path}"

    artifact = joblib.load(model_path)
    assert "model" in artifact
    assert "preprocessor" in artifact
    assert "climate_feature_order" in artifact
    assert "target_names" in artifact
    assert artifact["target_names"] == ["comfort", "cost", "safety", "sustainability"]

    # Test inference on a sample input
    climate_sample = {
        "latitude": 26.9,
        "hottest_month_max": 42.0,
        "coldest_month_min": 8.0,
        "coldest_month_mean": 15.0,
        "hot_season_humidity": 25.0,
        "annual_rain": 350.0,
        "wind_mean": 18.0,
        "solar_mean": 26.0,
        "days_above_40": 45.0,
        "days_below_5": 2.0,
        "window_to_wall_ratio": 0.15,
        "has_courtyard": 1.0,
        "raised_floor": 0.0,
        "estimated_cost_level": 2.0,
        "wall_material": "adobe_mud_brick",
        "roof_type": "parapet_courtyard",
        "shading_depth": "high",
        "ventilation": "night",
        "thermal_mass": "high",
        "insulation": "medium",
        "plan_archetype": "HOT_DRY",
    }
    input_df = pd.DataFrame([climate_sample])
    X_trans = artifact["preprocessor"].transform(input_df)
    preds = artifact["model"].predict(X_trans)

    assert preds.shape == (1, 4)
    # Output scores must be valid bounded percentages
    for score in preds[0]:
        assert 0.0 <= score <= 100.0


def test_reports_and_metrics_files():
    """Verify that design_metrics.json, permutation_importance.json, and feature_importance.png exist."""
    metrics_path = ROOT_DIR / "ml" / "reports" / "design_metrics.json"
    perm_path = ROOT_DIR / "ml" / "reports" / "permutation_importance.json"
    plot_path = ROOT_DIR / "ml" / "reports" / "feature_importance.png"
    card_path = ROOT_DIR / "ml" / "MODEL_CARD_DESIGN.md"

    assert metrics_path.exists(), f"Missing {metrics_path}"
    assert perm_path.exists(), f"Missing {perm_path}"
    assert plot_path.exists(), f"Missing {plot_path}"
    assert card_path.exists(), f"Missing {card_path}"

    with open(metrics_path, "r", encoding="utf-8") as f:
        metrics = json.load(f)

    assert "model_selected" in metrics
    assert metrics["selected_metrics"]["test_r2"] > 0.85
    assert metrics["selected_metrics"]["top3_overlap"] > 0.70

