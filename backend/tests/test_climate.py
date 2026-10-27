"""
Unit and integration tests for the Climate History feature.

Covers:
- Pandas data cleaning, impossible value screening, and gap interpolation
- Monthly aggregation & bioclimatic indicator calculations
- Open-Meteo historical archive API communication (mocked)
- In-memory caching and cache TTL behavior
- GET /api/climate endpoint validation and error responses
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.climate_service import (
    ClimateServiceError,
    clean_and_process_climate_data,
    clear_cache,
    get_climate_summary,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixture: Small synthetic dataset for unit testing data cleaning & math
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_raw_climate_data():
    """Generates 10 days of synthetic data covering multiple months and edge cases."""
    dates = [
        "2023-01-01",
        "2023-01-02",
        "2023-01-03",  # gap candidate
        "2023-01-04",
        "2023-01-05",
        "2023-06-01",
        "2023-06-02",
        "2023-06-03",
        "2023-06-04",
        "2023-06-05",
    ]

    daily = {
        "time": dates,
        # 2023-01-03 is NaN (gap to interpolate); 2023-06-02 has impossible 95.0C outlier
        "temperature_2m_max": [18.0, 19.0, None, 21.0, 22.0, 42.0, 95.0, 41.0, 39.0, 40.0],
        # 2023-01-01 has cold day 2.0C; 2023-01-04 has impossible -110.0C outlier
        "temperature_2m_min": [2.0, 4.0, 3.0, -110.0, 6.0, 28.0, 29.0, 27.0, 26.0, 28.0],
        "temperature_2m_mean": [10.0, 11.5, None, 12.0, 14.0, 35.0, 36.0, 34.0, 32.5, 34.0],
        "precipitation_sum": [5.0, 0.0, 0.0, 10.0, 0.0, 20.0, 50.0, 0.0, 0.0, 10.0],
        "wind_speed_10m_max": [12.0, 15.0, 10.0, 18.0, 14.0, 25.0, 30.0, 22.0, 18.0, 20.0],
        "shortwave_radiation_sum": [11.0, 12.0, 10.5, 9.0, 13.0, 24.0, 26.0, 22.0, 21.0, 25.0],
    }

    # Hourly humidity for the 10 dates (2 timestamps per date for simplicity)
    hourly_times = []
    hourly_humidity = []
    for d in dates:
        hourly_times.extend([f"{d}T06:00", f"{d}T18:00"])
        hourly_humidity.extend([70.0, 50.0])  # daily mean = 60.0%

    hourly = {
        "time": hourly_times,
        "relative_humidity_2m": hourly_humidity,
    }

    return {"daily": daily, "hourly": hourly}


# ---------------------------------------------------------------------------
# Unit Tests: Pandas Data Cleaning, QC & Derived Indicators
# ---------------------------------------------------------------------------
def test_clean_and_process_climate_data(sample_raw_climate_data):
    """Verifies that impossible values are screened, gaps interpolated, and summaries generated."""
    data_quality, derived, monthly = clean_and_process_climate_data(
        raw_daily=sample_raw_climate_data["daily"],
        raw_hourly=sample_raw_climate_data["hourly"],
        years=1,
    )

    # 1. Check DataQuality block
    assert data_quality.total_days == 10
    assert data_quality.missing_percent > 0.0
    assert data_quality.interpolated_days >= 1
    assert data_quality.verified is False
    assert "Open-Meteo" in data_quality.source

    # 2. Check 12 monthly summaries
    assert len(monthly) == 12
    jan = monthly[0]
    assert jan.month == 1
    assert jan.month_name == "January"
    assert jan.avg_temp_max is not None
    assert jan.avg_humidity == 60.0  # (70 + 50) / 2
    assert jan.avg_rainfall == 15.0  # 5 + 0 + 0 + 10 + 0

    jun = monthly[5]
    assert jun.month == 6
    assert jun.month_name == "June"
    # Impossible temp 95.0 was dropped and interpolated, so mean max stays in reasonable range
    assert jun.avg_temp_max < 55.0
    assert jun.avg_rainfall == 80.0  # 20 + 50 + 0 + 0 + 10

    # Months with no data
    feb = monthly[1]
    assert feb.avg_temp_mean is None

    # 3. Check Derived Bioclimatic Metrics
    assert derived.hottest_month == 6
    assert derived.coldest_month == 1
    assert derived.annual_rain == 95.0  # 15.0 (Jan) + 80.0 (Jun)
    assert derived.days_above_40 >= 3  # Jun 1 (42), Jun 3 (41), Jun 5 (40)
    assert derived.days_below_5 >= 1   # Jan 1 (2.0)
    assert derived.verified is False


def test_clean_empty_data_raises_error():
    """Empty daily payload must raise ClimateServiceError."""
    with pytest.raises(ClimateServiceError):
        clean_and_process_climate_data(raw_daily={}, raw_hourly=None, years=1)


# ---------------------------------------------------------------------------
# Service Tests: Mocked Open-Meteo API & In-Memory Cache
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_get_climate_summary_service_success(sample_raw_climate_data):
    """Verifies service orchestration and in-memory cache functionality."""
    clear_cache()

    with patch("app.services.climate_service._fetch_archive_data", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = sample_raw_climate_data

        # 1. First call: cache miss (cached=False)
        res1 = await get_climate_summary(lat=26.45, lon=80.33, years=1)
        assert res1.latitude == 26.45
        assert res1.longitude == 80.33
        assert res1.cached is False
        assert mock_fetch.call_count == 1

        # 2. Second call with same coordinates: cache hit (cached=True)
        res2 = await get_climate_summary(lat=26.45, lon=80.33, years=1)
        assert res2.cached is True
        # Underlying HTTP fetch should NOT have been called again
        assert mock_fetch.call_count == 1


@pytest.mark.asyncio
async def test_get_climate_summary_api_failure():
    """Verifies that network or upstream errors raise a clear ClimateServiceError."""
    clear_cache()

    with patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):
        with pytest.raises(ClimateServiceError) as exc_info:
            await get_climate_summary(lat=26.45, lon=80.33, years=1)

        assert "Failed to fetch climate history" in str(exc_info.value)


# ---------------------------------------------------------------------------
# Route Tests: GET /api/climate
# ---------------------------------------------------------------------------
def test_get_climate_route_success(sample_raw_climate_data):
    """GET /api/climate returns 200 OK with valid schema when service succeeds."""
    clear_cache()

    with patch("app.services.climate_service._fetch_archive_data", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = sample_raw_climate_data

        response = client.get("/api/climate?lat=26.45&lon=80.33&years=5")
        assert response.status_code == 200
        body = response.json()

        assert body["latitude"] == 26.45
        assert body["longitude"] == 80.33
        assert body["years_analyzed"] == 5
        assert len(body["monthly_summary"]) == 12
        assert "derived_metrics" in body
        assert "data_quality" in body
        assert body["verified"] is False


def test_get_climate_route_lat_lon_validation():
    """Coordinate boundaries must be strictly validated."""
    # Latitude > 90
    r_lat_high = client.get("/api/climate?lat=95.0&lon=80.0")
    assert r_lat_high.status_code == 422

    # Latitude < -90
    r_lat_low = client.get("/api/climate?lat=-95.0&lon=80.0")
    assert r_lat_low.status_code == 422

    # Longitude > 180
    r_lon_high = client.get("/api/climate?lat=20.0&lon=190.0")
    assert r_lon_high.status_code == 422

    # Longitude < -180
    r_lon_low = client.get("/api/climate?lat=20.0&lon=-190.0")
    assert r_lon_low.status_code == 422

    # Years out of range (years must be 1 to 10)
    r_years_invalid = client.get("/api/climate?lat=20.0&lon=80.0&years=0")
    assert r_years_invalid.status_code == 422

    r_years_high = client.get("/api/climate?lat=20.0&lon=80.0&years=15")
    assert r_years_high.status_code == 422


def test_get_climate_route_upstream_error_handling():
    """Upstream service errors must return 502 with structured error body, not crash."""
    clear_cache()

    with patch(
        "app.api.routes.climate.get_climate_summary",
        side_effect=ClimateServiceError("Upstream service unavailable"),
    ):
        response = client.get("/api/climate?lat=26.45&lon=80.33&years=5")
        assert response.status_code == 502
        body = response.json()
        assert "detail" in body
        assert body["detail"]["code"] == "CLIMATE_DATA_UNAVAILABLE"
        assert "Upstream service unavailable" in body["detail"]["message"]
