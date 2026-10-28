#!/usr/bin/env python
"""
Training script — trains the FLAML AutoML backup forecaster for one or more
locations and prints a backtest comparison table.

Usage (run from backend/):
    python -m scripts.train_automl
    python -m scripts.train_automl --lat 26.45 --lng 80.33
    python -m scripts.train_automl --locations kanpur jaipur ladakh

Requires:
  - weather_history.db to contain >= 90 rows for each location.
  - flaml installed: pip install flaml[automl]

Output:
  - Versioned model files at app/data/automl_models/{location_key}/{timestamp}/
  - metrics.json in each version directory
  - Backtest table printed to stdout
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd

from app.services import history_store
from app.services.automl_forecaster import (
    _BACKTEST_DAYS,
    _MIN_TRAINING_ROWS,
    _walk_forward_mae,
    build_features,
    load_model,
    train_location,
)
from app.services.backfill_service import make_location_key

PREDEFINED = {
    "kanpur": (26.4499, 80.3319),
    "jaipur": (26.9124, 75.7873),
    "ladakh": (34.1526, 77.5771),
}


def print_backtest_table(results: list) -> None:
    """Print a formatted comparison table."""
    print("\n" + "=" * 90)
    print(f"{'Location':<18} {'Horizon':<8} {'AutoML MAE':<14} {'Persistence MAE':<18} {'SeasonalNaive MAE':<18} {'Accepted'}")
    print("-" * 90)
    for r in results:
        print(
            f"{r['location']:<18} {r['horizon']:<8} "
            f"{fmt(r['automl_mae']):<14} {fmt(r['persistence_mae']):<18} "
            f"{fmt(r['seasonal_mae']):<18} {r['accepted']}"
        )
    print("=" * 90)
    print("MAE in °C for temp_mean. Lower is better.\n")
    print("NOTE: AutoML on past temperature is a statistical backup, not a weather model.")
    print("      Accuracy degrades significantly after day 3-4.")


def fmt(v) -> str:
    if v is None or (isinstance(v, float) and v == float("inf")):
        return "N/A"
    return f"{v:.3f}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Train AutoML backup forecaster.")
    parser.add_argument("--lat", type=float)
    parser.add_argument("--lng", type=float)
    parser.add_argument(
        "--locations",
        nargs="+",
        choices=list(PREDEFINED.keys()),
        default=list(PREDEFINED.keys()),
    )
    args = parser.parse_args()

    targets: list = []
    if args.lat is not None and args.lng is not None:
        targets.append(("custom", args.lat, args.lng))
    else:
        for name in args.locations:
            lat, lng = PREDEFINED[name]
            targets.append((name, lat, lng))

    backtest_results = []

    for name, lat, lng in targets:
        location_key = make_location_key(lat, lng)
        rows = history_store.query_history(location_key)
        n = len(rows)
        print(f"\n{'='*60}")
        print(f"Training: {name} ({location_key}) — {n} rows")

        if n < _MIN_TRAINING_ROWS:
            print(f"  SKIPPED — need {_MIN_TRAINING_ROWS} rows, have {n}.")
            print(f"  Run: python -m scripts.backfill --locations {name}")
            continue

        result = train_location(lat, lng)
        if result is None:
            print("  Training returned None (FLAML may not be installed, or lock contention).")
            continue

        print(f"  Version: {result.get('version')}")
        print(f"  Trained at: {result.get('trained_at')}")

        # Generate backtest comparison for the table
        df = pd.DataFrame([r.model_dump() for r in rows])
        bundles = load_model(location_key)
        for horizon in [1, 7]:
            bundle = bundles.get(horizon) if bundles else None
            bt = _walk_forward_mae(df, bundle, _BACKTEST_DAYS, horizon)
            accepted = result.get("horizons", {}).get(f"h{horizon}", {}).get("accepted", False)
            backtest_results.append(
                {
                    "location": name,
                    "horizon": f"day-{horizon}",
                    "automl_mae": bt.get("automl_mae"),
                    "persistence_mae": bt.get("persistence_mae"),
                    "seasonal_mae": bt.get("seasonal_mae"),
                    "accepted": "✓" if accepted else "✗",
                }
            )

    print_backtest_table(backtest_results)


if __name__ == "__main__":
    main()
