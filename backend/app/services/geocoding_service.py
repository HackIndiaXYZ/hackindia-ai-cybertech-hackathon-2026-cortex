"""
Geocoding service — reverse-geocodes (latitude, longitude) using the
OpenStreetMap Nominatim API to retrieve a human-readable location name.
"""

import asyncio
import logging
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.analysis_schema import LocationInfo

logger = logging.getLogger(__name__)


async def get_location(latitude: float, longitude: float) -> LocationInfo:
    """
    Reverse-geocode (latitude, longitude) using Nominatim.

    Returns a LocationInfo with name=None and country=None when the service
    is unreachable or returns unexpected data.  Never raises.
    """
    params = {
        "lat": latitude,
        "lon": longitude,
        "format": "json",
        "zoom": 10,
        "addressdetails": 1,
    }
    headers = {"User-Agent": settings.NOMINATIM_USER_AGENT}

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
                response = await client.get(
                    settings.NOMINATIM_URL, params=params, headers=headers
                )
                response.raise_for_status()
                data = response.json()

            address = data.get("address", {})

            # Build a human-readable name: prefer city, then town, then village,
            # then county, then state.
            name: Optional[str] = (
                address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("county")
                or address.get("state")
                or data.get("display_name", "").split(",")[0].strip()
                or None
            )
            country: Optional[str] = address.get("country") or None

            logger.info("Geocoding resolved: name=%s, country=%s", name, country)

            return LocationInfo(
                latitude=latitude,
                longitude=longitude,
                name=name,
                country=country,
            )

        except httpx.TimeoutException:
            if attempt == 0:
                logger.warning("Nominatim request timed out for (%.4f, %.4f), retrying once...", latitude, longitude)
                await asyncio.sleep(0.5)
                continue
            logger.error("Nominatim request timed out for (%.4f, %.4f)", latitude, longitude)
        except httpx.HTTPStatusError as exc:
            logger.error("Nominatim HTTP error %s: %s", exc.response.status_code, exc.response.text)
            break
        except httpx.RequestError as exc:
            if attempt == 0:
                logger.warning("Nominatim connection error (%s), retrying once...", exc)
                await asyncio.sleep(0.5)
                continue
            logger.error("Nominatim connection error: %s", exc)
        except Exception as exc:  # noqa: BLE001
            logger.error("Unexpected error during geocoding: %s", exc)
            break

    return LocationInfo(latitude=latitude, longitude=longitude, name=None, country=None)
