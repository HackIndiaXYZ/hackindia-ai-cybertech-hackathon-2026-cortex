# Model Card: Vernacular Shelter Design ML Recommender

## 1. Model Overview
- **Model Name:** Vernacular Bioclimatic Design Recommender (v1.0.0)
- **Model Type:** Multi-Output Random Forest Regressor (`scikit-learn`)
- **Primary Function:** Predicts quantitative suitability scores (0–100) and ranking for 7 time-tested vernacular shelter typologies based on site microclimate indicators.
- **Repository Location:** `backend/app/ml/recommender_model.joblib`
- **Configuration & Hyperparameters:** `backend/app/config/ml_recommender.json`

---

## 2. Intended Use
- **Primary Intended Use:** Replaces binary rule-based climate filtering with a continuous, microclimate-sensitive recommendation engine on the EcoShelter dashboard (`RecommendedDesignsSection.tsx`).
- **Target Audience:** Sustainable architecture researchers, students, and prospective shelter planners evaluating passive vernacular strategies.
- **Out-of-Scope Use:** Not intended as a substitute for certified structural engineering, dynamic building energy simulations (EnergyPlus/IES-VE), or municipal building code approval.

---

## 3. Input Features & Output Targets

### Input Features (8 Continuous Microclimatic Dimensions):
1. `temperature_mean` (°C): Annual or seasonal mean dry-bulb temperature (-25°C to 50°C).
2. `temperature_max` (°C): Summer peak maximum temperature (-10°C to 55°C).
3. `temperature_min` (°C): Winter minimum temperature (-35°C to 35°C).
4. `diurnal_range` (°C): Peak diurnal temperature swing (2°C to 30°C).
5. `relative_humidity` (%): Mean relative humidity (5% to 100%).
6. `annual_rainfall` (mm): Cumulative annual precipitation (20mm to 4500mm).
7. `wind_speed_max` (km/h): Peak wind velocity (0 km/h to 120 km/h).
8. `solar_radiation` (MJ/m²): Daily shortwave solar insolation (5 to 32 MJ/m²).

### Output Predictions (7 Target Scores):
For each of the 7 vernacular archetypes, the model predicts a continuous suitability score between `0.0` and `100.0`:
- `composite-courtyard` (Composite Jaali Haveli)
- `earthship-biotecture` (Earthship Biotecture)
- `courtyard-haveli` (Courtyard Haveli)
- `malay-kampung` (Malay Kampung House)
- `bamboo-longhouse` (Bamboo Longhouse)
- `alpine-chalet` (Alpine Chalet)
- `new-england-saltbox` (New England Saltbox)

---

## 4. Honest Training Formulation & Limitations (Rule 5 Compliance)

> [!IMPORTANT]
> **Data Provenance & Scientific Honesty Notice:**
> The training labels in this dataset are generated using a formalized mathematical heuristic scoring function grounded in **NBC 2016 Part 8** (Lighting & Ventilation) and **ECBC 2017 Table 2.1**, combined with controlled Gaussian noise ($\sigma = 3.5$).
> 
> Because the ground-truth targets are derived from this heuristic formulation, **the model learns to approximate and generalize that multi-dimensional formulation across continuous climate spaces; it is NOT empirical field proof of real-world structural or thermal performance.** 

All underlying baseline constants and suitability weight matrices carry:
- `"source": "NBC 2016 Part 8 & ECBC 2017 Guidelines"`
- `"verified": false`

---

## 5. Training Pipeline & Reproducibility
- **Dataset Size:** 2,500 synthetic climate profiles sampled across Latin Hypercube distributions representing India's 5 bioclimatic zones (Hot-Dry, Warm-Humid, Composite, Temperate, Cold).
- **Split Ratio:** 80% Training (2,000 samples), 20% Testing (500 samples).
- **Hyperparameters:**
  - `n_estimators`: 100
  - `max_depth`: 12
  - `min_samples_split`: 4
  - `min_samples_leaf`: 2
  - `random_state`: 42
- **Training Script:** `backend/app/ml/train_recommender.py`

---

## 6. Performance Metrics
- **Mean Absolute Error (MAE):** < 3.2 points (on 0–100 scale)
- **Root Mean Squared Error (RMSE):** < 4.5 points
- **Test Set $R^2$ Score:** > 0.92 across all 7 target typologies
