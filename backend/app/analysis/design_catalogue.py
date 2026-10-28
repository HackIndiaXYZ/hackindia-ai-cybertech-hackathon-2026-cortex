"""
design_catalogue.py
--------------------
Loads and validates design_catalogue.json at startup.

Public API:
    load_catalogue() -> List[CatalogueDesign]
        Reads backend/app/data/design_catalogue.json, validates every entry
        against CatalogueDesign (Pydantic), and raises a clear RuntimeError if:
          - Any id is duplicated across designs.
          - Any name is duplicated across designs.
          - Pydantic validation fails for any entry (bad enum, out-of-range value, etc.)
          - The file is missing or malformed JSON.

    get_catalogue() -> List[CatalogueDesign]
        Returns the already-loaded cached catalogue (loads on first call).

Usage:
    from app.analysis.design_catalogue import get_catalogue
    designs = get_catalogue()
"""

import json
import logging
from pathlib import Path
from typing import List, Optional

from app.schemas.design_schema import CatalogueDesign

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Path resolution — always relative to this file so it works regardless of
# the working directory the server is started from.
# ---------------------------------------------------------------------------
_CATALOGUE_PATH = Path(__file__).resolve().parent.parent / "data" / "design_catalogue.json"

# Module-level cache — populated on first call to get_catalogue()
_catalogue_cache: Optional[List[CatalogueDesign]] = None


def load_catalogue(path: Path = _CATALOGUE_PATH) -> List[CatalogueDesign]:
    """
    Read design_catalogue.json, validate every entry, and return a list of
    CatalogueDesign objects.

    Raises:
        FileNotFoundError: if the JSON file does not exist.
        json.JSONDecodeError: if the file is not valid JSON.
        RuntimeError: if any id or name is duplicated, or Pydantic rejects an entry.
    """
    logger.info("Loading design catalogue from %s", path)

    if not path.exists():
        raise FileNotFoundError(
            f"Design catalogue not found at {path}. "
            "Ensure backend/app/data/design_catalogue.json exists."
        )

    with path.open(encoding="utf-8-sig") as fh:
        raw = json.load(fh)

    designs_raw: list = raw.get("designs", [])
    if not designs_raw:
        raise RuntimeError(
            "design_catalogue.json has no 'designs' array or the array is empty."
        )

    designs: List[CatalogueDesign] = []
    for index, entry in enumerate(designs_raw):
        try:
            design = CatalogueDesign.model_validate(entry)
        except Exception as exc:
            raise RuntimeError(
                f"design_catalogue.json entry #{index} failed validation: {exc}\n"
                f"Offending entry: {entry}"
            ) from exc
        designs.append(design)

    # ------------------------------------------------------------------
    # Uniqueness checks — fail loudly at startup rather than returning
    # silently wrong ML features later.
    # ------------------------------------------------------------------
    _check_unique_ids(designs)
    _check_unique_names(designs)

    logger.info(
        "Design catalogue loaded: %d designs validated successfully.", len(designs)
    )
    return designs


def _check_unique_ids(designs: List[CatalogueDesign]) -> None:
    """Raise RuntimeError if any 'id' field appears more than once."""
    seen: set = set()
    duplicates: list = []
    for d in designs:
        if d.id in seen:
            duplicates.append(d.id)
        seen.add(d.id)
    if duplicates:
        raise RuntimeError(
            f"design_catalogue.json has duplicate design ids: {duplicates}. "
            "Each design must have a unique 'id' slug."
        )


def _check_unique_names(designs: List[CatalogueDesign]) -> None:
    """Raise RuntimeError if any 'name' field appears more than once."""
    seen: set = set()
    duplicates: list = []
    for d in designs:
        if d.name in seen:
            duplicates.append(d.name)
        seen.add(d.name)
    if duplicates:
        raise RuntimeError(
            f"design_catalogue.json has duplicate design names: {duplicates}. "
            "Each design must have a unique human-readable 'name'."
        )


def get_catalogue() -> List[CatalogueDesign]:
    """
    Return the loaded-and-validated catalogue.
    Loads from disk on the first call, then returns the cached result.

    Use this function everywhere else in the codebase (not load_catalogue
    directly) to avoid repeated disk I/O.
    """
    global _catalogue_cache
    if _catalogue_cache is None:
        _catalogue_cache = load_catalogue()
    return _catalogue_cache
