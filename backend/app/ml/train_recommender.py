"""
ML Training Pipeline for Vernacular Shelter Design Recommender.

Generates reproducible synthetic bioclimatic training data across Indian climate regimes,
applies heuristic scoring formulations from NBC 2016 Part 8 / ECBC 2017 with Gaussian noise,
trains a Multi-Output Random Forest Regressor, and serializes the trained model artifact.

Honest Disclaimer (Rule 5):
Training labels are generated using a documented mathematical scoring formulation plus noise.
The model learns to approximate this function across continuous multi-dimensional climate space;
it is not proof of real-world physical performance.
"""

import json
import logging
import os
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(BASE_DIR, "config", "ml_recommender.json")
MODEL_OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recommender_model.joblib")


def load_config(config_path: str = CONFIG_PATH) -> Dict[str, Any]:
    """Loads configuration parameters, feature definitions, and candidate designs from JSON."""
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _compute_archetype_score(
    features: np.ndarray,
    optimal: Dict[str, float],
    design_id: str,
) -> float:
    """
    Computes a continuous suitability score (0-100) based on distance from optimal bioclimatic niche.
    
    Features order:
    0: temperature_mean (°C)
    1: temperature_max (°C)
    2: temperature_min (°C)
    3: diurnal_range (°C)
    4: relative_humidity (%)
    5: annual_rainfall (mm)
    6: wind_speed_max (km/h)
    7: solar_radiation (MJ/m²)
    """
    t_mean, t_max, t_min, d_range, rh, rain, wind, solar = features

    # Base score
    score = 75.0

    # Specific bioclimatic response curves per design typology
    if design_id == "composite-courtyard":
        # Thrives in wide seasonal swings (hot summer + cold winter + moderate monsoon)
        score += min(15.0, (d_range - 10.0) * 1.5)
        score -= max(0.0, abs(t_mean - optimal["temperature_mean"]) * 1.2)
        score -= max(0.0, abs(rh - optimal["relative_humidity"]) * 0.4)
        if t_max >= 38.0 and t_min <= 10.0:
            score += 10.0  # Dual-season strength

    elif design_id == "earthship-biotecture":
        # Thrives in arid, dry heat with high diurnal range; penalized heavily by humidity and heavy rain
        score += min(20.0, (d_range - 12.0) * 2.0)
        score -= max(0.0, (rh - 40.0) * 1.5)  # Severe humidity penalty
        score -= max(0.0, (rain - 600.0) * 0.03)  # Rain penalty
        if t_max >= 40.0 and rh <= 35.0:
            score += 15.0

    elif design_id == "courtyard-haveli":
        # Hot-dry desert climate with high diurnal variation and stone thermal mass
        score += min(15.0, (d_range - 10.0) * 1.5)
        score -= max(0.0, (rh - 45.0) * 1.2)
        score -= max(0.0, (rain - 800.0) * 0.02)
        if t_max >= 38.0:
            score += 10.0

    elif design_id == "malay-kampung":
        # Warm-humid tropics: high humidity, heavy monsoon rain, high min temperatures
        score += min(20.0, (rh - 60.0) * 1.2)
        score += min(15.0, (rain - 1200.0) * 0.015)
        score -= max(0.0, (15.0 - t_min) * 3.0)  # Cannot tolerate freezing temperatures
        score -= max(0.0, (d_range - 12.0) * 2.0)  # Penalized by wide dry swings

    elif design_id == "bamboo-longhouse":
        # Warm-humid tropics: elevated stilt defense, porous woven ventilation
        score += min(20.0, (rh - 65.0) * 1.1)
        score += min(15.0, (rain - 1400.0) * 0.012)
        score -= max(0.0, (16.0 - t_min) * 3.5)  # Zero thermal mass freezes in winter
        score -= max(0.0, (d_range - 10.0) * 2.5)

    elif design_id == "alpine-chalet":
        # Cold climates: freezing min temperatures, snow shedding, compact volume
        score += min(25.0, (10.0 - t_mean) * 2.5)
        score += min(20.0, (5.0 - t_min) * 2.0)
        score -= max(0.0, (t_max - 30.0) * 3.0)  # Severe summer overheating penalty
        score -= max(0.0, (rh - 75.0) * 0.5)

    elif design_id == "new-england-saltbox":
        # Temperate / cold winds: moderate temperatures, cold winters, wind deflection
        score -= max(0.0, abs(t_mean - optimal["temperature_mean"]) * 2.0)
        score += min(15.0, (wind - 20.0) * 0.8)  # Aerodynamic wind deflection bonus
        score -= max(0.0, (t_max - 35.0) * 2.5)
        if t_min <= 0.0:
            score += 10.0  # Winter heating retention

    return float(np.clip(score, 5.0, 98.0))


def generate_synthetic_dataset(config: Dict[str, Any]) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Synthesizes bioclimatic records and generates label scores with Gaussian noise.
    
    Returns:
        X (np.ndarray): Shape (num_samples, 8) input features.
        y (np.ndarray): Shape (num_samples, 7) design suitability scores.
        target_names (List[str]): Design archetype IDs.
    """
    params = config["training_parameters"]
    num_samples: int = params["num_samples"]
    seed: int = params["random_seed"]
    noise_std: float = params["gaussian_noise_std"]
    candidates = config["candidate_designs"]
    target_names = [c["id"] for c in candidates]

    np.random.seed(seed)

    # 5 climate zone distribution modes
    zone_profiles = [
        # Hot-Dry (e.g. Jodhpur, Bikaner)
        {"t_mean": (28, 4), "t_max": (44, 4), "t_min": (12, 4), "d_range": (18, 4), "rh": (25, 10), "rain": (320, 150), "wind": (22, 8), "solar": (26, 3)},
        # Warm-Humid (e.g. Chennai, Kochi)
        {"t_mean": (29, 3), "t_max": (36, 3), "t_min": (23, 3), "d_range": (7, 2), "rh": (82, 8), "rain": (2200, 500), "wind": (25, 10), "solar": (21, 3)},
        # Composite (e.g. New Delhi, Lucknow)
        {"t_mean": (25, 4), "t_max": (43, 4), "t_min": (6, 3), "d_range": (16, 4), "rh": (54, 15), "rain": (800, 250), "wind": (18, 6), "solar": (22, 4)},
        # Cold (e.g. Leh, Shimla, Srinagar)
        {"t_mean": (7, 5), "t_max": (22, 5), "t_min": (-12, 6), "d_range": (13, 3), "rh": (60, 12), "rain": (650, 300), "wind": (28, 12), "solar": (19, 4)},
        # Temperate (e.g. Bengaluru, Pune)
        {"t_mean": (23, 3), "t_max": (33, 3), "t_min": (14, 3), "d_range": (11, 3), "rh": (62, 12), "rain": (950, 250), "wind": (20, 7), "solar": (23, 3)},
    ]

    samples_per_zone = num_samples // len(zone_profiles)
    feature_rows: List[List[float]] = []

    for prof in zone_profiles:
        for _ in range(samples_per_zone):
            t_mean = np.random.normal(*prof["t_mean"])
            t_max = max(t_mean + 2.0, np.random.normal(*prof["t_max"]))
            t_min = min(t_mean - 2.0, np.random.normal(*prof["t_min"]))
            d_range = max(2.0, t_max - t_min + np.random.normal(0, 1.0))
            rh = np.clip(np.random.normal(*prof["rh"]), 5.0, 99.0)
            rain = max(20.0, np.random.normal(*prof["rain"]))
            wind = max(2.0, np.random.normal(*prof["wind"]))
            solar = np.clip(np.random.normal(*prof["solar"]), 6.0, 31.0)

            feature_rows.append([t_mean, t_max, t_min, d_range, rh, rain, wind, solar])

    X = np.array(feature_rows, dtype=np.float64)

    # Compute target labels with controlled Gaussian noise
    y_list: List[List[float]] = []
    for row in X:
        row_scores: List[float] = []
        for c in candidates:
            base_score = _compute_archetype_score(row, c["optimal_conditions"], c["id"])
            noise = np.random.normal(0.0, noise_std)
            noisy_score = float(np.clip(base_score + noise, 0.0, 100.0))
            row_scores.append(round(noisy_score, 2))
        y_list.append(row_scores)

    y = np.array(y_list, dtype=np.float64)
    logger.info("Generated synthetic dataset: X shape=%s, y shape=%s", X.shape, y.shape)
    return X, y, target_names


def train_and_serialize_model(
    config_path: str = CONFIG_PATH,
    output_path: str = MODEL_OUTPUT_PATH,
) -> Dict[str, Any]:
    """
    Main training workflow: generates dataset, fits Random Forest, evaluates metrics, and serializes artifact.
    """
    config = load_config(config_path)
    X, y, target_names = generate_synthetic_dataset(config)

    test_ratio = config["training_parameters"]["test_split_ratio"]
    seed = config["training_parameters"]["random_seed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_ratio, random_state=seed
    )

    # Feature scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Multi-output Random Forest Regressor
    rf_params = config["training_parameters"]["model_hyperparameters"]
    model = RandomForestRegressor(random_state=seed, **rf_params)
    model.fit(X_train_scaled, y_train)

    # Evaluation
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)

    train_r2 = float(r2_score(y_train, y_pred_train))
    test_r2 = float(r2_score(y_test, y_pred_test))
    test_mae = float(mean_absolute_error(y_test, y_pred_test))

    logger.info("Model Training Complete. Train R2=%.4f, Test R2=%.4f, Test MAE=%.2f", train_r2, test_r2, test_mae)

    # Save artifact containing model, scaler, and metadata
    artifact = {
        "model": model,
        "scaler": scaler,
        "feature_names": [f["name"] for f in config["features"]],
        "target_names": target_names,
        "metrics": {
            "train_r2": round(train_r2, 4),
            "test_r2": round(test_r2, 4),
            "test_mae": round(test_mae, 2),
        },
        "model_version": "1.0.0",
        "provenance": {
            "source": config["source"],
            "verified": config["verified"],
            "note": "Trained on synthetic bioclimatic formulation derived from NBC 2016 Part 8 / ECBC 2017 plus Gaussian noise.",
        },
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    joblib.dump(artifact, output_path)
    logger.info("Saved serialized model artifact to %s (size: %.2f KB)", output_path, os.path.getsize(output_path) / 1024.0)

    return artifact["metrics"]


if __name__ == "__main__":
    train_and_serialize_model()
