"""
Tests for Thermal Risk Assessment Module and POST /api/risk endpoint.

Covers:
- Rule-based heat stress evaluation (extreme, high, medium, low)
- Rule-based cold stress evaluation (extreme, high, medium, low)
- Frontend ZoneRiskData shape compatibility (zone, confidence, heatStress, coldStress, whyNumbers, etc.)
- API integration: 200 OK, coordinate validation (422), upstream service error handling (502).
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.analysis.risk import assess_risk
from app.main import app
from app.services.climate_service import ClimateServiceError

client = TestClient(app)


def make_fake_climate_summary(
    hottest_max: float = 35.0,
    hot_humidity: float = 50.0,
    days_above_40: float = 0.0,
    coldest_min: float = 12.0,
    days_below_5: float = 0.0,
    annual_rain: float = 600.0,
):
    """Generates a synthetic climate summary with customizable thermal indicators."""
    months = []
    mid_temp = (hottest_max + coldest_min) / 2.0

    for m in range(1, 13):
        months.append({
            "month": m,
            "month_name": f"Month_{m}",
            "avg_temp_max": mid_temp + 3.0,
            "avg_temp_min": mid_temp - 3.0,
            "avg_temp_mean": mid_temp,
            "avg_humidity": 50.0,
            "avg_rainfall": annual_rain / 12.0,
            "avg_wind_speed": 10.0,
            "avg_solar_radiation": 16.0,
        })

    # Month 1 is coldest winter month
    months[0]["avg_temp_max"] = coldest_min + 6.0
    months[0]["avg_temp_min"] = coldest_min
    months[0]["avg_temp_mean"] = coldest_min + 3.0

    # Month 6 is hottest summer month
    months[5]["avg_temp_max"] = hottest_max
    months[5]["avg_temp_min"] = hottest_max - 8.0
    months[5]["avg_temp_mean"] = hottest_max - 4.0
    months[5]["avg_humidity"] = hot_humidity

    return {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "years_analyzed": 5,
        "start_date": "2020-01-01",
        "end_date": "2024-12-31",
        "data_quality": {
            "total_days": 1826,
            "missing_percent": 2.0,
            "interpolated_days": 36,
            "source": "Open-Meteo",
            "verified": False,
        },
        "derived_metrics": {
            "hottest_month": 6,
            "coldest_month": 1,
            "annual_rain": annual_rain,
            "days_above_40": days_above_40,
            "days_below_5": days_below_5,
            "source": "Open-Meteo",
            "verified": False,
        },
        "monthly_summary": months,
        "cached": False,
        "source": "Open-Meteo Historical Weather Archive API",
        "verified": False,
    }


# ===========================================================================
# Unit Tests — assess_risk
# ===========================================================================


def test_assess_risk_extreme_heat_stress():
    """Extreme heat stress triggers on hottest_max >= 44.0 or days_above_40 >= 25."""
    summary = make_fake_climate_summary(
        hottest_max=45.5,
        days_above_40=32.0,
        hot_humidity=45.0,
        coldest_min=14.0,
        days_below_5=0.0,
    )
    result = assess_risk(summary)

    assert result["heat"]["level"] == "extreme"
    assert result["heat"]["score_0_100"] >= 75
    assert result["heatStress"] == result["heat"]["score_0_100"]
    assert "Extreme heat stress" in result["heat"]["reason"]
    assert "45.5" in result["heat"]["reason"]


def test_assess_risk_high_heat_stress():
    """High heat stress triggers on hottest_max >= 39.0 or days_above_40 >= 8."""
    summary = make_fake_climate_summary(
        hottest_max=40.5,
        days_above_40=12.0,
        hot_humidity=40.0,
        coldest_min=14.0,
        days_below_5=0.0,
    )
    result = assess_risk(summary)

    assert result["heat"]["level"] == "high"
    assert 50 <= result["heat"]["score_0_100"] < 75
    assert result["heatStress"] == result["heat"]["score_0_100"]
    assert "High heat stress" in result["heat"]["reason"]


def test_assess_risk_moderate_heat_stress():
    """Moderate heat stress triggers on hottest_max >= 34.0 or days_above_40 >= 1."""
    summary = make_fake_climate_summary(
        hottest_max=36.0,
        days_above_40=2.0,
        hot_humidity=40.0,
        coldest_min=15.0,
        days_below_5=0.0,
    )
    result = assess_risk(summary)

    assert result["heat"]["level"] == "medium"
    assert 25 <= result["heat"]["score_0_100"] < 50
    assert result["heatStress"] == result["heat"]["score_0_100"]


def test_assess_risk_low_heat_stress():
    """Low heat stress when summer temperatures remain mild."""
    summary = make_fake_climate_summary(
        hottest_max=26.0,
        days_above_40=0.0,
        hot_humidity=50.0,
        coldest_min=15.0,
        days_below_5=0.0,
    )
    result = assess_risk(summary)

    assert result["heat"]["level"] == "low"
    assert result["heat"]["score_0_100"] < 25


def test_assess_risk_extreme_cold_stress():
    """Extreme cold stress triggers on coldest_min <= -2.0 or days_below_5 >= 25."""
    summary = make_fake_climate_summary(
        hottest_max=22.0,
        days_above_40=0.0,
        coldest_min=-6.0,
        days_below_5=40.0,
    )
    result = assess_risk(summary)

    assert result["cold"]["level"] == "extreme"
    assert result["cold"]["score_0_100"] >= 75
    assert result["coldStress"] == result["cold"]["score_0_100"]
    assert "Extreme cold stress" in result["cold"]["reason"]
    assert "-6.0" in result["cold"]["reason"]


def test_assess_risk_high_cold_stress():
    """High cold stress triggers on coldest_min <= 3.0 or days_below_5 >= 8."""
    summary = make_fake_climate_summary(
        hottest_max=30.0,
        days_above_40=0.0,
        coldest_min=1.5,
        days_below_5=12.0,
    )
    result = assess_risk(summary)

    assert result["cold"]["level"] == "high"
    assert 50 <= result["cold"]["score_0_100"] < 75
    assert result["coldStress"] == result["cold"]["score_0_100"]
    assert "High cold stress" in result["cold"]["reason"]


def test_assess_risk_moderate_cold_stress():
    """Moderate cold stress triggers on coldest_min <= 8.0 or days_below_5 >= 1."""
    summary = make_fake_climate_summary(
        hottest_max=32.0,
        days_above_40=0.0,
        coldest_min=6.0,
        days_below_5=3.0,
    )
    result = assess_risk(summary)

    assert result["cold"]["level"] == "medium"
    assert 25 <= result["cold"]["score_0_100"] < 50
    assert result["coldStress"] == result["cold"]["score_0_100"]


def test_assess_risk_low_cold_stress():
    """Low cold stress when winter temperatures remain mild."""
    summary = make_fake_climate_summary(
        hottest_max=32.0,
        days_above_40=0.0,
        coldest_min=18.0,
        days_below_5=0.0,
    )
    result = assess_risk(summary)

    assert result["cold"]["level"] == "low"
    assert result["cold"]["score_0_100"] < 25


def test_assess_risk_matches_frontend_zonerisk_shape():
    """Verifies that the returned dict matches frontend ZoneRiskData fields."""
    summary = make_fake_climate_summary(
        hottest_max=41.0,
        hot_humidity=35.0,
        days_above_40=15.0,
        coldest_min=8.0,
        days_below_5=2.0,
        annual_rain=420.0,
    )
    result = assess_risk(summary)

    # Core thermal risk contract
    assert "heat" in result
    assert "cold" in result
    assert "level" in result["heat"]
    assert "score_0_100" in result["heat"]
    assert "reason" in result["heat"]
    assert "level" in result["cold"]
    assert "score_0_100" in result["cold"]
    assert "reason" in result["cold"]

    # Frontend ZoneRiskData shape compatibility
    assert "zone" in result
    assert "confidence" in result and isinstance(result["confidence"], int)
    assert "heatStress" in result and isinstance(result["heatStress"], int)
    assert "coldStress" in result and isinstance(result["coldStress"], int)
    assert "whyNumbers" in result
    assert "avgSummerTemp" in result["whyNumbers"]
    assert "avgWinterTemp" in result["whyNumbers"]
    assert "annualRainfall" in result["whyNumbers"]
    assert "explanation" in result and isinstance(result["explanation"], str)
    assert "ruleBasedZone" in result
    assert "mlZone" in result
    assert "verified" in result
    assert result["verified"] is False


def test_assess_risk_empty_data_raises_value_error():
    """Confirms empty monthly climate data raises a ValueError."""
    with pytest.raises(ValueError):
        assess_risk({"monthly_summary": []})


# ===========================================================================
# API Endpoint Tests — POST /api/risk
# ===========================================================================


@patch("app.api.routes.risk.get_climate_summary")
def test_post_risk_success(mock_get_climate):
    """POST /api/risk returns 200 with structured thermal risk."""
    fake_data = make_fake_climate_summary(
        hottest_max=42.0,
        hot_humidity=40.0,
        days_above_40=18.0,
        coldest_min=6.0,
        days_below_5=4.0,
        annual_rain=500.0,
    )
    mock_get_climate.return_value = fake_data

    payload = {"latitude": 28.6139, "longitude": 77.2090}
    response = client.post("/api/risk", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["latitude"] == 28.6139
    assert data["longitude"] == 77.2090
    assert data["heat"]["level"] in ("low", "medium", "high", "extreme")
    assert data["cold"]["level"] in ("low", "medium", "high", "extreme")
    assert data["heatStress"] == data["heat"]["score_0_100"]
    assert data["coldStress"] == data["cold"]["score_0_100"]
    assert "avgSummerTemp" in data["whyNumbers"]
    assert "avgWinterTemp" in data["whyNumbers"]
    assert "annualRainfall" in data["whyNumbers"]
    assert len(data["explanation"]) > 0


def test_post_risk_coordinate_validation():
    """POST /api/risk rejects out-of-range coordinates with HTTP 422."""
    res_lat_high = client.post("/api/risk", json={"latitude": 95.0, "longitude": 77.0})
    assert res_lat_high.status_code == 422

    res_lat_low = client.post("/api/risk", json={"latitude": -95.0, "longitude": 77.0})
    assert res_lat_low.status_code == 422

    res_lon_high = client.post("/api/risk", json={"latitude": 28.0, "longitude": 185.0})
    assert res_lon_high.status_code == 422

    res_lon_low = client.post("/api/risk", json={"latitude": 28.0, "longitude": -185.0})
    assert res_lon_low.status_code == 422

    res_missing = client.post("/api/risk", json={"latitude": 28.0})
    assert res_missing.status_code == 422


@patch("app.api.routes.risk.get_climate_summary")
def test_post_risk_upstream_climate_error(mock_get_climate):
    """POST /api/risk returns 502 when upstream historical climate archive fails."""
    mock_get_climate.side_effect = ClimateServiceError("Connection timed out to archive API")

    payload = {"latitude": 28.6139, "longitude": 77.2090}
    response = client.post("/api/risk", json=payload)

    assert response.status_code == 502
    data = response.json()
    assert "detail" in data
    assert data["detail"]["code"] == "CLIMATE_DATA_UNAVAILABLE"
