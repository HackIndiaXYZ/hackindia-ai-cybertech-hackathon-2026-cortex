"""
Zone classification route — POST /api/zone

Accepts latitude and longitude coordinates, fetches historical multi-year
climate data via climate_service, and classifies the location into one of
the 5 bioclimatic zones.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.analysis.zone_classifier import classify_zone
from app.schemas.analysis_schema import ErrorDetail
from app.schemas.zone_schema import ZoneDiagnosticValues, ZoneRequest, ZoneResponse
from app.services.climate_service import ClimateServiceError, get_climate_summary

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/zone",
    response_model=ZoneResponse,
    summary="Classify location into 5 bioclimatic zones",
    description=(
        "Retrieves multi-year historical climate records for the provided coordinates, "
        "evaluates 5-zone thresholds (COLD, COMPOSITE, HOT_DRY, WARM_HUMID, TEMPERATE), "
        "and returns the assigned zone along with a human-readable reason."
    ),
    responses={
        200: {"description": "Zone classified successfully."},
        422: {"description": "Validation error — coordinates out of range."},
        502: {"description": "Climate data source unavailable."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_zone(request: ZoneRequest) -> ZoneResponse:
    """
    POST /api/zone endpoint handler.
    """
    lat, lon = request.latitude, request.longitude
    logger.info("Zone classification requested for (%.4f, %.4f)", lat, lon)

    try:
        # 1. Fetch multi-year climate summary
        climate_summary = await get_climate_summary(lat=lat, lon=lon, years=5)

        # 2. Run sequential 5-zone classifier
        result = classify_zone(climate_summary)

        return ZoneResponse(
            zone=result["zone"],
            reason=result["reason"],
            values=ZoneDiagnosticValues(**result["values"]),
            matched_rule=result["matched_rule"],
            latitude=lat,
            longitude=lon,
            source="Simplified starting values to be calibrated",
            verified=False,
        )

    except ClimateServiceError as exc:
        logger.error("Climate service failed during zone classification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(
                code="CLIMATE_DATA_UNAVAILABLE",
                message=str(exc),
            ).model_dump(),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error in /api/zone for (%.4f, %.4f)", lat, lon)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="INTERNAL_ERROR",
                message="An unexpected server error occurred during zone classification.",
            ).model_dump(),
        ) from exc
