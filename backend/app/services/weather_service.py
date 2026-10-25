"""
Weather service — fetches current conditions from the Open-Meteo Weather API.
"""

import asyncio
import logging
from typing import Optional

import httpx

from app.core.config import settings
from app.schemas.analysis_schema import WeatherInfo

logger = logging.getLogger(__name__)

# Open-Meteo variable names we request
_WEATHER_VARIABLES = (
    "temperature_2m,"
    "relative_humidity_2m,"
    "wind_speed_10m,"
    "precipitation,"
    "cloud_cover"
)


def _extract_current(data: dict, key: str):
    """Safely extract the first hourly value for a given key."""
    try:
        values = data["hourly"][key]
        # Return the first non-None value from the hourly list
        for v in values:
            if v is not None:
                return v
    except (KeyError, IndexError, TypeError):
        pass
    return None


async def get_weather(latitude: float, longitude: float) -> WeatherInfo:
    """
    Fetch current weather for (latitude, longitude) from Open-Meteo.

    Returns a WeatherInfo with None fields where data is unavailable.
    Never raises — returns all-None WeatherInfo on any failure.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": _WEATHER_VARIABLES,
        "hourly": _WEATHER_VARIABLES,
        "forecast_days": 1,
        "timezone": "auto",
    }

    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
                response = await client.get(settings.OPEN_METEO_WEATHER_URL, params=params)
                response.raise_for_status()
                data = response.json()

            current_data = data.get("current", {})
            temperature = current_data.get("temperature_2m") if "temperature_2m" in current_data else _extract_current(data, "temperature_2m")
            humidity_raw = current_data.get("relative_humidity_2m") if "relative_humidity_2m" in current_data else _extract_current(data, "relative_humidity_2m")
            wind_speed = current_data.get("wind_speed_10m") if "wind_speed_10m" in current_data else _extract_current(data, "wind_speed_10m")
            rainfall = current_data.get("precipitation") if "precipitation" in current_data else _extract_current(data, "precipitation")
            cloud_cover_raw = current_data.get("cloud_cover") if "cloud_cover" in current_data else _extract_current(data, "cloud_cover")

            humidity = int(humidity_raw) if humidity_raw is not None else None
            cloud_cover = int(cloud_cover_raw) if cloud_cover_raw is not None else None

            logger.info(
                "Weather fetched: temp=%.1f°C hum=%s%% wind=%.1f km/h",
                temperature or 0,
                humidity,
                wind_speed or 0,
            )
            return WeatherInfo(
                temperature=temperature,
                humidity=humidity,
                wind_speed=wind_speed,
                rainfall=rainfall,
                cloud_cover=cloud_cover,
            )

        except httpx.TimeoutException:
            if attempt == 0:
                logger.warning("Weather API request timed out for (%.4f, %.4f), retrying once...", latitude, longitude)
                await asyncio.sleep(0.5)
                continue
            logger.error("Weather API request timed out for (%.4f, %.4f)", latitude, longitude)
        except httpx.HTTPStatusError as exc:
            logger.error("Weather API HTTP error %s: %s", exc.response.status_code, exc.response.text)
            break
        except httpx.RequestError as exc:
            if attempt == 0:
                logger.warning("Weather API connection error (%s), retrying once...", exc)
                await asyncio.sleep(0.5)
                continue
            logger.error("Weather API connection error: %s", exc)
        except Exception as exc:  # noqa: BLE001
            logger.error("Unexpected error fetching weather data: %s", exc)
            break

    return WeatherInfo(
        temperature=None,
        humidity=None,
        wind_speed=None,
        rainfall=None,
        cloud_cover=None,
    )
