# Graph Report - Backend  (2026-10-27)

## Corpus Check
- 126 files · ~148,078 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 5, .example 2)

## Summary
- 957 nodes · 1828 edges · 64 communities (42 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6adc277`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyze_environment
- analysis_schema.py
- LibraryPage.tsx
- _patch_services
- App.tsx
- DESIGN SYSTEM
- frontend/README.md
- package.json
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization
- WeatherTab.tsx
- LocationSearch.tsx
- test_zone_classifier.py
- compilerOptions
- compilerOptions
- test_spec_builder.py
- post_zone
- useReducedMotion
- test_requirements.py
- locationClimateZones.d.ts
- README.md
- dependencies
- main.py
- test_api.py
- lucide-react
- Core Guidelines & Operational Rules
- ClimateServiceError
- climate_service.py
- vercel.json
- .oxlintrc.json
- post_risk
- React + TypeScript + Vite
- tsconfig.json
- test_design_ranker.py
- Analyze Pipeline Specification
- test_risk.py
- DesignsTab.tsx
- calibrate_zones.py
- design_schema.py
- ShelterCanvas.tsx
- devDependencies
- PlanTab.tsx
- DashboardPage.tsx
- scripts
- requirements_schema.py
- assess_risk
- analysis/risk.py
- LocationContext.tsx
- EmergencyPage.tsx
- test_post_risk_success
- main.tsx
- health
- sample_raw_climate_data
- engines

## God Nodes (most connected - your core abstractions)
1. `useReducedMotion()` - 54 edges
2. `analyze_environment()` - 29 edges
3. `react` - 23 edges
4. `assess_risk()` - 22 edges
5. `lucide-react` - 22 edges
6. `build_spec()` - 21 edges
7. `framer-motion` - 21 edges
8. `classify_zone()` - 19 edges
9. `ClimateServiceError` - 19 edges
10. `useClimateZone()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `10. Component Catalogue` --references--> `LocationSearch()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/LocationSearch.tsx
- `evaluate_city()` --calls--> `classify_zone()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/analysis/zone_classifier.py
- `evaluate_city()` --calls--> `get_climate_summary()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/services/climate_service.py
- `10. Component Catalogue` --references--> `DisclaimerBanner()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/DisclaimerBanner.tsx
- `_extract_risk_variables()` --uses--> `ClimateResponse`  [INFERRED]
  backend/app/analysis/risk.py → backend/app/schemas/climate_schema.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (64 total, 22 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.08
Nodes (9): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, TestClassification, TestConditions (+1 more)

### Community 1 - "analysis_schema.py"
Cohesion: 0.09
Nodes (13): analyze(), Settings, AnalysisInfo, AnalysisResponse, ErrorResponse, FloodInfo, LocationInfo, LocationRequest (+5 more)

### Community 2 - "LibraryPage.tsx"
Cohesion: 0.11
Nodes (20): CLIMATE_ZONES, findNearestVerifiedCity(), getAllSearchableLocations(), haversineDistanceKm(), resolveLocationClimate(), UNLISTED_SAMPLE_DISTRICTS, VERIFIED_CLIMATE_ZONES, ALL_ZONES (+12 more)

### Community 3 - "_patch_services"
Cohesion: 0.10
Nodes (5): _patch_services(), TestCoordinateValidation, TestForecastInResponse, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.16
Nodes (21): AnimatedRoutes(), App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, Footer() (+13 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (32): DisclaimerBanner(), 10. Component Catalogue, 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet (+24 more)

### Community 7 - "package.json"
Cohesion: 0.12
Nodes (16): name, private, type, version, autoprefixer, postcss, recharts, tailwindcss (+8 more)

### Community 17 - "WeatherTab.tsx"
Cohesion: 0.05
Nodes (49): ALERT_EMOJI, ALERT_STYLES, AlertBanner(), AlertBannerProps, AlertType, CountUp(), CustomTooltip(), DayCard() (+41 more)

### Community 18 - "LocationSearch.tsx"
Cohesion: 0.10
Nodes (21): LoadingSpinner(), LocationSearch(), ZONE_EMOJIS, ZONE_LABELS, ClimateMonth, mockClimateData, mockShelterDesigns, MOCK_LOCATIONS (+13 more)

### Community 19 - "test_zone_classifier.py"
Cohesion: 0.10
Nodes (14): classify_zone(), extract_climate_metrics(), load_zone_thresholds(), make_fake_summary(), test_classify_zone_cold(), test_classify_zone_cold_boundary(), test_classify_zone_composite(), test_classify_zone_composite_boundary() (+6 more)

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
Cohesion: 0.21
Nodes (4): post_zone(), ZoneDiagnosticValues, ZoneRequest, ZoneResponse

### Community 24 - "useReducedMotion"
Cohesion: 0.19
Nodes (17): ClimateTab(), CustomClimateChart(), AnimatedIcon(), RequirementCard(), RequirementsTab(), CircularProgress(), classificationToZone(), SemiCircleGauge() (+9 more)

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

### Community 29 - "main.py"
Cohesion: 0.10
Nodes (9): EcoShelter Directory Architecture, get_climate(), post_design_rank(), post_design_spec(), ErrorDetail, DesignSpecRequest, DesignSpecResponse, get_climate_summary() (+1 more)

### Community 30 - "test_api.py"
Cohesion: 0.13
Nodes (8): DailyForecastItem, HourlyForecastItem, WeatherInfo, _extract_current(), get_weather(), _parse_daily(), _parse_hourly(), TestHealth

### Community 31 - "lucide-react"
Cohesion: 0.16
Nodes (17): HeroSkyCanvas(), HeroSkyCanvasProps, createCustomIcon(), floodColor(), FlyController(), LocationPicker(), MapClickHandler(), MapResizer() (+9 more)

### Community 32 - "Core Guidelines & Operational Rules"
Cohesion: 0.20
Nodes (9): 1. Stability & Non-Breaking Changes, 2. Externalized Configurations & Constants, 3. Architecture Pattern for New Endpoints, 4. Data Provenance & Real-World Accuracy, 5. Code Quality & Beginner Readability, 6. Concise Completion Summary, Core Guidelines & Operational Rules, Incomplete Work Rules — Thermal_Shelter (EcoShelter) (+1 more)

### Community 33 - "ClimateServiceError"
Cohesion: 0.13
Nodes (9): clear_cache(), ClimateServiceError, _fetch_archive_data(), test_clean_empty_data_raises_error(), test_get_climate_route_lat_lon_validation(), test_get_climate_route_success(), test_get_climate_route_upstream_error_handling(), test_get_climate_summary_api_failure() (+1 more)

### Community 34 - "climate_service.py"
Cohesion: 0.11
Nodes (8): ClimateDerivedMetrics, DataQuality, MonthlyClimateSummary, clean_and_process_climate_data(), _compute_calendar_date_range(), _get_cache_key(), _load_config(), test_clean_and_process_climate_data()

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

### Community 44 - "test_risk.py"
Cohesion: 0.12
Nodes (11): make_fake_climate_summary(), test_assess_risk_extreme_cold_stress(), test_assess_risk_extreme_heat_stress(), test_assess_risk_high_cold_stress(), test_assess_risk_high_heat_stress(), test_assess_risk_low_cold_stress(), test_assess_risk_low_heat_stress(), test_assess_risk_matches_frontend_zonerisk_shape() (+3 more)

### Community 45 - "DesignsTab.tsx"
Cohesion: 0.18
Nodes (13): classificationToZone(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey, DesignModel, DesignScores (+5 more)

### Community 47 - "design_schema.py"
Cohesion: 0.11
Nodes (10): CourtyardSpec, DesignModel, DesignRankRequest, DesignRankResponse, DesignScores, DoorSpec, PlotSizeSpec, RoomSpec (+2 more)

### Community 48 - "ShelterCanvas.tsx"
Cohesion: 0.23
Nodes (12): ActiveClimateArchetype, CLIMATE_SHELTER_CONFIGS, ClimateFeatureAnnotation, ClimateShelterConfig, ClimateShelterModel(), FeaturePin(), ShelterCanvas(), ShelterCanvasProps (+4 more)

### Community 49 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+2 more)

### Community 50 - "PlanTab.tsx"
Cohesion: 0.22
Nodes (11): PlanTab(), EmptyState(), EmptyStateProps, ToastContext, ToastContextType, ToastMessage, ToastType, useToast() (+3 more)

### Community 51 - "DashboardPage.tsx"
Cohesion: 0.24
Nodes (12): RecommendedDesignsSection(), CanvasSkeleton(), MONTHS, ShelterTab(), useLocationContext(), DashboardPage(), miniPinIcon, TABS (+4 more)

### Community 52 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 53 - "requirements_schema.py"
Cohesion: 0.19
Nodes (5): post_requirements(), RequirementsRequest, RequirementsResponse, StrategyItem, WeatherTipItem

### Community 54 - "assess_risk"
Cohesion: 0.21
Nodes (6): assess_risk(), _evaluate_cold_stress(), _evaluate_heat_stress(), _extract_risk_variables(), load_risk_thresholds(), test_assess_risk_empty_data_raises_value_error()

### Community 56 - "LocationContext.tsx"
Cohesion: 0.31
Nodes (7): RecommendedDesignsSectionProps, LocationContext, LocationContextType, AnalysisResponse, GeocodedLocation, locationService, mockResults

### Community 57 - "EmergencyPage.tsx"
Cohesion: 0.33
Nodes (6): pageVariants, EMERGENCY_DATA, EmergencyPage(), EmergencyType, ProgressRing(), TABS

## Knowledge Gaps
- **206 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 465 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_environment()` connect `analyze_environment` to `analysis_schema.py`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `10. Component Catalogue` connect `DESIGN SYSTEM` to `LocationSearch.tsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07564102564102564 - nodes in this community are weakly interconnected._
- **Should `analysis_schema.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Should `_patch_services` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._