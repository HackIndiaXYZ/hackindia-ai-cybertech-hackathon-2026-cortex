---
trigger: always_on
---

# Full-Stack Agent Rules — EcoShelter Climate-Adaptive Platform

## 1. Project Scope

This project is FULL-STACK (Frontend + Backend).

The agent develops and maintains both the backend API and the frontend client, including climate-responsive 3D shelter visualizations.

### Allowed

* FastAPI backend & REST APIs
* External API integrations (Open-Meteo Weather, GloFAS Flood, OSM Nominatim)
* Weather & flood data processing, reverse geocoding, environmental analysis
* Frontend React/TypeScript application (`frontend/client`)
* Three.js / React Three Fiber 3D shelter visualization adapted according to climate reports & environmental classifications
* UI components, styling, routing, state management
* Request/response validation, error handling, CORS configuration
* Testing & documentation across both frontend and backend

### Not Allowed

* Do NOT add unnecessary database infrastructure unless explicitly requested.
* Do NOT add authentication or payment systems unless explicitly requested.
* Do NOT add features completely outside the EcoShelter climate-adaptive design scope.

---

# 2. Technology Stack

Use:

* Python 3.11+
* FastAPI
* Pydantic
* HTTPX
* Uvicorn
* pytest

External services may include:

* Open-Meteo Weather API
* Open-Meteo Flood API / GloFAS
* OpenStreetMap Nominatim

Do not introduce another framework unless explicitly required.

---


Do not put all backend logic inside `main.py`.

---

# 4. API Responsibility

The main endpoint should be:

```text
POST /api/analyze
```

Input:

```json
{
  "latitude": 34.1526,
  "longitude": 77.5771
}
```

The backend must:

1. Validate coordinates.
2. Get weather data.
3. Get flood/environmental data.
4. Get location information.
5. Analyze environmental conditions.
6. Return a unified JSON response.

---

# 5. API Contract

The frontend and backend must communicate through a stable API contract.

Expected response structure:

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
    "conditions": [],
    "summary": ""
  }
}
```

Do not randomly change response field names.

If the response contract must change, update the schema and documentation together.

---

# 6. Input Validation

Latitude must be:

```text
-90 <= latitude <= 90
```

Longitude must be:

```text
-180 <= longitude <= 180
```

Invalid coordinates must return a proper HTTP error.

Never accept invalid coordinates silently.

---

# 7. External API Rules

External API calls must NOT be written directly inside route functions.

Bad:

```python
@router.post("/analyze")
def analyze():
    requests.get(...)
```

Good:

```text
Route
  ↓
Service
  ↓
External API
```

Example:

```python
weather_service.get_weather(latitude, longitude)
```

Each external API must have its own service module.

---

# 8. HTTP Client

Use `httpx` for external API requests.

Every external request must have:

* timeout
* error handling
* response validation
* appropriate logging

Never allow an external API request to hang indefinitely.

---

# 9. API Failure Handling

External APIs can fail.

The backend must NOT crash the entire application because one external API failed.

Handle:

* timeout
* connection error
* HTTP error
* invalid response
* missing fields
* unavailable data

If data is unavailable, return:

```text
Insufficient Data
```

or an appropriate nullable field.

NEVER invent environmental values.

---

# 10. No Fake Data

Production responses must NEVER contain:

```text
random temperature
random humidity
fake flood risk
hardcoded weather
placeholder environmental values
```

Mock data may only be used inside tests.

Clearly separate test/mock data from production services.

---

# 11. Environment Analysis

Environmental classification must be handled separately from API fetching.

Example:

```text
Weather Data
     ↓
Environment Analyzer
     ↓
Classification
```

Possible classifications:

```text
Cold
Moderate
Hot-Dry
Hot-Humid
Cold-Humid
Variable
Insufficient Data
```

Do not claim that these categories are an official scientific climate classification.

They are application-level environmental categories.

---

# 12. Analysis Rules

Analysis rules must be stored separately:

```text
analysis/
├── environment_analyzer.py
└── rules.py
```

Do not scatter classification conditions throughout the project.

Example:

```python
if temperature < 10:
    classification = "Cold"
```

Rules should eventually be centralized and easy to modify.

---

# 13. Flood Risk Rules

Flood information must be treated as an estimate based on available data.

Never return statements such as:

```text
This house is completely safe from flooding.
```

or:

```text
This location will definitely flood.
```

Use careful terminology such as:

```text
Low
Moderate
High
Insufficient Data
```

The response should clearly distinguish observed/modelled data from application-level interpretation.

---

# 14. Data Transformation

External API responses must NOT be passed directly to the frontend.

Transform external API responses into our own stable schema.

```text
External API
     ↓
Service
     ↓
Data Transformation
     ↓
Pydantic Schema
     ↓
Frontend
```

This protects the frontend from external API structure changes.

---

# 15. Pydantic Schemas

Use Pydantic models for:

* request validation
* response validation
* internal structured data where useful

Example:

```python
class LocationRequest(BaseModel):
    latitude: float
    longitude: float
```

Avoid returning unstructured dictionaries everywhere when a stable schema is appropriate.

---

# 16. Separation of Responsibilities

### Routes

Routes should handle:

* HTTP request
* validation
* calling services
* returning response

### Services

Services should handle:

* external API communication
* data extraction
* API-specific transformation

### Analysis

Analysis should handle:

* environmental calculations
* classification
* interpretation

### Schemas

Schemas should handle:

* request/response models

Routes must NOT contain large business logic.

---

# 17. CORS

The backend must support frontend integration using CORS.

During development, allow the frontend development origin.

Example:

```text
http://localhost:5173
```

Do not blindly use:

```text
allow_origins=["*"]
```

in production.

Production origins must be configurable.

---

# 18. Environment Variables

Configuration must be separated from source code.

Use:

```text
.env
```

for environment-specific configuration.

Never hardcode:

* API keys
* secrets
* production URLs
* credentials

Never commit `.env` to Git.

Provide:

```text
.env.example
```

when environment variables are required.

---

# 19. Security

Never trust frontend input.

Validate all incoming data.

Do not expose:

* internal exceptions
* API credentials
* stack traces
* sensitive configuration

Use safe error messages for API responses.

---

# 20. Error Response

Use consistent error responses.

Example:

```json
{
  "error": {
    "code": "WEATHER_API_UNAVAILABLE",
    "message": "Weather data is currently unavailable."
  }
}
```

Do not expose raw third-party API errors directly to the frontend.

---

# 21. Logging

Use structured and useful logging.

Log:

* API request failures
* external API failures
* unexpected exceptions
* important processing failures

Do NOT log:

* API keys
* secrets
* unnecessary personal data

---

# 22. Testing

Every major backend module should have tests.

Minimum testing areas:

```text
Coordinate validation
Weather service
Flood service
Geocoding service
Environment classification
API endpoint
Error handling
```

Use:

```text
pytest
```

External APIs should preferably be mocked during unit tests.

Tests must not depend on a live internet connection unless explicitly marked as integration tests.

---

# 23. API Documentation

FastAPI's automatic documentation must remain functional.

The agent should ensure:

```text
/docs
```

and:

```text
/openapi.json
```

work correctly.

Add meaningful endpoint descriptions and schema descriptions where useful.

---

# 24. Frontend Integration

The backend must expose a clear API contract for the frontend developer.

Document:

```text
Endpoint
HTTP method
Request body
Response body
Status codes
Error responses
Example request
Example response
```

The frontend developer should be able to integrate without reading backend implementation details.

---

# 25. Local Development

Backend should run with:

```bash
uvicorn app.main:app --reload
```

Default development URL:

```text
http://localhost:8000
```

Swagger documentation:

```text
http://localhost:8000/docs
```

---

# 26. Code Quality

Write clean, readable and maintainable Python.

Rules:

* Use type hints.
* Use meaningful names.
* Keep functions focused.
* Avoid unnecessary duplication.
* Avoid giant files.
* Avoid unnecessary abstractions.
* Add comments only where they provide useful context.
* Prefer simple solutions over over-engineering.

---

# 27. Dependency Rules

Do not add a new package just because it is convenient.

Before adding a dependency:

1. Check whether the standard library or existing dependency can solve the problem.
2. Check whether the dependency is actually required.
3. Keep dependencies minimal.

Update `requirements.txt` whenever a production dependency is added.

---

# 28. Git Rules

Do not commit:

```text
.env
__pycache__/
.pytest_cache/
*.pyc
venv/
.venv/
```

Use `.gitignore`.

Make small, logical commits.

Do not mix unrelated changes in one commit.

---

# 29. Agent Workflow

The agent must work incrementally.

### Phase 1

Create backend structure.

### Phase 2

Create FastAPI application.

### Phase 3

Create request/response schemas.

### Phase 4

Create `/api/analyze`.

### Phase 5

Implement weather service.

### Phase 6

Implement flood service.

### Phase 7

Implement geocoding service.

### Phase 8

Implement environmental analyzer.

### Phase 9

Combine all services.

### Phase 10

Add error handling and logging.

### Phase 11

Configure CORS.

### Phase 12

Write tests.

### Phase 13

Update README/API documentation.

After each phase:

1. Run the application.
2. Run tests.
3. Fix errors.
4. Verify the phase.
5. Only then continue.

---

# 30. Important Agent Behavior

Before modifying code:

1. Inspect the existing project.
2. Understand the current architecture.
3. Do not overwrite working code unnecessarily.
4. Reuse existing components where appropriate.
5. Make the smallest change required.
6. Test after changes.

Do not generate the entire project blindly if a project already exists.

---

# 31. Scope Protection

Allowed core features:
* Backend APIs, environmental analysis, and data services
* Frontend dashboard, interactive maps, and theme adaptation
* Three.js 3D shelter visualization dynamically driven by climate reports (roof slope, overhangs, stilts, thermal mass, courtyard, window orientation)

Do NOT implement without explicit request:
* Payment systems
* Complex multi-tenant auth systems
* Unrelated non-shelter features

---

# 32. Architecture Pipeline

The completed platform provides this pipeline:

```text
User / Map Click
   │
   │ latitude + longitude
   ▼
FastAPI Backend
   │
   ├── Weather Service (Open-Meteo)
   ├── Flood Service (GloFAS)
   └── Geocoding Service (OSM Nominatim)
            │
            ▼
    Environment Analyzer
            │
            ▼
   Unified JSON Response (Classification, Weather, Flood, Conditions)
            │
            ▼
Frontend Dashboard & 3D Engine (Three.js / React Three Fiber)
            │
            ▼
Climate-Adaptive 3D Shelter Model (Generated based on Climate Classification)
```

