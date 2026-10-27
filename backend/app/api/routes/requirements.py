"""
Shelter requirements route — POST /api/requirements

Provides passive architectural design requirements tailored to specific
bioclimatic zones and emergency weather hazards.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.analysis.recommend import get_requirements
from app.schemas.analysis_schema import ErrorDetail
from app.schemas.requirements_schema import (
    RequirementsRequest,
    RequirementsResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/requirements",
    response_model=RequirementsResponse,
    summary="Get passive shelter design requirements",
    description=(
        "Returns tailored passive architectural design strategies for a given climate zone "
        "(layout, walls, roof, windows, shading, ventilation, orientation, landscaping) "
        "along with actionable emergency weather tips for active alerts."
    ),
    responses={
        200: {"description": "Shelter requirements successfully generated."},
        422: {"description": "Invalid climate zone or payload format."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_requirements(request: RequirementsRequest) -> RequirementsResponse:
    """
    POST /api/requirements endpoint handler.
    Validates zone and returns structured recommendations and emergency tips.
    """
    logger.info("Shelter requirements requested for zone='%s', alerts=%s", request.zone, request.alerts)

    try:
        data = get_requirements(zone=request.zone, alerts=request.alerts)
        return RequirementsResponse(**data)

    except ValueError as val_err:
        logger.warning("Invalid zone requested: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_CLIMATE_ZONE",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error generating requirements for zone '%s'", request.zone)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="INTERNAL_ERROR",
                message="An unexpected server error occurred while retrieving shelter requirements.",
            ).model_dump(),
        ) from exc
