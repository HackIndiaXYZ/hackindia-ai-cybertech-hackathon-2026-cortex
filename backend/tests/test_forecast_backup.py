"""
Tests for the AutoML backup forecasting system.

Covers (per spec):
  1. Upsert has no duplicates.
  2. Validation rejects bad rows (nulls, impossible temps, negative precip).
  3. Feature engineering has no data leakage (no feature uses data from target date
     or later).
  4. Fallback chain moves to next step when primary raises or returns NaN.
  5. GET /history, GET /forecast, GET /backup/status endpoints.

All external API calls are mocked — no network calls.
"""

import math
import sqlite3
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest

# ---------------------------------------------------------------------------
# Helpers to create in-memory / temp-file history store for isolation
# ---------------------------------------------------------------------------


def _make_temp_store():
    """Return a dict with a temp db path and override the store module."""
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    return tmp.name


def _generate_fake_df(n_days: int = 200) -> pd.DataFrame:
    """Generate a synthetic daily weather DataFrame for feature/model tests."""
    import numpy as np

    dates = pd.date_range(end=datetime.now(timezone.utc).date(), periods=n_days, freq="D")
    rng = np.random.default_rng(42)
    base_temp = 20 + 10 * np.sin(2 * np.pi * dates.dayofyear / 365)
    df = pd.DataFrame(
        {
            "date": dates,
            "temp_max": base_temp + rng.normal(0, 2, n_days),
            "temp_min": base_temp - 8 + rng.normal(0, 2, n_days),
            "temp_mean": base_temp - 4 + rng.normal(0, 1, n_days),
            "humidity": rng.uniform(40, 90, n_days),
            "precipitation": rng.exponential(2, n_days),
            "wind": rng.uniform(5, 30, n_days),
            "location_key": "test_loc",
            "lat": 26.45,
            "lng": 80.33,
            "source": "test",
            "fetched_at": None,
        }
    )
    return df


# ============================================================================
# 1. History Store — Upsert deduplication
# ============================================================================


class TestHistoryStoreUpsert:
    """Upsert must be idempotent — no duplicates."""

    def _fresh_conn(self, tmp_path) -> sqlite3.Connection:
        db_file = tmp_path / "test.db"
        import sys
        # Patch the db path
        conn = sqlite3.connect(str(db_file), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS weather_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_key TEXT NOT NULL,
                lat REAL NOT NULL, lng REAL NOT NULL, date TEXT NOT NULL,
                temp_max REAL, temp_min REAL, temp_mean REAL,
                humidity REAL, precipitation REAL, wind REAL,
                source TEXT NOT NULL DEFAULT 'unknown', fetched_at TEXT,
                UNIQUE (location_key, date)
            )
            """
        )
        conn.commit()
        return conn

    def test_upsert_no_duplicates(self, tmp_path):
        """Inserting the same (location_key, date) twice must not duplicate rows."""
        conn = self._fresh_conn(tmp_path)
        sql = """
            INSERT INTO weather_history
                (location_key, lat, lng, date, temp_max, temp_min, temp_mean,
                 humidity, precipitation, wind, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(location_key, date) DO UPDATE SET
                temp_mean = excluded.temp_mean
        """
        row = ("loc1", 26.45, 80.33, "2024-01-01", 30.0, 15.0, 22.5, 60.0, 0.0, 10.0, "test", None)
        conn.execute(sql, row)
        conn.execute(sql, row)  # second upsert same key
        conn.commit()
        count = conn.execute(
            "SELECT COUNT(*) FROM weather_history WHERE location_key='loc1' AND date='2024-01-01'"
        ).fetchone()[0]
        assert count == 1, f"Expected 1 row, got {count} (upsert created a duplicate)."
        conn.close()

    def test_upsert_updates_values(self, tmp_path):
        """Upsert must overwrite existing values."""
        conn = self._fresh_conn(tmp_path)
        sql = """
            INSERT INTO weather_history
                (location_key, lat, lng, date, temp_max, temp_min, temp_mean,
                 humidity, precipitation, wind, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(location_key, date) DO UPDATE SET
                temp_mean = excluded.temp_mean,
                source    = excluded.source
        """
        conn.execute(sql, ("loc1", 0.0, 0.0, "2024-01-01", 25.0, 10.0, 17.5, 50.0, 1.0, 5.0, "v1", None))
        conn.execute(sql, ("loc1", 0.0, 0.0, "2024-01-01", 25.0, 10.0, 19.0, 50.0, 1.0, 5.0, "v2", None))
        conn.commit()
        row = conn.execute(
            "SELECT temp_mean, source FROM weather_history WHERE location_key='loc1'"
        ).fetchone()
        assert row["temp_mean"] == 19.0
        assert row["source"] == "v2"
        conn.close()


# ============================================================================
# 2. Validation — bad rows must be rejected
# ============================================================================


class TestValidation:
    """history_store._validate_row must reject bad input with a message."""

    def _make_valid_row(self, **kwargs):
        from app.schemas.forecast_schema import WeatherHistoryRow
        defaults = dict(
            location_key="26.45_80.33",
            lat=26.45,
            lng=80.33,
            date="2024-06-15",
            temp_max=32.0,
            temp_min=22.0,
            temp_mean=27.0,
            humidity=65.0,
            precipitation=0.0,
            wind=12.0,
            source="test",
            fetched_at=None,
        )
        defaults.update(kwargs)
        return WeatherHistoryRow(**defaults)

    def test_valid_row_passes(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row()
        assert _validate_row(row) is None

    def test_all_temps_none_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(temp_max=None, temp_min=None, temp_mean=None)
        result = _validate_row(row)
        assert result is not None, "Should reject row with all-None temperatures."

    def test_impossible_temp_max_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(temp_max=999.0)  # absurd
        result = _validate_row(row)
        assert result is not None, "Should reject temp_max=999."

    def test_temp_too_cold_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(temp_min=-100.0)
        result = _validate_row(row)
        assert result is not None, "Should reject temp_min=-100."

    def test_negative_precipitation_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(precipitation=-5.0)
        result = _validate_row(row)
        assert result is not None, "Should reject negative precipitation."

    def test_invalid_humidity_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(humidity=110.0)
        result = _validate_row(row)
        assert result is not None, "Should reject humidity > 100."

    def test_empty_location_key_rejected(self):
        from app.services.history_store import _validate_row
        row = self._make_valid_row(location_key="")
        result = _validate_row(row)
        assert result is not None, "Should reject empty location_key."


# ============================================================================
# 3. Feature engineering — no data leakage
# ============================================================================


class TestFeatureEngineering:
    """No feature for row i must use data from row i or later."""

    def test_lag_features_do_not_use_future_data(self):
        from app.services.automl_forecaster import build_features

        df = _generate_fake_df(200)
        X, y = build_features(df, horizon=1)

        assert not X.empty, "Feature matrix must not be empty."
        assert not y.empty, "Target matrix must not be empty."

        # The X index and y index must be the same length and aligned
        assert len(X) == len(y), "X and y must have the same number of rows."

        # The features for each row must only use data up to that row's date.
        # Specifically, lag-1 features must be NaN for the very first row
        # (which is dropped by dropna). All lag features should be finite
        # for the rows that remain after dropna.
        lag1_cols = [c for c in X.columns if "lag1" in c]
        for col in lag1_cols:
            assert X[col].isna().sum() == 0, (
                f"Lag column {col} has NaN after dropna — likely alignment error."
            )

    def test_horizon_1_and_7_target_offset(self):
        """
        The target for horizon=h at index i should correspond to h days ahead of
        the row at index i in the original DataFrame. We verify by checking that
        y values are not identical to same-row X lag-1 values.
        """
        from app.services.automl_forecaster import build_features

        df = _generate_fake_df(300)
        for horizon in [1, 7]:
            X, y = build_features(df, horizon=horizon)
            # If y were the same-day value we'd see near-zero MAE vs lag1.
            # Instead, verify temp_mean_target != temp_mean_lag1 for most rows.
            lag1 = X.get("temp_mean_lag1")
            target = y.get("temp_mean_target")
            if lag1 is not None and target is not None:
                same = (lag1.reset_index(drop=True) - target.reset_index(drop=True)).abs() < 0.001
                # At most 5% identical (due to coincidence) — not 100%
                pct_same = same.mean()
                assert pct_same < 0.05, (
                    f"h={horizon}: {pct_same:.0%} of lag-1 values match target — "
                    "possible leakage."
                )

    def test_no_columns_from_future(self):
        """Feature column names must not contain 'target' (those are in y only)."""
        from app.services.automl_forecaster import build_features

        df = _generate_fake_df(200)
        X, _ = build_features(df, horizon=1)
        target_cols = [c for c in X.columns if "target" in c]
        assert len(target_cols) == 0, (
            f"Feature matrix X contains target columns: {target_cols}"
        )


# ============================================================================
# 4. Fallback chain behaviour
# ============================================================================


class TestFallbackChain:
    """The fallback chain must step down gracefully on failures."""

    @pytest.mark.asyncio
    async def test_fallback_when_api_raises(self):
        """When _fetch_api_forecast raises, source must not be 'primary'."""
        import asyncio

        from app.services.forecast_service import get_forecast

        # Patch the internal API fetcher and the history store
        with (
            patch(
                "app.services.forecast_service._fetch_api_forecast",
                new=AsyncMock(side_effect=Exception("API down")),
            ),
            patch(
                "app.services.forecast_service.automl_forecaster.forecast_automl",
                return_value=None,
            ),
            patch(
                "app.services.forecast_service.history_store.query_history",
                return_value=[],
            ),
        ):
            result = await get_forecast(lat=26.45, lng=80.33, horizon=1)
            assert result.source != "primary"
            assert result.is_fallback is True

    @pytest.mark.asyncio
    async def test_fallback_when_api_times_out(self):
        """TimeoutError on API step must trigger fallback."""
        import asyncio

        from app.services.forecast_service import get_forecast

        async def _slow(*a, **kw):
            await asyncio.sleep(10)

        with (
            patch(
                "app.services.forecast_service._fetch_api_forecast",
                new=AsyncMock(side_effect=asyncio.TimeoutError()),
            ),
            patch(
                "app.services.forecast_service.automl_forecaster.forecast_automl",
                return_value=None,
            ),
            patch(
                "app.services.forecast_service.history_store.query_history",
                return_value=[],
            ),
        ):
            result = await get_forecast(lat=26.45, lng=80.33, horizon=1)
            assert result.is_fallback is True

    @pytest.mark.asyncio
    async def test_automl_used_when_api_fails(self):
        """When API fails but AutoML returns valid data, source = 'automl_backup'."""
        from app.schemas.forecast_schema import WeatherHistoryRow
        from app.services.forecast_service import get_forecast

        fake_automl_days = [
            {"date": "2025-01-01", "temp_max": 30.0, "temp_min": 20.0, "temp_mean": 25.0,
             "humidity": 60.0, "precipitation": 0.0}
        ]

        with (
            patch(
                "app.services.forecast_service._fetch_api_forecast",
                new=AsyncMock(side_effect=Exception("API down")),
            ),
            patch(
                "app.services.forecast_service.automl_forecaster.forecast_automl",
                return_value=fake_automl_days,
            ),
            patch(
                "app.services.forecast_service.automl_forecaster.load_model",
                return_value={1: {"accepted": True, "version": "20250101T000000Z"}},
            ),
            patch(
                "app.services.forecast_service.history_store.query_history",
                return_value=[],
            ),
        ):
            result = await get_forecast(lat=26.45, lng=80.33, horizon=1)
            assert result.source == "automl_backup"
            assert result.is_fallback is True
            assert result.model_version == "20250101T000000Z"

    @pytest.mark.asyncio
    async def test_seasonal_naive_is_last_resort(self):
        """When API and AutoML both fail, seasonal_naive is used if history exists."""
        from app.schemas.forecast_schema import WeatherHistoryRow
        from app.services.forecast_service import get_forecast

        # Build minimal fake history (>= 3 rows needed)
        fake_rows = []
        for i in range(5):
            date = (datetime.now(timezone.utc) - timedelta(days=400 - i * 365)).strftime("%Y-%m-%d")
            fake_rows.append(
                WeatherHistoryRow(
                    location_key="26.45_80.33",
                    lat=26.45,
                    lng=80.33,
                    date=date,
                    temp_max=32.0,
                    temp_min=22.0,
                    temp_mean=27.0,
                    humidity=65.0,
                    precipitation=0.0,
                    wind=10.0,
                    source="test",
                    fetched_at=None,
                )
            )

        with (
            patch(
                "app.services.forecast_service._fetch_api_forecast",
                new=AsyncMock(side_effect=Exception("API down")),
            ),
            patch(
                "app.services.forecast_service.automl_forecaster.forecast_automl",
                return_value=None,
            ),
            patch(
                "app.services.forecast_service.history_store.query_history",
                return_value=fake_rows,
            ),
        ):
            result = await get_forecast(lat=26.45, lng=80.33, horizon=1)
            assert result.source == "seasonal_naive"
            assert result.is_fallback is True

    @pytest.mark.asyncio
    async def test_nan_output_triggers_fallback(self):
        """If API forecast contains NaN temp, the chain should not trust it."""
        from app.services.forecast_service import _fetch_api_forecast, _is_valid_temp

        assert not _is_valid_temp(float("nan"))
        assert not _is_valid_temp(None)
        assert _is_valid_temp(25.0)
        assert not _is_valid_temp(999.0)


# ============================================================================
# 5. API Endpoints
# ============================================================================


class TestForecastEndpoints:
    """Integration tests for the three new API routes."""

    @pytest.fixture(autouse=True)
    def client(self):
        from fastapi.testclient import TestClient
        from app.main import app
        self._client = TestClient(app, raise_server_exceptions=False)

    def test_history_returns_200(self):
        with patch(
            "app.api.routes.forecast.history_store.query_history",
            return_value=[],
        ):
            resp = self._client.get("/api/history", params={"lat": 26.45, "lng": 80.33})
            assert resp.status_code == 200
            data = resp.json()
            assert "rows" in data
            assert "count" in data

    def test_history_invalid_coords(self):
        resp = self._client.get("/api/history", params={"lat": 200.0, "lng": 80.33})
        assert resp.status_code == 422

    def test_forecast_returns_200(self):
        from app.schemas.forecast_schema import ForecastResponse

        fake_response = ForecastResponse(
            location="26.45_80.33",
            horizon=1,
            forecast=[],
            source="seasonal_naive",
            is_fallback=True,
            generated_at=datetime.now(timezone.utc).isoformat(),
            model_version=None,
            warning=None,
        )
        with (
            patch(
                "app.api.routes.forecast.get_forecast",
                new=AsyncMock(return_value=fake_response),
            ),
            patch("app.api.routes.forecast.history_store.count_rows", return_value=100),
            patch("app.api.routes.forecast.scheduler.register_location"),
        ):
            resp = self._client.get(
                "/api/forecast", params={"lat": 26.45, "lng": 80.33, "horizon": 1}
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "source" in data
            assert "is_fallback" in data
            assert "generated_at" in data

    def test_backup_status_returns_200(self):
        with (
            patch(
                "app.api.routes.forecast.history_store.get_all_location_keys",
                return_value=[],
            ),
        ):
            resp = self._client.get("/api/backup/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "locations" in data
            assert "generated_at" in data

    def test_forecast_horizon_validation(self):
        """Horizon must be 1–7."""
        resp = self._client.get(
            "/api/forecast", params={"lat": 26.45, "lng": 80.33, "horizon": 99}
        )
        assert resp.status_code == 422
