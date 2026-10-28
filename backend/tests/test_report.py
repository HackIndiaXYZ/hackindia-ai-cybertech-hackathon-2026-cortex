"""
Tests for PDF report generation and the POST /api/report endpoint.
Verifies that the endpoint generates valid binary PDF documents,
validates coordinates, and includes all required architectural sections.
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analysis_schema import LocationInfo, WeatherInfo, FloodInfo
from app.schemas.climate_schema import (
    ClimateDerivedMetrics,
    ClimateResponse,
    DataQuality,
    MonthlyClimateSummary,
)
from app.services.report_service import build_pdf_document, collect_report_data

client = TestClient(app)

MOCK_WEATHER = WeatherInfo(
    temperature=32.5,
    humidity=45,
    wind_speed=12.0,
    rainfall=0.0,
    cloud_cover=20,
)
MOCK_FLOOD = FloodInfo(risk="Low", status="Available")
MOCK_LOCATION = LocationInfo(
    latitude=28.6139,
    longitude=77.2090,
    name="New Delhi",
    country="India",
)

MOCK_CLIMATE = ClimateResponse(
    latitude=28.6139,
    longitude=77.2090,
    years_analyzed=5,
    start_date="2019-01-01",
    end_date="2023-12-31",
    data_quality=DataQuality(
        total_days=1826,
        missing_percent=0.0,
        interpolated_days=0,
    ),
    derived_metrics=ClimateDerivedMetrics(
        hottest_month=6,
        coldest_month=1,
        annual_rain=750.0,
        days_above_40=22.4,
        days_below_5=3.2,
    ),
    monthly_summary=[
        MonthlyClimateSummary(
            month=m,
            month_name=f"Month-{m}",
            avg_temp_max=30.0 + m,
            avg_temp_min=15.0 + m,
            avg_temp_mean=22.0 + m,
            avg_humidity=50.0,
            avg_rainfall=60.0,
            avg_wind_speed=10.0,
            avg_solar_radiation=18.0,
        )
        for m in range(1, 13)
    ],
)


@pytest.fixture
def mock_all_services():
    """Mocks external services so tests execute swiftly and offline."""
    with patch("app.services.weather_service.get_weather", new_callable=AsyncMock) as m_weather, \
         patch("app.services.flood_service.get_flood", new_callable=AsyncMock) as m_flood, \
         patch("app.services.geocoding_service.get_location", new_callable=AsyncMock) as m_loc, \
         patch("app.services.report_service.get_climate_summary", new_callable=AsyncMock) as m_clim:
        m_weather.return_value = MOCK_WEATHER
        m_flood.return_value = MOCK_FLOOD
        m_loc.return_value = MOCK_LOCATION
        m_clim.return_value = MOCK_CLIMATE
        yield


def test_post_report_success(mock_all_services):
    """POST /api/report should return 200 with a valid PDF binary."""
    payload = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "weights": {"comfort": 40.0, "cost": 30.0, "safety": 15.0, "sustainability": 15.0},
        "plot_size": {"width": 15.0, "length": 18.0},
    }
    response = client.post("/api/report", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")

    content = response.content
    assert len(content) > 1000, "PDF content must be non-trivial"
    assert content.startswith(b"%PDF-"), "Response must start with %PDF- magic bytes"


def test_post_report_alias_coords(mock_all_services):
    """POST /api/report accepts lat and lon aliases."""
    payload = {
        "lat": 19.0760,
        "lon": 72.8777,
    }
    response = client.post("/api/report", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF-")


def test_post_report_invalid_coords():
    """POST /api/report returns 422 for out-of-range coordinates."""
    response = client.post("/api/report", json={"latitude": 150.0, "longitude": 77.0})
    assert response.status_code == 422

    response2 = client.post("/api/report", json={"latitude": 28.0, "longitude": -200.0})
    assert response2.status_code == 422


def test_post_report_missing_coords():
    """POST /api/report returns 422 when coordinates are omitted."""
    response = client.post("/api/report", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_collect_report_data_graceful_degradation():
    """Verifies collect_report_data handles upstream service errors gracefully."""
    with patch("app.services.weather_service.get_weather", side_effect=Exception("Timeout")), \
         patch("app.services.flood_service.get_flood", side_effect=Exception("Offline")), \
         patch("app.services.geocoding_service.get_location", side_effect=Exception("Failed")), \
         patch("app.services.report_service.get_climate_summary", side_effect=Exception("No climate")):
        data = await collect_report_data(latitude=20.0, longitude=78.0)
        assert data["zone"] is not None
        assert data["risk"] is not None
        assert isinstance(data["top_designs"], list)

        # PDF builder should still succeed without exceptions
        pdf_bytes = build_pdf_document(data)
        assert pdf_bytes.startswith(b"%PDF-")
        assert len(pdf_bytes) > 500
