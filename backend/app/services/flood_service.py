"""
Flood service — fetches river discharge data from the Open-Meteo GloFAS Flood API
and converts it into an application-level risk estimate.

Flood risk labels (Low / Moderate / High) are application-level estimates
based on modelled river-discharge data.  They are NOT authoritative flood
warnings.  The application clearly distinguishes modelled data from ground truth.
"""

import asyncio
import json
import logging
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.analysis_schema import FloodInfo

logger = logging.getLogger(__name__)

# GloFAS flood variable
_FLOOD_VARIABLE = "river_discharge"

# Thresholds (m³/s) used to derive an application-level risk label.
# These are simple heuristics, not official warning levels.
_MODERATE_DISCHARGE_THRESHOLD: float = 100.0
_HIGH_DISCHARGE_THRESHOLD: float = 500.0


def _assess_risk(discharge: Optional[float]) -> str:
    if discharge is None:
        return "Insufficient Data"
    if discharge >= _HIGH_DISCHARGE_THRESHOLD:
        return "High"
    if discharge >= _MODERATE_DISCHARGE_THRESHOLD:
        return "Moderate"
    return "Low"


async def get_flood(latitude: float, longitude: float) -> FloodInfo:
    """
    Fetch river discharge for (latitude, longitude) from the GloFAS Flood API
    and return an application-level FloodInfo.

    Returns FloodInfo with risk='Insufficient Data' on any failure.
    Never raises.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": _FLOOD_VARIABLE,
        "forecast_days": 1,
    }

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
                response = await client.get(settings.OPEN_METEO_FLOOD_URL, params=params)
                response.raise_for_status()
                # GloFAS can return non-standard 'nan' when no river basin exists at the coordinates
                raw_text = response.text.replace(":nan", ":null")
                data = json.loads(raw_text)

            discharge_values = data.get("daily", {}).get(_FLOOD_VARIABLE, [])
            discharge: Optional[float] = None
            for v in discharge_values:
                if v is not None:
                    discharge = float(v)
                    break

            if discharge is None:
                logger.info("Flood data unavailable for (%.4f, %.4f) — no river basin data", latitude, longitude)
                return FloodInfo(risk="Insufficient Data", status="Unavailable")

            risk = _assess_risk(discharge)
            logger.info("Flood data fetched: discharge=%s m³/s → risk=%s", discharge, risk)

            return FloodInfo(risk=risk, status="Available")

        except httpx.TimeoutException:
            if attempt == 0:
                logger.warning("Flood API request timed out for (%.4f, %.4f), retrying once...", latitude, longitude)
                await asyncio.sleep(0.5)
                continue
            logger.error("Flood API request timed out for (%.4f, %.4f)", latitude, longitude)
        except httpx.HTTPStatusError as exc:
            logger.error("Flood API HTTP error %s: %s", exc.response.status_code, exc.response.text)
            break
        except httpx.RequestError as exc:
            if attempt == 0:
                logger.warning("Flood API connection error (%s), retrying once...", exc)
                await asyncio.sleep(0.5)
                continue
            logger.error("Flood API connection error: %s", exc)
        except Exception as exc:  # noqa: BLE001
            logger.error("Unexpected error fetching flood data: %s", exc)
            break

    return FloodInfo(risk="Insufficient Data", status="Unavailable")
