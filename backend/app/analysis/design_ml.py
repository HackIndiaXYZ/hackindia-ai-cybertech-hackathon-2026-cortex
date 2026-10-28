"""
design_ml.py
------------
Core ML analysis module for the EcoShelter Design Recommender.

Functions:
- load_model(): Loads the serialized model artifact at app startup.
- is_model_loaded(): Checks whether the model artifact is available in memory.
- get_model_info(): Returns model metadata (name, version, source: "ml").
- predict_design_scores(): Validates climate features against design_features.json
  and predicts comfort, cost, safety, and sustainability (0-100) for every design.
- recommend_designs(): Normalizes MCDM priority weights, ranks designs by weighted
  total score, selects top N distinct designs, and builds factual bioclimatic reasons.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from app.analysis.design_catalogue import get_catalogue
from app.schemas.design_schema import CatalogueDesign

logger = logging.getLogger(__name__)

# File Paths
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_MODEL_PATH = _BACKEND_DIR / "models" / "design_model_v1.joblib"
_FEATURES_CONFIG_PATH = _BACKEND_DIR / "config" / "design_features.json"
_PRESETS_CONFIG_PATH = _BACKEND_DIR / "config" / "presets.json"
_REASONS_CONFIG_PATH = _BACKEND_DIR / "config" / "reason_templates.json"

# In-memory cached model artifact
_model_artifact: Optional[Dict[str, Any]] = None
_features_config_cache: Optional[Dict[str, Any]] = None
_presets_config_cache: Optional[Dict[str, Any]] = None
_reasons_config_cache: Optional[Dict[str, Any]] = None


def load_features_config(path: Path = _FEATURES_CONFIG_PATH) -> Dict[str, Any]:
    """Loads and caches design_features.json."""
    global _features_config_cache
    if _features_config_cache is None:
        if not path.exists():
            raise FileNotFoundError(f"Feature config not found at {path}")
        with path.open(encoding="utf-8") as f:
            _features_config_cache = json.load(f)
    return _features_config_cache


def load_presets_config(path: Path = _PRESETS_CONFIG_PATH) -> Dict[str, Any]:
    """Loads and caches presets.json."""
    global _presets_config_cache
    if _presets_config_cache is None:
        if not path.exists():
            raise FileNotFoundError(f"Presets config not found at {path}")
        with path.open(encoding="utf-8") as f:
            _presets_config_cache = json.load(f)
    return _presets_config_cache


def load_reasons_config(path: Path = _REASONS_CONFIG_PATH) -> Dict[str, Any]:
    """Loads and caches reason_templates.json."""
    global _reasons_config_cache
    if _reasons_config_cache is None:
        if not path.exists():
            raise FileNotFoundError(f"Reason templates config not found at {path}")
        with path.open(encoding="utf-8") as f:
            _reasons_config_cache = json.load(f)
    return _reasons_config_cache


def load_model(model_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """
    Loads backend/app/models/design_model_v1.joblib into memory once at startup.
    If the file is missing or corrupted, logs a clear warning and keeps the app running.
    """
    global _model_artifact
    target_path = model_path or _DEFAULT_MODEL_PATH
    logger.info("Attempting to load Design ML model from %s", target_path)

    if not target_path.exists():
        logger.warning(
            "Design ML model artifact not found at %s. "
            "ML recommendation endpoints will return HTTP 503 until the model is available.",
            target_path,
        )
        _model_artifact = None
        return None

    try:
        artifact = joblib.load(target_path)
        required_keys = ["model", "preprocessor", "climate_feature_order"]
        for key in required_keys:
            if key not in artifact:
                raise ValueError(f"Model artifact at {target_path} missing required key '{key}'")

        _model_artifact = artifact
        logger.info(
            "Design ML model loaded successfully: '%s' (v%s). Ready for inference.",
            artifact.get("model_name", "RandomForestRegressor"),
            artifact.get("model_version", "1.0.0"),
        )
        return _model_artifact

    except Exception as exc:
        logger.error(
            "Failed to load Design ML model from %s: %s. Continuing startup without ML.",
            target_path,
            exc,
        )
        _model_artifact = None
        return None


def is_model_loaded() -> bool:
    """Returns True if the ML model artifact is loaded and ready for predictions."""
    return _model_artifact is not None


def get_model_info() -> Dict[str, Any]:
    """Returns model identity and provenance metadata."""
    if _model_artifact is None:
        return {"name": "Unavailable", "version": "0.0.0", "source": "ml"}
    return {
        "name": _model_artifact.get("model_name", "RandomForestRegressor"),
        "version": _model_artifact.get("model_version", "1.0.0"),
        "source": "ml",
    }


def validate_climate_features(features: Dict[str, Any]) -> Dict[str, float]:
    """
    Validates input features against backend/app/config/design_features.json.
    Raises ValueError with a clear explanation if:
    - Any required feature from 'feature_order' is missing or None.
    - Any feature value is non-numeric or out of its permissible [min_value, max_value] range.
    """
    config = load_features_config()
    feature_order = config.get("feature_order", [])
    features_meta = {item["name"]: item for item in config.get("features", [])}

    validated: Dict[str, float] = {}

    for f_name in feature_order:
        if f_name not in features or features[f_name] is None:
            raise ValueError(f"Missing required climate feature: '{f_name}'")

        val = features[f_name]
        try:
            val_float = float(val)
        except (ValueError, TypeError):
            raise ValueError(f"Feature '{f_name}' must be a numeric value, got '{val}'")

        meta = features_meta.get(f_name, {})
        min_v = meta.get("min_value")
        max_v = meta.get("max_value")

        if min_v is not None and val_float < min_v:
            raise ValueError(
                f"Feature '{f_name}' value {val_float} is below minimum allowed {min_v} {meta.get('unit', '')}"
            )
        if max_v is not None and val_float > max_v:
            raise ValueError(
                f"Feature '{f_name}' value {val_float} exceeds maximum allowed {max_v} {meta.get('unit', '')}"
            )

        validated[f_name] = round(val_float, 4)

    return validated


def predict_design_scores(features: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Validates the feature dict, scores EVERY design in the catalogue,
    and returns for each design the four predicted scores clipped to 0-100.

    Raises:
        RuntimeError: if the ML model is not loaded.
        ValueError: if input features fail validation against design_features.json.
    """
    if _model_artifact is None:
        raise RuntimeError("Design recommendation ML model is not loaded.")

    valid_clim = validate_climate_features(features)
    designs = get_catalogue()

    climate_feature_order = _model_artifact["climate_feature_order"]
    cat_design_cols = _model_artifact.get(
        "cat_design_cols",
        ["wall_material", "roof_type", "shading_depth", "ventilation", "thermal_mass", "insulation", "plan_archetype"],
    )
    num_design_cols = _model_artifact.get(
        "num_design_cols",
        ["window_to_wall_ratio", "has_courtyard", "raised_floor", "estimated_cost_level"],
    )

    # Build input batch DataFrame
    rows: List[Dict[str, Any]] = []
    for d in designs:
        row: Dict[str, Any] = {}
        for f_name in climate_feature_order:
            row[f_name] = valid_clim[f_name]

        # Numeric / Boolean design features
        row["window_to_wall_ratio"] = float(d.window_to_wall_ratio)
        row["has_courtyard"] = 1.0 if d.has_courtyard else 0.0
        row["raised_floor"] = 1.0 if d.raised_floor else 0.0
        row["estimated_cost_level"] = float(d.estimated_cost_level)

        # Categorical design features
        row["wall_material"] = str(d.wall_material)
        row["roof_type"] = str(d.roof_type)
        row["shading_depth"] = str(d.shading_depth)
        row["ventilation"] = str(d.ventilation)
        row["thermal_mass"] = str(d.thermal_mass)
        row["insulation"] = str(d.insulation)
        row["plan_archetype"] = str(d.plan_archetype)

        rows.append(row)

    batch_df = pd.DataFrame(rows)
    X_trans = _model_artifact["preprocessor"].transform(batch_df)
    preds = _model_artifact["model"].predict(X_trans)

    results: List[Dict[str, Any]] = []
    for i, d in enumerate(designs):
        raw_scores = preds[i]
        c = float(np.clip(raw_scores[0], 0.0, 100.0))
        co = float(np.clip(raw_scores[1], 0.0, 100.0))
        s = float(np.clip(raw_scores[2], 0.0, 100.0))
        su = float(np.clip(raw_scores[3], 0.0, 100.0))

        results.append({
            "design": d,
            "scores": {
                "comfort": round(c, 1),
                "cost": round(co, 1),
                "safety": round(s, 1),
                "sustainability": round(su, 1),
            },
        })

    return results


def normalize_weights(weights: Optional[Dict[str, Any]]) -> Dict[str, float]:
    """
    Validates that weights are non-negative and normalizes them to sum to 1.0.
    If weights is None or empty, loads the default 'Balanced' preset from presets.json.
    """
    if not weights:
        presets = load_presets_config().get("presets", {})
        balanced = presets.get("Balanced", {}).get("weights", {"comfort": 0.25, "cost": 0.25, "safety": 0.25, "sustainability": 0.25})
        return {k: float(balanced[k]) for k in ["comfort", "cost", "safety", "sustainability"]}

    criteria = ["comfort", "cost", "safety", "sustainability"]
    raw_weights = {}

    for c in criteria:
        val = weights.get(c, 0.0)
        try:
            val_f = float(val)
        except (ValueError, TypeError):
            raise ValueError(f"Weight '{c}' must be numeric, got '{val}'")
        if val_f < 0.0:
            raise ValueError(f"Weight '{c}' must be non-negative, got {val_f}")
        raw_weights[c] = val_f

    total = sum(raw_weights.values())
    if total <= 0.0:
        raise ValueError("At least one criterion weight must be greater than zero.")

    return {c: round(raw_weights[c] / total, 4) for c in criteria}


def build_design_reasons(
    design: CatalogueDesign,
    features: Dict[str, float],
    max_reasons: int = 3,
) -> List[str]:
    """
    Constructs 2 to 3 factual, non-invented architectural reason lines from
    reason_templates.json matching the design's real attributes and the site's climate values.
    """
    reasons_config = load_reasons_config()
    templates = reasons_config.get("templates", [])

    matched_reasons: List[Tuple[int, str]] = []

    # Human-readable formatters
    wall_display = design.wall_material.replace("_", " ")
    roof_display = design.roof_type.replace("_", " ")

    format_vars = {
        "wall_material": design.wall_material,
        "wall_material_display": wall_display,
        "roof_type": design.roof_type,
        "roof_type_display": roof_display,
        "shading_depth": design.shading_depth,
        "ventilation": design.ventilation,
        "thermal_mass": design.thermal_mass,
        "insulation": design.insulation,
        "estimated_cost_level": design.estimated_cost_level,
        **features,
    }

    for item in templates:
        attr = item["attribute"]
        expected_values = item["attribute_values"]
        climate_conds = item.get("climate_conditions", {})

        # 1. Attribute check
        d_val = getattr(design, attr, None)
        if d_val is None:
            continue

        if isinstance(d_val, bool):
            if d_val not in expected_values:
                continue
        elif isinstance(d_val, (int, float)):
            if d_val not in expected_values:
                continue
        else:
            if str(d_val).lower() not in [str(v).lower() for v in expected_values]:
                continue

        # 2. Climate conditions check
        cond_met = True
        for cond_key, threshold in climate_conds.items():
            if cond_key == "hottest_month_max_min" and features.get("hottest_month_max", 0.0) < threshold:
                cond_met = False
                break
            if cond_key == "hot_season_humidity_max" and features.get("hot_season_humidity", 0.0) > threshold:
                cond_met = False
                break
            if cond_key == "hot_season_humidity_min" and features.get("hot_season_humidity", 0.0) < threshold:
                cond_met = False
                break
            if cond_key == "coldest_month_min_max" and features.get("coldest_month_min", 99.0) > threshold:
                cond_met = False
                break
            if cond_key == "annual_rain_min" and features.get("annual_rain", 0.0) < threshold:
                cond_met = False
                break
            if cond_key == "days_below_5_min" and features.get("days_below_5", 0.0) < threshold:
                cond_met = False
                break
            if cond_key == "solar_mean_min" and features.get("solar_mean", 0.0) < threshold:
                cond_met = False
                break

        if not cond_met:
            continue

        try:
            formatted = item["template"].format(**format_vars)
            matched_reasons.append((item.get("priority", 5), formatted))
        except KeyError:
            continue

    # Sort matched reasons by priority (lower number = higher priority)
    matched_reasons.sort(key=lambda x: x[0])
    selected = [r[1] for r in matched_reasons[:max_reasons]]

    # Ensure at least 2 reasons
    if len(selected) < 2:
        selected.append(
            f"Designed according to {design.plan_archetype.replace('_', ' ').title()} bioclimatic envelope principles."
        )

    return selected[:max_reasons]


def recommend_designs(
    features: Dict[str, Any],
    weights: Optional[Dict[str, Any]] = None,
    top_n: int = 3,
) -> Dict[str, Any]:
    """
    Ranks all 25 catalogue designs for the given climate features using MCDM weighted sum
    over ML-predicted comfort, cost, safety, and sustainability scores.

    Returns:
        Dict with keys:
          - 'designs': List of top N ranked designs with id, name, plan_archetype, scores, total, reasons, rank
          - 'weights_used': Normalized weights dictionary
          - 'features_used': Validated climate features
          - 'model_info': Metadata dict (name, version, source: "ml")
    """
    if top_n < 1:
        raise ValueError("top_n must be at least 1")

    # 1. Normalize weights
    norm_weights = normalize_weights(weights)

    # 2. Predict scores for all designs
    scored_items = predict_design_scores(features)

    # 3. Calculate weighted total score
    ranked_candidates: List[Dict[str, Any]] = []
    validated_clim = validate_climate_features(features)

    for item in scored_items:
        d: CatalogueDesign = item["design"]
        sc = item["scores"]

        total = (
            norm_weights["comfort"] * sc["comfort"]
            + norm_weights["cost"] * sc["cost"]
            + norm_weights["safety"] * sc["safety"]
            + norm_weights["sustainability"] * sc["sustainability"]
        )

        reasons = build_design_reasons(d, validated_clim, max_reasons=3)

        ranked_candidates.append({
            "id": d.id,
            "name": d.name,
            "plan_archetype": d.plan_archetype,
            "scores": sc,
            "total": round(total, 2),
            "reasons": reasons,
        })

    # Sort descending by total score
    ranked_candidates.sort(key=lambda x: x["total"], reverse=True)

    # Filter to top N distinct designs
    top_designs: List[Dict[str, Any]] = []
    seen_ids: set = set()
    rank = 1

    for cand in ranked_candidates:
        if cand["id"] not in seen_ids:
            cand["rank"] = rank
            top_designs.append(cand)
            seen_ids.add(cand["id"])
            rank += 1
        if len(top_designs) >= top_n:
            break

    return {
        "designs": top_designs,
        "weights_used": norm_weights,
        "features_used": validated_clim,
        "model_info": get_model_info(),
    }
