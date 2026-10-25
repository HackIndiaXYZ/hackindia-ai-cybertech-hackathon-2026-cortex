"""
Unit tests for the environmental analyzer and classification rules.
All tests are offline — no external API calls are made.
"""

import pytest

from app.analysis.environment_analyzer import analyze_environment
from app.analysis.rules import (
    COLD_TEMP_THRESHOLD,
    HIGH_HUMIDITY_THRESHOLD,
    HIGH_WIND_THRESHOLD,
    HOT_TEMP_THRESHOLD,
    LOW_HUMIDITY_THRESHOLD,
)


# ---------------------------------------------------------------------------
# Classification tests
# ---------------------------------------------------------------------------


class TestClassification:
    def test_cold_dry(self):
        result = analyze_environment(temperature=2.0, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Cold"

    def test_cold_humid(self):
        result = analyze_environment(temperature=5.0, humidity=80, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Cold-Humid"

    def test_moderate(self):
        result = analyze_environment(temperature=20.0, humidity=50, wind_speed=10.0, rainfall=0.0)
        assert result.classification == "Moderate"

    def test_hot_dry(self):
        result = analyze_environment(temperature=38.0, humidity=15, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Hot-Dry"

    def test_hot_humid(self):
        result = analyze_environment(temperature=35.0, humidity=85, wind_speed=5.0, rainfall=0.5)
        assert result.classification == "Hot-Humid"

    def test_hot_moderate_humidity_is_hot_dry(self):
        # Temperatures ≥ HOT_TEMP_THRESHOLD with moderate humidity → Hot-Dry
        result = analyze_environment(temperature=32.0, humidity=45, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Hot-Dry"

    def test_insufficient_data_no_temp(self):
        result = analyze_environment(temperature=None, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Insufficient Data"

    def test_insufficient_data_no_humidity(self):
        result = analyze_environment(temperature=20.0, humidity=None, wind_speed=5.0, rainfall=0.0)
        assert result.classification == "Insufficient Data"

    def test_insufficient_data_both_none(self):
        result = analyze_environment(temperature=None, humidity=None, wind_speed=None, rainfall=None)
        assert result.classification == "Insufficient Data"


# ---------------------------------------------------------------------------
# Condition detection tests
# ---------------------------------------------------------------------------


class TestConditions:
    def test_low_temperature_condition(self):
        result = analyze_environment(temperature=5.0, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert "Low temperature" in result.conditions

    def test_high_temperature_condition(self):
        result = analyze_environment(temperature=35.0, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert "High temperature" in result.conditions

    def test_high_humidity_condition(self):
        result = analyze_environment(temperature=20.0, humidity=75, wind_speed=5.0, rainfall=0.0)
        assert "High humidity" in result.conditions

    def test_low_humidity_condition(self):
        result = analyze_environment(temperature=20.0, humidity=25, wind_speed=5.0, rainfall=0.0)
        assert "Low humidity" in result.conditions

    def test_high_wind_condition(self):
        result = analyze_environment(temperature=20.0, humidity=50, wind_speed=50.0, rainfall=0.0)
        assert "High wind speed" in result.conditions

    def test_heavy_rainfall_condition(self):
        result = analyze_environment(temperature=20.0, humidity=50, wind_speed=5.0, rainfall=10.0)
        assert "Heavy rainfall" in result.conditions

    def test_no_conditions_normal_weather(self):
        result = analyze_environment(temperature=20.0, humidity=50, wind_speed=10.0, rainfall=0.0)
        assert result.conditions == []

    def test_multiple_conditions(self):
        result = analyze_environment(temperature=5.0, humidity=75, wind_speed=50.0, rainfall=0.0)
        assert "Low temperature" in result.conditions
        assert "High humidity" in result.conditions
        assert "High wind speed" in result.conditions


# ---------------------------------------------------------------------------
# Summary tests
# ---------------------------------------------------------------------------


class TestSummary:
    def test_summary_not_empty_when_data_available(self):
        result = analyze_environment(temperature=5.0, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert result.summary != ""

    def test_summary_mentions_classification(self):
        result = analyze_environment(temperature=5.0, humidity=50, wind_speed=5.0, rainfall=0.0)
        assert "Cold" in result.summary

    def test_insufficient_data_summary(self):
        result = analyze_environment(temperature=None, humidity=None, wind_speed=None, rainfall=None)
        assert "Insufficient" in result.summary
