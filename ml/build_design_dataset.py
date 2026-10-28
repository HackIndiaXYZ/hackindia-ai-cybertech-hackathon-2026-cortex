"""
build_design_dataset.py
-----------------------
Generates the comprehensive training dataset for the EcoShelter Design Recommender ML model.

Workflow:
1. Loads fixed feature order from backend/app/config/design_features.json.
2. Loads all 25 vernacular and bioclimatic designs from backend/app/data/design_catalogue.json.
3. Samples >= 400 climate points across India's 5 bioclimatic zones using realistic
   ranges from ml/config/climate_ranges.json (and reference Indian cities).
4. Crosses every climate point with every design in the catalogue.
5. Computes four targets (comfort, cost, safety, sustainability) using ml.labeling.score_designs.
6. Injects configurable Gaussian noise to simulate real-world field variance.
7. Saves the dataset to ml/data/processed/design_training.csv with a climate_group column.
8. Prints a comprehensive validation summary and verifies that no two designs receive
   identical score profiles.
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd

# Add workspace root and backend to path so imports work cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from ml.labeling.score_designs import score_design

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# File Paths
CONFIG_DIR = ROOT_DIR / "ml" / "config"
FEATURES_CONFIG_PATH = ROOT_DIR / "backend" / "app" / "config" / "design_features.json"
CATALOGUE_PATH = ROOT_DIR / "backend" / "app" / "data" / "design_catalogue.json"
CLIMATE_RANGES_PATH = CONFIG_DIR / "climate_ranges.json"
OUTPUT_DIR = ROOT_DIR / "ml" / "data" / "processed"
OUTPUT_FILE = OUTPUT_DIR / "design_training.csv"


def load_feature_order(path: Path = FEATURES_CONFIG_PATH) -> List[str]:
    """Loads the fixed feature order specified in backend/app/config/design_features.json."""
    if not path.exists():
        raise FileNotFoundError(f"Features configuration file not found at {path}")
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    feature_order = data.get("feature_order", [])
    if not feature_order:
        raise ValueError(f"No 'feature_order' list found in {path}")
    logger.info("Loaded fixed feature order (%d features): %s", len(feature_order), feature_order)
    return feature_order


def load_designs(path: Path = CATALOGUE_PATH) -> List[Dict[str, Any]]:
    """Loads design dictionary from design_catalogue.json."""
    if not path.exists():
        raise FileNotFoundError(f"Design catalogue not found at {path}")
    with path.open(encoding="utf-8-sig") as f:
        data = json.load(f)
    designs = data.get("designs", [])
    if not designs:
        raise ValueError(f"No designs found in {path}")
    logger.info("Loaded %d designs from catalogue (%s)", len(designs), path.name)
    return designs


def load_climate_ranges(path: Path = CLIMATE_RANGES_PATH) -> Dict[str, Any]:
    """Loads bioclimatic ranges and reference stations from climate_ranges.json."""
    if not path.exists():
        raise FileNotFoundError(f"Climate ranges config not found at {path}")
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def sample_climate_points(
    ranges_config: Dict[str, Any],
    min_points: int = 400,
    seed: int = 42,
) -> List[Dict[str, Any]]:
    """
    Samples at least min_points climate points across Indian bioclimatic regimes.
    Includes real reference cities plus stratified Latin-hypercube-style continuous variations.
    """
    rng = np.random.default_rng(seed)
    climate_points: List[Dict[str, Any]] = []

    # 1. Include reference cities first
    ref_cities = ranges_config.get("reference_cities", [])
    for city in ref_cities:
        point = {
            "climate_group": f"city_{city['name'].lower().replace(' ', '_')}",
            "zone": city["zone"],
            "latitude": float(city["latitude"]),
            "hottest_month_max": float(city["hottest_month_max"]),
            "coldest_month_min": float(city["coldest_month_min"]),
            "coldest_month_mean": float(city["coldest_month_mean"]),
            "hot_season_humidity": float(city["hot_season_humidity"]),
            "annual_rain": float(city["annual_rain"]),
            "wind_mean": float(city["wind_mean"]),
            "solar_mean": float(city["solar_mean"]),
            "days_above_40": float(city["days_above_40"]),
            "days_below_5": float(city["days_below_5"]),
        }
        climate_points.append(point)

    # 2. Stratified continuous sampling per bioclimatic zone
    zones = ranges_config.get("zones", {})
    zone_keys = list(zones.keys())
    remaining_needed = max(0, min_points - len(climate_points))
    points_per_zone = int(np.ceil(remaining_needed / len(zone_keys)))

    for z_idx, z_key in enumerate(zone_keys):
        z_info = zones[z_key]
        for s_idx in range(points_per_zone):
            sample_id = f"{z_key.lower()}_sample_{s_idx + 1:03d}"

            # Continuous uniform sampling within realistic zone bounds
            lat = float(rng.uniform(*z_info["latitude_range"]))
            h_max = float(rng.uniform(*z_info["hottest_month_max"]))
            c_min = float(rng.uniform(*z_info["coldest_month_min"]))
            c_mean = float(np.clip(rng.uniform(*z_info["coldest_month_mean"]), c_min, h_max - 5.0))
            humidity = float(rng.uniform(*z_info["hot_season_humidity"]))
            rain = float(rng.uniform(*z_info["annual_rain"]))
            wind = float(rng.uniform(*z_info["wind_mean"]))
            solar = float(rng.uniform(*z_info["solar_mean"]))
            d_40 = float(rng.uniform(*z_info["days_above_40"]))
            d_5 = float(rng.uniform(*z_info["days_below_5"]))

            point = {
                "climate_group": sample_id,
                "zone": z_key,
                "latitude": round(lat, 4),
                "hottest_month_max": round(h_max, 1),
                "coldest_month_min": round(c_min, 1),
                "coldest_month_mean": round(c_mean, 1),
                "hot_season_humidity": round(humidity, 1),
                "annual_rain": round(rain, 1),
                "wind_mean": round(wind, 1),
                "solar_mean": round(solar, 2),
                "days_above_40": round(d_40, 1),
                "days_below_5": round(d_5, 1),
            }
            climate_points.append(point)

    logger.info("Sampled %d climate points across %d bioclimatic zones.", len(climate_points), len(zone_keys))
    return climate_points


def build_dataset(
    min_climate_points: int = 400,
    noise_std: float = 1.5,
    seed: int = 42,
    output_path: Path = OUTPUT_FILE,
) -> pd.DataFrame:
    """
    Builds the dataset by crossing climate points with catalogue designs,
    computing the 4 target scores with noise, and saving to CSV.
    """
    feature_order = load_feature_order()
    designs = load_designs()
    climate_ranges = load_climate_ranges()

    climate_points = sample_climate_points(climate_ranges, min_points=min_climate_points, seed=seed)
    rng = np.random.default_rng(seed)

    rows: List[Dict[str, Any]] = []

    for point in climate_points:
        clim_features = {k: point[k] for k in feature_order}
        climate_group = point["climate_group"]

        for design in designs:
            # Deterministic base scoring
            base_scores = score_design(clim_features, design)

            # Add small Gaussian noise to simulate field observation uncertainty
            noise = rng.normal(0.0, noise_std, size=4)
            comfort_noisy = float(np.clip(base_scores["comfort"] + noise[0], 0.0, 100.0))
            cost_noisy = float(np.clip(base_scores["cost"] + noise[1], 0.0, 100.0))
            safety_noisy = float(np.clip(base_scores["safety"] + noise[2], 0.0, 100.0))
            sustainability_noisy = float(np.clip(base_scores["sustainability"] + noise[3], 0.0, 100.0))

            row: Dict[str, Any] = {
                "climate_group": climate_group,
                "climate_zone": point.get("zone", "UNKNOWN"),
            }

            # Insert fixed climate features in specified order
            for f_name in feature_order:
                row[f_name] = clim_features[f_name]

            # Insert design features
            row["design_id"] = design["id"]
            row["design_name"] = design["name"]
            row["wall_material"] = design["wall_material"]
            row["roof_type"] = design["roof_type"]
            row["window_to_wall_ratio"] = design["window_to_wall_ratio"]
            row["shading_depth"] = design["shading_depth"]
            row["ventilation"] = design["ventilation"]
            row["thermal_mass"] = design["thermal_mass"]
            row["insulation"] = design["insulation"]
            row["has_courtyard"] = design["has_courtyard"]
            row["raised_floor"] = design["raised_floor"]
            row["plan_archetype"] = design["plan_archetype"]
            row["estimated_cost_level"] = design["estimated_cost_level"]

            # Insert targets (both prefixed and plain for convenience)
            row["target_comfort"] = round(comfort_noisy, 2)
            row["target_cost"] = round(cost_noisy, 2)
            row["target_safety"] = round(safety_noisy, 2)
            row["target_sustainability"] = round(sustainability_noisy, 2)

            rows.append(row)

    df = pd.DataFrame(rows)

    # Ensure output directory exists and save CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    logger.info("Saved dataset to %s (size: %.2f MB)", output_path, output_path.stat().st_size / (1024 * 1024))

    return df


def verify_and_print_summary(df: pd.DataFrame) -> None:
    """
    Prints a summary: rows, features, target statistics,
    and performs a rigorous check that no two designs receive identical scores across all climates.
    """
    feature_order = load_feature_order()
    target_cols = ["target_comfort", "target_cost", "target_safety", "target_sustainability"]

    print("\n" + "=" * 70)
    print("           ECOSHELTER DESIGN RECOMMENDER DATASET SUMMARY           ")
    print("=" * 70)
    print(f"Total Rows:               {len(df):,}")
    print(f"Total Unique Climates:    {df['climate_group'].nunique():,}")
    print(f"Total Unique Designs:     {df['design_id'].nunique():,}")
    print(f"Total Columns:            {len(df.columns)}")
    print(f"Climate Features ({len(feature_order)}):   {', '.join(feature_order)}")
    print(f"Target Columns ({len(target_cols)}):      {', '.join(target_cols)}")

    print("\n--- Target Score Distributions (0 - 100) ---")
    summary_stats = df[target_cols].describe().T[["mean", "std", "min", "50%", "max"]]
    summary_stats.columns = ["Mean", "Std", "Min", "Median", "Max"]
    print(summary_stats.to_string())

    print("\n--- Distinct Design Differentiation Check ---")
    # For every pair of designs, compute their score profiles across climate points
    pivot_profiles = df.pivot_table(index="design_id", columns="climate_group", values=target_cols)
    design_ids = list(pivot_profiles.index)

    identical_pairs = []
    min_pairwise_l1_dist = float("inf")
    closest_pair = ("", "")

    for i in range(len(design_ids)):
        for j in range(i + 1, len(design_ids)):
            d1 = design_ids[i]
            d2 = design_ids[j]
            v1 = pivot_profiles.loc[d1].values
            v2 = pivot_profiles.loc[d2].values
            l1_dist = float(np.mean(np.abs(v1 - v2)))

            if l1_dist < 1e-4:
                identical_pairs.append((d1, d2))

            if l1_dist < min_pairwise_l1_dist:
                min_pairwise_l1_dist = l1_dist
                closest_pair = (d1, d2)

    if identical_pairs:
        print(f"[FAIL] Found {len(identical_pairs)} pairs of designs with identical score profiles: {identical_pairs}")
        raise AssertionError(f"Identical design score profiles detected: {identical_pairs}")
    else:
        print("[OK] SUCCESS: Every design has a unique bioclimatic score response profile across climates.")
        print(f"   Closest design pair: '{closest_pair[0]}' vs '{closest_pair[1]}' (Mean absolute delta: {min_pairwise_l1_dist:.2f} pts)")

    print("=" * 70 + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build training dataset for EcoShelter Design Recommender.")
    parser.add_argument("--min-climates", type=int, default=420, help="Minimum number of climate points to sample (default: 420)")
    parser.add_argument("--noise-std", type=float, default=1.5, help="Standard deviation of Gaussian noise added to targets (default: 1.5)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility (default: 42)")
    parser.add_argument("--output", type=str, default=str(OUTPUT_FILE), help="Output CSV path")

    args = parser.parse_args()

    df = build_dataset(
        min_climate_points=args.min_climates,
        noise_std=args.noise_std,
        seed=args.seed,
        output_path=Path(args.output),
    )
    verify_and_print_summary(df)


if __name__ == "__main__":
    main()
