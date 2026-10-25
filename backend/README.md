# EcoShelter Environment Analyzer — Backend

A FastAPI backend that accepts a geographic coordinate pair and returns
weather observations, a flood-risk estimate, reverse-geocoded location
details, and an application-level environmental classification.

---

## Quick Start

```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env       # then edit if needed

# 4. Start the development server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs`  
OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI application, CORS, routing
│   ├── api/
│   │   └── routes/
│   │       └── analysis.py         # POST /api/analyze route
│   ├── services/
│   │   ├── weather_service.py      # Open-Meteo Weather API
│   │   ├── flood_service.py        # Open-Meteo GloFAS Flood API
│   │   └── geocoding_service.py    # OSM Nominatim reverse geocoding
│   ├── analysis/
│   │   ├── environment_analyzer.py # Classification logic
│   │   └── rules.py                # Thresholds and rule definitions
│   ├── schemas/
│   │   └── analysis_schema.py      # Pydantic request/response models
│   └── core/
│       └── config.py               # Environment-variable configuration
├── tests/
│   ├── test_analysis.py            # Unit tests for the analyzer
│   └── test_api.py                 # Endpoint tests (services mocked)
├── requirements.txt
├── .env.example
└── pytest.ini
```

---

## API Reference

### `POST /api/analyze`

Analyze environmental conditions for a geographic coordinate.

#### Request

```json
{
  "latitude": 34.1526,
  "longitude": 77.5771
}
```

| Field | Type | Constraints |
|-------|------|-------------|
| `latitude` | float | −90 to 90 |
| `longitude` | float | −180 to 180 |

#### Response — `200 OK`

```json
{
  "location": {
    "latitude": 34.1526,
    "longitude": 77.5771,
    "name": "Leh",
    "country": "India"
  },
  "weather": {
    "temperature": 5.2,
    "humidity": 62,
    "wind_speed": 8.4,
    "rainfall": 0.2,
    "cloud_cover": 35
  },
  "flood": {
    "risk": "Low",
    "status": "Available"
  },
  "analysis": {
    "classification": "Cold",
    "conditions": ["Low temperature"],
    "summary": "Cold conditions — temperature 5.2°C, humidity 62%. Notable: low temperature."
  }
}
```

#### Error — `422 Unprocessable Entity`

Returned when coordinates are outside the valid range or fields are missing.

```json
{
  "detail": [
    {
      "type": "less_than_equal",
      "loc": ["body", "latitude"],
      "msg": "Input should be less than or equal to 90",
      "input": 95.0
    }
  ]
}
```

---

### `GET /health`

Returns `200 OK` with `{"status": "ok"}` when the service is running.

---

## Environmental Classifications

> **Note:** These categories are application-level convenience labels.  
> They are **not** an official scientific climate classification.

| Classification | Description |
|----------------|-------------|
| `Cold` | Temperature < 10 °C, humidity < 70 % |
| `Cold-Humid` | Temperature < 10 °C, humidity ≥ 70 % |
| `Moderate` | Temperature 10–30 °C |
| `Hot-Dry` | Temperature ≥ 30 °C, humidity < 70 % |
| `Hot-Humid` | Temperature ≥ 30 °C, humidity ≥ 70 % |
| `Variable` | Catch-all when no other rule matches |
| `Insufficient Data` | Temperature or humidity unavailable |

---

## Flood Risk Labels

Flood risk is an **application-level estimate** derived from GloFAS modelled
river-discharge data.  It is **not** an authoritative flood warning.

| Risk | Meaning |
|------|---------|
| `Low` | Discharge < 100 m³/s |
| `Moderate` | Discharge 100–499 m³/s |
| `High` | Discharge ≥ 500 m³/s |
| `Insufficient Data` | Data unavailable |

---

## Configuration

All configuration is read from environment variables (see `.env.example`).

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `HTTP_TIMEOUT` | `10.0` | External API timeout (seconds) |
| `OPEN_METEO_WEATHER_URL` | Open-Meteo default | Override for testing |
| `OPEN_METEO_FLOOD_URL` | GloFAS default | Override for testing |
| `NOMINATIM_URL` | OSM Nominatim default | Override for testing |
| `NOMINATIM_USER_AGENT` | `EcoShelterAnalyzer/1.0` | Required by Nominatim ToS |

---

## Running Tests

```bash
pytest -v
```

All tests are offline — external APIs are fully mocked.

---

## External Services

| Service | Used For | URL |
|---------|----------|-----|
| Open-Meteo Weather API | Temperature, humidity, wind, rainfall, cloud cover | `https://api.open-meteo.com/v1/forecast` |
| Open-Meteo GloFAS Flood API | River discharge / flood risk estimate | `https://flood-api.open-meteo.com/v1/flood` |
| OSM Nominatim | Reverse geocoding | `https://nominatim.openstreetmap.org/reverse` |


# backend run code
# 1. Backend folder me jayein
cd c:\Users\Pranshu\OneDrive\Documents\Backend\backend

# 2. Virtual environment activate karein
.\venv\Scripts\Activate.ps1

# 3. FastAPI backend server start karein
uvicorn app.main:app --reload


#frontend run code

# 1. Frontend ke client folder me jayein (jahan package.json hai)
cd c:\Users\Pranshu\OneDrive\Documents\Backend\frontend\client

# 2. Development server start karein
npm run dev
