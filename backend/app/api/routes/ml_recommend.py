"""
ML Vernacular Recommender Route — POST /api/recommend/ml

Accepts site coordinates or explicit microclimatic variables and serves predictions
from the trained Multi-Output Random Forest Regressor.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from app.schemas.analysis_schema import ErrorDetail
from app.schemas.ml_recommender_schema import (
    MLRecommendRequest,
    MLRecommendResponse,
)
from app.services.ml_recommender_service import predict_recommended_designs

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/recommend/ml",
    response_model=MLRecommendResponse,
    summary="Predict top recommended vernacular shelter designs using ML",
    description=(
        "Uses a trained multi-output Random Forest regressor to predict continuous suitability "
        "scores (0-100) and ranking for 7 vernacular shelter typologies based on 8 microclimatic "
        "indicators (temperatures, diurnal range, humidity, rainfall, wind, solar radiation). "
        "Includes ensemble tree-consensus confidence metrics and architectural explanations."
    ),
    responses={
        200: {"description": "ML recommendations predicted successfully."},
        422: {"description": "Validation error — coordinates or climate parameters out of range."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_ml_recommend(request: MLRecommendRequest) -> MLRecommendResponse:
    """
    POST /api/recommend/ml endpoint handler.
    """
    lat = request.latitude
    lon = request.longitude
    logger.info("ML design recommendation requested for coords=(%s, %s), top_n=%d", lat, lon, request.top_n)

    try:
        response = await predict_recommended_designs(request)
        return response

    except ValueError as val_err:
        logger.warning("Validation error in ML recommendation: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_ML_PARAMETERS",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error in /api/recommend/ml")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="ML_RECOMMENDATION_FAILED",
                message="An unexpected server error occurred during ML design recommendation.",
            ).model_dump(),
        ) from exc
