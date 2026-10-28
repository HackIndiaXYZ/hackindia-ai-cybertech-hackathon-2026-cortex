<<<<<<< HEAD
# EcoShelter — Climate-Adaptive Vernacular Shelter Platform

EcoShelter is a full-stack, climate-responsive architectural platform that analyzes local microclimates, predicts multi-criteria performance scores using machine learning surrogates, and dynamically recommends and visualizes 2D architectural plans and 3D vernacular shelters.

---

## 1. Quick Start

### Frontend (React + TypeScript + Vite + Three.js)
```bash
cd frontend/client
=======
# Eco Shelter
# start frontend 
cd frontend
>>>>>>> a874f38be1b5a82c01e446c3021158dd9ddf975e
npm install
npm run dev
```
Development URL: `http://localhost:5173`

<<<<<<< HEAD
### Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1   # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
=======
# start backend 
cd backend
.\venv\Scripts\Activate.ps1
>>>>>>> a874f38be1b5a82c01e446c3021158dd9ddf975e
uvicorn app.main:app --reload
```
API Documentation (Swagger UI): `http://localhost:8000/docs`

---

## 2. ML Design Recommender Pipeline

The EcoShelter design recommendation engine replaces brittle static lookup tables with a continuous multi-target machine learning surrogate model. The model scores every design in the 25-archetype vernacular catalogue across 4 distinct performance targets:
- **Thermal Comfort** (0–100)
- **Cost Efficiency** (0–100, inverted: higher = more affordable)
- **Safety & Structural Resilience** (0–100)
- **Sustainability & Low Embodied Carbon** (0–100)

### Step 1: Build the Training Dataset
Generates 10,525 observations combining 421 real Indian reference cities and stratified bioclimatic zones with 25 catalogue typologies. Labels are calculated using documented physical bioclimatic heuristics in `ml/labeling/score_designs.py`:
```bash
python ml/build_design_dataset.py
```
- **Output:** `ml/data/processed/design_training.csv`
- **Features Order:** Strictly enforced by `backend/app/config/design_features.json`

### Step 2: Train & Evaluate the Model
Trains and compares a mean baseline, Multi-Output Gradient Boosting Regressor, and Random Forest Regressor using `GroupShuffleSplit` (grouped by `climate_group` to prevent spatial data leakage):
```bash
python ml/train_design_model.py
```
- **Evaluation Metrics:**
  - $R^2 \approx 0.96$
  - Test MAE $\approx 2.4$ points
  - Top-3 Archetype Overlap $\approx 86\%$
  - Spearman Rank Correlation $\approx 0.94$

### Step 3: Model Artifact
The trained model, feature order, and one-hot attribute encoders are packaged together:
- **File Location:** `backend/app/models/design_model_v1.joblib`

The model is automatically loaded once at FastAPI startup via the lifespan context in `backend/app/main.py`.

---

## 3. Design Recommendation API

### `POST /api/designs/recommend`
Evaluates all catalogue designs for the site coordinates using 5-year historical climate metrics and the trained ML model, returning the top-ranked designs with bioclimatic rationale.

#### Request Body:
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "weights": {
    "comfort": 25,
    "cost": 25,
    "safety": 25,
    "sustainability": 25
  },
  "top_n": 3
}
```

#### Response Body:
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "name": "New Delhi",
    "country": "India"
  },
  "features_used": {
    "latitude": 28.6139,
    "hottest_month_max": 40.2,
    "coldest_month_min": 7.8,
    "coldest_month_mean": 14.2,
    "hot_season_humidity": 45.0,
    "annual_rain": 780.0,
    "wind_mean": 12.5,
    "solar_mean": 22.0,
    "days_above_40": 35,
    "days_below_5": 0
  },
  "designs": [
    {
      "id": "haveli_courtyard",
      "name": "Haveli Courtyard House",
      "plan_archetype": "COURTYARD",
      "scores": {
        "comfort": 88.4,
        "cost": 72.1,
        "safety": 85.0,
        "sustainability": 90.2
      },
      "total": 83.93,
      "reasons": [
        "Internal courtyard acts as a diurnal thermal regulator and convective sink.",
        "Deep overhangs and high thermal mass dampen extreme summer temperature swings."
      ],
      "rank": 1
    }
  ],
  "weights_used": {
    "comfort": 0.25,
    "cost": 0.25,
    "safety": 0.25,
    "sustainability": 0.25
  },
  "model_info": {
    "name": "GradientBoostingRegressor (MultiOutput)",
    "version": "v1.0.0",
    "source": "backend/app/models/design_model_v1.joblib"
  }
}
```

### `GET /api/design/presets`
Returns preconfigured optimization presets (`Balanced`, `Low cost`, `Safety first`, `Eco friendly`).

---

## 4. Known Model Limitations & Scientific Transparency

> [!WARNING]
> **Data Provenance & Validation Limitations:**
> 1. **Synthetic Heuristic Ground Truth:** Training labels originate from formalized mathematical scoring functions grounded in **NBC 2016 Part 8** and **ECBC 2017** combined with Gaussian noise (`verified: false`). The model learns to approximate this multi-criteria formulation; it does NOT represent measured real-world sensor data.
> 2. **Catalogue Attribute Placeholders:** Architectural parameters (thermal mass values, window-to-wall ratios, embodied carbon indices) in `design_catalogue.json` are domain approximations.
> 3. **No Real-World Sensor Validation:** The scores have not been validated against empirical post-occupancy sensor deployments or long-term dynamic thermal simulations (e.g., EnergyPlus/IES-VE).
> 4. **Scope of Guidance:** Predictions provide preliminary conceptual guidance for sustainable shelter planning only and do not replace certified structural engineering, geotechnical analysis, or municipal building code approval.

---

## 5. Testing & Verification

### Run Backend Tests (pytest)
```bash
cd backend
.\venv\Scripts\pytest backend\tests
```
All 176 backend unit and integration tests pass with 0 failures.

### Run Frontend Tests (Node test runner)
```bash
cd frontend/client
npm test
```
All 19 frontend unit tests pass (including `recommendDesigns` API client tests for success, HTTP 503 model-unavailable handling, and network error handling).

### Run Frontend Production Build
```bash
cd frontend/client
npm run build
```
Type checks and bundles with Vite (`tsc -b && vite build`) with 0 errors.
