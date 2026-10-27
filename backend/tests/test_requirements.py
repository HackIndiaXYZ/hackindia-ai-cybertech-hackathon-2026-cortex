"""
Tests for Shelter Requirements Engine & POST /api/requirements endpoint.

Covers:
- Recommendation engine unit tests (all 5 zones, strategies structure, alert tips, unknown zones)
- API endpoint integration tests (HTTP 200, HTTP 422 for unknown zone and missing body)
- Dual contract compatibility (element/value/reason + id/title/recommendation/iconType)
"""

import pytest
from fastapi.testclient import TestClient

from app.analysis.recommend import get_requirements
from app.main import app

client = TestClient(app)

ZONES = ["HOT_DRY", "WARM_HUMID", "COMPOSITE", "TEMPERATE", "COLD"]
EXPECTED_ELEMENTS = {
    "layout",
    "walls",
    "roof",
    "windows",
    "shading",
    "ventilation",
    "orientation",
    "landscape",
}


# ===========================================================================
# Unit Tests — get_requirements
# ===========================================================================


@pytest.mark.parametrize("zone", ZONES)
def test_get_requirements_all_zones(zone: str):
    """Verifies that all 5 bioclimatic zones return valid requirements."""
    result = get_requirements(zone=zone)

    assert result["zone"] == zone
    assert isinstance(result["name"], str) and len(result["name"]) > 0
    assert isinstance(result["description"], str) and len(result["description"]) > 0
    assert result["verified"] is False
    assert "source" in result

    strategies = result["strategies"]
    assert isinstance(strategies, list)
    assert len(strategies) == len(EXPECTED_ELEMENTS)

    found_elements = set()
    for strat in strategies:
        # User requested contract
        assert "element" in strat
        assert "value" in strat
        assert "reason" in strat
        assert isinstance(strat["value"], str) and len(strat["value"]) > 0
        assert isinstance(strat["reason"], str) and len(strat["reason"]) > 0

        # Frontend mock compatibility contract
        assert "id" in strat
        assert "title" in strat
        assert "recommendation" in strat
        assert "iconType" in strat
        assert strat["recommendation"] == strat["value"]
        assert strat["iconType"] == strat["element"]

        found_elements.add(strat["element"])

    assert found_elements == EXPECTED_ELEMENTS
    assert result["tips"] == []


def test_get_requirements_case_and_separator_insensitivity():
    """Confirms zone normalization works with lower case and hyphens."""
    res_hyphen = get_requirements(zone="hot-dry")
    assert res_hyphen["zone"] == "HOT_DRY"

    res_lower = get_requirements(zone="cold")
    assert res_lower["zone"] == "COLD"

    res_space = get_requirements(zone="warm humid")
    assert res_space["zone"] == "WARM_HUMID"


def test_get_requirements_with_alerts():
    """Confirms weather tips are injected when active alerts are provided."""
    alerts = ["heatwave", "heavy_rain"]
    result = get_requirements(zone="HOT_DRY", alerts=alerts)

    tips = result["tips"]
    assert isinstance(tips, list)
    assert len(tips) > 0

    tip_hazards = {tip["hazard"] for tip in tips}
    assert "heatwave" in tip_hazards
    assert "heavy_rain" in tip_hazards

    for tip in tips:
        assert "tip" in tip
        assert "priority" in tip
        assert len(tip["tip"]) > 0


def test_get_requirements_with_cold_wave_alert():
    """Confirms cold wave hazard tips are resolved correctly."""
    result = get_requirements(zone="COLD", alerts=["cold_wave"])
    hazards = {t["hazard"] for t in result["tips"]}
    assert "cold_wave" in hazards


def test_get_requirements_unknown_alert_ignored():
    """Confirms unknown alerts do not crash the engine and are ignored gracefully."""
    result = get_requirements(zone="TEMPERATE", alerts=["volcanic_ash_cloud"])
    assert result["tips"] == []


def test_get_requirements_unknown_zone_raises_value_error():
    """Confirms unknown zones raise a descriptive ValueError."""
    with pytest.raises(ValueError) as exc_info:
        get_requirements(zone="SUBTERRANEAN_CAVE")
    assert "SUBTERRANEAN_CAVE" in str(exc_info.value)
    assert "Must be one of:" in str(exc_info.value)


# ===========================================================================
# API Endpoint Tests — POST /api/requirements
# ===========================================================================


def test_post_requirements_success():
    """POST /api/requirements returns 200 with complete strategies."""
    response = client.post("/api/requirements", json={"zone": "HOT_DRY"})
    assert response.status_code == 200
    data = response.json()

    assert data["zone"] == "HOT_DRY"
    assert data["verified"] is False
    assert len(data["strategies"]) == 8
    assert data["tips"] == []

    # Check first strategy keys
    strat = data["strategies"][0]
    assert "element" in strat
    assert "value" in strat
    assert "reason" in strat
    assert "id" in strat
    assert "title" in strat
    assert "recommendation" in strat
    assert "iconType" in strat


def test_post_requirements_with_alerts_success():
    """POST /api/requirements with alerts returns 200 and tips list."""
    payload = {
        "zone": "COLD",
        "alerts": ["cold_wave", "heavy_rain"],
    }
    response = client.post("/api/requirements", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["zone"] == "COLD"
    assert len(data["tips"]) >= 2
    hazards = {tip["hazard"] for tip in data["tips"]}
    assert "cold_wave" in hazards
    assert "heavy_rain" in hazards


def test_post_requirements_unknown_zone_returns_422():
    """POST /api/requirements with invalid zone returns HTTP 422."""
    response = client.post("/api/requirements", json={"zone": "MARTIAN_DESERT"})
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    # Check that our ErrorDetail code is returned
    assert data["detail"]["code"] == "INVALID_CLIMATE_ZONE"
    assert "MARTIAN_DESERT" in data["detail"]["message"]


def test_post_requirements_missing_zone_returns_422():
    """POST /api/requirements with empty json returns HTTP 422 from Pydantic."""
    response = client.post("/api/requirements", json={})
    assert response.status_code == 422


def test_post_requirements_invalid_types_returns_422():
    """POST /api/requirements with invalid field types returns HTTP 422."""
    response = client.post("/api/requirements", json={"zone": 12345})
    assert response.status_code == 422
