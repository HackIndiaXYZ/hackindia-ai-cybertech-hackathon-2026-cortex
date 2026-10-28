"""
designs.py
----------
ML Vernacular Design Recommendation route — POST /api/designs/recommend.

Accepts site coordinates and optional criteria weights, retrieves 5-year climate history
metrics from the climate service and reverse-geocoded location info, applies the trained
ML surrogate model to score all 25 catalogue designs across comfort, cost, safety, and
sustainability, and returns the top-ranked designs with factual bioclimatic rationale.
"""

import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, status

from app.analysis.design_ml import is_model_loaded, recommend_designs
from app.schemas.analysis_schema import ErrorDetail, LocationInfo
from app.schemas.climate_schema import ClimateResponse
from app.schemas.design_schema import (
    MLDesignRecommendRequest,
    MLDesignRecommendResponse,
    MLModelInfo,
    MLRecommendedDesign,
    MLRecommendedDesignScores,
)
from app.services.climate_service import ClimateServiceError, get_climate_summary
from app.services.geocoding_service import get_location

router = APIRouter()
logger = logging.getLogger(__name__)


def extract_climate_features(climate_resp: ClimateResponse, latitude: float) -> Dict[str, float]:
    """
    Extracts the 10 fixed climate features from a 5-year ClimateResponse summary.
    """
    derived = climate_resp.derived_metrics
    monthly = climate_resp.monthly_summary

    # Safe indexing for hottest and coldest months
    h_idx = max(0, min(11, derived.hottest_month - 1))
    c_idx = max(0, min(11, derived.coldest_month - 1))

    h_month = monthly[h_idx]
    c_month = monthly[c_idx]

    # Calculate annual averages across valid months
    valid_winds = [m.avg_wind_speed for m in monthly if m.avg_wind_speed is not None]
    valid_solars = [m.avg_solar_radiation for m in monthly if m.avg_solar_radiation is not None]

    wind_mean = float(sum(valid_winds) / len(valid_winds)) if valid_winds else 15.0
    solar_mean = float(sum(valid_solars) / len(valid_solars)) if valid_solars else 20.0

    return {
        "latitude": round(float(latitude), 4),
        "hottest_month_max": round(float(h_month.avg_temp_max if h_month.avg_temp_max is not None else 35.0), 1),
        "coldest_month_min": round(float(c_month.avg_temp_min if c_month.avg_temp_min is not None else 10.0), 1),
        "coldest_month_mean": round(float(c_month.avg_temp_mean if c_month.avg_temp_mean is not None else 16.0), 1),
        "hot_season_humidity": round(float(h_month.avg_humidity if h_month.avg_humidity is not None else 50.0), 1),
        "annual_rain": round(float(derived.annual_rain), 1),
        "wind_mean": round(wind_mean, 1),
        "solar_mean": round(solar_mean, 2),
        "days_above_40": round(float(derived.days_above_40), 1),
        "days_below_5": round(float(derived.days_below_5), 1),
    }


@router.post(
    "/designs/recommend",
    response_model=MLDesignRecommendResponse,
    summary="Recommend top vernacular shelter designs using ML surrogate model",
    description=(
        "Retrieves multi-year bioclimatic records from Open-Meteo and reverse-geocoded location "
        "info, uses the trained ML surrogate model (RandomForestRegressor) to predict continuous "
        "comfort, cost, safety, and sustainability scores across all 25 catalogue archetypes, "
        "and returns the top N ranked designs with factual bioclimatic explanations."
    ),
    responses={
        200: {"description": "ML recommendations generated successfully."},
        422: {"description": "Validation error — coordinates out of range or invalid parameters."},
        502: {"description": "Upstream climate or location service failure."},
        503: {"description": "ML surrogate model is not available in memory."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_designs_recommend(body: MLDesignRecommendRequest) -> MLDesignRecommendResponse:
    """
    POST /api/designs/recommend endpoint handler.
    """
    logger.info(
        "ML design recommendation requested for coords=(%.4f, %.4f), top_n=%d",
        body.latitude,
        body.longitude,
        body.top_n,
    )

    # 1. Check if model is loaded (Rule: return 503 if missing, no rule-based fallback)
    if not is_model_loaded():
        logger.error("ML model not loaded; returning HTTP 503")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ErrorDetail(
                code="MODEL_NOT_AVAILABLE",
                message="Design recommendation ML model is not available. Please ensure design_model_v1.joblib is deployed.",
            ).model_dump(),
        )

    # 2. Retrieve location info
    location_info = await get_location(latitude=body.latitude, longitude=body.longitude)

    # 3. Retrieve historical climate summary
    try:
        climate_resp = await get_climate_summary(lat=body.latitude, lon=body.longitude, years=5)
    except ClimateServiceError as exc:
        logger.error("Climate service failed for (%.4f, %.4f): %s", body.latitude, body.longitude, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=ErrorDetail(
                code="CLIMATE_DATA_UNAVAILABLE",
                message=f"Historical climate data service unavailable: {exc}",
            ).model_dump(),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error retrieving climate data for (%.4f, %.4f)", body.latitude, body.longitude)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="INTERNAL_ERROR",
                message="Unexpected failure while fetching climate records.",
            ).model_dump(),
        ) from exc

    # 4. Extract climate features
    features = extract_climate_features(climate_resp, body.latitude)

    # 5. Extract weights if provided
    weights_dict: Optional[Dict[str, float]] = None
    if body.weights:
        weights_dict = body.weights.model_dump()

    # 6. Generate ML recommendations
    try:
        rec_result = recommend_designs(features=features, weights=weights_dict, top_n=body.top_n)
    except ValueError as val_err:
        logger.warning("Validation error in recommendation: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_RECOMMENDATION_PARAMETERS",
                message=str(val_err),
            ).model_dump(),
        ) from val_err
    except Exception as exc:
        logger.exception("ML prediction failure for (%.4f, %.4f)", body.latitude, body.longitude)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="PREDICTION_FAILED",
                message="Unexpected failure during design score prediction.",
            ).model_dump(),
        ) from exc

    # 7. Build structured response
    rec_designs: list = []
    for d_item in rec_result["designs"]:
        rec_designs.append(
            MLRecommendedDesign(
                id=d_item["id"],
                name=d_item["name"],
                plan_archetype=d_item["plan_archetype"],
                scores=MLRecommendedDesignScores(**d_item["scores"]),
                total=d_item["total"],
                reasons=d_item["reasons"],
                rank=d_item["rank"],
            )
        )

    return MLDesignRecommendResponse(
        location=location_info,
        features_used=rec_result["features_used"],
        designs=rec_designs,
        weights_used=rec_result["weights_used"],
        model_info=MLModelInfo(**rec_result["model_info"]),
    )
