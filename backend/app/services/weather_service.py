"""
Weather service — fetches current conditions and 7-day forecast from the
Open-Meteo Weather API.
"""

import asyncio
import logging
from typing import List, Optional

import httpx

from app.core.config import settings
from app.schemas.analysis_schema import (
    DailyForecastItem,
    HourlyForecastItem,
    WeatherInfo,
)

logger = logging.getLogger(__name__)

# Open-Meteo current-conditions variables
_CURRENT_VARIABLES = (
    "temperature_2m,"
    "relative_humidity_2m,"
    "wind_speed_10m,"
    "precipitation,"
    "cloud_cover"
)

# Daily forecast variables (7 days)
_DAILY_VARIABLES = (
    "temperature_2m_max,"
    "temperature_2m_min,"
    "weather_code,"
    "precipitation_probability_max"
)

# Hourly variable for next-24h chart
_HOURLY_CHART_VARIABLE = "temperature_2m"


def _extract_current(data: dict, key: str):
    """Safely extract the first hourly value for a given key."""
    try:
        values = data["hourly"][key]
        for v in values:
            if v is not None:
                return v
    except (KeyError, IndexError, TypeError):
        pass
    return None


def _parse_daily(data: dict) -> Optional[List[DailyForecastItem]]:
    """
    Parse Open-Meteo daily forecast block into a list of DailyForecastItem.
    Returns None if the block is missing or malformed.
    """
    try:
        daily = data["daily"]
        dates: List[str] = daily["time"]
        max_temps: List[Optional[float]] = daily["temperature_2m_max"]
        min_temps: List[Optional[float]] = daily["temperature_2m_min"]
        codes: List[Optional[int]] = daily["weather_code"]
        rain_probs: List[Optional[int]] = daily["precipitation_probability_max"]

        items: List[DailyForecastItem] = []
        for i, date in enumerate(dates):
            items.append(
                DailyForecastItem(
                    date=date,
                    temp_max=max_temps[i] if i < len(max_temps) else None,
                    temp_min=min_temps[i] if i < len(min_temps) else None,
                    weather_code=codes[i] if i < len(codes) else None,
                    rain_probability=rain_probs[i] if i < len(rain_probs) else None,
                )
            )
        return items if items else None
    except (KeyError, TypeError, IndexError) as exc:
        logger.warning("Failed to parse daily forecast: %s", exc)
        return None


def _parse_hourly(data: dict) -> Optional[List[HourlyForecastItem]]:
    """
    Parse the first 24 hourly temperature values from Open-Meteo hourly block
    (the block that was requested for the chart, not the current-conditions
    hourly block).
    Returns None if the block is missing or malformed.
    """
    try:
        # The hourly block used for current conditions also has temperature_2m;
        # Open-Meteo returns hourly data for all forecast_days so we slice [0:24].
        times: List[str] = data["hourly"]["time"]
        temps: List[Optional[float]] = data["hourly"]["temperature_2m"]

        items: List[HourlyForecastItem] = []
        for i in range(min(24, len(times))):
            if temps[i] is not None:
                items.append(HourlyForecastItem(time=times[i], temperature=temps[i]))
        return items if items else None
    except (KeyError, TypeError, IndexError) as exc:
        logger.warning("Failed to parse hourly forecast: %s", exc)
        return None


async def get_weather(latitude: float, longitude: float) -> WeatherInfo:
    """
    Fetch current weather and 7-day forecast for (latitude, longitude) from
    Open-Meteo.

    Returns a WeatherInfo with None fields where data is unavailable.
    Never raises — returns all-None WeatherInfo on any failure.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": _CURRENT_VARIABLES,
        "hourly": _HOURLY_CHART_VARIABLE,
        "daily": _DAILY_VARIABLES,
        "forecast_days": 7,
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

            # Parse forecast — isolated so failures don't break current conditions
            daily_forecast = _parse_daily(data)
            hourly_forecast = _parse_hourly(data)

            logger.info(
                "Weather fetched: temp=%.1f\u00b0C hum=%s%% wind=%.1f km/h daily=%d hourly=%d",
                temperature or 0,
                humidity,
                wind_speed or 0,
                len(daily_forecast) if daily_forecast else 0,
                len(hourly_forecast) if hourly_forecast else 0,
            )
            return WeatherInfo(
                temperature=temperature,
                humidity=humidity,
                wind_speed=wind_speed,
                rainfall=rainfall,
                cloud_cover=cloud_cover,
                daily_forecast=daily_forecast,
                hourly_forecast=hourly_forecast,
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
        daily_forecast=None,
        hourly_forecast=None,
    )
