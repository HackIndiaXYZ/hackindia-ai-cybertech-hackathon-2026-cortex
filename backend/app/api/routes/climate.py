"""
Climate history route — GET /api/climate

Accepts latitude, longitude, and optional years count, then retrieves
and computes multi-year historical climate averages and derived metrics.
"""

import logging
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.analysis_schema import ErrorDetail
from app.schemas.climate_schema import ClimateResponse
from app.services.climate_service import ClimateServiceError, get_climate_summary

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/climate",
    response_model=ClimateResponse,
    summary="Get multi-year historical climate summary",
    description=(
        "Retrieves multi-year historical climate records from the Open-Meteo archive, "
        "cleans data with pandas, performs linear interpolation on gaps up to 3 days, "
        "and produces 12-month aggregated bioclimatic indicators."
    ),
    responses={
        200: {"description": "Historical climate summary calculated successfully."},
        422: {"description": "Coordinate or parameter validation failure."},
        502: {"description": "Upstream historical climate data service failure."},
        500: {"description": "Internal server processing failure."},
    },
)
async def get_climate(
    lat: float = Query(
        ...,
        ge=-90.0,
        le=90.0,
        description="Latitude in decimal degrees (-90.0 to 90.0).",
        examples=[26.45],
    ),
    lon: float = Query(
        ...,
        ge=-180.0,
        le=180.0,
        description="Longitude in decimal degrees (-180.0 to 180.0).",
        examples=[80.33],
    ),
    years: int = Query(
        5,
        ge=1,
        le=10,
        description="Number of full past calendar years to evaluate (1 to 10).",
        examples=[5],
    ),
) -> ClimateResponse:
    """
    Climate history endpoint handler.
    Validates lat/lon/years, delegates to climate_service, and returns structured climate metrics.
    """
    logger.info("Climate history query received: lat=%.4f, lon=%.4f, years=%d", lat, lon, years)

    try:
        response = await get_climate_summary(lat=lat, lon=lon, years=years)
        return response

    except ClimateServiceError as exc:
        logger.error("Climate service failed for (%.4f, %.4f): %s", lat, lon, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(
                code="CLIMATE_DATA_UNAVAILABLE",
                message=str(exc),
            ).model_dump(),
        ) from exc

    except Exception as exc:
        logger.exception("Unexpected error in /api/climate for (%.4f, %.4f)", lat, lon)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="INTERNAL_ERROR",
                message="An unexpected server error occurred while processing climate history.",
            ).model_dump(),
        ) from exc
