"""
Integration-style tests for the POST /api/analyze endpoint.
External APIs are fully mocked — no network calls are made.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app
from app.schemas.analysis_schema import (
    AnalysisInfo,
    DailyForecastItem,
    FloodInfo,
    HourlyForecastItem,
    LocationInfo,
    WeatherInfo,
)

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures — mock service return values
# ---------------------------------------------------------------------------


MOCK_WEATHER = WeatherInfo(
    temperature=5.2,
    humidity=62,
    wind_speed=8.4,
    rainfall=0.2,
    cloud_cover=35,
)

MOCK_FLOOD = FloodInfo(risk="Low", status="Available")

MOCK_LOCATION = LocationInfo(
    latitude=34.1526,
    longitude=77.5771,
    name="Leh",
    country="India",
)

MOCK_ALL_NONE_WEATHER = WeatherInfo(
    temperature=None,
    humidity=None,
    wind_speed=None,
    rainfall=None,
    cloud_cover=None,
)

MOCK_UNAVAILABLE_FLOOD = FloodInfo(risk="Insufficient Data", status="Unavailable")


def _patch_services(weather=MOCK_WEATHER, flood=MOCK_FLOOD, location=MOCK_LOCATION):
    """Return a context-manager triple that mocks all three service calls."""
    return (
        patch(
            "app.api.routes.analysis.weather_service.get_weather",
            new_callable=AsyncMock,
            return_value=weather,
        ),
        patch(
            "app.api.routes.analysis.flood_service.get_flood",
            new_callable=AsyncMock,
            return_value=flood,
        ),
        patch(
            "app.api.routes.analysis.geocoding_service.get_location",
            new_callable=AsyncMock,
            return_value=location,
        ),
    )


# ---------------------------------------------------------------------------
# Coordinate validation
# ---------------------------------------------------------------------------


class TestCoordinateValidation:
    def test_invalid_latitude_too_high(self):
        resp = client.post("/api/analyze", json={"latitude": 91.0, "longitude": 0.0})
        assert resp.status_code == 422

    def test_invalid_latitude_too_low(self):
        resp = client.post("/api/analyze", json={"latitude": -91.0, "longitude": 0.0})
        assert resp.status_code == 422

    def test_invalid_longitude_too_high(self):
        resp = client.post("/api/analyze", json={"latitude": 0.0, "longitude": 181.0})
        assert resp.status_code == 422

    def test_invalid_longitude_too_low(self):
        resp = client.post("/api/analyze", json={"latitude": 0.0, "longitude": -181.0})
        assert resp.status_code == 422

    def test_missing_latitude(self):
        resp = client.post("/api/analyze", json={"longitude": 77.5771})
        assert resp.status_code == 422

    def test_missing_longitude(self):
        resp = client.post("/api/analyze", json={"latitude": 34.1526})
        assert resp.status_code == 422

    def test_boundary_coordinates_accepted(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post("/api/analyze", json={"latitude": 90.0, "longitude": 180.0})
        assert resp.status_code == 200

    def test_negative_boundary_coordinates_accepted(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post("/api/analyze", json={"latitude": -90.0, "longitude": -180.0})
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Successful response contract
# ---------------------------------------------------------------------------


class TestSuccessfulResponse:
    def test_response_shape(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        body = resp.json()
        assert "location" in body
        assert "weather" in body
        assert "flood" in body
        assert "analysis" in body

    def test_location_fields(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        loc = resp.json()["location"]
        assert loc["latitude"] == 34.1526
        assert loc["longitude"] == 77.5771
        assert loc["name"] == "Leh"
        assert loc["country"] == "India"

    def test_weather_fields(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        weather = resp.json()["weather"]
        assert weather["temperature"] == 5.2
        assert weather["humidity"] == 62
        assert weather["wind_speed"] == 8.4
        assert weather["rainfall"] == 0.2
        assert weather["cloud_cover"] == 35

    def test_flood_fields(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        flood = resp.json()["flood"]
        assert flood["risk"] == "Low"
        assert flood["status"] == "Available"

    def test_analysis_contains_classification(self):
        pw, pf, pl = _patch_services()
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        analysis = resp.json()["analysis"]
        assert "classification" in analysis
        assert analysis["classification"] == "Cold"  # 5.2°C, 62% hum → Cold
        assert isinstance(analysis["conditions"], list)
        assert isinstance(analysis["summary"], str)


# ---------------------------------------------------------------------------
# Service failure handling
# ---------------------------------------------------------------------------


class TestServiceFailures:
    def test_weather_failure_returns_insufficient_data(self):
        pw, pf, pl = _patch_services(weather=MOCK_ALL_NONE_WEATHER)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        assert resp.json()["analysis"]["classification"] == "Insufficient Data"

    def test_flood_failure_returns_unavailable(self):
        pw, pf, pl = _patch_services(flood=MOCK_UNAVAILABLE_FLOOD)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        flood = resp.json()["flood"]
        assert flood["status"] == "Unavailable"
        assert flood["risk"] == "Insufficient Data"

    def test_location_failure_still_returns_200(self):
        fallback_loc = LocationInfo(
            latitude=34.1526, longitude=77.5771, name=None, country=None
        )
        pw, pf, pl = _patch_services(location=fallback_loc)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        loc = resp.json()["location"]
        assert loc["name"] is None
        assert loc["country"] is None


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Forecast fields
# ---------------------------------------------------------------------------


MOCK_WEATHER_WITH_FORECAST = WeatherInfo(
    temperature=5.2,
    humidity=62,
    wind_speed=8.4,
    rainfall=0.2,
    cloud_cover=35,
    daily_forecast=[
        DailyForecastItem(
            date="2026-10-25",
            temp_max=8.0,
            temp_min=1.5,
            weather_code=3,
            rain_probability=10,
        ),
        DailyForecastItem(
            date="2026-10-26",
            temp_max=7.0,
            temp_min=0.5,
            weather_code=71,
            rain_probability=5,
        ),
    ],
    hourly_forecast=[
        HourlyForecastItem(time="2026-10-25T00:00", temperature=3.1),
        HourlyForecastItem(time="2026-10-25T01:00", temperature=2.9),
    ],
)

MOCK_WEATHER_NO_FORECAST = WeatherInfo(
    temperature=5.2,
    humidity=62,
    wind_speed=8.4,
    rainfall=0.2,
    cloud_cover=35,
    daily_forecast=None,
    hourly_forecast=None,
)


class TestForecastInResponse:
    def test_forecast_fields_present_when_available(self):
        """daily_forecast and hourly_forecast appear in response when service returns them."""
        pw, pf, pl = _patch_services(weather=MOCK_WEATHER_WITH_FORECAST)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        weather = resp.json()["weather"]
        assert "daily_forecast" in weather
        assert isinstance(weather["daily_forecast"], list)
        assert len(weather["daily_forecast"]) == 2
        assert weather["daily_forecast"][0]["date"] == "2026-10-25"
        assert weather["daily_forecast"][0]["temp_max"] == 8.0
        assert weather["daily_forecast"][1]["weather_code"] == 71
        assert "hourly_forecast" in weather
        assert isinstance(weather["hourly_forecast"], list)
        assert len(weather["hourly_forecast"]) == 2
        assert weather["hourly_forecast"][0]["temperature"] == 3.1

    def test_forecast_null_still_returns_200(self):
        """Response is still 200 and analysis works even when forecast is None."""
        pw, pf, pl = _patch_services(weather=MOCK_WEATHER_NO_FORECAST)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        assert resp.status_code == 200
        weather = resp.json()["weather"]
        assert weather["daily_forecast"] is None
        assert weather["hourly_forecast"] is None
        # Core analysis still works
        assert "classification" in resp.json()["analysis"]

    def test_existing_weather_fields_unchanged(self):
        """Existing weather fields still have the same values when forecast is added."""
        pw, pf, pl = _patch_services(weather=MOCK_WEATHER_WITH_FORECAST)
        with pw, pf, pl:
            resp = client.post(
                "/api/analyze", json={"latitude": 34.1526, "longitude": 77.5771}
            )
        weather = resp.json()["weather"]
        assert weather["temperature"] == 5.2
        assert weather["humidity"] == 62
        assert weather["wind_speed"] == 8.4
        assert weather["rainfall"] == 0.2
        assert weather["cloud_cover"] == 35
