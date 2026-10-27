"""
Tests for Design Specification Generator and POST /api/design/spec endpoint.

Covers:
- Layout validation: boundary enclosure and strict non-overlap checks
- Bioclimatic archetypes: HOT_DRY, WARM_HUMID, COLD, COMPOSITE, TEMPERATE
- Bedroom scaling: 1 to 5 bedrooms
- Passive envelope specs: courtyard presence, wall thickness, roof type, overhang
- Contract guarantees: concept_only: true, plotSize shape matching PlanSpec
- API integration: 200 OK responses and 422 validation errors
"""

import pytest
from fastapi.testclient import TestClient

from app.analysis.spec_builder import (
    build_spec,
    normalize_zone,
    validate_layout,
)
from app.main import app

client = TestClient(app)


# ===========================================================================
# 1. Bounds and Non-Overlap Validation Unit Tests
# ===========================================================================


def test_validate_layout_valid_touching_rooms():
    """Rooms sharing boundary edges (zero overlapping area) pass validation."""
    rooms = [
        {"id": "r1", "name": "Room 1", "x": 1.0, "y": 1.0, "w": 5.0, "l": 4.0},
        {"id": "r2", "name": "Room 2", "x": 6.0, "y": 1.0, "w": 5.0, "l": 4.0},  # touches r1 on right
        {"id": "r3", "name": "Room 3", "x": 1.0, "y": 5.0, "w": 10.0, "l": 4.0}, # touches r1 & r2 on bottom
    ]
    # On a 14x12 plot, this is valid
    validate_layout(rooms, plot_width=14.0, plot_length=12.0)


def test_validate_layout_exceeds_plot_width_raises_error():
    """Room protruding past plot width raises ValueError."""
    rooms = [
        {"id": "r1", "name": "Room 1", "x": 10.0, "y": 1.0, "w": 6.0, "l": 4.0}, # x + w = 16.0 > 14.0
    ]
    with pytest.raises(ValueError, match="exceeds plot boundaries"):
        validate_layout(rooms, plot_width=14.0, plot_length=12.0)


def test_validate_layout_exceeds_plot_length_raises_error():
    """Room protruding past plot length raises ValueError."""
    rooms = [
        {"id": "r1", "name": "Room 1", "x": 1.0, "y": 9.0, "w": 5.0, "l": 5.0}, # y + l = 14.0 > 12.0
    ]
    with pytest.raises(ValueError, match="exceeds plot boundaries"):
        validate_layout(rooms, plot_width=14.0, plot_length=12.0)


def test_validate_layout_negative_coordinates_raises_error():
    """Room with negative x or y coordinate raises ValueError."""
    rooms = [
        {"id": "r1", "name": "Room 1", "x": -1.0, "y": 2.0, "w": 5.0, "l": 4.0},
    ]
    with pytest.raises(ValueError, match="negative coordinates"):
        validate_layout(rooms, plot_width=14.0, plot_length=12.0)


def test_validate_layout_overlapping_rooms_raises_error():
    """Two rooms with overlapping interior area raise ValueError."""
    rooms = [
        {"id": "r1", "name": "Room 1", "x": 1.0, "y": 1.0, "w": 6.0, "l": 5.0},
        {"id": "r2", "name": "Room 2", "x": 4.0, "y": 3.0, "w": 6.0, "l": 5.0}, # intersects r1
    ]
    with pytest.raises(ValueError, match="Room overlap detected"):
        validate_layout(rooms, plot_width=15.0, plot_length=15.0)


# ===========================================================================
# 2. Bioclimatic Zone Archetypes & Spec Builder Tests
# ===========================================================================


@pytest.mark.parametrize("zone", ["HOT_DRY", "WARM_HUMID", "COLD", "COMPOSITE", "TEMPERATE"])
@pytest.mark.parametrize("bedrooms", [1, 2, 3])
def test_build_spec_all_zones_and_bedrooms(zone: str, bedrooms: int):
    """Verifies spec generation for all zones and bedroom counts with rigorous geometric integrity."""
    pw, pl = 16.0, 18.0
    spec = build_spec(zone=zone, plot_width=pw, plot_length=pl, bedrooms=bedrooms)

    assert spec["zone"] == zone
    assert spec["plotSize"] == {"w": pw, "l": pl}
    assert spec["concept_only"] is True
    assert len(spec["rooms"]) >= 3
    assert "wall_thickness" in spec
    assert "roof_type" in spec
    assert "overhang" in spec

    # Verify rooms are within bounds and do not overlap
    validate_layout(spec["rooms"], pw, pl)

    # Count generated bedrooms
    bed_count = sum(1 for r in spec["rooms"] if r["type"] == "bedroom")
    assert bed_count == bedrooms, f"Expected {bedrooms} bedrooms in {zone}, found {bed_count}"

    # Verify all rooms have doors and details
    for r in spec["rooms"]:
        assert "id" in r and "name" in r and "type" in r
        assert "doors" in r and "windows" in r
        assert len(r["details"]) > 0


def test_build_spec_hot_dry_courtyard_and_envelope():
    """HOT_DRY must include central courtyard, parapet roof, and thick adobe/brick walls."""
    spec = build_spec(zone="HOT_DRY", plot_width=14.0, plot_length=16.0, bedrooms=2)

    assert spec["courtyard"]["present"] is True
    assert spec["courtyard"]["type"] == "central_cooling"
    assert spec["roof_type"] == "parapet_courtyard"
    assert spec["wall_thickness"] >= 0.35
    assert spec["overhang"] == 0.8

    # Courtyard room must exist in rooms list
    court_room = next((r for r in spec["rooms"] if r["type"] == "courtyard"), None)
    assert court_room is not None
    assert court_room["id"] == "courtyard"


def test_build_spec_composite_courtyard():
    """COMPOSITE zone must include adaptable courtyard."""
    spec = build_spec(zone="COMPOSITE", plot_width=14.0, plot_length=16.0, bedrooms=2)

    assert spec["courtyard"]["present"] is True
    assert spec["courtyard"]["type"] == "seasonal_adaptable"
    assert spec["roof_type"] == "hybrid_composite"


def test_build_spec_warm_humid_no_courtyard_cross_ventilation():
    """WARM_HUMID has no central courtyard; features verandah and high overhang."""
    spec = build_spec(zone="WARM_HUMID", plot_width=16.0, plot_length=14.0, bedrooms=2)

    assert spec["courtyard"]["present"] is False
    assert spec["roof_type"] == "hipped_stilted"
    assert spec["overhang"] >= 1.0
    assert spec["wall_thickness"] <= 0.25

    # Verandah corridor present
    verandah = next((r for r in spec["rooms"] if r["id"] == "verandah"), None)
    assert verandah is not None


def test_build_spec_cold_climate_airlock_and_steep_roof():
    """COLD features steep gabled roof (snow shedding), entry airlock lobby, thick insulation."""
    spec = build_spec(zone="COLD", plot_width=12.0, plot_length=14.0, bedrooms=2)

    assert spec["courtyard"]["present"] is False
    assert spec["roof_type"] == "steep_gable"
    assert spec["wall_thickness"] >= 0.40
    assert spec["overhang"] == 0.4

    # Entry lobby airlock present
    lobby = next((r for r in spec["rooms"] if r["id"] == "lobby"), None)
    assert lobby is not None


def test_build_spec_invalid_zone_raises_value_error():
    """Unsupported or empty zone raises ValueError."""
    with pytest.raises(ValueError, match="Invalid climate zone"):
        build_spec(zone="TROPICAL_SAVANNAH")


def test_build_spec_invalid_dimensions_raises_value_error():
    """Out-of-range plot dimensions raise ValueError."""
    with pytest.raises(ValueError, match="plot_width"):
        build_spec(zone="HOT_DRY", plot_width=4.0)  # min 8.0m
    with pytest.raises(ValueError, match="plot_length"):
        build_spec(zone="HOT_DRY", plot_length=200.0)  # max 100.0m
    with pytest.raises(ValueError, match="bedrooms"):
        build_spec(zone="HOT_DRY", bedrooms=0)
    with pytest.raises(ValueError, match="bedrooms"):
        build_spec(zone="HOT_DRY", bedrooms=6)


# ===========================================================================
# 3. API Integration Tests — POST /api/design/spec
# ===========================================================================


def test_post_design_spec_success_contract():
    """POST /api/design/spec returns 200 OK with valid DesignSpecResponse."""
    payload = {
        "zone": "HOT_DRY",
        "plot_width": 14.0,
        "plot_length": 16.0,
        "bedrooms": 2,
        "design": "brick_rcc_flat",
    }
    response = client.post("/api/design/spec", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["zone"] == "HOT_DRY"
    assert data["plotSize"] == {"w": 14.0, "l": 16.0}
    assert data["concept_only"] is True
    assert isinstance(data["rooms"], list)
    assert len(data["rooms"]) >= 4
    assert data["wall_thickness"] > 0
    assert data["roof_type"] == "parapet_courtyard"
    assert data["overhang"] > 0
    assert "source" in data
    assert data["verified"] is False
    assert data["design_summary"] == "brick_rcc_flat"

    # Verify room model details
    for room in data["rooms"]:
        assert "id" in room
        assert "name" in room
        assert "label" in room
        assert "type" in room
        assert "x" in room and "y" in room and "w" in room and "l" in room
        assert "doors" in room
        assert "windows" in room
        assert "details" in room


def test_post_design_spec_case_insensitive_zone():
    """Zone field accepts lowercase and hyphenated formats."""
    payload = {
        "zone": "hot-dry",
        "plot_width": 14.0,
        "plot_length": 16.0,
        "bedrooms": 2,
    }
    response = client.post("/api/design/spec", json=payload)
    assert response.status_code == 200
    assert response.json()["zone"] == "HOT_DRY"


def test_post_design_spec_invalid_zone_returns_422():
    """Unknown zone returns 422 Unprocessable Content."""
    payload = {
        "zone": "SUB_ARCTIC",
        "plot_width": 14.0,
        "plot_length": 16.0,
        "bedrooms": 2,
    }
    response = client.post("/api/design/spec", json=payload)
    assert response.status_code == 422
    err = response.json()
    assert err["detail"]["code"] == "INVALID_SPEC_PARAMETERS"


def test_post_design_spec_out_of_bounds_plot_returns_422():
    """Plot smaller than minimum threshold returns 422."""
    payload = {
        "zone": "HOT_DRY",
        "plot_width": 5.0,  # Below min 8.0m
        "plot_length": 16.0,
        "bedrooms": 2,
    }
    response = client.post("/api/design/spec", json=payload)
    assert response.status_code == 422


def test_post_design_spec_missing_required_zone_returns_422():
    """Missing required zone parameter returns 422."""
    response = client.post("/api/design/spec", json={"plot_width": 14.0})
    assert response.status_code == 422
