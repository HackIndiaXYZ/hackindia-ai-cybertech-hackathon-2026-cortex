"""
Design Ranking route — POST /api/design/rank

Evaluates multi-criteria architectural envelope candidates (wall, roof, window,
orientation, ventilation) against bioclimatic zones and user priority weights.
"""

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status

from app.analysis.design_ranker import load_presets, rank_designs
from app.analysis.spec_builder import build_spec
from app.schemas.analysis_schema import ErrorDetail
from app.schemas.design_schema import (
    DesignRankRequest,
    DesignRankResponse,
    DesignSpecRequest,
    DesignSpecResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/design/rank",
    response_model=DesignRankResponse,
    summary="Rank passive shelter design alternatives (MCDM weighted sum)",
    description=(
        "Generates all permutations of envelope strategies (walls, roof, windows, orientation, "
        "ventilation), filters out candidates failing minimum structural safety thresholds, "
        "and ranks designs using a weighted sum model over comfort, inverted cost, safety, and "
        "sustainability criteria. Returns top N recommendations matching the frontend design card contract."
    ),
    responses={
        200: {"description": "Design ranking evaluated successfully."},
        422: {"description": "Validation error — invalid zone, negative weights, or bad parameters."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_design_rank(request: DesignRankRequest) -> DesignRankResponse:
    """
    POST /api/design/rank endpoint handler.
    """
    logger.info("Design ranking requested for zone='%s', top_n=%d", request.zone, request.top_n)

    weights_dict = request.weights.model_dump() if request.weights else None

    try:
        ranked_result = rank_designs(
            zone=request.zone,
            weights=weights_dict,
            top_n=request.top_n,
        )
        return DesignRankResponse(**ranked_result)

    except ValueError as val_err:
        logger.warning("Validation error in design ranking: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_DESIGN_PARAMETERS",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error ranking designs for zone '%s'", request.zone)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="DESIGN_RANKING_FAILED",
                message="An unexpected error occurred during design ranking.",
            ).model_dump(),
        ) from exc


@router.get(
    "/design/presets",
    summary="Get design optimization weight presets",
    description="Returns preconfigured optimization presets: Balanced, Low cost, Safety first, and Eco friendly.",
)
async def get_design_presets() -> Dict[str, Any]:
    """Returns optimization weight presets from presets.json."""
    return load_presets()


@router.post(
    "/design/spec",
    response_model=DesignSpecResponse,
    summary="Generate bioclimatic 2D design plan specification",
    description=(
        "Generates a 2D architectural concept layout specification (plotSize, orientation, "
        "rooms, doors, windows, courtyard, wall_thickness, roof_type, overhang) tailored to the "
        "bioclimatic zone and site plot constraints. Validates that all rooms stay strictly within "
        "bounds and do not overlap. Advisory flag concept_only: true is set."
    ),
    responses={
        200: {"description": "Design specification generated and validated successfully."},
        422: {"description": "Validation error — invalid zone, plot boundaries, or parameters."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_design_spec(request: DesignSpecRequest) -> DesignSpecResponse:
    """
    POST /api/design/spec endpoint handler.
    """
    logger.info(
        "Design specification requested for zone='%s', plot=%.1fx%.1fm, bedrooms=%d",
        request.zone,
        request.plot_width,
        request.plot_length,
        request.bedrooms,
    )

    try:
        spec_dict = build_spec(
            zone=request.zone,
            design=request.design,
            plot_width=request.plot_width,
            plot_length=request.plot_length,
            bedrooms=request.bedrooms,
        )
        return DesignSpecResponse(**spec_dict)

    except ValueError as val_err:
        logger.warning("Validation error in design specification: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_SPEC_PARAMETERS",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error generating design specification for zone '%s'", request.zone)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="DESIGN_SPEC_FAILED",
                message="An unexpected error occurred during design specification generation.",
            ).model_dump(),
        ) from exc
