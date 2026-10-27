"""
Tests for the 5-zone bioclimatic classifier and POST /api/zone endpoint.
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.analysis.zone_classifier import classify_zone, extract_climate_metrics
from app.main import app
from app.services.climate_service import ClimateServiceError

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper to construct fake 12-month climate summary dicts
# ---------------------------------------------------------------------------
def make_fake_summary(
    hottest_max: float,
    coldest_min: float,
    coldest_mean: float,
    hot_humidity: float,
    annual_rain: float,
):
    """Creates a mock climate_summary payload with specific bioclimatic parameters."""
    months = []
    # Calculate neutral midpoint temperatures
    mid_max = (hottest_max + (coldest_mean + 5.0)) / 2.0
    mid_min = (coldest_min + (hottest_max - 5.0)) / 2.0
    mid_mean = (coldest_mean + (hottest_max - 5.0)) / 2.0

    # 12 months with default moderate values
    for m in range(1, 13):
        months.append({
            "month": m,
            "month_name": f"Month_{m}",
            "avg_temp_max": mid_max,
            "avg_temp_min": mid_min,
            "avg_temp_mean": mid_mean,
            "avg_humidity": 50.0,
            "avg_rainfall": annual_rain / 12.0,
            "avg_wind_speed": 10.0,
            "avg_solar_radiation": 15.0,
        })

    # Month 1 is winter/coldest
    months[0]["avg_temp_max"] = coldest_mean + 4.0
    months[0]["avg_temp_min"] = coldest_min
    months[0]["avg_temp_mean"] = coldest_mean

    # Month 6 is summer/hottest
    months[5]["avg_temp_max"] = hottest_max
    months[5]["avg_temp_min"] = hottest_max - 10.0
    months[5]["avg_temp_mean"] = hottest_max - 5.0
    months[5]["avg_humidity"] = hot_humidity

    return {
        "latitude": 26.0,
        "longitude": 80.0,
        "years_analyzed": 5,
        "start_date": "2021-01-01",
        "end_date": "2025-12-31",
        "derived_metrics": {
            "hottest_month": 6,
            "coldest_month": 1,
            "annual_rain": annual_rain,
            "days_above_40": 10.0,
            "days_below_5": 5.0,
            "source": "Open-Meteo",
            "verified": False,
        },
        "monthly_summary": months,
    }


# ---------------------------------------------------------------------------
# Unit Tests for Each Zone and Boundary Cases
# ---------------------------------------------------------------------------
def test_classify_zone_cold():
    """COLD: coldest_month_mean < 10 and hottest_month_max < 30."""
    summary = make_fake_summary(
        hottest_max=22.0,
        coldest_min=-5.0,
        coldest_mean=2.0,
        hot_humidity=65.0,
        annual_rain=750.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "COLD"
    assert result["matched_rule"] == "COLD"
    assert "Cold zone:" in result["reason"]
    assert "2.0°C" in result["reason"]
    assert "22.0°C" in result["reason"]


def test_classify_zone_cold_boundary():
    """Boundary case for COLD: mean 9.9 < 10 and max 29.9 < 30."""
    summary = make_fake_summary(
        hottest_max=29.9,
        coldest_min=5.0,
        coldest_mean=9.9,
        hot_humidity=50.0,
        annual_rain=500.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "COLD"


def test_classify_zone_composite():
    """COMPOSITE: hottest_month_max >= 35 and coldest_month_min <= 10."""
    summary = make_fake_summary(
        hottest_max=42.0,
        coldest_min=7.0,
        coldest_mean=14.0,
        hot_humidity=45.0,
        annual_rain=850.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "COMPOSITE"
    assert result["matched_rule"] == "COMPOSITE"
    assert "Composite zone:" in result["reason"]
    assert "42.0°C" in result["reason"]
    assert "7.0°C" in result["reason"]


def test_classify_zone_composite_boundary():
    """Boundary case for COMPOSITE: max 35.0 and min 10.0."""
    summary = make_fake_summary(
        hottest_max=35.0,
        coldest_min=10.0,
        coldest_mean=14.0,
        hot_humidity=40.0,
        annual_rain=700.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "COMPOSITE"


def test_classify_zone_hot_dry():
    """HOT_DRY: hottest_month_max >= 35, hot_humidity < 50, annual_rain < 600 (coldest_min > 10)."""
    summary = make_fake_summary(
        hottest_max=44.0,
        coldest_min=14.0,
        coldest_mean=19.0,
        hot_humidity=30.0,
        annual_rain=320.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "HOT_DRY"
    assert result["matched_rule"] == "HOT_DRY"
    assert "Hot-Dry zone:" in result["reason"]
    assert "44.0°C" in result["reason"]
    assert "30.0%" in result["reason"]
    assert "320.0mm" in result["reason"]


def test_classify_zone_warm_humid():
    """WARM_HUMID: hottest_month_max >= 28, hot_humidity >= 60, coldest_month_mean >= 18."""
    summary = make_fake_summary(
        hottest_max=34.0,
        coldest_min=22.0,
        coldest_mean=25.0,
        hot_humidity=78.0,
        annual_rain=2400.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "WARM_HUMID"
    assert result["matched_rule"] == "WARM_HUMID"
    assert "Warm-Humid zone:" in result["reason"]
    assert "34.0°C" in result["reason"]
    assert "78.0%" in result["reason"]
    assert "25.0°C" in result["reason"]


def test_classify_zone_temperate():
    """TEMPERATE: moderate values not triggering COLD, COMPOSITE, HOT_DRY, or WARM_HUMID."""
    summary = make_fake_summary(
        hottest_max=29.0,
        coldest_min=12.0,
        coldest_mean=16.0,
        hot_humidity=55.0,
        annual_rain=850.0,
    )
    result = classify_zone(summary)
    assert result["zone"] == "TEMPERATE"
    assert "Temperate zone:" in result["reason"]


# ---------------------------------------------------------------------------
# Route Tests: POST /api/zone
# ---------------------------------------------------------------------------
def test_post_zone_endpoint_success():
    """POST /api/zone returns 200 with classified zone and values."""
    mock_summary = make_fake_summary(
        hottest_max=41.0,
        coldest_min=8.0,
        coldest_mean=14.0,
        hot_humidity=45.0,
        annual_rain=800.0,
    )

    with patch(
        "app.api.routes.zone.get_climate_summary",
        new_callable=AsyncMock,
        return_value=mock_summary,
    ):
        # 1. Shorthand lat/lon
        resp1 = client.post("/api/zone", json={"lat": 26.45, "lon": 80.33})
        assert resp1.status_code == 200
        body1 = resp1.json()
        assert body1["zone"] == "COMPOSITE"
        assert body1["latitude"] == 26.45
        assert body1["longitude"] == 80.33
        assert body1["values"]["hottest_month_max"] == 41.0
        assert body1["verified"] is False

        # 2. Full latitude/longitude
        resp2 = client.post("/api/zone", json={"latitude": 26.45, "longitude": 80.33})
        assert resp2.status_code == 200
        assert resp2.json()["zone"] == "COMPOSITE"


def test_post_zone_endpoint_validation():
    """Invalid coordinates must return 422 Unprocessable Entity."""
    # Latitude > 90
    r_lat = client.post("/api/zone", json={"lat": 95.0, "lon": 80.0})
    assert r_lat.status_code == 422

    # Longitude > 180
    r_lon = client.post("/api/zone", json={"lat": 20.0, "lon": 195.0})
    assert r_lon.status_code == 422


def test_post_zone_endpoint_upstream_error():
    """If climate service fails, return 502 with structured error, do not crash."""
    with patch(
        "app.api.routes.zone.get_climate_summary",
        side_effect=ClimateServiceError("Archive API timeout"),
    ):
        response = client.post("/api/zone", json={"lat": 26.45, "lon": 80.33})
        assert response.status_code == 502
        body = response.json()
        assert body["detail"]["code"] == "CLIMATE_DATA_UNAVAILABLE"
        assert "Archive API timeout" in body["detail"]["message"]
