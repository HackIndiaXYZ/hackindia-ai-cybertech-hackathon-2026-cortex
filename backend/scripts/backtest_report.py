"""
Backtest simulation script — run this to reproduce the comparison table
printed in the final report.

Usage (from backend/):
    python -m scripts.backtest_report

What it does:
  1. Backfills 3 sample locations (Kanpur, Jaipur, Ladakh) if needed.
  2. Trains FLAML models.
  3. Runs walk-forward backtests.
  4. Prints a table: location × horizon → AutoML MAE | Persistence MAE | Seasonal Naive MAE.
  5. Simulates failure modes and reports /forecast source.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pandas as pd

from app.services import history_store
from app.services.automl_forecaster import (
    _BACKTEST_DAYS,
    _MIN_TRAINING_ROWS,
    _seasonal_naive_forecast,
    _persistence_forecast,
    _walk_forward_mae,
    build_features,
    load_model,
    train_location,
)
from app.services.backfill_service import backfill_location, make_location_key

LOCATIONS = {
    "Kanpur": (26.4499, 80.3319),
    "Jaipur": (26.9124, 75.7873),
    "Ladakh": (34.1526, 77.5771),
}


def fmt(v) -> str:
    if v is None or (isinstance(v, float) and v == float("inf")):
        return "  N/A  "
    return f"{v:7.3f}"


async def main():
    print("\n" + "=" * 80)
    print("EcoShelter AutoML Backup — Backtest Report")
    print("=" * 80)

    # Phase 1: Backfill
    print("\n[1/3] Backfilling historical data...")
    for name, (lat, lng) in LOCATIONS.items():
        result = await backfill_location(lat, lng, years=3, force=False)
        lk = make_location_key(lat, lng)
        rows = history_store.count_rows(lk)
        print(f"  {name:<10}: {result.get('accepted', 0)} accepted | {rows} total rows")

    # Phase 2: Train
    print("\n[2/3] Training FLAML models...")
    for name, (lat, lng) in LOCATIONS.items():
        lk = make_location_key(lat, lng)
        rows = history_store.count_rows(lk)
        if rows < _MIN_TRAINING_ROWS:
            print(f"  {name}: SKIPPED — only {rows} rows")
            continue
        result = train_location(lat, lng)
        ver = result.get("version", "N/A") if result else "SKIPPED (FLAML not installed)"
        print(f"  {name}: version={ver}")

    # Phase 3: Backtest table
    print("\n[3/3] Walk-forward backtest comparison\n")
    print(f"{'Location':<12} {'Horizon':<8} {'AutoML MAE':>12} {'Persistence MAE':>16} {'Seasonal Naive MAE':>20} {'AutoML Accepted'}")
    print("-" * 80)

    for name, (lat, lng) in LOCATIONS.items():
        lk = make_location_key(lat, lng)
        rows = history_store.query_history(lk)
        if len(rows) < 30:
            print(f"{name:<12} {'N/A':<8} {'insufficient data':>52}")
            continue

        df = pd.DataFrame([r.model_dump() for r in rows])
        bundles = load_model(lk)

        for horizon in [1, 7]:
            bundle = bundles.get(horizon) if bundles else None
            bt = _walk_forward_mae(df, bundle, _BACKTEST_DAYS, horizon)
            accepted = bundle.get("accepted", False) if bundle else False
            print(
                f"{name:<12} {'day-' + str(horizon):<8} "
                f"{fmt(bt.get('automl_mae')):>12} "
                f"{fmt(bt.get('persistence_mae')):>16} "
                f"{fmt(bt.get('seasonal_mae')):>20} "
                f"{'YES' if accepted else 'NO':>12}"
            )

    print("\n" + "=" * 80)
    print("NOTE: AutoML on past temperature is a statistical backup, NOT a weather model.")
    print("      Accuracy degrades significantly after day 3-4.")
    print("      This model is only used when the live API is unavailable.\n")

    # Phase 4: Failure simulation
    print("\n[Bonus] Failure simulation\n")
    from app.services.forecast_service import get_forecast
    from unittest.mock import patch, AsyncMock

    loc_name = "Kanpur"
    lat, lng = LOCATIONS[loc_name]

    scenarios = [
        ("Primary model down", {"app.services.forecast_service._fetch_api_forecast": AsyncMock(side_effect=Exception("primary down"))}),
    ]

    for desc, patches in scenarios:
        with patch.multiple("app.services.forecast_service", **patches):
            result = await get_forecast(lat=lat, lng=lng, horizon=1, location_name=loc_name)
            print(f"  [{desc}] source={result.source}, is_fallback={result.is_fallback}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
