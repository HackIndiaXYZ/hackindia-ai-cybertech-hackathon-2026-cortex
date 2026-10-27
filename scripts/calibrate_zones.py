"""
Climate Zone Threshold Calibration Script.

Evaluates 15 reference Indian cities (3 per zone) against the 5-zone
classifier using historical weather data from Open-Meteo.
Prints a diagnostic comparison table to facilitate threshold tuning.
"""

import asyncio
import os
import sys

# Ensure backend/ directory is on sys.path so app modules import cleanly
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.analysis.zone_classifier import classify_zone
from app.services.climate_service import get_climate_summary

# ---------------------------------------------------------------------------
# 15 Reference Indian Cities (3 per zone)
# NOTE: Expected zones are unverified benchmark labels based on NBC 2016 / ECBC
# ---------------------------------------------------------------------------
BENCHMARK_CITIES = [
    # COLD
    {"city": "Leh", "lat": 34.1526, "lon": 77.5771, "expected_zone": "COLD"},
    {"city": "Shimla", "lat": 31.1048, "lon": 77.1734, "expected_zone": "COLD"},
    {"city": "Srinagar", "lat": 34.0837, "lon": 74.7973, "expected_zone": "COLD"},

    # COMPOSITE
    {"city": "Delhi", "lat": 28.6139, "lon": 77.2090, "expected_zone": "COMPOSITE"},
    {"city": "Lucknow", "lat": 26.8467, "lon": 80.9462, "expected_zone": "COMPOSITE"},
    {"city": "Kanpur", "lat": 26.4499, "lon": 80.3319, "expected_zone": "COMPOSITE"},

    # HOT_DRY
    {"city": "Jodhpur", "lat": 26.2389, "lon": 73.0243, "expected_zone": "HOT_DRY"},
    {"city": "Jaisalmer", "lat": 26.9157, "lon": 70.9083, "expected_zone": "HOT_DRY"},
    {"city": "Bikaner", "lat": 28.0229, "lon": 73.3119, "expected_zone": "HOT_DRY"},

    # WARM_HUMID
    {"city": "Mumbai", "lat": 19.0760, "lon": 72.8777, "expected_zone": "WARM_HUMID"},
    {"city": "Kochi", "lat": 9.9312, "lon": 76.2673, "expected_zone": "WARM_HUMID"},
    {"city": "Chennai", "lat": 13.0827, "lon": 80.2707, "expected_zone": "WARM_HUMID"},

    # TEMPERATE
    {"city": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "expected_zone": "TEMPERATE"},
    {"city": "Pune", "lat": 18.5204, "lon": 73.8567, "expected_zone": "TEMPERATE"},
    {"city": "Ooty", "lat": 11.4100, "lon": 76.6950, "expected_zone": "TEMPERATE"},
]


async def evaluate_city(city_entry: dict, years: int = 5) -> dict:
    """Fetches climate summary and runs zone classification for one city."""
    city = city_entry["city"]
    lat, lon = city_entry["lat"], city_entry["lon"]
    expected = city_entry["expected_zone"]

    try:
        summary = await get_climate_summary(lat=lat, lon=lon, years=years)
        result = classify_zone(summary)
        actual = result["zone"]
        matched = (actual == expected)

        return {
            "city": city,
            "expected": expected,
            "actual": actual,
            "match": "MATCH" if matched else "MISMATCH",
            "values": result["values"],
            "reason": result["reason"],
            "error": None,
        }
    except Exception as exc:
        return {
            "city": city,
            "expected": expected,
            "actual": "ERROR",
            "match": "ERROR",
            "values": {},
            "reason": str(exc),
            "error": str(exc),
        }


async def main():
    print("=" * 115)
    print(" 5-ZONE CLIMATE CLASSIFIER CALIBRATION BENCHMARK (15 Reference Indian Cities)")
    print(" Note: Expected zones are UNVERIFIED expected labels based on NBC 2016 / ECBC for tuning.")
    print("=" * 115)

    results = []
    for c in BENCHMARK_CITIES:
        print(f"Fetching climate data for {c['city']}...", end="", flush=True)
        res = await evaluate_city(c, years=5)
        results.append(res)
        print(f" -> {res['actual']} ({res['match']})")
        # Gentle throttling to respect Open-Meteo free concurrency limits
        await asyncio.sleep(0.7)

    # Print Header
    header = (
        f"{'City':<11} | {'Expected (Unverified)':<21} | {'Actual':<12} | {'Status':<8} | "
        f"{'HotMax(°C)':<10} | {'ColdMin(°C)':<11} | {'ColdMean(°C)':<12} | {'Humid(%)':<8} | {'Rain(mm)':<9}"
    )
    print(header)
    print("-" * 115)

    matches = 0
    total = len(results)

    for r in results:
        status_str = "  OK  " if r["match"] == "MATCH" else "DIFF "
        if r["match"] == "MATCH":
            matches += 1

        v = r.get("values", {})
        hot_max = f"{v.get('hottest_month_max', 0.0):.1f}" if v else "N/A"
        cold_min = f"{v.get('coldest_month_min', 0.0):.1f}" if v else "N/A"
        cold_mean = f"{v.get('coldest_month_mean', 0.0):.1f}" if v else "N/A"
        hum = f"{v.get('hot_season_humidity', 0.0):.1f}" if v else "N/A"
        rain = f"{v.get('annual_rain', 0.0):.1f}" if v else "N/A"

        row = (
            f"{r['city']:<11} | {r['expected']:<21} | {r['actual']:<12} | {status_str:<8} | "
            f"{hot_max:<10} | {cold_min:<11} | {cold_mean:<12} | {hum:<8} | {rain:<9}"
        )
        print(row)

    print("-" * 115)
    pct = (matches / total) * 100
    print(f"Summary: {matches}/{total} matched starting thresholds ({pct:.1f}% accuracy).")
    print("=" * 115)
    print("\nDetailed Diagnostic Reasons for Calibration:")
    for r in results:
        print(f"- [{r['city']}] Expected: {r['expected']} -> Classified as: {r['actual']}")
        print(f"  Reason: {r['reason']}\n")


if __name__ == "__main__":
    asyncio.run(main())
