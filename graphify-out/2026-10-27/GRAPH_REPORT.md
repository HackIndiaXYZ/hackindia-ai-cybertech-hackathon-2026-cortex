# Graph Report - Backend  (2026-10-27)

## Corpus Check
- 131 files · ~154,454 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 5, .example 2)

## Summary
- 1044 nodes · 2083 edges · 65 communities (43 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `13021074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyze_environment
- flood_service.py
- LibraryPage.tsx
- _patch_services
- App.tsx
- DESIGN SYSTEM
- frontend/README.md
- package.json
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization
- WeatherTab.tsx
- mock/index.ts
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
- analysis_schema.py
- weather_service.py
- react
- Core Guidelines & Operational Rules
- test_report.py
- report_service.py
- vercel.json
- .oxlintrc.json
- post_risk
- React + TypeScript + Vite
- tsconfig.json
- test_design_ranker.py
- Analyze Pipeline Specification
- assess_risk
- useReducedMotion
- get_climate_summary
- design_schema.py
- requirements_schema.py
- devDependencies
- ShelterTab.tsx
- DashboardPage.tsx
- scripts
- post_report
- collect_report_data
- NumberedCanvas
- api.ts
- suitability.d.ts
- main.tsx
- mock_all_services
- health
- sample_raw_climate_data
- vite.config.ts
- engines

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

## Communities (65 total, 22 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.08
Nodes (9): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, TestClassification, TestConditions (+1 more)

### Community 1 - "flood_service.py"
Cohesion: 0.10
Nodes (8): Settings, FloodInfo, _assess_risk(), get_flood(), EcoShelter Documentation & API Reference, GloFAS Flood Risk Model & Interpretation, evaluate_city(), main()

### Community 2 - "LibraryPage.tsx"
Cohesion: 0.14
Nodes (17): CLIMATE_ZONES, findNearestVerifiedCity(), getAllSearchableLocations(), haversineDistanceKm(), resolveLocationClimate(), UNLISTED_SAMPLE_DISTRICTS, VERIFIED_CLIMATE_ZONES, ALL_ZONES (+9 more)

### Community 3 - "_patch_services"
Cohesion: 0.09
Nodes (6): LocationInfo, _patch_services(), TestCoordinateValidation, TestForecastInResponse, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.10
Nodes (33): AnimatedRoutes(), App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, DisclaimerBanner() (+25 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (30): 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet, 1. Product Overview, 2. The Living Climate Concept (+22 more)

### Community 7 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, type, version, autoprefixer, postcss, @react-three/drei, @react-three/fiber (+9 more)

### Community 17 - "WeatherTab.tsx"
Cohesion: 0.12
Nodes (24): ALERT_EMOJI, ALERT_STYLES, AlertBanner(), AlertBannerProps, AlertType, CountUp(), CustomTooltip(), DayCard() (+16 more)

### Community 18 - "mock/index.ts"
Cohesion: 0.18
Nodes (10): ClimateMonth, mockClimateData, mockShelterDesigns, DailyForecast, HourlyForecast, mockWeather, WeatherData, mockZoneRisk (+2 more)

### Community 19 - "classify_zone"
Cohesion: 0.11
Nodes (13): classify_zone(), extract_climate_metrics(), load_zone_thresholds(), make_fake_summary(), test_classify_zone_cold(), test_classify_zone_cold_boundary(), test_classify_zone_composite(), test_classify_zone_composite_boundary() (+5 more)

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
Cohesion: 0.17
Nodes (4): post_zone(), ZoneDiagnosticValues, ZoneRequest, ZoneResponse

### Community 24 - "DesignsTab.tsx"
Cohesion: 0.21
Nodes (14): classificationToZone(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey, DesignModel, DesignScores (+6 more)

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

### Community 29 - "analysis_schema.py"
Cohesion: 0.10
Nodes (9): EcoShelter Directory Architecture, analyze(), post_design_spec(), AnalysisInfo, AnalysisResponse, ErrorDetail, ErrorResponse, LocationRequest (+1 more)

### Community 30 - "weather_service.py"
Cohesion: 0.20
Nodes (6): DailyForecastItem, HourlyForecastItem, _extract_current(), get_weather(), _parse_daily(), _parse_hourly()

### Community 31 - "react"
Cohesion: 0.22
Nodes (12): createCustomIcon(), floodColor(), FlyController(), LocationPicker(), MapClickHandler(), MapResizer(), NominatimResult, nominatimSearch() (+4 more)

### Community 32 - "Core Guidelines & Operational Rules"
Cohesion: 0.20
Nodes (9): 1. Stability & Non-Breaking Changes, 2. Externalized Configurations & Constants, 3. Architecture Pattern for New Endpoints, 4. Data Provenance & Real-World Accuracy, 5. Code Quality & Beginner Readability, 6. Concise Completion Summary, Core Guidelines & Operational Rules, Incomplete Work Rules — Thermal_Shelter (EcoShelter) (+1 more)

### Community 33 - "test_report.py"
Cohesion: 0.06
Nodes (18): WeatherInfo, clean_and_process_climate_data(), clear_cache(), ClimateServiceError, TestHealth, test_clean_and_process_climate_data(), test_clean_empty_data_raises_error(), test_get_climate_route_lat_lon_validation() (+10 more)

### Community 34 - "report_service.py"
Cohesion: 0.10
Nodes (4): ClimateDerivedMetrics, ClimateResponse, DataQuality, MonthlyClimateSummary

### Community 36 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 37 - "post_risk"
Cohesion: 0.19
Nodes (5): post_risk(), RiskRequest, RiskResponse, ThermalStressDetail, WhyNumbers

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 42 - "test_design_ranker.py"
Cohesion: 0.07
Nodes (20): _generate_candidate_reasons(), generate_candidates(), load_materials(), load_presets(), load_ranking_rules(), normalize_weights(), normalize_zone(), rank_designs() (+12 more)

### Community 43 - "Analyze Pipeline Specification"
Cohesion: 0.67
Nodes (3): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope

### Community 44 - "assess_risk"
Cohesion: 0.07
Nodes (18): assess_risk(), _evaluate_cold_stress(), _evaluate_heat_stress(), _extract_risk_variables(), load_risk_thresholds(), make_fake_climate_summary(), test_assess_risk_empty_data_raises_value_error(), test_assess_risk_extreme_cold_stress() (+10 more)

### Community 45 - "useReducedMotion"
Cohesion: 0.11
Nodes (26): CircularProgress(), SemiCircleGauge(), ZoneRiskTab(), EmptyState(), EmptyStateProps, HeroSkyCanvas(), HeroSkyCanvasProps, ScrollStory() (+18 more)

### Community 46 - "get_climate_summary"
Cohesion: 0.11
Nodes (8): ClimateRequest, get_climate(), get_climate_get(), _compute_calendar_date_range(), _fetch_archive_data(), _get_cache_key(), get_climate_summary(), _load_config()

### Community 47 - "design_schema.py"
Cohesion: 0.09
Nodes (13): post_design_rank(), CourtyardSpec, DesignModel, DesignRankRequest, DesignRankResponse, DesignScores, DesignSpecRequest, DesignSpecResponse (+5 more)

### Community 48 - "requirements_schema.py"
Cohesion: 0.19
Nodes (5): post_requirements(), RequirementsRequest, RequirementsResponse, StrategyItem, WeatherTipItem

### Community 49 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+2 more)

### Community 50 - "ShelterTab.tsx"
Cohesion: 0.08
Nodes (36): CanvasErrorBoundary, CanvasSkeleton(), ErrorBoundaryProps, ErrorBoundaryState, isWebGLAvailable(), MONTHS, ShelterTab(), COLD_PLAN (+28 more)

### Community 51 - "DashboardPage.tsx"
Cohesion: 0.17
Nodes (21): ClimateSkeleton(), ClimateTab(), CustomClimateChart(), PlanTab(), RecommendedDesignsSection(), AnimatedIcon(), RequirementCard(), RequirementsTab() (+13 more)

### Community 52 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 53 - "post_report"
Cohesion: 0.15
Nodes (3): post_report(), PlotSizeInput, ReportRequest

### Community 54 - "collect_report_data"
Cohesion: 0.20
Nodes (5): get_location(), build_pdf_document(), collect_report_data(), generate_report_pdf(), test_collect_report_data_graceful_degradation()

### Community 56 - "api.ts"
Cohesion: 0.09
Nodes (28): RecommendedDesignsSectionProps, LocationContextType, AnalysisInfo, AnalysisResponse, analyzeService, ClimateApiResponse, DesignModel, DesignRankResponse (+20 more)

### Community 57 - "suitability.d.ts"
Cohesion: 0.50
Nodes (3): VernacularDesign, SuitabilityResult, SuitabilityStatus

## Knowledge Gaps
- **204 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+199 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 500 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `assess_risk()` connect `assess_risk` to `test_report.py`, `report_service.py`, `post_risk`, `classify_zone`, `collect_report_data`, `analysis_schema.py`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `_patch_services()` connect `_patch_services` to `test_report.py`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `collect_report_data()` connect `collect_report_data` to `analyze_environment`, `flood_service.py`, `report_service.py`, `test_report.py`, `test_design_ranker.py`, `assess_risk`, `get_climate_summary`, `classify_zone`, `test_requirements.py`, `weather_service.py`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _204 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07564102564102564 - nodes in this community are weakly interconnected._
- **Should `flood_service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10144927536231885 - nodes in this community are weakly interconnected._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13756613756613756 - nodes in this community are weakly interconnected._