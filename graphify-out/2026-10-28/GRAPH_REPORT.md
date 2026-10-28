# Graph Report - Backend  (2026-10-27)

## Corpus Check
- 132 files · ~156,624 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 5, .example 2)

## Summary
- 1054 nodes · 2103 edges · 60 communities (41 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13021074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyze_environment
- logging
- LibraryPage.tsx
- test_api.py
- App.tsx
- DESIGN SYSTEM
- frontend/README.md
- package.json
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization
- WeatherTab.tsx
- RequirementsTab.tsx
- classify_zone
- compilerOptions
- compilerOptions
- test_spec_builder.py
- post_zone
- DesignsTab.tsx
- test_requirements.py
- locationClimateZones.d.ts
- README.md
- dependencies
- main.py
- ZoneRiskTab.tsx
- calibrate_zones.py
- Core Guidelines & Operational Rules
- ClimateServiceError
- climate_service.py
- vercel.json
- .oxlintrc.json
- routes/risk.py
- React + TypeScript + Vite
- tsconfig.json
- test_design_ranker.py
- test_post_risk_success
- assess_risk
- useReducedMotion
- get_climate
- analysis_schema.py
- get_requirements
- devDependencies
- ShelterTab.tsx
- DashboardPage.tsx
- scripts
- post_report
- report_service.py
- NumberedCanvas
- api.ts
- WeightsInput
- test_report.py
- sample_raw_climate_data

## God Nodes (most connected - your core abstractions)
1. `useReducedMotion()` - 54 edges
2. `analyze_environment()` - 31 edges
3. `useClimateZone()` - 25 edges
4. `assess_risk()` - 24 edges
5. `react` - 24 edges
6. `lucide-react` - 22 edges
7. `build_spec()` - 21 edges
8. `classify_zone()` - 21 edges
9. `framer-motion` - 21 edges
10. `useLocationContext()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `evaluate_city()` --calls--> `classify_zone()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/analysis/zone_classifier.py
- `evaluate_city()` --calls--> `get_climate_summary()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/services/climate_service.py
- `10. Component Catalogue` --references--> `DisclaimerBanner()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/DisclaimerBanner.tsx
- `10. Component Catalogue` --references--> `LocationSearch()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/LocationSearch.tsx
- `_extract_risk_variables()` --uses--> `ClimateResponse`  [INFERRED]
  backend/app/analysis/risk.py → backend/app/schemas/climate_schema.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (60 total, 19 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.07
Nodes (10): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, AnalysisInfo, TestClassification (+2 more)

### Community 1 - "logging"
Cohesion: 0.06
Nodes (21): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope, analyze(), Settings, AnalysisResponse, DailyForecastItem, ErrorResponse (+13 more)

### Community 2 - "LibraryPage.tsx"
Cohesion: 0.09
Nodes (29): CLIMATE_ZONES, findNearestVerifiedCity(), getAllSearchableLocations(), haversineDistanceKm(), resolveLocationClimate(), UNLISTED_SAMPLE_DISTRICTS, VERIFIED_CLIMATE_ZONES, ALL_ZONES (+21 more)

### Community 3 - "test_api.py"
Cohesion: 0.09
Nodes (7): LocationInfo, _patch_services(), TestCoordinateValidation, TestForecastInResponse, TestHealth, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.06
Nodes (45): AnimatedRoutes(), App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, DisclaimerBanner() (+37 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (30): 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet, 1. Product Overview, 2. The Living Climate Concept (+22 more)

### Community 7 - "package.json"
Cohesion: 0.10
Nodes (20): engines, node, name, private, type, version, autoprefixer, leaflet (+12 more)

### Community 17 - "WeatherTab.tsx"
Cohesion: 0.12
Nodes (24): ALERT_EMOJI, ALERT_STYLES, AlertBanner(), AlertBannerProps, AlertType, CountUp(), CustomTooltip(), DayCard() (+16 more)

### Community 18 - "RequirementsTab.tsx"
Cohesion: 0.39
Nodes (7): AnimatedIcon(), RequirementCard(), RequirementsTab(), mockRequirements, Requirement, getRequirements(), mapToThemeZone()

### Community 19 - "classify_zone"
Cohesion: 0.11
Nodes (12): classify_zone(), extract_climate_metrics(), load_zone_thresholds(), ClimateResponse, make_fake_summary(), test_classify_zone_cold(), test_classify_zone_cold_boundary(), test_classify_zone_composite() (+4 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, composite, isolatedModules, jsx, lib, module (+12 more)

### Community 21 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, composite, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "test_spec_builder.py"
Cohesion: 0.05
Nodes (27): _build_cold_layout(), _build_composite_layout(), _build_hot_dry_layout(), build_spec(), _build_temperate_layout(), _build_warm_humid_layout(), load_spec_rules(), normalize_zone() (+19 more)

### Community 23 - "post_zone"
Cohesion: 0.18
Nodes (4): post_zone(), ZoneDiagnosticValues, ZoneRequest, ZoneResponse

### Community 24 - "DesignsTab.tsx"
Cohesion: 0.16
Nodes (17): classificationToZone(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey, DesignModel, DesignScores (+9 more)

### Community 25 - "test_requirements.py"
Cohesion: 0.08
Nodes (11): test_get_requirements_all_zones(), test_get_requirements_case_and_separator_insensitivity(), test_get_requirements_unknown_alert_ignored(), test_get_requirements_unknown_zone_raises_value_error(), test_get_requirements_with_alerts(), test_get_requirements_with_cold_wave_alert(), test_post_requirements_invalid_types_returns_422(), test_post_requirements_missing_zone_returns_422() (+3 more)

### Community 26 - "locationClimateZones.d.ts"
Cohesion: 0.50
Nodes (3): ClimateLookupResult, SearchableLocation, VerifiedLocation

### Community 27 - "README.md"
Cohesion: 0.50
Nodes (3): start backend, start frontend, Thermal_Shelter

### Community 28 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, framer-motion, leaflet, lucide-react, react, react-dom, react-leaflet, react-router-dom (+6 more)

### Community 29 - "main.py"
Cohesion: 0.22
Nodes (3): EcoShelter Directory Architecture, health(), Production & Test Dependencies Specification

### Community 30 - "ZoneRiskTab.tsx"
Cohesion: 0.39
Nodes (5): CircularProgress(), SemiCircleGauge(), ZoneRiskTab(), getRisk(), getZone()

### Community 32 - "Core Guidelines & Operational Rules"
Cohesion: 0.20
Nodes (9): 1. Stability & Non-Breaking Changes, 2. Externalized Configurations & Constants, 3. Architecture Pattern for New Endpoints, 4. Data Provenance & Real-World Accuracy, 5. Code Quality & Beginner Readability, 6. Concise Completion Summary, Core Guidelines & Operational Rules, Incomplete Work Rules — Thermal_Shelter (EcoShelter) (+1 more)

### Community 33 - "ClimateServiceError"
Cohesion: 0.12
Nodes (10): clear_cache(), ClimateServiceError, _fetch_archive_data(), get_climate_summary(), test_clean_empty_data_raises_error(), test_get_climate_route_lat_lon_validation(), test_get_climate_route_success(), test_get_climate_route_upstream_error_handling() (+2 more)

### Community 34 - "climate_service.py"
Cohesion: 0.10
Nodes (8): ClimateDerivedMetrics, DataQuality, MonthlyClimateSummary, clean_and_process_climate_data(), _compute_calendar_date_range(), _get_cache_key(), _load_config(), test_clean_and_process_climate_data()

### Community 36 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 37 - "routes/risk.py"
Cohesion: 0.18
Nodes (5): post_risk(), RiskRequest, RiskResponse, ThermalStressDetail, WhyNumbers

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 42 - "test_design_ranker.py"
Cohesion: 0.07
Nodes (20): _generate_candidate_reasons(), generate_candidates(), load_materials(), load_presets(), load_ranking_rules(), normalize_weights(), normalize_zone(), rank_designs() (+12 more)

### Community 44 - "assess_risk"
Cohesion: 0.09
Nodes (15): assess_risk(), _evaluate_cold_stress(), _evaluate_heat_stress(), _extract_risk_variables(), load_risk_thresholds(), make_fake_climate_summary(), test_assess_risk_extreme_cold_stress(), test_assess_risk_extreme_heat_stress() (+7 more)

### Community 45 - "useReducedMotion"
Cohesion: 0.11
Nodes (33): EmptyState(), EmptyStateProps, HeroSkyCanvas(), HeroSkyCanvasProps, createCustomIcon(), floodColor(), FlyController(), LocationPicker() (+25 more)

### Community 46 - "get_climate"
Cohesion: 0.29
Nodes (3): ClimateRequest, get_climate(), get_climate_get()

### Community 47 - "analysis_schema.py"
Cohesion: 0.07
Nodes (14): post_design_rank(), post_design_spec(), ErrorDetail, CourtyardSpec, DesignModel, DesignRankRequest, DesignRankResponse, DesignScores (+6 more)

### Community 48 - "get_requirements"
Cohesion: 0.11
Nodes (9): get_requirements(), _load_json_data(), normalize_alert_key(), normalize_zone_key(), post_requirements(), RequirementsRequest, RequirementsResponse, StrategyItem (+1 more)

### Community 49 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+2 more)

### Community 50 - "ShelterTab.tsx"
Cohesion: 0.07
Nodes (35): CanvasErrorBoundary, CanvasSkeleton(), ErrorBoundaryProps, ErrorBoundaryState, isWebGLAvailable(), MONTHS, COLD_PLAN, COMPOSITE_PLAN (+27 more)

### Community 51 - "DashboardPage.tsx"
Cohesion: 0.25
Nodes (17): ClimateSkeleton(), ClimateTab(), CustomClimateChart(), PlanTab(), RecommendedDesignsSection(), ShelterTab(), useToast(), useLocationContext() (+9 more)

### Community 52 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 53 - "post_report"
Cohesion: 0.15
Nodes (3): post_report(), PlotSizeInput, ReportRequest

### Community 54 - "report_service.py"
Cohesion: 0.13
Nodes (4): build_pdf_document(), collect_report_data(), generate_report_pdf(), test_collect_report_data_graceful_degradation()

### Community 56 - "api.ts"
Cohesion: 0.12
Nodes (24): RecommendedDesignsSectionProps, LocationContext, LocationContextType, AnalysisInfo, AnalysisResponse, analyzeService, ClimateApiResponse, DesignModel (+16 more)

### Community 59 - "test_report.py"
Cohesion: 0.08
Nodes (10): mock_all_services(), test_post_report_alias_coords(), test_post_report_invalid_coords(), test_post_report_missing_coords(), test_post_report_success(), test_assess_risk_empty_data_raises_value_error(), test_post_risk_coordinate_validation(), test_post_zone_endpoint_success() (+2 more)

## Knowledge Gaps
- **208 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 504 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_environment()` connect `analyze_environment` to `logging`, `report_service.py`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `assess_risk()` connect `assess_risk` to `test_report.py`, `classify_zone`, `routes/risk.py`, `report_service.py`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `collect_report_data()` connect `report_service.py` to `analyze_environment`, `ClimateServiceError`, `logging`, `test_design_ranker.py`, `assess_risk`, `get_requirements`, `classify_zone`, `test_report.py`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07293868921775898 - nodes in this community are weakly interconnected._
- **Should `logging` be split into smaller, more focused modules?**
  _Cohesion score 0.0636734693877551 - nodes in this community are weakly interconnected._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08748615725359911 - nodes in this community are weakly interconnected._