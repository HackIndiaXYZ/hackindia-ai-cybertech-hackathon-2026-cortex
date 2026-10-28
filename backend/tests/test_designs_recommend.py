"""
test_designs_recommend.py
-------------------------
Tests for POST /api/designs/recommend endpoint and ML design recommendation engine.

Test cases:
- Model missing returns HTTP 503 (no fallback)
- Invalid coordinates return HTTP 422
- Negative weights return HTTP 422
- Weights normalization returns normalized weights summing to 1.0
- Returns top 3 distinct designs with valid scores and reasons
- Sensitivity test: Changing optimization weights alters the ranking order
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.analysis import design_ml
from app.main import app
from app.schemas.analysis_schema import LocationInfo
from app.schemas.climate_schema import (
    ClimateDerivedMetrics,
    ClimateResponse,
    DataQuality,
    MonthlyClimateSummary,
)


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    # Ensure model is loaded for test suite
    design_ml.load_model()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_climate_response():
    """Returns a realistic mock ClimateResponse for Jaipur/Jodhpur (Hot-Dry/Composite)."""
    monthly = []
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    for m in range(1, 13):
        monthly.append(
            MonthlyClimateSummary(
                month=m,
                month_name=month_names[m - 1],
                avg_temp_max=42.0 if m in [5, 6] else 30.0,
                avg_temp_min=8.0 if m in [1, 12] else 22.0,
                avg_temp_mean=15.0 if m in [1, 12] else 32.0,
                avg_humidity=25.0 if m in [5, 6] else 50.0,
                avg_rainfall=25.0,
                avg_wind_speed=18.0,
                avg_solar_radiation=24.5,
            )
        )

    derived = ClimateDerivedMetrics(
        hottest_month=5,
        coldest_month=1,
        annual_rain=350.0,
        days_above_40=45.0,
        days_below_5=2.0,
        source="Open-Meteo Test Mock",
        verified=False,
    )

    quality = DataQuality(
        total_days=1825,
        missing_percent=0.0,
        interpolated_days=0,
        source="Open-Meteo Test Mock",
        verified=False,
    )

    return ClimateResponse(
        latitude=26.9124,
        longitude=75.7873,
        years_analyzed=5,
        start_date="2021-01-01",
        end_date="2025-12-31",
        data_quality=quality,
        derived_metrics=derived,
        monthly_summary=monthly,
        cached=False,
        source="Open-Meteo Test Mock",
        verified=False,
    )


@pytest.fixture
def mock_location():
    """Returns mock geocoding location info."""
    return LocationInfo(
        latitude=26.9124,
        longitude=75.7873,
        name="Jaipur",
        country="India",
    )


def test_model_missing_returns_503(client, mock_location, mock_climate_response):
    """If ML model is not loaded, the endpoint must return HTTP 503 with a clear message and NO fallback."""
    # Temporarily set model artifact to None
    original_artifact = design_ml._model_artifact
    try:
        design_ml._model_artifact = None

        with patch("app.api.routes.designs.get_location", new_callable=AsyncMock) as mock_loc, \
             patch("app.api.routes.designs.get_climate_summary", new_callable=AsyncMock) as mock_clim:
            mock_loc.return_value = mock_location
            mock_clim.return_value = mock_climate_response

            response = client.post(
                "/api/designs/recommend",
                json={"latitude": 26.9124, "longitude": 75.7873},
            )

            assert response.status_code == 503
            data = response.json()
            assert "detail" in data
            assert data["detail"]["code"] == "MODEL_NOT_AVAILABLE"
            assert "model is not available" in data["detail"]["message"].lower()

    finally:
        design_ml._model_artifact = original_artifact


def test_invalid_coordinates_return_422(client):
    """Coordinates outside physical limits must return HTTP 422."""
    # Latitude > 90
    resp_lat = client.post(
        "/api/designs/recommend",
        json={"latitude": 95.0, "longitude": 75.0},
    )
    assert resp_lat.status_code == 422

    # Longitude < -180
    resp_lon = client.post(
        "/api/designs/recommend",
        json={"latitude": 20.0, "longitude": -195.0},
    )
    assert resp_lon.status_code == 422

    # Non-numeric
    resp_str = client.post(
        "/api/designs/recommend",
        json={"latitude": "invalid", "longitude": 75.0},
    )
    assert resp_str.status_code == 422


def test_negative_weights_return_422(client):
    """Negative weights must be rejected with HTTP 422."""
    resp = client.post(
        "/api/designs/recommend",
        json={
            "latitude": 26.9124,
            "longitude": 75.7873,
            "weights": {"comfort": -10.0, "cost": 50.0, "safety": 25.0, "sustainability": 25.0},
        },
    )
    assert resp.status_code == 422


def test_all_zero_weights_return_422(client):
    """Weights that sum to zero must be rejected with HTTP 422."""
    resp = client.post(
        "/api/designs/recommend",
        json={
            "latitude": 26.9124,
            "longitude": 75.7873,
            "weights": {"comfort": 0.0, "cost": 0.0, "safety": 0.0, "sustainability": 0.0},
        },
    )
    assert resp.status_code == 422


def test_weights_normalization_and_balanced_default(client, mock_location, mock_climate_response):
    """Providing arbitrary positive weights normalizes them to sum to 1.0; omitting them defaults to Balanced."""
    with patch("app.api.routes.designs.get_location", new_callable=AsyncMock) as mock_loc, \
         patch("app.api.routes.designs.get_climate_summary", new_callable=AsyncMock) as mock_clim:
        mock_loc.return_value = mock_location
        mock_clim.return_value = mock_climate_response

        # 1. Custom un-normalized weights (e.g. 50, 50, 0, 0 -> 0.5, 0.5, 0.0, 0.0)
        res_custom = client.post(
            "/api/designs/recommend",
            json={
                "latitude": 26.9124,
                "longitude": 75.7873,
                "weights": {"comfort": 50.0, "cost": 50.0, "safety": 0.0, "sustainability": 0.0},
            },
        )
        assert res_custom.status_code == 200
        data_custom = res_custom.json()
        weights_used = data_custom["weights_used"]
        assert round(sum(weights_used.values()), 2) == 1.0
        assert weights_used["comfort"] == 0.5
        assert weights_used["cost"] == 0.5
        assert weights_used["safety"] == 0.0
        assert weights_used["sustainability"] == 0.0

        # 2. Default Balanced weights (0.25 each)
        res_default = client.post(
            "/api/designs/recommend",
            json={"latitude": 26.9124, "longitude": 75.7873},
        )
        assert res_default.status_code == 200
        data_default = res_default.json()
        assert data_default["weights_used"] == {
            "comfort": 0.25,
            "cost": 0.25,
            "safety": 0.25,
            "sustainability": 0.25,
        }


def test_top_3_distinct_designs_and_reasons(client, mock_location, mock_climate_response):
    """Endpoint returns top 3 distinct designs with rank, scores, total, and non-empty factual reasons."""
    with patch("app.api.routes.designs.get_location", new_callable=AsyncMock) as mock_loc, \
         patch("app.api.routes.designs.get_climate_summary", new_callable=AsyncMock) as mock_clim:
        mock_loc.return_value = mock_location
        mock_clim.return_value = mock_climate_response

        response = client.post(
            "/api/designs/recommend",
            json={"latitude": 26.9124, "longitude": 75.7873, "top_n": 3},
        )
        assert response.status_code == 200
        data = response.json()

        # Check location
        assert data["location"]["latitude"] == 26.9124
        assert data["location"]["longitude"] == 75.7873
        assert data["location"]["name"] == "Jaipur"

        # Check features used
        assert "hottest_month_max" in data["features_used"]
        assert "annual_rain" in data["features_used"]

        # Check model info
        assert data["model_info"]["source"] == "ml"
        assert "RandomForest" in data["model_info"]["name"]

        designs = data["designs"]
        assert len(designs) == 3

        # Verify distinct IDs and ranks
        ids = [d["id"] for d in designs]
        names = [d["name"] for d in designs]
        ranks = [d["rank"] for d in designs]

        assert len(set(ids)) == 3, "All recommended design IDs must be distinct"
        assert len(set(names)) == 3, "All recommended design names must be distinct"
        assert ranks == [1, 2, 3]

        # Verify scores are bounded and total matches weighted sum
        for d in designs:
            sc = d["scores"]
            for target in ["comfort", "cost", "safety", "sustainability"]:
                assert 0.0 <= sc[target] <= 100.0

            assert 0.0 <= d["total"] <= 100.0
            assert len(d["reasons"]) >= 2, "Each design must include at least 2 factual reasons"
            for r in d["reasons"]:
                assert isinstance(r, str) and len(r) > 10

        # Ranks must be sorted descending by total score
        assert designs[0]["total"] >= designs[1]["total"] >= designs[2]["total"]


def test_weight_sensitivity_changes_order(client, mock_location, mock_climate_response):
    """
    Sensitivity Test: Changing priority weights from Cost-focused to Comfort-focused
    must alter the ranking order of recommended designs.
    """
    with patch("app.api.routes.designs.get_location", new_callable=AsyncMock) as mock_loc, \
         patch("app.api.routes.designs.get_climate_summary", new_callable=AsyncMock) as mock_clim:
        mock_loc.return_value = mock_location
        mock_clim.return_value = mock_climate_response

        # Scenario 1: Heavily prioritize Cost (Cost=90%, others=10% total)
        res_cost = client.post(
            "/api/designs/recommend",
            json={
                "latitude": 26.9124,
                "longitude": 75.7873,
                "weights": {"comfort": 0.0, "cost": 100.0, "safety": 0.0, "sustainability": 0.0},
                "top_n": 5,
            },
        )
        assert res_cost.status_code == 200
        cost_ranked_ids = [d["id"] for d in res_cost.json()["designs"]]

        # Scenario 2: Heavily prioritize Comfort (Comfort=100%, others=0%)
        res_comfort = client.post(
            "/api/designs/recommend",
            json={
                "latitude": 26.9124,
                "longitude": 75.7873,
                "weights": {"comfort": 100.0, "cost": 0.0, "safety": 0.0, "sustainability": 0.0},
                "top_n": 5,
            },
        )
        assert res_comfort.status_code == 200
        comfort_ranked_ids = [d["id"] for d in res_comfort.json()["designs"]]

        # The top design or top-5 order must differ
        assert cost_ranked_ids != comfort_ranked_ids, (
            f"Weights change failed to alter ranking order!\n"
            f"Cost IDs: {cost_ranked_ids}\nComfort IDs: {comfort_ranked_ids}"
        )
