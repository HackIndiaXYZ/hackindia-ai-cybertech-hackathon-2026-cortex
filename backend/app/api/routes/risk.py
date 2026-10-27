"""
Thermal Risk Assessment route — POST /api/risk

Accepts latitude and longitude coordinates, fetches multi-year historical
climate records via climate_service, evaluates rule-based heat and cold stress
profiles, and returns structured risk indicators matching frontend ZoneRiskData.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.analysis.risk import assess_risk
from app.schemas.analysis_schema import ErrorDetail
from app.schemas.risk_schema import RiskRequest, RiskResponse
from app.services.climate_service import ClimateServiceError, get_climate_summary

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/risk",
    response_model=RiskResponse,
    summary="Assess thermal risk (heat & cold stress)",
    description=(
        "Retrieves multi-year historical climate data for the given coordinates, "
        "evaluates heat stress and cold stress using IMD-aligned rule-based criteria, "
        "and returns normalized risk scores (0-100), levels, and architectural explanations."
    ),
    responses={
        200: {"description": "Thermal risk assessment completed successfully."},
        422: {"description": "Validation error — coordinates out of valid range."},
        502: {"description": "Upstream historical climate data unavailable."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_risk(request: RiskRequest) -> RiskResponse:
    """
    POST /api/risk endpoint handler.
    """
    lat, lon = request.latitude, request.longitude
    logger.info("Thermal risk assessment requested for (%.4f, %.4f)", lat, lon)

    try:
        # 1. Fetch multi-year climate history
        climate_summary = await get_climate_summary(lat=lat, lon=lon, years=5)

        # 2. Assess rule-based thermal risk
        result = assess_risk(climate_summary)

        return RiskResponse(
            heat=result["heat"],
            cold=result["cold"],
            zone=result["zone"],
            confidence=result["confidence"],
            heatStress=result["heatStress"],
            coldStress=result["coldStress"],
            whyNumbers=result["whyNumbers"],
            explanation=result["explanation"],
            ruleBasedZone=result["ruleBasedZone"],
            mlZone=result["mlZone"],
            latitude=lat,
            longitude=lon,
            source=result.get("source", "IMD Heat Wave & Cold Wave Criteria"),
            verified=result.get("verified", False),
        )

    except ClimateServiceError as srv_err:
        logger.error("Climate service unavailable for (%.4f, %.4f): %s", lat, lon, srv_err)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(
                code="CLIMATE_DATA_UNAVAILABLE",
                message=f"Could not retrieve historical climate records: {srv_err}",
            ).model_dump(),
        ) from srv_err

    except ValueError as val_err:
        logger.warning("Validation error assessing risk for (%.4f, %.4f): %s", lat, lon, val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_DATA",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error assessing thermal risk for (%.4f, %.4f)", lat, lon)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="RISK_ANALYSIS_FAILED",
                message="An unexpected error occurred during thermal risk assessment.",
            ).model_dump(),
        ) from exc
