# ML Recommender Architecture & Implementation Rules

## Goal
Replace the rule-based lookup in the "Top Recommended Designs" section (`frontend/client/src/components/dashboard/RecommendedDesignsSection.tsx`, which currently filters `VERNACULAR_DESIGNS` by climate zone) with recommendations and suitability predictions produced by a trained machine learning model served via the FastAPI backend (`backend/app`).

---

## Non-Negotiable Operational Rules

### 1. Scope Protection & Library Isolation
- **Do NOT modify** `LibraryPage.tsx`, `frontend/client/src/data/vernacularDesigns.ts`, `frontend/client/src/utils/suitability.js`, `frontend/client/src/data/locationClimateZones.js`, or their tests.
- The Vernacular Library page (`/library`) and its suitability calculations must continue to operate independently.

### 2. Backward Compatibility & Test Invariants
- **Do NOT break** existing endpoints:
  - `POST /api/analyze`
  - `GET /health`
  - `POST /api/climate`, `GET /api/climate`
  - `POST /api/zone`
  - `POST /api/risk`
  - `POST /api/requirements`
  - `POST /api/design/rank`
  - `POST /api/design/spec`
  - `POST /api/report`
- Only add new endpoints, models, and UI enhancements.
- Run `pytest` in `backend/` after every backend task.
- Run `npm run build` in `frontend/client/` after every frontend task.

### 3. Externalized Configuration & Zero Hardcoded Constants
- **Never hardcode** thresholds, weights, hyper-parameters, feature bounds, or label formulas directly in Python or TypeScript code.
- Place all configurations in JSON files under:
  - `backend/app/config/`
  - `ml/config/` (or `backend/ml/config/`)
- Every configuration file must be loaded dynamically with safe defaults.

### 4. Data Provenance & Fact Integrity
- **Never invent facts or real-world physical properties.**
- Every domain value that represents real-world engineering or physical data (such as thermal mass capacitance, material U-values, embodied carbon, NBC/ECBC guidelines) must explicitly specify:
  - `"source"`: citation of standard or heuristic origin (e.g., `NBC 2016 Part 8 / ECBC 2017 / Synthetic Training Formulation`).
  - `"verified": false` (flag indicating empirical field calibration is pending).

### 5. Intellectual Honesty in Model Documentation
- Clearly state in code comments, logs, API metadata, and the Model Card (`docs/MODEL_CARD.md` / `ml/MODEL_CARD.md`) that:
  - Synthetic training labels are generated using a documented mathematical scoring formulation combined with controlled Gaussian noise.
  - The model learns to approximate this multi-criteria scoring formulation given climatic features; it does **not** constitute empirical field proof of real-world structural or thermal performance.

### 6. Clean, Simple, Well-Commented Code with Type Hints
- Write clean, maintainable Python 3.11+ and TypeScript.
- Annotate every function and method with strict type hints (`typing.Optional`, `typing.Dict`, `typing.List`, Pydantic models).
- Add clear comments explaining ML preprocessing, feature extraction, inference pipeline, and scoring logic so a beginner can understand and learn from it.

### 7. Step-by-Step Reporting Contract
- After each task, provide a 3 to 5 line concise summary stating:
  1. **What was built**
  2. **Which files were created or modified**
  3. **The exact command or test to verify it**
