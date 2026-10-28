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

    # ---------------------------------------------------------------------------
    # Weather History Store (SQLite)
    # ---------------------------------------------------------------------------
    # Path to the SQLite database file. Relative paths are resolved from the
    # backend/ directory. Override with an absolute path in production.
    HISTORY_DB_PATH: str = os.getenv(
        "HISTORY_DB_PATH", "app/data/weather_history.db"
    )
    # Temperature validity bounds for row validation
    HISTORY_TEMP_MIN: float = float(os.getenv("HISTORY_TEMP_MIN", "-60.0"))
    HISTORY_TEMP_MAX: float = float(os.getenv("HISTORY_TEMP_MAX", "60.0"))
    # Timeout for archive API calls during backfill
    HISTORY_HTTP_TIMEOUT: float = float(os.getenv("HISTORY_HTTP_TIMEOUT", "30.0"))

    # ---------------------------------------------------------------------------
    # Backfill
    # ---------------------------------------------------------------------------
    OPEN_METEO_ARCHIVE_URL: str = os.getenv(
        "OPEN_METEO_ARCHIVE_URL", "https://archive-api.open-meteo.com/v1/archive"
    )
    BACKFILL_YEARS: int = int(os.getenv("BACKFILL_YEARS", "3"))

    # ---------------------------------------------------------------------------
    # AutoML Backup Forecaster (FLAML)
    # ---------------------------------------------------------------------------
    # Minimum number of history rows required before training
    AUTOML_MIN_TRAINING_ROWS: int = int(os.getenv("AUTOML_MIN_TRAINING_ROWS", "90"))
    # Number of days used for walk-forward backtest
    AUTOML_BACKTEST_DAYS: int = int(os.getenv("AUTOML_BACKTEST_DAYS", "90"))
    # FLAML training time budget in seconds per target per horizon
    AUTOML_FLAML_TIME_BUDGET: int = int(os.getenv("AUTOML_FLAML_TIME_BUDGET", "60"))
    # Number of versioned model directories to keep per location
    AUTOML_KEEP_VERSIONS: int = int(os.getenv("AUTOML_KEEP_VERSIONS", "3"))
    # Root directory for versioned model artifacts
    AUTOML_MODELS_DIR: str = os.getenv(
        "AUTOML_MODELS_DIR", "app/data/automl_models"
    )

    # ---------------------------------------------------------------------------
    # Background Scheduler
    # ---------------------------------------------------------------------------
    # Interval between daily data-append runs (seconds; default 24h)
    SCHEDULER_DAILY_INTERVAL_S: int = int(os.getenv("SCHEDULER_DAILY_INTERVAL_S", "86400"))
    # Interval between retrain checks (seconds; default 7 days)
    SCHEDULER_RETRAIN_INTERVAL_S: int = int(os.getenv("SCHEDULER_RETRAIN_INTERVAL_S", "604800"))
    # Minimum number of new rows needed to trigger a retrain
    SCHEDULER_RETRAIN_NEW_DATA_ROWS: int = int(os.getenv("SCHEDULER_RETRAIN_NEW_DATA_ROWS", "7"))


settings = Settings()

