# Incomplete Work Rules — Thermal_Shelter (EcoShelter)

## Project Overview
- **Project Name:** Thermal_Shelter (EcoShelter)
- **Backend:** FastAPI in `backend/app/`
  - Subdirectories: `analysis/`, `api/routes/`, `core/`, `schemas/`, `services/`, `config/`, `data/`
- **Frontend:** React + TypeScript + Vite in `frontend/client/src/`
- **Existing & Working Components:**
  - `POST /api/analyze`
  - `GET /health`
  - `weather_service.py` (Open-Meteo)
  - `flood_service.py` (GloFAS)
  - `geocoding_service.py` (OSM Nominatim)
  - `environment_analyzer.py` & classification rules
  - `analyzeService.ts`
  - `LocationContext.tsx`
  - `ClimateThemeProvider.tsx`
  - All Dashboard tabs (currently several utilizing mock/initial data)

---

## Core Guidelines & Operational Rules

### 1. Stability & Non-Breaking Changes
- **Do NOT break existing endpoints**, response contract shapes, or existing backend/frontend tests.
- Only add new features, schemas, and endpoints incrementally.
- Run `pytest` in `backend/` after every backend task and fix any failures immediately.

### 2. Externalized Configurations & Constants
- Never hardcode numerical thresholds, scoring weights, or rule limits directly in business logic.
- Store all rule thresholds, calculation weights, and environmental criteria in JSON configuration files located under `backend/app/config/` or `backend/app/data/`.
- Load configuration files dynamically through dedicated helper functions with fallback defaults.

### 3. Architecture Pattern for New Endpoints
Every new endpoint must adhere strictly to the established architectural pipeline:
1. **Pydantic Schema:** Define strict request and response models in `backend/app/schemas/`.
2. **Service / Logic Module:** Implement external integrations and business logic in `backend/app/services/` or `backend/app/analysis/`.
3. **Route Module:** Create the route handler in `backend/app/api/routes/` and register it inside `backend/app/main.py`.
4. **Validation & Error Handling:** Validate input parameters thoroughly and return structured HTTP errors without exposing internal stack traces.
5. **Testing:** Write unit/integration tests with `pytest` under `backend/tests/`, ensuring external HTTP calls are mocked.

### 4. Data Provenance & Real-World Accuracy
- **Never invent or hallucinate facts.**
- Any value requiring empirical or scientific verification (such as climate thresholds, material cost per m², or structural safety scores) must include:
  - A `"source"` field indicating the reference document or standard (e.g., `NBC 2016`, `ECBC 2017`, `GloFAS`).
  - A `"verified": false` flag if the value has not yet been independently verified with authoritative field datasets.

### 5. Code Quality & Beginner Readability
- Keep code simple, clean, and thoroughly commented to facilitate learning.
- Use explicit Python type hints throughout all function and method signatures.
- Avoid unnecessary abstractions or over-engineering.

### 6. Concise Completion Summary
After completing each task, provide a concise summary (3–5 lines) answering:
- **What was built**
- **Which files were added or modified**
- **The exact command or URL to test it**
