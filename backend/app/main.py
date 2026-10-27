"""
FastAPI application entry point.

Configures:
- CORS middleware
- API router
- Logging
- Health-check endpoint
"""

import logging
import logging.config

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.analysis import router as analysis_router
from app.api.routes.climate import router as climate_router
from app.api.routes.design import router as design_router
from app.api.routes.requirements import router as requirements_router
from app.api.routes.risk import router as risk_router
from app.api.routes.zone import router as zone_router
from app.core.config import settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(analysis_router, prefix="/api", tags=["Analysis"])
app.include_router(climate_router, prefix="/api", tags=["Climate"])
app.include_router(zone_router, prefix="/api", tags=["Zone"])
app.include_router(requirements_router, prefix="/api", tags=["Requirements"])
app.include_router(risk_router, prefix="/api", tags=["Thermal Risk"])
app.include_router(design_router, prefix="/api", tags=["Design Ranking"])


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Health"], summary="Health check")
async def health() -> dict:
    """Returns 200 OK when the service is running."""
    return {"status": "ok"}
