"""
Report generation route — POST /api/report

Accepts latitude, longitude, optional MCDM criteria weights, and optional plot dimensions,
gathers environmental observations, bioclimatic zone classification, thermal risk profiles,
passive shelter requirements, and top ranked designs, and returns a publication-ready
architectural assessment PDF.
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Response, status

from app.schemas.analysis_schema import ErrorDetail
from app.schemas.report_schema import ReportRequest
from app.services.report_service import generate_report_pdf

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/report",
    summary="Generate architectural assessment PDF report",
    description=(
        "Collects current weather observations, GloFAS flood risk, reverse-geocoded location data, "
        "historical climate records, 5-zone bioclimatic classification, rule-based thermal risk, "
        "passive shelter design requirements, and top 3 MCDM ranked envelope designs. "
        "Returns a formatted binary PDF document (application/pdf)."
    ),
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "Bioclimatic assessment PDF report generated successfully.",
        },
        422: {"description": "Validation error — coordinates or weights out of valid range."},
        500: {"description": "Internal server processing failure."},
    },
)
async def post_report(request: ReportRequest) -> Response:
    """
    POST /api/report endpoint handler.
    """
    lat, lon = request.latitude, request.longitude
    logger.info("PDF report requested for (%.4f, %.4f)", lat, lon)

    # Convert plot_size if provided
    plot_dict: Dict[str, Any] = {}
    if request.plot_size:
        if hasattr(request.plot_size, "get_width"):
            plot_dict = {
                "width": request.plot_size.get_width(),
                "length": request.plot_size.get_length(),
            }
        elif isinstance(request.plot_size, dict):
            plot_dict = request.plot_size

    try:
        pdf_bytes = await generate_report_pdf(
            latitude=lat,
            longitude=lon,
            weights=request.weights,
            plot_size=plot_dict,
        )

        filename = f"ecoshelter_report_{lat:.2f}_{lon:.2f}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    except ValueError as val_err:
        logger.warning("Validation error in report generation: %s", val_err)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=ErrorDetail(
                code="INVALID_REPORT_PARAMETERS",
                message=str(val_err),
            ).model_dump(),
        ) from val_err

    except Exception as exc:
        logger.exception("Unexpected error generating PDF report for (%.4f, %.4f)", lat, lon)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=ErrorDetail(
                code="REPORT_GENERATION_FAILED",
                message="An unexpected server error occurred while compiling the PDF report.",
            ).model_dump(),
        ) from exc
