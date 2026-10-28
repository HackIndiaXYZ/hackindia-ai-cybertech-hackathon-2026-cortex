"""
test_design_catalogue.py
------------------------
Unit tests for:
  - backend/app/data/design_catalogue.json  (structure and business rules)
  - backend/app/analysis/design_catalogue.py  (loader, duplication guards)
  - backend/app/schemas/design_schema.py      (CatalogueDesign validation)

All tests are offline — no external APIs are called.

Run:
    cd backend
    pytest tests/test_design_catalogue.py -v
"""

import json
import tempfile
from pathlib import Path
from typing import Any, Dict

import pytest

from app.analysis.design_catalogue import load_catalogue
from app.schemas.design_schema import CatalogueDesign

# ---------------------------------------------------------------------------
# Helper — valid minimal catalogue JSON
# ---------------------------------------------------------------------------

VALID_DESIGN_A: Dict[str, Any] = {
    "id": "courtyard-haveli",
    "name": "Courtyard Haveli",
    "wall_material": "sandstone_masonry",
    "roof_type": "parapet_courtyard",
    "window_to_wall_ratio": 0.12,
    "shading_depth": "high",
    "ventilation": "stack",
    "thermal_mass": "high",
    "insulation": "low",
    "has_courtyard": True,
    "raised_floor": False,
    "plan_archetype": "HOT_DRY",
    "estimated_cost_level": 3,
    "source": "NBC 2016 Part 8",
    "verified": False,
}

VALID_DESIGN_B: Dict[str, Any] = {
    "id": "malay-kampung",
    "name": "Malay Kampung House",
    "wall_material": "timber_slatted",
    "roof_type": "hipped_stilted",
    "window_to_wall_ratio": 0.45,
    "shading_depth": "high",
    "ventilation": "cross",
    "thermal_mass": "low",
    "insulation": "low",
    "has_courtyard": False,
    "raised_floor": True,
    "plan_archetype": "WARM_HUMID",
    "estimated_cost_level": 2,
    "source": "NBC 2016 Part 8",
    "verified": False,
}


def _write_catalogue(tmp_path: Path, designs: list) -> Path:
    """Write a minimal catalogue JSON to a temp file and return its path."""
    catalogue = {"designs": designs}
    p = tmp_path / "design_catalogue.json"
    p.write_text(json.dumps(catalogue), encoding="utf-8")
    return p


# ===========================================================================
# 1. Production catalogue file tests
# ===========================================================================


class TestProductionCatalogue:
    """Tests that run against the real design_catalogue.json file."""

    @pytest.fixture(scope="class")
    @classmethod
    def catalogue(cls):
        """Load the real catalogue once for all tests in this class."""
        return load_catalogue()

    def test_catalogue_not_empty(self, catalogue):
        """Catalogue must contain at least one design."""
        assert len(catalogue) >= 1, "Catalogue is empty — check design_catalogue.json"

    def test_minimum_design_count(self, catalogue):
        """Catalogue must have at least 20 distinct designs (per spec)."""
        assert len(catalogue) >= 20, (
            f"Expected at least 20 designs, got {len(catalogue)}. "
            "Add more entries to design_catalogue.json."
        )

    def test_all_ids_unique(self, catalogue):
        """No two designs may share an 'id' slug."""
        ids = [d.id for d in catalogue]
        unique_ids = set(ids)
        assert len(ids) == len(unique_ids), (
            f"Duplicate design ids found: "
            f"{[x for x in ids if ids.count(x) > 1]}"
        )

    def test_all_names_unique(self, catalogue):
        """No two designs may share a 'name'."""
        names = [d.name for d in catalogue]
        unique_names = set(names)
        assert len(names) == len(unique_names), (
            f"Duplicate design names found: "
            f"{[x for x in names if names.count(x) > 1]}"
        )

    def test_all_required_fields_present(self, catalogue):
        """Every CatalogueDesign must have all required fields populated."""
        required_str_fields = ["id", "name", "wall_material", "source"]
        for design in catalogue:
            for field in required_str_fields:
                value = getattr(design, field, None)
                assert value and isinstance(value, str), (
                    f"Design '{design.id}' is missing or has blank '{field}'."
                )

    def test_plan_archetype_valid_for_frontend(self, catalogue):
        """
        plan_archetype must be one of the keys that planData.ts and
        climateShelterData.ts recognise, so the 2D and 3D buttons keep working.
        """
        valid_archetypes = {"HOT_DRY", "WARM_HUMID", "COLD", "COMPOSITE", "TEMPERATE", "NEUTRAL"}
        for design in catalogue:
            assert design.plan_archetype in valid_archetypes, (
                f"Design '{design.id}' has plan_archetype='{design.plan_archetype}' "
                f"which is not in {valid_archetypes}."
            )

    def test_verified_always_false(self, catalogue):
        """No design may be marked verified=True (honesty constraint)."""
        for design in catalogue:
            assert design.verified is False, (
                f"Design '{design.id}' has verified=True. "
                "Catalogue values are research estimates — do not mark as verified."
            )

    def test_window_to_wall_ratio_in_range(self, catalogue):
        """window_to_wall_ratio must be between 0.01 and 0.90."""
        for design in catalogue:
            assert 0.01 <= design.window_to_wall_ratio <= 0.90, (
                f"Design '{design.id}' has window_to_wall_ratio="
                f"{design.window_to_wall_ratio} outside [0.01, 0.90]."
            )

    def test_cost_level_in_range(self, catalogue):
        """estimated_cost_level must be 1–5."""
        for design in catalogue:
            assert 1 <= design.estimated_cost_level <= 5, (
                f"Design '{design.id}' has estimated_cost_level="
                f"{design.estimated_cost_level} outside [1, 5]."
            )

    def test_roof_type_is_valid_3d_key(self, catalogue):
        """roof_type must be one of the keys used by ClimateShelterConfig in climateShelterData.ts."""
        valid_roof_types = {
            "steep_gable",
            "parapet_courtyard",
            "hipped_stilted",
            "monopitch_solar",
            "hybrid_composite",
        }
        for design in catalogue:
            assert design.roof_type in valid_roof_types, (
                f"Design '{design.id}' has roof_type='{design.roof_type}' "
                f"which is not in {valid_roof_types}."
            )

    def test_source_not_empty(self, catalogue):
        """Each design must have a non-empty 'source' string."""
        for design in catalogue:
            assert design.source.strip(), (
                f"Design '{design.id}' has an empty 'source' field. "
                "Every design needs a bibliographic reference."
            )


# ===========================================================================
# 2. CatalogueDesign schema validation tests
# ===========================================================================


class TestCatalogueDesignSchema:
    """Unit tests for the CatalogueDesign Pydantic model."""

    def test_valid_design_parses(self):
        """A correctly shaped entry must parse without error."""
        design = CatalogueDesign.model_validate(VALID_DESIGN_A)
        assert design.id == "courtyard-haveli"
        assert design.plan_archetype == "HOT_DRY"
        assert design.verified is False

    def test_invalid_shading_depth_rejected(self):
        """An unknown shading_depth value must raise a validation error."""
        bad = {**VALID_DESIGN_A, "shading_depth": "extreme"}
        with pytest.raises(Exception):  # pydantic ValidationError
            CatalogueDesign.model_validate(bad)

    def test_invalid_ventilation_strategy_rejected(self):
        """An unknown ventilation value must raise a validation error."""
        bad = {**VALID_DESIGN_A, "ventilation": "passive_cooling"}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)

    def test_invalid_plan_archetype_rejected(self):
        """An unknown plan_archetype must raise a validation error."""
        bad = {**VALID_DESIGN_A, "plan_archetype": "TROPICAL"}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)

    def test_invalid_roof_type_rejected(self):
        """An unknown roof_type must raise a validation error."""
        bad = {**VALID_DESIGN_A, "roof_type": "flat_concrete"}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)

    def test_wwr_below_minimum_rejected(self):
        """window_to_wall_ratio below 0.01 must be rejected."""
        bad = {**VALID_DESIGN_A, "window_to_wall_ratio": 0.0}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)

    def test_cost_level_above_maximum_rejected(self):
        """estimated_cost_level > 5 must be rejected."""
        bad = {**VALID_DESIGN_A, "estimated_cost_level": 6}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)

    def test_verified_true_rejected(self):
        """verified=True must raise a validation error (honesty constraint)."""
        bad = {**VALID_DESIGN_A, "verified": True}
        with pytest.raises(Exception):
            CatalogueDesign.model_validate(bad)


# ===========================================================================
# 3. Loader duplication guard tests
# ===========================================================================


class TestLoadCatalogueDuplicateGuards:
    """Tests for the duplicate-id and duplicate-name guards in load_catalogue()."""

    def test_duplicate_id_raises(self, tmp_path):
        """Two designs with the same 'id' must raise RuntimeError."""
        a = {**VALID_DESIGN_A}
        b = {**VALID_DESIGN_B, "id": VALID_DESIGN_A["id"]}  # force duplicate id
        path = _write_catalogue(tmp_path, [a, b])
        with pytest.raises(RuntimeError, match="duplicate design ids"):
            load_catalogue(path)

    def test_duplicate_name_raises(self, tmp_path):
        """Two designs with the same 'name' must raise RuntimeError."""
        a = {**VALID_DESIGN_A}
        b = {**VALID_DESIGN_B, "name": VALID_DESIGN_A["name"]}  # force duplicate name
        path = _write_catalogue(tmp_path, [a, b])
        with pytest.raises(RuntimeError, match="duplicate design names"):
            load_catalogue(path)

    def test_valid_two_designs_loads_ok(self, tmp_path):
        """Two distinct designs must load without error."""
        path = _write_catalogue(tmp_path, [VALID_DESIGN_A, VALID_DESIGN_B])
        catalogue = load_catalogue(path)
        assert len(catalogue) == 2

    def test_missing_file_raises(self, tmp_path):
        """A missing JSON file must raise FileNotFoundError."""
        missing = tmp_path / "nonexistent.json"
        with pytest.raises(FileNotFoundError):
            load_catalogue(missing)

    def test_empty_designs_array_raises(self, tmp_path):
        """An empty 'designs' array must raise RuntimeError."""
        path = _write_catalogue(tmp_path, [])
        with pytest.raises(RuntimeError, match="empty"):
            load_catalogue(path)

    def test_invalid_entry_raises_with_index(self, tmp_path):
        """A malformed design entry must raise RuntimeError mentioning the index."""
        bad = {**VALID_DESIGN_A, "roof_type": "not_a_valid_roof"}
        path = _write_catalogue(tmp_path, [bad])
        with pytest.raises(RuntimeError, match="#0"):
            load_catalogue(path)
