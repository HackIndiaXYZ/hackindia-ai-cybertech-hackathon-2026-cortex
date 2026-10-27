"""
Tests for MCDM Design Ranking Engine and POST /api/design/rank endpoint.

Includes:
- Candidate generation and safety rule filtering
- Weight normalization and validation
- Hand-calculated MCDM weighted sum verification test
- Sensitivity test verifying that altering priority weights changes ranking order
- API integration: 200 OK with DesignModel shape, validation errors (422), presets endpoint (GET)
"""

import pytest
from fastapi.testclient import TestClient

from app.analysis.design_ranker import (
    generate_candidates,
    load_materials,
    load_ranking_rules,
    normalize_weights,
    normalize_zone,
    rank_designs,
)
from app.main import app

client = TestClient(app)


# ===========================================================================
# Unit Tests — Candidate Generation & Filtering
# ===========================================================================


def test_normalize_zone_valid_and_case_insensitive():
    """Zone normalization accepts lower, upper, and hyphenated variations."""
    assert normalize_zone("hot_dry") == "HOT_DRY"
    assert normalize_zone("Hot-Dry") == "HOT_DRY"
    assert normalize_zone("cold") == "COLD"
    assert normalize_zone("warm_humid") == "WARM_HUMID"
    assert normalize_zone("composite") == "COMPOSITE"
    assert normalize_zone("temperate") == "TEMPERATE"


def test_normalize_zone_invalid_raises_value_error():
    """Invalid zones raise ValueError."""
    with pytest.raises(ValueError, match="Invalid climate zone"):
        normalize_zone("DESERT_TROPICAL")
    with pytest.raises(ValueError):
        normalize_zone("")


def test_generate_candidates_filters_by_safety():
    """Confirms all generated candidates meet or exceed the safety threshold."""
    rules = load_ranking_rules()
    min_safety = float(rules.get("min_safety_score", 6.0))
    min_safety_100 = int(round(min_safety * 10))

    candidates = generate_candidates("HOT_DRY")
    assert len(candidates) > 0

    for cand in candidates:
        assert cand["scores"]["safety"] >= min_safety_100
        assert "comfort" in cand["scores"]
        assert "cost" in cand["scores"]
        assert "sustainability" in cand["scores"]
        assert len(cand["reasons"]) >= 1


def test_weights_validation_and_normalization():
    """Weights are validated for non-negative values and normalized to sum to 1.0."""
    # Percentage input (sum = 100)
    norm = normalize_weights({"comfort": 25, "cost": 25, "safety": 25, "sustainability": 25})
    assert norm == {"comfort": 0.25, "cost": 0.25, "safety": 0.25, "sustainability": 0.25}

    # Decimal input (sum = 1.0)
    norm2 = normalize_weights({"comfort": 0.4, "cost": 0.2, "safety": 0.2, "sustainability": 0.2})
    assert norm2["comfort"] == 0.4
    assert round(sum(norm2.values()), 4) == 1.0

    # Negative weight raises ValueError
    with pytest.raises(ValueError, match="cannot be negative"):
        normalize_weights({"comfort": -5, "cost": 25, "safety": 25, "sustainability": 25})

    # Zero total weight raises ValueError
    with pytest.raises(ValueError, match="greater than zero"):
        normalize_weights({"comfort": 0, "cost": 0, "safety": 0, "sustainability": 0})


# ===========================================================================
# Hand-Calculated Verification Test (Requirement 3)
# ===========================================================================


def test_mcdm_hand_calculated_example():
    """
    Hand-calculated verification test:
    For a known candidate with explicit component scores, verify the manual
    formula matches rank_designs totalScore.

    Formulas:
    w = (0.40, 0.10, 0.20, 0.30)
    scores: comfort=C, cost=K, safety=S, sustainability=U
    Expected totalScore = round(0.40*C + 0.10*K + 0.20*S + 0.30*U)
    """
    zone = "HOT_DRY"
    weights = {"comfort": 40.0, "cost": 10.0, "safety": 20.0, "sustainability": 30.0}

    result = rank_designs(zone=zone, weights=weights, top_n=5)
    assert len(result["designs"]) == 5

    for d in result["designs"]:
        sc = d["scores"]
        w1, w2, w3, w4 = 0.40, 0.10, 0.20, 0.30
        hand_calculated = round(
            w1 * sc["comfort"] + w2 * sc["cost"] + w3 * sc["safety"] + w4 * sc["sustainability"]
        )
        assert d["totalScore"] == hand_calculated, (
            f"Expected {hand_calculated} for scores {sc}, got {d['totalScore']}"
        )


# ===========================================================================
# Sensitivity Test: Weight Changes Alter Ranking (Requirement 3)
# ===========================================================================


def test_mcdm_sensitivity_ranking_changes_with_weights():
    """
    Sensitivity test:
    Changing priority weights drastically from 'Low cost' (budget focus) to
    'Safety first' (durability focus) produces different top design recommendations.
    """
    zone = "WARM_HUMID"

    # 1. Budget focus: 70% cost efficiency, 10% others
    low_cost_weights = {
        "comfort": 10.0,
        "cost": 70.0,
        "safety": 10.0,
        "sustainability": 10.0,
    }
    low_cost_result = rank_designs(zone=zone, weights=low_cost_weights, top_n=3)
    top_low_cost = low_cost_result["designs"][0]

    # 2. Safety focus: 70% structural safety, 10% others
    safety_weights = {
        "comfort": 10.0,
        "cost": 10.0,
        "safety": 70.0,
        "sustainability": 10.0,
    }
    safety_result = rank_designs(zone=zone, weights=safety_weights, top_n=3)
    top_safety = safety_result["designs"][0]

    # Top recommendations must differ due to opposing criteria
    assert top_low_cost["id"] != top_safety["id"]
    # The budget winner must have higher cost efficiency score than the safety winner
    assert top_low_cost["scores"]["cost"] >= top_safety["scores"]["cost"]
    # The safety winner must have higher safety score than the budget winner
    assert top_safety["scores"]["safety"] >= top_low_cost["scores"]["safety"]


# ===========================================================================
# API Endpoint Tests — POST /api/design/rank & GET /api/design/presets
# ===========================================================================


def test_post_design_rank_success_matches_frontend_contract():
    """POST /api/design/rank returns 200 and matches frontend DesignModel shape."""
    payload = {
        "zone": "HOT_DRY",
        "weights": {"comfort": 25, "cost": 25, "safety": 25, "sustainability": 25},
        "top_n": 3,
    }
    res = client.post("/api/design/rank", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["zone"] == "HOT_DRY"
    assert data["weights_applied"] == {
        "comfort": 0.25,
        "cost": 0.25,
        "safety": 0.25,
        "sustainability": 0.25,
    }
    assert len(data["designs"]) == 3

    # Check each card matches DesignModel in frontend/client/src/mock/designs.ts
    for design in data["designs"]:
        assert "id" in design
        assert "name" in design
        assert "scores" in design
        assert "comfort" in design["scores"]
        assert "cost" in design["scores"]
        assert "safety" in design["scores"]
        assert "sustainability" in design["scores"]
        assert "totalScore" in design
        assert "description" in design
        assert "reasons" in design and isinstance(design["reasons"], list)
        assert len(design["reasons"]) > 0


def test_post_design_rank_default_weights_and_top_n():
    """POST /api/design/rank defaults to balanced weights and top_n=3 when omitted."""
    res = client.post("/api/design/rank", json={"zone": "COLD"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["designs"]) == 3
    assert data["weights_applied"] == {
        "comfort": 0.25,
        "cost": 0.25,
        "safety": 0.25,
        "sustainability": 0.25,
    }


def test_post_design_rank_invalid_zone_returns_422():
    """Invalid zone returns 422 with descriptive error."""
    res = client.post("/api/design/rank", json={"zone": "MARS_ARID"})
    assert res.status_code == 422
    assert res.json()["detail"]["code"] == "INVALID_DESIGN_PARAMETERS"


def test_post_design_rank_negative_weights_returns_422():
    """Negative weights return 422."""
    res = client.post(
        "/api/design/rank",
        json={"zone": "HOT_DRY", "weights": {"comfort": -10, "cost": 30, "safety": 40, "sustainability": 40}},
    )
    assert res.status_code == 422


def test_get_design_presets_returns_presets():
    """GET /api/design/presets returns presets configured in presets.json."""
    res = client.get("/api/design/presets")
    assert res.status_code == 200
    data = res.json()
    assert "presets" in data
    presets = data["presets"]
    assert "Balanced" in presets
    assert "Low cost" in presets
    assert "Safety first" in presets
    assert "Eco friendly" in presets
