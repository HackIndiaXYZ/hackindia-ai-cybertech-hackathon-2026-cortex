"""
Application configuration loaded from environment variables.
"""

import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Application
    APP_TITLE: str = "EcoShelter Environment Analyzer"
    APP_DESCRIPTION: str = (
        "Backend API that analyzes environmental conditions for a given location, "
        "including weather, flood risk, and classification."
    )
    APP_VERSION: str = "1.0.0"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://localhost:8080,http://localhost:5500,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:8080,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000,null",
        ).split(",")
        if origin.strip()
    ]

    # HTTP Client
    HTTP_TIMEOUT: float = float(os.getenv("HTTP_TIMEOUT", "10.0"))

    # External API base URLs (overridable for testing)
    OPEN_METEO_WEATHER_URL: str = os.getenv(
        "OPEN_METEO_WEATHER_URL", "https://api.open-meteo.com/v1/forecast"
    )
    OPEN_METEO_FLOOD_URL: str = os.getenv(
        "OPEN_METEO_FLOOD_URL", "https://flood-api.open-meteo.com/v1/flood"
    )
    NOMINATIM_URL: str = os.getenv(
        "NOMINATIM_URL", "https://nominatim.openstreetmap.org/reverse"
    )
    NOMINATIM_USER_AGENT: str = os.getenv(
        "NOMINATIM_USER_AGENT", "EcoShelterAnalyzer/1.0"
    )


settings = Settings()
