#!/usr/bin/env python
"""
Backfill script — downloads the last N years of historical weather for one
or more locations from the Open-Meteo Historical Archive and stores it in
the local SQLite database.

Usage (run from the backend/ directory):
    python -m scripts.backfill --lat 26.45 --lng 80.33 --years 3
    python -m scripts.backfill --locations kanpur jaipur ladakh

Predefined locations:
    kanpur  = 26.4499, 80.3319
    jaipur  = 26.9124, 75.7873
    ladakh  = 34.1526, 77.5771

No API key required — uses the free Open-Meteo Archive API.
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Allow running from the repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.backfill_service import backfill_location

PREDEFINED = {
    "kanpur": (26.4499, 80.3319),
    "jaipur": (26.9124, 75.7873),
    "ladakh": (34.1526, 77.5771),
}


async def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill weather history from Open-Meteo Archive.")
    parser.add_argument("--lat", type=float, help="Latitude of the location.")
    parser.add_argument("--lng", type=float, help="Longitude of the location.")
    parser.add_argument("--years", type=int, default=3, help="Years of history to fetch (default: 3).")
    parser.add_argument(
        "--locations",
        nargs="+",
        choices=list(PREDEFINED.keys()),
        help="Predefined location name(s): kanpur, jaipur, ladakh",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-run backfill even if the location already has data.",
    )
    args = parser.parse_args()

    locations_to_backfill = []

    if args.locations:
        for name in args.locations:
            lat, lng = PREDEFINED[name]
            locations_to_backfill.append((name, lat, lng))
    elif args.lat is not None and args.lng is not None:
        locations_to_backfill.append(("custom", args.lat, args.lng))
    else:
        # Default: backfill all predefined locations
        for name, (lat, lng) in PREDEFINED.items():
            locations_to_backfill.append((name, lat, lng))

    for name, lat, lng in locations_to_backfill:
        print(f"\n{'='*60}")
        print(f"Backfilling: {name} (lat={lat}, lng={lng}), years={args.years}")
        print("="*60)
        result = await backfill_location(lat, lng, years=args.years, force=args.force)
        print(f"Result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
