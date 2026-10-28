"""
AutoML backup forecaster — FLAML-based temperature forecaster.

Architecture:
  history_store (SQLite)
    → feature_builder   (lag features, rolling stats, calendar)
    → FLAML AutoML      (time-split, walk-forward backtest)
    → model registry    (versioned .pkl + metrics.json, keep last 3)
    → forecast          (direct 1-day and 7-day prediction)

Honest caveats (documented here and in API responses):
  - This is a statistical backup that extrapolates past temperature patterns.
  - It is NOT a numerical weather model.
  - Accuracy degrades significantly after day 3–4.
  - It is only activated when the primary model and the live API both fail.

Target variables: temp_max, temp_min, temp_mean
Horizons: 1 day ahead, 7 days ahead (separate models per horizon)
Minimum training data: 90 rows (configurable via settings).
"""

import json
import logging
import math
import pickle
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.core.config import settings
from app.services import history_store
from app.services.backfill_service import make_location_key

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration (all overridable via settings / env vars)
# ---------------------------------------------------------------------------
_MIN_TRAINING_ROWS: int = getattr(settings, "AUTOML_MIN_TRAINING_ROWS", 90)
_BACKTEST_DAYS: int = getattr(settings, "AUTOML_BACKTEST_DAYS", 90)
_FLAML_TIME_BUDGET: int = getattr(settings, "AUTOML_FLAML_TIME_BUDGET", 60)  # seconds
_KEEP_VERSIONS: int = getattr(settings, "AUTOML_KEEP_VERSIONS", 3)
_MODELS_DIR: Path = Path(
    getattr(settings, "AUTOML_MODELS_DIR", "backend/app/data/automl_models")
)
if not _MODELS_DIR.is_absolute():
    _MODELS_DIR = Path(__file__).resolve().parent.parent.parent / _MODELS_DIR

# ---------------------------------------------------------------------------
# In-memory registry: location_key → {horizon → loaded model bundle}
# ---------------------------------------------------------------------------
_registry: Dict[str, Dict[int, dict]] = {}
_registry_lock = threading.Lock()

# Training lock per location to prevent concurrent retrains
_training_locks: Dict[str, threading.Lock] = {}
_training_locks_lock = threading.Lock()


def _get_training_lock(location_key: str) -> threading.Lock:
    with _training_locks_lock:
        if location_key not in _training_locks:
            _training_locks[location_key] = threading.Lock()
        return _training_locks[location_key]


# ---------------------------------------------------------------------------
# Feature Engineering
# ---------------------------------------------------------------------------

_TARGETS = ["temp_max", "temp_min", "temp_mean"]
_LAG_DAYS = [1, 2, 3, 7, 14, 28]
_ROLLING_WINDOWS = [7, 14]


def build_features(df: pd.DataFrame, horizon: int) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Build lag/rolling/calendar features for training.

    The target columns are shifted forward by `horizon` days so that
    X[i] contains only past data and y[i] contains the value `horizon`
    days ahead. This avoids any future data leakage.

    Returns (X, y) DataFrames, both index-aligned and with NaN rows dropped.
    """
    df = df.sort_values("date").reset_index(drop=True).copy()
    df["date"] = pd.to_datetime(df["date"])

    feature_cols = []

    # Lag features
    for lag in _LAG_DAYS:
        for col in _TARGETS:
            fname = f"{col}_lag{lag}"
            df[fname] = df[col].shift(lag)
            feature_cols.append(fname)

    # Rolling statistics
    for window in _ROLLING_WINDOWS:
        for col in _TARGETS:
            fname_mean = f"{col}_rollmean{window}"
            fname_std = f"{col}_rollstd{window}"
            df[fname_mean] = df[col].shift(1).rolling(window, min_periods=max(2, window // 2)).mean()
            df[fname_std] = df[col].shift(1).rolling(window, min_periods=max(2, window // 2)).std()
            feature_cols.extend([fname_mean, fname_std])

    # Calendar features
    df["doy_sin"] = np.sin(2 * np.pi * df["date"].dt.day_of_year / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * df["date"].dt.day_of_year / 365.25)
    df["month"] = df["date"].dt.month
    feature_cols.extend(["doy_sin", "doy_cos", "month"])

    # Last known humidity / precipitation (lag-1)
    for extra_col in ["humidity", "precipitation"]:
        if extra_col in df.columns:
            fname = f"{extra_col}_lag1"
            df[fname] = df[extra_col].shift(1)
            feature_cols.append(fname)

    # Target: value `horizon` days in the future
    target_df = df[_TARGETS].shift(-horizon)
    target_df.columns = [f"{t}_target" for t in _TARGETS]

    X = df[feature_cols]
    y = target_df

    # Drop rows where any feature or any target is NaN
    combined = pd.concat([X, y], axis=1)
    combined = combined.dropna()
    X = combined[feature_cols]
    y = combined[[f"{t}_target" for t in _TARGETS]]

    return X, y


# ---------------------------------------------------------------------------
# Baselines
# ---------------------------------------------------------------------------

def _persistence_forecast(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    """Persistence baseline: predict today's values for every future day."""
    last = df.iloc[-1]
    base_date = pd.to_datetime(last["date"])
    rows = []
    for h in range(1, horizon + 1):
        rows.append(
            {
                "date": (base_date + timedelta(days=h)).strftime("%Y-%m-%d"),
                "temp_max": last.get("temp_max"),
                "temp_min": last.get("temp_min"),
                "temp_mean": last.get("temp_mean"),
                "humidity": last.get("humidity"),
                "precipitation": last.get("precipitation"),
            }
        )
    return pd.DataFrame(rows)


def _seasonal_naive_forecast(df: pd.DataFrame, horizon: int) -> pd.DataFrame:
    """
    Seasonal naive: use the average of same-day-of-year from previous years.
    Falls back to last known value when history is insufficient.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    last_date = df["date"].iloc[-1]
    rows = []
    for h in range(1, horizon + 1):
        target_date = last_date + timedelta(days=h)
        # Find same DOY from all years in history
        same_doy = df[df["date"].dt.day_of_year == target_date.day_of_year]
        row: dict = {"date": target_date.strftime("%Y-%m-%d")}
        for col in ["temp_max", "temp_min", "temp_mean", "humidity", "precipitation"]:
            if col in same_doy.columns and not same_doy[col].dropna().empty:
                row[col] = float(same_doy[col].dropna().mean())
            else:
                row[col] = float(df[col].dropna().mean()) if col in df.columns else None
        rows.append(row)
    return pd.DataFrame(rows)


def _mae(actuals: pd.Series, preds: pd.Series) -> float:
    """Mean Absolute Error, ignoring NaN pairs."""
    mask = actuals.notna() & preds.notna()
    if mask.sum() == 0:
        return float("inf")
    return float((actuals[mask] - preds[mask]).abs().mean())


# ---------------------------------------------------------------------------
# Walk-forward backtest
# ---------------------------------------------------------------------------

def _walk_forward_mae(
    df: pd.DataFrame,
    model_bundle: Optional[dict],
    backtest_days: int,
    horizon: int,
) -> dict:
    """
    Rolling-origin backtest over the last `backtest_days`.
    Returns dict: {automl_mae, persistence_mae, seasonal_mae} for temp_mean.
    """
    df = df.sort_values("date").reset_index(drop=True).copy()
    n = len(df)
    if n < backtest_days + 60:
        # Not enough data for a meaningful backtest
        return {
            "automl_mae": None,
            "persistence_mae": None,
            "seasonal_mae": None,
        }

    # Only backtest on the last `backtest_days` rows as test targets
    test_indices = range(n - backtest_days, n)
    automl_preds, persist_preds, seasonal_preds, actuals = [], [], [], []

    for test_idx in test_indices:
        # The model needs data up to (test_idx - horizon) to forecast test_idx
        cutoff = test_idx - horizon
        if cutoff < 60:
            continue

        train_df = df.iloc[:cutoff]
        actual_row = df.iloc[test_idx]
        actual = actual_row["temp_mean"]
        if pd.isna(actual):
            continue

        actuals.append(actual)

        # Persistence
        last_known = train_df.iloc[-1]["temp_mean"]
        persist_preds.append(float(last_known) if not pd.isna(last_known) else float("nan"))

        # Seasonal naive (from training data only)
        sn_fc = _seasonal_naive_forecast(train_df, horizon)
        sn_val = sn_fc.iloc[-1]["temp_mean"] if not sn_fc.empty else float("nan")
        seasonal_preds.append(float(sn_val) if sn_val is not None else float("nan"))

        # AutoML
        if model_bundle and "models" in model_bundle:
            try:
                X, _ = build_features(train_df.tail(60), 0)
                if not X.empty:
                    last_x = X.iloc[[-1]]
                    target_name = "temp_mean_target"
                    models = model_bundle["models"]
                    if target_name in models:
                        pred = float(models[target_name].predict(last_x)[0])
                    else:
                        pred = float("nan")
                else:
                    pred = float("nan")
            except Exception as exc:
                logger.debug("AutoML backtest predict error: %s", exc)
                pred = float("nan")
        else:
            pred = float("nan")

        automl_preds.append(pred)

    actuals_s = pd.Series(actuals)
    persist_s = pd.Series(persist_preds)
    seasonal_s = pd.Series(seasonal_preds)
    automl_s = pd.Series(automl_preds) if automl_preds else pd.Series(dtype=float)

    return {
        "automl_mae": _mae(actuals_s, automl_s) if len(automl_s) == len(actuals_s) else None,
        "persistence_mae": _mae(actuals_s, persist_s),
        "seasonal_mae": _mae(actuals_s, seasonal_s),
    }


# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------

def train_location(lat: float, lng: float) -> Optional[dict]:
    """
    Train FLAML AutoML models for a single location.
    Called in a background thread — never blocks request handling.

    Returns a dict with training summary, or None if training was skipped.
    """
    location_key = make_location_key(lat, lng)
    lock = _get_training_lock(location_key)

    if not lock.acquire(blocking=False):
        logger.info("Training already in progress for %s, skipping.", location_key)
        return None

    try:
        return _do_train(location_key, lat, lng)
    finally:
        lock.release()


def _do_train(location_key: str, lat: float, lng: float) -> Optional[dict]:
    """Inner training logic (runs inside the training lock)."""
    rows = history_store.query_history(location_key)
    if len(rows) < _MIN_TRAINING_ROWS:
        logger.info(
            "Skipping AutoML training for %s — only %d rows (need %d).",
            location_key,
            len(rows),
            _MIN_TRAINING_ROWS,
        )
        return None

    try:
        from flaml import AutoML as FLAMLAutoML  # lazy import — not always installed
    except ImportError:
        logger.error("FLAML is not installed. Run: pip install flaml[automl]")
        return None

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    version_ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    model_dir = _MODELS_DIR / location_key / version_ts
    model_dir.mkdir(parents=True, exist_ok=True)

    all_metrics: dict = {}
    horizon_bundles: Dict[int, dict] = {}

    for horizon in [1, 7]:
        X, y = build_features(df, horizon)
        if len(X) < 60:
            logger.warning(
                "Not enough feature rows for %s horizon=%d after lag building.",
                location_key,
                horizon,
            )
            continue

        # Time-based split — the last 20% for validation, no shuffle
        split_idx = int(len(X) * 0.8)
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]

        models: dict = {}
        val_metrics: dict = {}

        for target in _TARGETS:
            target_col = f"{target}_target"
            if target_col not in y_train.columns:
                continue

            automl = FLAMLAutoML()
            try:
                automl.fit(
                    X_train=X_train,
                    y_train=y_train[target_col],
                    task="regression",
                    metric="mae",
                    time_budget=_FLAML_TIME_BUDGET,
                    verbose=0,
                )
            except Exception as exc:
                logger.error(
                    "FLAML training failed for %s h=%d target=%s: %s",
                    location_key, horizon, target, exc
                )
                continue

            models[target_col] = automl

            # Validation MAE
            if not X_val.empty:
                preds = automl.predict(X_val)
                val_mae = _mae(y_val[target_col], pd.Series(preds, index=y_val.index))
                val_metrics[f"{target}_mae"] = round(float(val_mae), 4)

        if not models:
            continue

        # Walk-forward backtest vs baselines (on the whole df, using the trained models)
        bundle_for_backtest = {"models": models}
        bt_metrics = _walk_forward_mae(df, bundle_for_backtest, _BACKTEST_DAYS, horizon)

        # Accept AutoML only if it beats persistence on MAE
        automl_accepted = False
        automl_mae = bt_metrics.get("automl_mae")
        persist_mae = bt_metrics.get("persistence_mae")
        if automl_mae is not None and persist_mae is not None:
            automl_accepted = automl_mae < persist_mae
        else:
            automl_accepted = bool(val_metrics)  # accept if backtest not possible

        if not automl_accepted:
            logger.warning(
                "AutoML model for %s h=%d NOT accepted "
                "(automl_mae=%.4f vs persistence_mae=%.4f). "
                "Will serve best baseline instead.",
                location_key,
                horizon,
                automl_mae or float("inf"),
                persist_mae or float("inf"),
            )

        bundle = {
            "models": models if automl_accepted else {},
            "accepted": automl_accepted,
            "horizon": horizon,
            "val_metrics": val_metrics,
            "backtest_metrics": bt_metrics,
            "location_key": location_key,
            "version": version_ts,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "train_rows": len(X_train),
            "total_rows": len(df),
            "flaml_version": _flaml_version(),
            "feature_cols": list(X.columns),
        }

        horizon_bundles[horizon] = bundle
        all_metrics[f"h{horizon}"] = {
            "val_metrics": val_metrics,
            "backtest_metrics": bt_metrics,
            "accepted": automl_accepted,
        }

        # Persist model artifact
        model_file = model_dir / f"automl_h{horizon}.pkl"
        with open(model_file, "wb") as f:
            pickle.dump(bundle, f)
        logger.info(
            "Saved %s h=%d model: %s (accepted=%s)", location_key, horizon, model_file, automl_accepted
        )

    # Write metrics.json
    metrics_payload = {
        "location_key": location_key,
        "version": version_ts,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "total_rows": len(df),
        "horizons": all_metrics,
        "flaml_version": _flaml_version(),
    }
    metrics_file = model_dir / "metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    # Update in-memory registry
    with _registry_lock:
        _registry[location_key] = horizon_bundles

    # Prune old versions
    _prune_versions(location_key)

    logger.info("AutoML training complete for %s, version %s", location_key, version_ts)
    return metrics_payload


def _flaml_version() -> str:
    try:
        import flaml
        return getattr(flaml, "__version__", "unknown")
    except ImportError:
        return "not_installed"


def _prune_versions(location_key: str) -> None:
    """Keep only the last _KEEP_VERSIONS model directories, delete older ones."""
    loc_dir = _MODELS_DIR / location_key
    if not loc_dir.exists():
        return

    versions = sorted(
        [d for d in loc_dir.iterdir() if d.is_dir()],
        key=lambda d: d.name,
    )
    to_delete = versions[: max(0, len(versions) - _KEEP_VERSIONS)]
    for old_dir in to_delete:
        try:
            import shutil
            shutil.rmtree(old_dir)
            logger.info("Pruned old model version: %s", old_dir)
        except Exception as exc:
            logger.warning("Could not prune %s: %s", old_dir, exc)


# ---------------------------------------------------------------------------
# Loading models from disk
# ---------------------------------------------------------------------------

def load_model(location_key: str) -> Optional[Dict[int, dict]]:
    """
    Load the latest model version for a location from disk.
    Caches in _registry. Returns None if no model is available.
    """
    with _registry_lock:
        if location_key in _registry:
            return _registry[location_key]

    loc_dir = _MODELS_DIR / location_key
    if not loc_dir.exists():
        return None

    versions = sorted(
        [d for d in loc_dir.iterdir() if d.is_dir()],
        key=lambda d: d.name,
        reverse=True,
    )
    if not versions:
        return None

    latest = versions[0]
    bundles: Dict[int, dict] = {}
    for horizon in [1, 7]:
        pkl = latest / f"automl_h{horizon}.pkl"
        if pkl.exists():
            try:
                with open(pkl, "rb") as f:
                    bundle = pickle.load(f)
                bundles[horizon] = bundle
                logger.info("Loaded %s h=%d from %s", location_key, horizon, pkl)
            except Exception as exc:
                logger.warning("Failed to load model %s: %s", pkl, exc)

    if bundles:
        with _registry_lock:
            _registry[location_key] = bundles
        return bundles
    return None


# ---------------------------------------------------------------------------
# Forecast using AutoML (or best baseline)
# ---------------------------------------------------------------------------

def forecast_automl(
    lat: float,
    lng: float,
    horizon: int,
) -> Optional[List[dict]]:
    """
    Produce a forecast using the AutoML model if available and accepted,
    otherwise fall back to the best baseline (persistence or seasonal naive).

    Returns list of dicts per forecast day, or None when no fallback is possible
    (< 3 rows of history).
    """
    location_key = make_location_key(lat, lng)
    rows = history_store.query_history(location_key)
    if len(rows) < 3:
        return None

    df = pd.DataFrame([r.model_dump() for r in rows])
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Try loaded model
    bundles = load_model(location_key)
    bundle = bundles.get(horizon) if bundles else None

    if bundle and bundle.get("accepted") and bundle.get("models"):
        try:
            return _predict_with_bundle(df, bundle, horizon)
        except Exception as exc:
            logger.warning(
                "AutoML prediction failed for %s h=%d: %s. Falling to seasonal naive.",
                location_key, horizon, exc
            )

    # Fall back to seasonal naive (better for longer horizons than persistence)
    logger.info("Using seasonal_naive fallback for %s h=%d", location_key, horizon)
    sn_fc = _seasonal_naive_forecast(df, horizon)
    return sn_fc.to_dict(orient="records")


def _predict_with_bundle(
    df: pd.DataFrame, bundle: dict, horizon: int
) -> List[dict]:
    """Use the trained FLAML models to predict `horizon` days ahead."""
    X, _ = build_features(df, 0)  # horizon=0 to get current feature row
    if X.empty:
        raise ValueError("No feature rows could be built from history.")

    last_x = X.iloc[[-1]]
    models = bundle["models"]

    last_date = pd.to_datetime(df["date"].iloc[-1])
    results = []
    for h in range(1, horizon + 1):
        target_date = (last_date + timedelta(days=h)).strftime("%Y-%m-%d")
        row: dict = {"date": target_date}
        for target in _TARGETS:
            target_col = f"{target}_target"
            if target_col in models:
                val = float(models[target_col].predict(last_x)[0])
                if math.isnan(val) or not (-60 <= val <= 60):
                    raise ValueError(f"Out-of-range prediction {val} for {target}")
                row[target] = round(val, 2)
            else:
                row[target] = None
        # Humidity / precipitation: use seasonal naive as supplement
        sn_fc = _seasonal_naive_forecast(df, h)
        if not sn_fc.empty:
            sn_row = sn_fc.iloc[-1]
            row["humidity"] = sn_row.get("humidity")
            row["precipitation"] = sn_row.get("precipitation")
        else:
            row["humidity"] = None
            row["precipitation"] = None
        results.append(row)

    return results


# ---------------------------------------------------------------------------
# Status helpers for /backup/status
# ---------------------------------------------------------------------------

def get_location_status(location_key: str) -> dict:
    """Gather metrics.json data for a location (latest version)."""
    loc_dir = _MODELS_DIR / location_key
    if not loc_dir.exists():
        return {}

    versions = sorted(
        [d for d in loc_dir.iterdir() if d.is_dir()],
        key=lambda d: d.name,
        reverse=True,
    )
    if not versions:
        return {}

    metrics_file = versions[0] / "metrics.json"
    if not metrics_file.exists():
        return {}

    try:
        with open(metrics_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning("Failed to read metrics.json for %s: %s", location_key, exc)
        return {}
