# Model Card — EcoShelter Design Recommender Surrogate Model

## 1. Model Overview

- **Model Identifier:** `design_model_v1.joblib`
- **Model Type:** Multi-Output Tree Ensemble Regressor (`RandomForestRegressor` with 100 estimators, max depth 12, min samples leaf 2)
- **Framework:** scikit-learn 1.4+, joblib
- **Artifact Path:** `backend/app/models/design_model_v1.joblib`
- **Artifact Size:** ~8.9 MB (compressed, safe for version control and Render deployment)
- **Input Feature Count:** 61 transformed dimensions (10 continuous climate features + 4 numeric/boolean design attributes + 47 one-hot encoded categorical design attribute indicators)
- **Output Targets:** 4 continuous performance scores scaled from 0.0 to 100.0:
  1. `comfort` — Bioclimatic passive thermal comfort score
  2. `cost` — Capital affordability / cost efficiency score (inverted: 100 = most affordable)
  3. `safety` — Structural and environmental resilience score (heavy rain, flood, wind, snow)
  4. `sustainability` — Embodied material carbon and operational energy efficiency score

---

## 2. Purpose & Intended Use

### Primary Objective
The EcoShelter Design Recommender predicts multi-criteria performance scores for vernacular and climate-responsive shelter designs for any location across India. It serves as a fast, real-time surrogate inference engine that instantly evaluates candidates from the design catalogue without requiring slow, computationally prohibitive dynamic physics simulations at request time.

### Intended Applications
- Real-time MCDM (Multi-Criteria Decision Making) ranking and sensitivity weighting in the EcoShelter web dashboard.
- Early-stage architectural concept exploration and vernacular typology recommendation.
- Comparative bioclimatic performance visualization.

### Out-of-Scope & Non-Goals
- **Not a Structural Engineering Stamp:** Does not replace licensed structural, seismic, or geotechnical calculations.
- **Not a Detailed HVAC Simulation:** Does not replace hourly dynamic thermal simulation engines (e.g., EnergyPlus, OpenStudio).
- **Not a Building Code Compliance Certification:** Does not guarantee official municipal approval.

---

## 3. Data & Sampling Strategy

### Dataset Composition
- **Dataset Source:** `ml/data/processed/design_training.csv`
- **Total Records:** 10,525 observations
- **Unique Climate Locations:** 421 distinct microclimates across India
- **Unique Architectural Designs:** 25 bioclimatic archetypes from `backend/app/data/design_catalogue.json`

### Climate Sampling & Coverage
The 421 climate points encompass:
1. **Real Reference Indian Cities:** Jodhpur, Jaisalmer, Bikaner, Chennai, Kochi, Mumbai, Kolkata, New Delhi, Lucknow, Jaipur, Nagpur, Bhopal, Leh, Srinagar, Shimla, Manali, Kargil, Bengaluru, Pune, Mysore, Coimbatore, and others.
2. **Stratified Bioclimatic Coverage:** Synthetic sampling bounded within realistic historical intervals derived from NBC 2016 Part 8 and ECBC 2017 across India's 5 official bioclimatic zones:
   - `HOT_DRY` (Arid desert & plains: high diurnal swings, extreme summer peaks, low humidity)
   - `WARM_HUMID` (Coastal belts & northeastern valleys: sustained high humidity, heavy monsoon deluges)
   - `COMPOSITE` (Indo-Gangetic plains: dual-season extremes with 45°C summers and near-freezing winters)
   - `COLD` (Himalayan highland & Ladakh: sub-zero winter temperatures, snow load risks)
   - `TEMPERATE` (South-central plateaus: moderate year-round temperatures, comfortable conditions)

### Group-Aware Train/Test Split (Preventing Data Leakage)
- **Split Method:** `GroupShuffleSplit` (80% train / 20% test) grouped strictly by `climate_group`.
- **Why Group by Climate?**
  In this dataset, every climate point is evaluated across all 25 design typologies. A standard random row split would leak identical climate profiles into both train and test sets. By holding out complete geographic clusters (`climate_group`), the test set evaluates the model's true ability to generalize to completely unseen geographic coordinates and novel weather combinations.
- **Partition Counts:**
  - Training Set: 8,400 samples (336 unique climates)
  - Held-out Test Set: 2,125 samples (85 unique climates)

---

## 4. How Labels Were Generated (Ground Truth Construction)

Ground truth training labels are generated deterministically using documented physical scoring rules in `ml/config/label_rules.json` and `ml/labeling/score_designs.py`, with small Gaussian noise ($\sigma = 1.5$ points) injected to emulate real-world field variance:

### Physical Scoring Formulations:
1. **Thermal Comfort ($0 - 100$):**
   - *Hot-Dry Climates:* Rewards high thermal mass (phase shift delay), small window-to-wall ratios (WWR $\le 0.16$), deep solar shading, internal courtyards (microclimatic convective sink), and night/stack ventilation. Penalizes large unshaded glazing and cross-ventilation during scorching daytime heat.
   - *Warm-Humid Climates:* Rewards continuous cross-ventilation (sweat evaporation), light thermal mass (avoids night radiative heat trapping), high window-to-wall ratio with deep overhangs, and elevated stilt floors.
   - *Cold Climates:* Rewards high envelope insulation (low U-factor), thermal mass, solar-oriented glazing (monopitch solar), and airtight/controlled ventilation. Penalizes cross-ventilation drafts and unroofed courtyards.
   - *Composite Climates:* Rewards dual-season envelope flexibility (thermal mass + courtyard + mixed ventilation).

2. **Affordability / Cost Efficiency ($0 - 100$):**
   - Inverted scale where $100$ is most affordable and $0$ is most capital intensive.
   - Base score derived from CPWD plinth area benchmark levels ($1$ to $5$).
   - Rewards low-cost vernacular materials (woven bamboo, adobe mud brick, mud ferro-cement, rammed earth).
   - Penalizes high-carbon engineered materials (structural insulated panels, reinforced concrete earth berms, cross-laminated timber).

3. **Structural Safety & Environmental Resilience ($0 - 100$):**
   - *Monsoon & Flood Defense:* Rewards sloped roofs (steep gable, hipped stilted) and elevated stilt platforms ($> 0.6$ m plinth); penalizes flat roofs subject to water pooling and non-elevated earth construction in $> 2000$ mm rainfall belts.
   - *Wind Resistance:* Rewards aerodynamic hipped roofs and heavy masonry; penalizes light unanchored timber/bamboo framing in high-wind belts.
   - *Snow Load Defense:* Rewards steep gable roofs that cleanly shed snow loads; penalizes flat roofs vulnerable to snow overload.

4. **Sustainability & Low-Carbon Footprint ($0 - 100$):**
   - Evaluates embodied carbon of materials based on GRIHA V.2019 Criterion 13.
   - Rewards bio/earth materials with near-zero embodied carbon.
   - Rewards passive operational energy savings (passive heating in cold zones, night flushing in hot-dry zones, solar roof integration).

---

## 5. Evaluation Metrics & Model Comparison

### Baseline vs. Gradient Boosting vs. Random Forest

| Metric | Baseline (Dummy Mean) | MultiOutput GradientBoosting | **RandomForestRegressor (Selected)** |
| :--- | :---: | :---: | :---: |
| **Overall Test $R^2$** | $-0.0007$ | $0.9538$ | **$0.9596$** |
| **Overall Test MAE** | $15.00$ pts | $1.96$ pts | **$1.75$ pts** |
| **5-Fold CV $R^2$ (Train)** | N/A | $0.9648 \pm 0.003$ | **$0.9623 \pm 0.002$** |
| **5-Fold CV MAE (Train)** | N/A | $1.81 \pm 0.05$ pts | **$1.68 \pm 0.04$ pts** |
| **Top-3 Candidate Overlap** | $22.75\%$ | $84.31\%$ | **$85.88\%$** |
| **Spearman Rank Correlation ($\rho$)** | $0.0000$ | $0.9490$ | **$0.9587$** |

### Per-Target Performance Breakdown (Held-out Test Climates)

| Criterion Target | Test $R^2$ | Test MAE | Min True / Pred | Max True / Pred |
| :--- | :---: | :---: | :---: | :---: |
| **Comfort** | $0.8970$ | $2.96$ pts | $2.86$ / $4.10$ | $100.00$ / $98.50$ |
| **Cost** | $0.9961$ | $1.25$ pts | $2.45$ / $3.20$ | $100.00$ / $99.80$ |
| **Safety** | $0.9746$ | $1.41$ pts | $37.42$ / $38.00$ | $100.00$ / $99.20$ |
| **Sustainability** | $0.9707$ | $1.36$ pts | $30.60$ / $31.50$ | $97.42$ / $96.80$ |

### Architectural Ranking Fidelity
- On completely held-out microclimates, the model achieves an **$85.88\%$ exact overlap** with the top-3 recommended designs identified by the full deterministic rules.
- The **Spearman rank correlation of $\rho = 0.9587$** confirms that the relative suitability ordering of all 25 candidate typologies is reliably preserved.

---

## 6. Key Driving Features (Permutation Importance)

Permutation importance evaluated across 85 unseen test climate clusters:

| Rank | Feature Name | Permutation Score | Physical Role |
| :---: | :--- | :---: | :--- |
| 1 | `estimated_cost_level` | $+1.09727$ | Primary driver for capital expenditure & affordability criteria |
| 2 | `hot_season_humidity` | $+0.20171$ | Dictates thermal mass vs. cross-ventilation comfort bifurcation |
| 3 | `annual_rain` | $+0.17271$ | Critical trigger for roof pitch and stilt flood safety bonuses |
| 4 | `days_below_5` | $+0.08952$ | Governs winter freeze risk and insulation requirements |
| 5 | `coldest_month_min` | $+0.08740$ | Dictates heating demand and passive solar glazing value |
| 6 | `hottest_month_max` | $+0.08412$ | Governs peak daytime cooling loads and shading depth needs |
| 7 | `days_above_40` | $+0.07630$ | Determines heat wave exposure and thermal battery sizing |

---

## 7. Limitations & Honest Disclaimer

1. **Surrogate Approximation, Not Measured In-Situ Data:**
   - The model learns to approximate the deterministic scoring rules and bioclimatic physics formulations from `label_rules.json` plus Gaussian noise across continuous climate space.
   - It is **not** calibrated on empirical building sensors or physical energy meter readings.
2. **Provisional Verification Status:**
   - All rule parameters carry `"verified": false` and citations to NBC 2016 Part 8 / ECBC 2017 / GRIHA V.2019 / BIS IS:875. These represent literature-derived engineering heuristics to be calibrated with field studies.
3. **Macroclimate vs. Microclimate:**
   - Regional 5-year historical climate averages may differ from extreme localized microclimates (e.g., steep valley inversions, dense urban heat island effects, coastal sea-breeze corridors). Site-specific on-ground measurements are always recommended.
