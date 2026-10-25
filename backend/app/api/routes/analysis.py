"""
Analysis route — POST /api/analyze

Orchestrates weather, flood, and geocoding services then returns
a unified AnalysisResponse.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, status

from app.analysis.environment_analyzer import analyze_environment
from app.schemas.analysis_schema import (
    AnalysisResponse,
    ErrorDetail,
    LocationRequest,
)
from app.services import flood_service, geocoding_service, weather_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Analyze environmental conditions",
    description=(
        "Accepts a latitude/longitude pair and returns weather observations, "
        "an application-level flood-risk estimate, reverse-geocoded location "
        "information, and an environmental classification."
    ),
    responses={
        422: {"description": "Validation error — invalid coordinates."},
        500: {"description": "Internal server error."},
    },
)
async def analyze(request: LocationRequest) -> AnalysisResponse:
    """
    Main analysis endpoint.

    Calls weather, flood, and geocoding services concurrently then passes
    the weather data through the environment analyzer.
    """
    lat, lon = request.latitude, request.longitude
    logger.info("Analysis requested for (%.4f, %.4f)", lat, lon)

    try:
        weather, flood, location = await asyncio.gather(
            weather_service.get_weather(lat, lon),
            flood_service.get_flood(lat, lon),
            geocoding_service.get_location(lat, lon),
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Unexpected error during parallel service calls: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="INTERNAL_ERROR",
                message="An unexpected error occurred while fetching environmental data.",
            ).model_dump(),
        ) from exc

    analysis = analyze_environment(
        temperature=weather.temperature,
        humidity=float(weather.humidity) if weather.humidity is not None else None,
        wind_speed=weather.wind_speed,
        rainfall=weather.rainfall,
    )

    logger.info(
        "Analysis complete for (%.4f, %.4f): classification=%s, flood_risk=%s",
        lat,
        lon,
        analysis.classification,
        flood.risk,
    )

    return AnalysisResponse(
        location=location,
        weather=weather,
        flood=flood,
        analysis=analysis,
    )
