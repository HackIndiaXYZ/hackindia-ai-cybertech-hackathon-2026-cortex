# Graph Report - Backend  (2026-10-28)

## Corpus Check
- 157 files · ~181,788 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 16 file(s) not represented in the graph (top: .css 5, (none) 5, .example 2)

## Summary
- 1396 nodes · 2735 edges · 75 communities (51 shown, 24 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 71 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13021074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyze_environment
- report_service.py
- LibraryPage.tsx
- _patch_services
- App.tsx
- DESIGN SYSTEM
- frontend/README.md
- package.json
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization
- train_design_model.py
- WeatherTab.tsx
- RequirementsTab.tsx
- classify_zone
- compilerOptions
- compilerOptions
- test_spec_builder.py
- climate_service.py
- DesignsTab.tsx
- test_requirements.py
- locationClimateZones.d.ts
- README.md
- dependencies
- health
- ZoneRiskTab.tsx
- test_design_dataset.py
- Core Guidelines & Operational Rules
- clear_cache
- test_designs_recommend.py
- vercel.json
- .oxlintrc.json
- main.py
- React + TypeScript + Vite
- tsconfig.json
- test_design_ranker.py
- design_ml.py
- assess_risk
- useReducedMotion
- ml_recommender_service.py
- design_schema.py
- ErrorDetail
- devDependencies
- planData.ts
- ShelterTab.tsx
- scripts
- post_report
- TestProductionCatalogue
- NumberedCanvas
- analyzeService.ts
- build_design_dataset.py
- load_catalogue
- mock_all_services
- Model Card — EcoShelter Design Recommender Surrogate Model
- TestCatalogueDesignSchema
- sample_raw_climate_data
- DashboardPage.tsx
- ShelterCanvas.tsx
- mock/index.ts
- json
- Non-Negotiable Operational Rules
- Model Card: Vernacular Shelter Design ML Recommender
- ClimateTab.tsx
- main.tsx
- Analyze Pipeline Specification
- mock_meteo

## God Nodes (most connected - your core abstractions)
1. `useReducedMotion()` - 54 edges
2. `analyze_environment()` - 31 edges
3. `react` - 25 edges
4. `useClimateZone()` - 25 edges
5. `assess_risk()` - 24 edges
6. `get_climate_summary()` - 23 edges
7. `ClimateResponse` - 22 edges
8. `lucide-react` - 22 edges
9. `build_spec()` - 21 edges
10. `classify_zone()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `evaluate_city()` --calls--> `get_climate_summary()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/services/climate_service.py
- `test_scoring_hot_dry_climate()` --calls--> `load_designs()`  [EXTRACTED]
  backend/tests/test_design_dataset.py → ml/build_design_dataset.py
- `test_scoring_warm_humid_climate()` --calls--> `load_designs()`  [EXTRACTED]
  backend/tests/test_design_dataset.py → ml/build_design_dataset.py
- `test_scoring_cold_climate()` --calls--> `load_designs()`  [EXTRACTED]
  backend/tests/test_design_dataset.py → ml/build_design_dataset.py
- `10. Component Catalogue` --references--> `DisclaimerBanner()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/DisclaimerBanner.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (75 total, 24 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.08
Nodes (9): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, TestClassification, TestConditions (+1 more)

### Community 1 - "report_service.py"
Cohesion: 0.05
Nodes (21): analyze(), Settings, AnalysisInfo, AnalysisResponse, DailyForecastItem, ErrorResponse, FloodInfo, HourlyForecastItem (+13 more)

### Community 2 - "LibraryPage.tsx"
Cohesion: 0.09
Nodes (28): CLIMATE_ZONES, findNearestVerifiedCity(), getAllSearchableLocations(), haversineDistanceKm(), resolveLocationClimate(), UNLISTED_SAMPLE_DISTRICTS, VERIFIED_CLIMATE_ZONES, ALL_ZONES (+20 more)

### Community 3 - "_patch_services"
Cohesion: 0.10
Nodes (5): _patch_services(), TestCoordinateValidation, TestForecastInResponse, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.10
Nodes (36): AnimatedRoutes(), App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, DisclaimerBanner() (+28 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (30): 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet, 1. Product Overview, 2. The Living Climate Concept (+22 more)

### Community 7 - "package.json"
Cohesion: 0.09
Nodes (21): engines, node, name, private, type, version, autoprefixer, postcss (+13 more)

### Community 10 - "train_design_model.py"
Cohesion: 0.06
Nodes (14): _compute_archetype_score(), generate_synthetic_dataset(), load_config(), train_and_serialize_model(), load_ml_config(), load_model_artifact(), build_preprocessor(), compute_ranking_metrics() (+6 more)

### Community 17 - "WeatherTab.tsx"
Cohesion: 0.13
Nodes (23): ALERT_EMOJI, ALERT_STYLES, AlertBanner(), AlertBannerProps, AlertType, CountUp(), CustomTooltip(), DayCard() (+15 more)

### Community 18 - "RequirementsTab.tsx"
Cohesion: 0.43
Nodes (6): AnimatedIcon(), RequirementCard(), RequirementsTab(), mockRequirements, Requirement, getRequirements()

### Community 19 - "classify_zone"
Cohesion: 0.06
Nodes (20): classify_zone(), extract_climate_metrics(), load_zone_thresholds(), build_pdf_document(), collect_report_data(), generate_report_pdf(), test_collect_report_data_graceful_degradation(), make_fake_summary() (+12 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, composite, isolatedModules, jsx, lib, module (+12 more)

### Community 21 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, composite, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "test_spec_builder.py"
Cohesion: 0.05
Nodes (27): _build_cold_layout(), _build_composite_layout(), _build_hot_dry_layout(), build_spec(), _build_temperate_layout(), _build_warm_humid_layout(), load_spec_rules(), normalize_zone() (+19 more)

### Community 23 - "climate_service.py"
Cohesion: 0.07
Nodes (14): ClimateRequest, get_climate(), get_climate_get(), post_zone(), ClimateResponse, ZoneDiagnosticValues, ZoneRequest, ZoneResponse (+6 more)

### Community 24 - "DesignsTab.tsx"
Cohesion: 0.16
Nodes (16): classificationToZone(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey, DesignModel, DesignScores (+8 more)

### Community 25 - "test_requirements.py"
Cohesion: 0.07
Nodes (15): get_requirements(), _load_json_data(), normalize_alert_key(), normalize_zone_key(), test_get_requirements_all_zones(), test_get_requirements_case_and_separator_insensitivity(), test_get_requirements_unknown_alert_ignored(), test_get_requirements_unknown_zone_raises_value_error() (+7 more)

### Community 26 - "locationClimateZones.d.ts"
Cohesion: 0.50
Nodes (3): ClimateLookupResult, SearchableLocation, VerifiedLocation

### Community 27 - "README.md"
Cohesion: 0.50
Nodes (3): start backend, start frontend, Thermal_Shelter

### Community 28 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, framer-motion, leaflet, lucide-react, react, react-dom, react-leaflet, react-router-dom (+6 more)

### Community 30 - "ZoneRiskTab.tsx"
Cohesion: 0.36
Nodes (6): CircularProgress(), SemiCircleGauge(), ZoneRiskTab(), getRisk(), getZone(), mapToThemeZone()

### Community 31 - "test_design_dataset.py"
Cohesion: 0.11
Nodes (13): test_design_features_json_structure(), test_label_rules_json_structure(), test_reports_and_metrics_files(), test_scoring_cold_climate(), test_scoring_hot_dry_climate(), test_scoring_warm_humid_climate(), test_trained_model_artifact_and_prediction(), load_rules() (+5 more)

### Community 32 - "Core Guidelines & Operational Rules"
Cohesion: 0.20
Nodes (9): 1. Stability & Non-Breaking Changes, 2. Externalized Configurations & Constants, 3. Architecture Pattern for New Endpoints, 4. Data Provenance & Real-World Accuracy, 5. Code Quality & Beginner Readability, 6. Concise Completion Summary, Core Guidelines & Operational Rules, Incomplete Work Rules — Thermal_Shelter (EcoShelter) (+1 more)

### Community 33 - "clear_cache"
Cohesion: 0.20
Nodes (5): clear_cache(), test_get_climate_route_success(), test_get_climate_route_upstream_error_handling(), test_get_climate_summary_api_failure(), test_get_climate_summary_service_success()

### Community 34 - "test_designs_recommend.py"
Cohesion: 0.04
Nodes (25): ClimateDerivedMetrics, DataQuality, MonthlyClimateSummary, clean_and_process_climate_data(), test_clean_and_process_climate_data(), test_clean_empty_data_raises_error(), test_get_climate_route_lat_lon_validation(), client() (+17 more)

### Community 36 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 37 - "main.py"
Cohesion: 0.10
Nodes (8): EcoShelter Directory Architecture, post_risk(), lifespan(), RiskRequest, RiskResponse, ThermalStressDetail, WhyNumbers, Production & Test Dependencies Specification

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 42 - "test_design_ranker.py"
Cohesion: 0.07
Nodes (20): _generate_candidate_reasons(), generate_candidates(), load_materials(), load_presets(), load_ranking_rules(), normalize_weights(), normalize_zone(), rank_designs() (+12 more)

### Community 43 - "design_ml.py"
Cohesion: 0.13
Nodes (12): get_catalogue(), build_design_reasons(), get_model_info(), load_features_config(), load_model(), load_presets_config(), load_reasons_config(), normalize_weights() (+4 more)

### Community 44 - "assess_risk"
Cohesion: 0.08
Nodes (19): assess_risk(), _evaluate_cold_stress(), _evaluate_heat_stress(), _extract_risk_variables(), load_risk_thresholds(), make_fake_climate_summary(), test_assess_risk_empty_data_raises_value_error(), test_assess_risk_extreme_cold_stress() (+11 more)

### Community 45 - "useReducedMotion"
Cohesion: 0.10
Nodes (33): EmptyState(), EmptyStateProps, HeroSkyCanvas(), HeroSkyCanvasProps, createCustomIcon(), floodColor(), FlyController(), LocationPicker() (+25 more)

### Community 46 - "ml_recommender_service.py"
Cohesion: 0.13
Nodes (8): post_ml_recommend(), MLDesignPrediction, MLModelMetadata, MLRecommendRequest, MLRecommendResponse, extract_features(), _generate_recommendation_reason(), predict_recommended_designs()

### Community 47 - "design_schema.py"
Cohesion: 0.06
Nodes (22): is_model_loaded(), post_design_rank(), post_design_spec(), extract_climate_features(), post_designs_recommend(), CourtyardSpec, DesignModel, DesignRankRequest (+14 more)

### Community 48 - "ErrorDetail"
Cohesion: 0.18
Nodes (6): post_requirements(), ErrorDetail, RequirementsRequest, RequirementsResponse, StrategyItem, WeatherTipItem

### Community 49 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+2 more)

### Community 50 - "planData.ts"
Cohesion: 0.14
Nodes (13): COLD_PLAN, COMPOSITE_PLAN, Door, HOT_DRY_PLAN, mockPlanSpec, PlanZoneKey, Room, TEMPERATE_PLAN (+5 more)

### Community 51 - "ShelterTab.tsx"
Cohesion: 0.17
Nodes (16): PlanTab(), CanvasErrorBoundary, CanvasSkeleton(), ErrorBoundaryProps, ErrorBoundaryState, isWebGLAvailable(), MONTHS, ShelterTab() (+8 more)

### Community 52 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 53 - "post_report"
Cohesion: 0.15
Nodes (3): post_report(), PlotSizeInput, ReportRequest

### Community 56 - "analyzeService.ts"
Cohesion: 0.11
Nodes (26): RecommendedDesignsSectionProps, LocationContext, LocationContextType, AnalysisInfo, AnalysisResponse, analyzeService, ClimateApiResponse, DesignModel (+18 more)

### Community 57 - "build_design_dataset.py"
Cohesion: 0.16
Nodes (8): test_processed_dataset_integrity(), build_dataset(), load_climate_ranges(), load_designs(), load_feature_order(), main(), sample_climate_points(), verify_and_print_summary()

### Community 58 - "load_catalogue"
Cohesion: 0.15
Nodes (3): load_catalogue(), TestLoadCatalogueDuplicateGuards, _write_catalogue()

### Community 60 - "Model Card — EcoShelter Design Recommender Surrogate Model"
Cohesion: 0.11
Nodes (18): 1. Model Overview, 2. Purpose & Intended Use, 3. Data & Sampling Strategy, 4. How Labels Were Generated (Ground Truth Construction), 5. Evaluation Metrics & Model Comparison, 6. Key Driving Features (Permutation Importance), 7. Limitations & Honest Disclaimer, Architectural Ranking Fidelity (+10 more)

### Community 63 - "DashboardPage.tsx"
Cohesion: 0.23
Nodes (12): confidenceWidth(), matchLevelColor(), mlPredictionToCard(), RecommendedDesignsSection(), staticDesignToCard(), UnifiedCard, getFallbackSvg(), miniPinIcon (+4 more)

### Community 64 - "ShelterCanvas.tsx"
Cohesion: 0.26
Nodes (12): PlanSpec, DesignSpecResponse, ActiveClimateArchetype, CLIMATE_SHELTER_CONFIGS, ClimateFeatureAnnotation, ClimateShelterConfig, PlanSVGProps, ClimateShelterModel() (+4 more)

### Community 65 - "mock/index.ts"
Cohesion: 0.19
Nodes (9): ClimateMonth, mockClimateData, mockShelterDesigns, DailyForecast, HourlyForecast, mockWeather, WeatherData, mockZoneRisk (+1 more)

### Community 67 - "Non-Negotiable Operational Rules"
Cohesion: 0.18
Nodes (10): 1. Scope Protection & Library Isolation, 2. Backward Compatibility & Test Invariants, 3. Externalized Configuration & Zero Hardcoded Constants, 4. Data Provenance & Fact Integrity, 5. Intellectual Honesty in Model Documentation, 6. Clean, Simple, Well-Commented Code with Type Hints, 7. Step-by-Step Reporting Contract, Goal (+2 more)

### Community 68 - "Model Card: Vernacular Shelter Design ML Recommender"
Cohesion: 0.20
Nodes (9): 1. Model Overview, 2. Intended Use, 3. Input Features & Output Targets, 4. Honest Training Formulation & Limitations (Rule 5 Compliance), 5. Training Pipeline & Reproducibility, 6. Performance Metrics, Input Features (8 Continuous Microclimatic Dimensions):, Model Card: Vernacular Shelter Design ML Recommender (+1 more)

### Community 69 - "ClimateTab.tsx"
Cohesion: 0.70
Nodes (4): ClimateSkeleton(), ClimateTab(), CustomClimateChart(), getClimate()

### Community 71 - "Analyze Pipeline Specification"
Cohesion: 0.67
Nodes (3): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope

## Knowledge Gaps
- **238 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 680 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_environment()` connect `analyze_environment` to `report_service.py`, `classify_zone`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `TestCatalogueDesignSchema` connect `TestCatalogueDesignSchema` to `json`, `design_ml.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `TestProductionCatalogue` connect `TestProductionCatalogue` to `json`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07564102564102564 - nodes in this community are weakly interconnected._
- **Should `report_service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.052943354313217325 - nodes in this community are weakly interconnected._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._