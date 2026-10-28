"""
Tests for ML Vernacular Recommender Endpoint and Service (/api/recommend/ml).
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analysis_schema import WeatherInfo
from app.schemas.climate_schema import (
    ClimateDerivedMetrics,
    ClimateResponse,
    DataQuality,
    MonthlyClimateSummary,
)

client = TestClient(app)

MOCK_WEATHER = WeatherInfo(
    temperature=32.0,
    humidity=40,
    wind_speed=14.0,
    rainfall=0.0,
    cloud_cover=20,
)

MOCK_CLIMATE = ClimateResponse(
    latitude=28.61,
    longitude=77.20,
    years_analyzed=5,
    start_date="2019-01-01",
    end_date="2023-12-31",
    data_quality=DataQuality(total_days=1826, missing_percent=0.0, interpolated_days=0),
    derived_metrics=ClimateDerivedMetrics(
        hottest_month=6,
        coldest_month=1,
        annual_rain=780.0,
        days_above_40=20.0,
        days_below_5=2.0,
    ),
    monthly_summary=[
        MonthlyClimateSummary(
            month=m,
            month_name=f"Month-{m}",
            avg_temp_max=32.0 + m,
            avg_temp_min=14.0 + m,
            avg_temp_mean=23.0 + m,
            avg_humidity=52.0,
            avg_rainfall=65.0,
            avg_wind_speed=12.0,
            avg_solar_radiation=20.0,
        )
        for m in range(1, 13)
    ],
)


@pytest.fixture
def mock_meteo():
    """Mocks upstream weather and climate calls."""
    with patch("app.services.weather_service.get_weather", new_callable=AsyncMock) as m_w, \
         patch("app.services.ml_recommender_service.get_climate_summary", new_callable=AsyncMock) as m_c:
        m_w.return_value = MOCK_WEATHER
        m_c.return_value = MOCK_CLIMATE
        yield


def test_post_ml_recommend_with_coords(mock_meteo):
    """POST /api/recommend/ml returns 200 with ranked predictions for valid coordinates."""
    response = client.post("/api/recommend/ml", json={"latitude": 28.6139, "longitude": 77.2090, "top_n": 3})
    assert response.status_code == 200

    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 3

    # Check top prediction
    first = data["predictions"][0]
    assert "id" in first
    assert "name" in first
    assert 0.0 <= first["predicted_score"] <= 100.0
    assert 0.0 <= first["confidence"] <= 1.0
    assert first["match_level"] in ["High Match", "Moderate Match", "Low Match"]
    assert first["rank"] == 1
    assert len(first["strengths"]) > 0
    assert len(first["why_recommended"]) > 10

    # Check metadata & honesty notice
    meta = data["model_metadata"]
    assert meta["model_type"] == "Multi-Output Random Forest Regressor"
    assert meta["test_r2"] > 0.85
    assert "honesty_notice" in meta
    assert data["verified"] is False


def test_post_ml_recommend_top_n(mock_meteo):
    """Respects top_n parameter between 1 and 7."""
    response = client.post("/api/recommend/ml", json={"lat": 19.076, "lon": 72.877, "top_n": 5})
    assert response.status_code == 200
    assert len(response.json()["predictions"]) == 5


def test_post_ml_recommend_direct_climate_features():
    """Predicts accurately when explicit microclimate variables are supplied without coordinates."""
    payload = {
        "temperature": 8.0,
        "humidity": 65.0,
        "rainfall": 600.0,
        "top_n": 3,
    }
    response = client.post("/api/recommend/ml", json=payload)
    assert response.status_code == 200

    data = response.json()
    top_pred = data["predictions"][0]
    # In cold conditions (8°C), cold or temperate archetypes should rank high
    assert top_pred["id"] in ["alpine-chalet", "new-england-saltbox", "composite-courtyard"]


def test_post_ml_recommend_invalid_coords():
    """Validates coordinate ranges."""
    res = client.post("/api/recommend/ml", json={"latitude": 120.0, "longitude": 50.0})
    assert res.status_code == 422

    res2 = client.post("/api/recommend/ml", json={"latitude": 20.0, "longitude": -200.0})
    assert res2.status_code == 422
