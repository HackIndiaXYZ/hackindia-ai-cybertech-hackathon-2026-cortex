"""
train_design_model.py
---------------------
Trains and evaluates the EcoShelter Design Recommender multi-target surrogate model.

Pipeline Steps:
1. Load dataset (ml/data/processed/design_training.csv) and feature definitions from
   backend/app/config/design_features.json.
2. Group-aware train/test split using GroupShuffleSplit based on 'climate_group'
   so that no microclimate or geographic location appears in both train and test.
3. Preprocessing: Fixed climate features (pass-through) + Design attributes (One-Hot Encoded).
4. Train baseline (predicting mean), MultiOutputRegressor(GradientBoostingRegressor),
   and RandomForestRegressor.
5. Compute evaluation metrics (MAE and R2 per target: comfort, cost, safety, sustainability).
6. Evaluate architectural ranking metrics on unseen test climates:
   - Top-3 recommendation set overlap
   - Spearman rank correlation of total scores
7. Select the superior model and serialize the complete pipeline artifact to
   backend/app/models/design_model_v1.joblib.
8. Output evaluation report (ml/reports/design_metrics.json), permutation importance values,
   and a feature importance plot (ml/reports/feature_importance.png).
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend safe for headless servers/CI
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import OneHotEncoder

# Add workspace root and backend to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
DATASET_PATH = ROOT_DIR / "ml" / "data" / "processed" / "design_training.csv"
FEATURES_CONFIG_PATH = ROOT_DIR / "backend" / "app" / "config" / "design_features.json"
MODELS_DIR = ROOT_DIR / "backend" / "app" / "models"
REPORTS_DIR = ROOT_DIR / "ml" / "reports"
OUTPUT_MODEL_PATH = MODELS_DIR / "design_model_v1.joblib"
METRICS_JSON_PATH = REPORTS_DIR / "design_metrics.json"
PERM_IMPORTANCE_JSON_PATH = REPORTS_DIR / "permutation_importance.json"
FEATURE_IMPORTANCE_PLOT_PATH = REPORTS_DIR / "feature_importance.png"


def load_climate_feature_order(config_path: Path = FEATURES_CONFIG_PATH) -> List[str]:
    """
    Step 1a: Load the fixed climate feature order.
    Both training and production inference must use the exact same order defined in design_features.json.
    """
    with open(config_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["feature_order"]


def prepare_data(
    df: pd.DataFrame, climate_feature_order: List[str]
) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray, List[str], List[str]]:
    """
    Step 1b: Organize feature columns and targets.
    - Climate features: 10 fixed continuous features
    - Categorical design attributes: wall_material, roof_type, shading_depth, ventilation,
      thermal_mass, insulation, plan_archetype
    - Numeric/Boolean design attributes: window_to_wall_ratio, has_courtyard, raised_floor, estimated_cost_level
    """
    target_cols = ["target_comfort", "target_cost", "target_safety", "target_sustainability"]

    cat_design_cols = [
        "wall_material",
        "roof_type",
        "shading_depth",
        "ventilation",
        "thermal_mass",
        "insulation",
        "plan_archetype",
    ]

    num_design_cols = [
        "window_to_wall_ratio",
        "has_courtyard",
        "raised_floor",
        "estimated_cost_level",
    ]

    # Convert boolean flags to float for modeling
    df["has_courtyard"] = df["has_courtyard"].astype(float)
    df["raised_floor"] = df["raised_floor"].astype(float)
    df["window_to_wall_ratio"] = df["window_to_wall_ratio"].astype(float)
    df["estimated_cost_level"] = df["estimated_cost_level"].astype(float)

    all_input_cols = climate_feature_order + num_design_cols + cat_design_cols
    X = df[all_input_cols].copy()
    y = df[target_cols].copy()
    groups = df["climate_group"].values

    return X, y, groups, cat_design_cols, num_design_cols


def build_preprocessor(
    climate_feature_order: List[str],
    num_design_cols: List[str],
    cat_design_cols: List[str],
) -> ColumnTransformer:
    """
    Step 1c: Construct the reusable ColumnTransformer encoder.
    Climate features and numeric design attributes pass through unchanged.
    Categorical design attributes are one-hot encoded with handle_unknown='ignore'.
    """
    passthrough_cols = climate_feature_order + num_design_cols
    preprocessor = ColumnTransformer(
        transformers=[
            ("num_pass", "passthrough", passthrough_cols),
            (
                "cat_ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_design_cols,
            ),
        ]
    )
    return preprocessor


def compute_ranking_metrics(
    df_test: pd.DataFrame,
    y_true: np.ndarray,
    y_pred: np.ndarray,
) -> Dict[str, float]:
    """
    Step 4: Compute architectural ranking metrics on unseen test climates.
    For each test climate:
      1. Calculate predicted total score: average of comfort, cost, safety, sustainability.
      2. Calculate true total score.
      3. Identify top-3 design candidates according to predicted vs true scores.
      4. Measure top-3 candidate overlap fraction (0.0 to 1.0).
      5. Measure Spearman rank correlation across all 25 designs.
    """
    # Calculate balanced total score across 4 criteria
    true_total = np.mean(y_true, axis=1)
    pred_total = np.mean(y_pred, axis=1)

    eval_df = df_test[["climate_group", "design_id"]].copy().reset_index(drop=True)
    eval_df["true_total"] = true_total
    eval_df["pred_total"] = pred_total

    overlaps: List[float] = []
    spearman_corrs: List[float] = []

    for climate_id, group_df in eval_df.groupby("climate_group"):
        if len(group_df) < 3:
            continue

        sorted_true = group_df.sort_values(by="true_total", ascending=False)
        sorted_pred = group_df.sort_values(by="pred_total", ascending=False)

        top3_true = set(sorted_true.iloc[:3]["design_id"].values)
        top3_pred = set(sorted_pred.iloc[:3]["design_id"].values)

        overlap = len(top3_true.intersection(top3_pred)) / 3.0
        overlaps.append(overlap)

        # Spearman rank correlation across all designs for this climate
        if len(group_df) > 1 and group_df["pred_total"].std() > 1e-6:
            corr, _ = spearmanr(group_df["true_total"].values, group_df["pred_total"].values)
            if not np.isnan(corr):
                spearman_corrs.append(corr)

    return {
        "mean_top3_overlap": float(np.mean(overlaps)) if overlaps else 0.0,
        "mean_spearman_rho": float(np.mean(spearman_corrs)) if spearman_corrs else 0.0,
        "num_evaluated_climates": len(overlaps),
    }


def evaluate_model(
    model: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    target_names: List[str],
) -> Dict[str, Any]:
    """
    Step 3b: Evaluates model performance on train and test partitions.
    Computes overall and per-target MAE and R2.
    """
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)

    train_mae = float(mean_absolute_error(y_train, y_train_pred))
    test_mae = float(mean_absolute_error(y_test, y_test_pred))
    train_r2 = float(r2_score(y_train, y_train_pred))
    test_r2 = float(r2_score(y_test, y_test_pred))

    per_target = {}
    for idx, target in enumerate(target_names):
        target_name = target.replace("target_", "")
        t_mae = float(mean_absolute_error(y_test[:, idx], y_test_pred[:, idx]))
        t_r2 = float(r2_score(y_test[:, idx], y_test_pred[:, idx]))
        per_target[target_name] = {
            "test_mae": round(t_mae, 2),
            "test_r2": round(t_r2, 4),
        }

    return {
        "train_mae": round(train_mae, 2),
        "test_mae": round(test_mae, 2),
        "train_r2": round(train_r2, 4),
        "test_r2": round(test_r2, 4),
        "per_target": per_target,
        "y_test_pred": y_test_pred,
    }


def cross_validate_model(
    model_factory: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    groups_train: np.ndarray,
    n_splits: int = 5,
) -> Dict[str, float]:
    """
    Step 2b: GroupKFold cross-validation across training microclimates.
    Ensures stability across diverse climate clusters.
    """
    gkf = GroupKFold(n_splits=n_splits)
    cv_maes = []
    cv_r2s = []

    for train_idx, val_idx in gkf.split(X_train, y_train, groups=groups_train):
        m = model_factory()
        m.fit(X_train[train_idx], y_train[train_idx])
        val_pred = m.predict(X_train[val_idx])
        cv_maes.append(mean_absolute_error(y_train[val_idx], val_pred))
        cv_r2s.append(r2_score(y_train[val_idx], val_pred))

    return {
        "cv_mae_mean": round(float(np.mean(cv_maes)), 2),
        "cv_mae_std": round(float(np.std(cv_maes)), 2),
        "cv_r2_mean": round(float(np.mean(cv_r2s)), 4),
        "cv_r2_std": round(float(np.std(cv_r2s)), 4),
    }


def plot_feature_importance(
    model: Any,
    feature_names: List[str],
    output_path: Path,
    top_n: int = 15,
) -> None:
    """
    Step 5c: Generates and saves a clean feature importance bar chart.
    """
    # Extract importances: for MultiOutputRegressor, average across estimators; for RandomForest, use feature_importances_
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    elif hasattr(model, "estimators_"):
        importances = np.mean([est.feature_importances_ for est in model.estimators_], axis=0)
    else:
        logger.warning("Model does not provide tree feature_importances_.")
        return

    indices = np.argsort(importances)[::-1][:top_n]
    top_names = [feature_names[i] for i in indices][::-1]
    top_scores = [importances[i] for i in indices][::-1]

    plt.figure(figsize=(10, 6))
    bars = plt.barh(range(top_n), top_scores, color="#0f766e", edgecolor="#115e59")
    plt.yticks(range(top_n), top_names, fontsize=10)
    plt.xlabel("Relative Feature Importance (MDI)", fontsize=11, fontweight="bold")
    plt.title(f"EcoShelter Design Recommender — Top {top_n} Driving Features", fontsize=13, fontweight="bold")
    plt.grid(axis="x", linestyle="--", alpha=0.5)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=200)
    plt.close()
    logger.info("Saved feature importance chart to %s", output_path)


def main() -> None:
    logger.info("Starting EcoShelter Design Recommender Training Pipeline...")

    # 1. Load Data & Config
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run ml/build_design_dataset.py first.")

    df = pd.read_csv(DATASET_PATH)
    climate_feature_order = load_climate_feature_order(FEATURES_CONFIG_PATH)
    target_names = ["target_comfort", "target_cost", "target_safety", "target_sustainability"]

    logger.info("Loaded %d rows across %d climates.", len(df), df["climate_group"].nunique())

    X, y, groups, cat_design_cols, num_design_cols = prepare_data(df, climate_feature_order)

    # 2. Group-Aware Split
    # =========================================================================
    # Why GroupShuffleSplit and GroupKFold by climate_group?
    #
    # In our dataset, each climate station is crossed with all 25 architectural
    # designs. A naive random split would leak the same microclimate records into
    # both train and test partitions.
    # Grouping by `climate_group` guarantees that entire geographic locations are
    # held out, testing whether the model can truly generalize to new, unseen
    # microclimatic profiles rather than memorizing site coordinates or climate points.
    # =========================================================================
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    X_train_df, X_test_df = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
    y_train, y_test = y.iloc[train_idx].values, y.iloc[test_idx].values
    groups_train = groups[train_idx]
    df_test = df.iloc[test_idx].copy()

    logger.info(
        "Train set: %d rows (%d unique climates) | Test set: %d rows (%d unique climates)",
        len(X_train_df),
        len(np.unique(groups_train)),
        len(X_test_df),
        df_test["climate_group"].nunique(),
    )

    # 3. Fit Encoder & Transform
    preprocessor = build_preprocessor(climate_feature_order, num_design_cols, cat_design_cols)
    X_train = preprocessor.fit_transform(X_train_df)
    X_test = preprocessor.transform(X_test_df)

    # Reconstruct human-readable transformed feature names
    cat_ohe = preprocessor.named_transformers_["cat_ohe"]
    ohe_feature_names = list(cat_ohe.get_feature_names_out(cat_design_cols))
    all_feature_names = climate_feature_order + num_design_cols + ohe_feature_names

    logger.info("Transformed feature space dimensionality: %d inputs", X_train.shape[1])

    # 4. Train Models
    # Model A: Baseline Dummy Regressor (predicts mean)
    logger.info("Training Baseline Model (Dummy Mean Regressor)...")
    baseline = DummyRegressor(strategy="mean")
    baseline.fit(X_train, y_train)
    res_baseline = evaluate_model(baseline, X_train, y_train, X_test, y_test, target_names)
    rank_baseline = compute_ranking_metrics(df_test, y_test, res_baseline["y_test_pred"])

    # Model B: MultiOutputRegressor(GradientBoostingRegressor)
    logger.info("Training MultiOutput GradientBoostingRegressor...")
    gbr_factory = lambda: MultiOutputRegressor(
        GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42,
        )
    )
    cv_gbr = cross_validate_model(gbr_factory, X_train, y_train, groups_train, n_splits=5)
    model_gbr = gbr_factory()
    model_gbr.fit(X_train, y_train)
    res_gbr = evaluate_model(model_gbr, X_train, y_train, X_test, y_test, target_names)
    rank_gbr = compute_ranking_metrics(df_test, y_test, res_gbr["y_test_pred"])

    # Model C: RandomForestRegressor (Multi-Output natively supported)
    logger.info("Training RandomForestRegressor...")
    rf_factory = lambda: RandomForestRegressor(
        n_estimators=100,
        max_depth=12,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    cv_rf = cross_validate_model(rf_factory, X_train, y_train, groups_train, n_splits=5)
    model_rf = rf_factory()
    model_rf.fit(X_train, y_train)
    res_rf = evaluate_model(model_rf, X_train, y_train, X_test, y_test, target_names)
    rank_rf = compute_ranking_metrics(df_test, y_test, res_rf["y_test_pred"])

    # 5. Model Comparison and Selection
    logger.info("=== Model Comparison ===")
    logger.info(
        "Baseline  -> Test R2: %.4f | Test MAE: %.2f | Top-3 Overlap: %.1f%% | Spearman: %.4f",
        res_baseline["test_r2"],
        res_baseline["test_mae"],
        rank_baseline["mean_top3_overlap"] * 100,
        rank_baseline["mean_spearman_rho"],
    )
    logger.info(
        "GradBoost -> Test R2: %.4f | Test MAE: %.2f | Top-3 Overlap: %.1f%% | Spearman: %.4f",
        res_gbr["test_r2"],
        res_gbr["test_mae"],
        rank_gbr["mean_top3_overlap"] * 100,
        rank_gbr["mean_spearman_rho"],
    )
    logger.info(
        "RandForst -> Test R2: %.4f | Test MAE: %.2f | Top-3 Overlap: %.1f%% | Spearman: %.4f",
        res_rf["test_r2"],
        res_rf["test_mae"],
        rank_rf["mean_top3_overlap"] * 100,
        rank_rf["mean_spearman_rho"],
    )

    # Pick better model based on higher test R2
    if res_gbr["test_r2"] >= res_rf["test_r2"]:
        better_model = model_gbr
        better_name = "GradientBoostingRegressor (MultiOutput)"
        better_metrics = res_gbr
        better_ranking = rank_gbr
        better_cv = cv_gbr
    else:
        better_model = model_rf
        better_name = "RandomForestRegressor"
        better_metrics = res_rf
        better_ranking = rank_rf
        better_cv = cv_rf

    logger.info("Selected superior model: %s (Test R2=%.4f)", better_name, better_metrics["test_r2"])

    # 6. Save Compact Model Artifact for Production Deployment
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": better_model,
        "model_name": better_name,
        "preprocessor": preprocessor,
        "climate_feature_order": climate_feature_order,
        "cat_design_cols": cat_design_cols,
        "num_design_cols": num_design_cols,
        "all_feature_names": all_feature_names,
        "target_names": ["comfort", "cost", "safety", "sustainability"],
        "metrics": {
            "test_r2": better_metrics["test_r2"],
            "test_mae": better_metrics["test_mae"],
            "cv_r2_mean": better_cv["cv_r2_mean"],
            "cv_mae_mean": better_cv["cv_mae_mean"],
            "top3_overlap": round(better_ranking["mean_top3_overlap"], 4),
            "spearman_rho": round(better_ranking["mean_spearman_rho"], 4),
            "per_target": better_metrics["per_target"],
        },
        "model_version": "1.0.0",
        "provenance": {
            "source": "NBC 2016 Part 8 / ECBC 2017 & Open-Meteo Historical Climate Summary",
            "verified": False,
            "note": (
                "Provisional surrogate ML model trained on synthetic bioclimatic formulations "
                "plus Gaussian noise. Not validated against real building thermal sensors."
            ),
        },
    }
    joblib.dump(artifact, OUTPUT_MODEL_PATH, compress=3)
    file_size_mb = OUTPUT_MODEL_PATH.stat().st_size / (1024 * 1024)
    logger.info("Saved serialized model artifact to %s (size: %.2f MB)", OUTPUT_MODEL_PATH, file_size_mb)

    # 7. Save Reports: Metrics JSON
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_data = {
        "model_selected": better_name,
        "comparison": {
            "Baseline": {
                "test_r2": res_baseline["test_r2"],
                "test_mae": res_baseline["test_mae"],
                "top3_overlap": round(rank_baseline["mean_top3_overlap"], 4),
                "spearman_rho": round(rank_baseline["mean_spearman_rho"], 4),
            },
            "GradientBoostingRegressor": {
                "test_r2": res_gbr["test_r2"],
                "test_mae": res_gbr["test_mae"],
                "cv_r2_mean": cv_gbr["cv_r2_mean"],
                "cv_mae_mean": cv_gbr["cv_mae_mean"],
                "top3_overlap": round(rank_gbr["mean_top3_overlap"], 4),
                "spearman_rho": round(rank_gbr["mean_spearman_rho"], 4),
                "per_target": res_gbr["per_target"],
            },
            "RandomForestRegressor": {
                "test_r2": res_rf["test_r2"],
                "test_mae": res_rf["test_mae"],
                "cv_r2_mean": cv_rf["cv_r2_mean"],
                "cv_mae_mean": cv_rf["cv_mae_mean"],
                "top3_overlap": round(rank_rf["mean_top3_overlap"], 4),
                "spearman_rho": round(rank_rf["mean_spearman_rho"], 4),
                "per_target": res_rf["per_target"],
            },
        },
        "selected_metrics": {
            "test_r2": better_metrics["test_r2"],
            "test_mae": better_metrics["test_mae"],
            "top3_overlap": round(better_ranking["mean_top3_overlap"], 4),
            "spearman_rho": round(better_ranking["mean_spearman_rho"], 4),
            "per_target": better_metrics["per_target"],
        },
        "dataset_info": {
            "total_rows": len(df),
            "total_climates": df["climate_group"].nunique(),
            "train_rows": len(X_train_df),
            "test_rows": len(X_test_df),
            "train_climates": len(np.unique(groups_train)),
            "test_climates": df_test["climate_group"].nunique(),
        },
    }
    with open(METRICS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)
    logger.info("Saved metrics report to %s", METRICS_JSON_PATH)

    # 8. Permutation Importance
    logger.info("Computing Permutation Importance on held-out test climates...")
    perm_res = permutation_importance(
        better_model,
        X_test,
        y_test,
        n_repeats=5,
        random_state=42,
        n_jobs=-1,
    )
    perm_dict = {}
    for i, name in enumerate(all_feature_names):
        perm_dict[name] = {
            "importance_mean": round(float(perm_res.importances_mean[i]), 5),
            "importance_std": round(float(perm_res.importances_std[i]), 5),
        }
    # Sort by importance_mean descending
    sorted_perm = dict(sorted(perm_dict.items(), key=lambda kv: kv[1]["importance_mean"], reverse=True))
    with open(PERM_IMPORTANCE_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(sorted_perm, f, indent=2)
    logger.info("Saved permutation importance to %s", PERM_IMPORTANCE_JSON_PATH)

    # 9. Feature Importance Chart
    plot_feature_importance(better_model, all_feature_names, FEATURE_IMPORTANCE_PLOT_PATH)

    # 10. Print Final Console Summary
    print("\n" + "=" * 70)
    print("      ECOSHELTER DESIGN RECOMMENDER TRAINING EVALUATION SUMMARY      ")
    print("=" * 70)
    print(f"Model Chosen:             {better_name}")
    print(f"Test MAE (Mean Abs Err):  {better_metrics['test_mae']} pts")
    print(f"Test R² (Det. Coeff):     {better_metrics['test_r2']}")
    print(f"Top-3 Recommendation Hit: {better_ranking['mean_top3_overlap'] * 100:.2f}%")
    print(f"Spearman Rank Correlation:{better_ranking['mean_spearman_rho']:.4f}")
    print("\n--- Per-Target Evaluation Breakdown (Test Set) ---")
    for t_name, scores in better_metrics["per_target"].items():
        print(f"  • {t_name.upper():<14} R²: {scores['test_r2']:.4f} | MAE: {scores['test_mae']:.2f} pts")
    print("\n--- Top 5 Features by Permutation Importance ---")
    for f_name, f_data in list(sorted_perm.items())[:5]:
        print(f"  • {f_name:<30} Score: {f_data['importance_mean']:+.5f}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
