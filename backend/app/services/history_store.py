"""
Weather history store — SQLite-backed persistence layer.

Table: weather_history
  Columns: location_key, lat, lng, date, temp_max, temp_min, temp_mean,
           humidity, precipitation, wind, source, fetched_at
  Unique constraint on (location_key, date) — upserts are idempotent.

Design principles (per project rules):
  - External API calls are NOT in here. This module is pure persistence.
  - Validation (nulls, range checks) happens before any INSERT.
  - Every rejection is logged.
  - Thread-safe via a module-level threading.Lock + check_same_thread=False.
"""

import logging
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator, List, Optional

from app.core.config import settings
from app.schemas.forecast_schema import WeatherHistoryRow

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Temperature validity bounds (configurable via settings, hard-coded fallback)
# ---------------------------------------------------------------------------
_TEMP_MIN: float = getattr(settings, "HISTORY_TEMP_MIN", -60.0)
_TEMP_MAX: float = getattr(settings, "HISTORY_TEMP_MAX", 60.0)

_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None


# ---------------------------------------------------------------------------
# DB initialisation
# ---------------------------------------------------------------------------

def _db_path() -> Path:
    path = Path(getattr(settings, "HISTORY_DB_PATH", "weather_history.db"))
    if not path.is_absolute():
        # Resolve relative to the backend directory (parent of app/)
        path = Path(__file__).resolve().parent.parent.parent / path
    return path


def _get_connection() -> sqlite3.Connection:
    """Return (and lazily create) the shared SQLite connection."""
    global _conn
    if _conn is None:
        db_path = _db_path()
        db_path.parent.mkdir(parents=True, exist_ok=True)
        logger.info("Opening weather history DB at %s", db_path)
        _conn = sqlite3.connect(
            str(db_path),
            check_same_thread=False,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        _conn.row_factory = sqlite3.Row
        _ensure_schema(_conn)
    return _conn


@contextmanager
def _cursor() -> Generator[sqlite3.Cursor, None, None]:
    """Context manager that yields a cursor inside a thread-safe lock."""
    with _lock:
        conn = _get_connection()
        cur = conn.cursor()
        try:
            yield cur
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()


def _ensure_schema(conn: sqlite3.Connection) -> None:
    """Create the weather_history table and index if they do not exist."""
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS weather_history (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            location_key TEXT    NOT NULL,
            lat          REAL    NOT NULL,
            lng          REAL    NOT NULL,
            date         TEXT    NOT NULL,
            temp_max     REAL,
            temp_min     REAL,
            temp_mean    REAL,
            humidity     REAL,
            precipitation REAL,
            wind         REAL,
            source       TEXT    NOT NULL DEFAULT 'unknown',
            fetched_at   TEXT,
            UNIQUE (location_key, date)
        )
        """
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_wh_location_date ON weather_history (location_key, date)"
    )
    conn.commit()
    logger.debug("weather_history schema verified.")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def _validate_row(row: WeatherHistoryRow) -> Optional[str]:
    """
    Return None when the row is valid, or a rejection reason string.

    Checks:
      - Required string fields not empty
      - Temperature values within [-60, 60] °C when present
      - humidity in [0, 100] when present
      - precipitation >= 0 when present
      - wind >= 0 when present
    """
    if not row.location_key or not row.date:
        return "location_key or date is empty"

    for col, val in [
        ("temp_max", row.temp_max),
        ("temp_min", row.temp_min),
        ("temp_mean", row.temp_mean),
    ]:
        if val is not None and not (_TEMP_MIN <= val <= _TEMP_MAX):
            return f"{col}={val} is outside valid range [{_TEMP_MIN}, {_TEMP_MAX}]"

    if row.humidity is not None and not (0.0 <= row.humidity <= 100.0):
        return f"humidity={row.humidity} is outside [0, 100]"

    if row.precipitation is not None and row.precipitation < 0:
        return f"precipitation={row.precipitation} is negative"

    if row.wind is not None and row.wind < 0:
        return f"wind={row.wind} is negative"

    # At least one temperature value must be present
    if row.temp_max is None and row.temp_min is None and row.temp_mean is None:
        return "all temperature fields (temp_max, temp_min, temp_mean) are null"

    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def upsert_row(row: WeatherHistoryRow) -> bool:
    """
    Validate and upsert one daily record.
    Returns True on success, False on rejection (reason is logged).
    """
    rejection = _validate_row(row)
    if rejection:
        logger.warning(
            "HISTORY REJECTED row (location_key=%s, date=%s): %s",
            row.location_key,
            row.date,
            rejection,
        )
        return False

    fetched_at = row.fetched_at or datetime.now(timezone.utc).isoformat()

    with _cursor() as cur:
        cur.execute(
            """
            INSERT INTO weather_history
                (location_key, lat, lng, date, temp_max, temp_min, temp_mean,
                 humidity, precipitation, wind, source, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(location_key, date) DO UPDATE SET
                temp_max      = excluded.temp_max,
                temp_min      = excluded.temp_min,
                temp_mean     = excluded.temp_mean,
                humidity      = excluded.humidity,
                precipitation = excluded.precipitation,
                wind          = excluded.wind,
                source        = excluded.source,
                fetched_at    = excluded.fetched_at
            """,
            (
                row.location_key,
                row.lat,
                row.lng,
                row.date,
                row.temp_max,
                row.temp_min,
                row.temp_mean,
                row.humidity,
                row.precipitation,
                row.wind,
                row.source,
                fetched_at,
            ),
        )
    logger.debug("Upserted weather_history row: %s / %s", row.location_key, row.date)
    return True


def upsert_rows(rows: List[WeatherHistoryRow]) -> dict:
    """Bulk upsert a list of rows; returns dict with accepted/rejected counts."""
    accepted = 0
    rejected = 0
    for row in rows:
        if upsert_row(row):
            accepted += 1
        else:
            rejected += 1
    logger.info(
        "Bulk upsert complete: %d accepted, %d rejected", accepted, rejected
    )
    return {"accepted": accepted, "rejected": rejected}


def query_history(
    location_key: str,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 3000,
) -> List[WeatherHistoryRow]:
    """
    Return stored rows for a location, optionally filtered by date range.
    Sorted ascending by date.
    """
    sql = "SELECT * FROM weather_history WHERE location_key = ?"
    params: list = [location_key]

    if from_date:
        sql += " AND date >= ?"
        params.append(from_date)
    if to_date:
        sql += " AND date <= ?"
        params.append(to_date)

    sql += " ORDER BY date ASC LIMIT ?"
    params.append(limit)

    with _cursor() as cur:
        cur.execute(sql, params)
        rows_raw = cur.fetchall()

    return [
        WeatherHistoryRow(
            location_key=r["location_key"],
            lat=r["lat"],
            lng=r["lng"],
            date=r["date"],
            temp_max=r["temp_max"],
            temp_min=r["temp_min"],
            temp_mean=r["temp_mean"],
            humidity=r["humidity"],
            precipitation=r["precipitation"],
            wind=r["wind"],
            source=r["source"],
            fetched_at=r["fetched_at"],
        )
        for r in rows_raw
    ]


def count_rows(location_key: str) -> int:
    """Return the number of stored rows for a location."""
    with _cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM weather_history WHERE location_key = ?",
            (location_key,),
        )
        result = cur.fetchone()
    return result[0] if result else 0


def get_all_location_keys() -> List[str]:
    """Return the distinct location_keys present in the store."""
    with _cursor() as cur:
        cur.execute("SELECT DISTINCT location_key FROM weather_history")
        rows = cur.fetchall()
    return [r[0] for r in rows]


def close_db() -> None:
    """Gracefully close the SQLite connection (call at app shutdown)."""
    global _conn
    with _lock:
        if _conn is not None:
            _conn.close()
            _conn = None
            logger.info("weather_history DB connection closed.")
