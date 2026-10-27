# Graph Report - Backend  (2026-10-26)

## Corpus Check
- 105 files · ~130,628 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 5, (none) 5, .example 2)

## Summary
- 695 nodes · 1336 edges · 47 communities (32 shown, 15 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.94)
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
- ShelterCanvas.tsx
- mock/index.ts
- test_zone_classifier.py
- compilerOptions
- compilerOptions
- planData.ts
- zone.py
- useReducedMotion
- classify_zone
- locationClimateZones.d.ts
- README.md
- dependencies
- main.py
- test_api.py
- analyze
- Core Guidelines & Operational Rules
- test_climate.py
- climate_service.py
- vercel.json
- .oxlintrc.json
- LocationPicker.tsx
- React + TypeScript + Vite
- tsconfig.json
- devDependencies
- analysis.py
- scripts
- ClimateServiceError
- calibrate_zones.py

## God Nodes (most connected - your core abstractions)
1. `useReducedMotion()` - 54 edges
2. `analyze_environment()` - 29 edges
3. `lucide-react` - 22 edges
4. `react` - 22 edges
5. `framer-motion` - 21 edges
6. `useClimateZone()` - 19 edges
7. `compilerOptions` - 19 edges
8. `DESIGN SYSTEM` - 18 edges
9. `classify_zone()` - 17 edges
10. `ClimateServiceError` - 15 edges

## Surprising Connections (you probably didn't know these)
- `evaluate_city()` --calls--> `classify_zone()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/analysis/zone_classifier.py
- `evaluate_city()` --calls--> `get_climate_summary()`  [EXTRACTED]
  scripts/calibrate_zones.py → backend/app/services/climate_service.py
- `10. Component Catalogue` --references--> `DisclaimerBanner()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/DisclaimerBanner.tsx
- `10. Component Catalogue` --references--> `LocationSearch()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/LocationSearch.tsx
- `analyze()` --uses--> `AnalysisResponse`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (47 total, 15 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.07
Nodes (9): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, TestClassification, TestConditions (+1 more)

### Community 1 - "analysis_schema.py"
Cohesion: 0.17
Nodes (4): AnalysisInfo, AnalysisResponse, ErrorResponse, LocationRequest

### Community 2 - "LibraryPage.tsx"
Cohesion: 0.07
Nodes (35): RecommendedDesignsSectionProps, DayCardProps, LocationContext, LocationContextType, CLIMATE_ZONES, findNearestVerifiedCity(), getAllSearchableLocations(), haversineDistanceKm() (+27 more)

### Community 3 - "_patch_services"
Cohesion: 0.10
Nodes (5): _patch_services(), TestCoordinateValidation, TestForecastInResponse, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.09
Nodes (34): App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, DisclaimerBanner(), Footer() (+26 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (30): 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet, 1. Product Overview, 2. The Living Climate Concept (+22 more)

### Community 7 - "package.json"
Cohesion: 0.11
Nodes (18): engines, node, name, private, type, version, autoprefixer, postcss (+10 more)

### Community 17 - "ShelterCanvas.tsx"
Cohesion: 0.23
Nodes (12): ActiveClimateArchetype, CLIMATE_SHELTER_CONFIGS, ClimateFeatureAnnotation, ClimateShelterConfig, ClimateShelterModel(), FeaturePin(), ShelterCanvas(), ShelterCanvasProps (+4 more)

### Community 18 - "mock/index.ts"
Cohesion: 0.18
Nodes (10): ClimateMonth, mockClimateData, mockShelterDesigns, DailyForecast, HourlyForecast, mockWeather, WeatherData, mockZoneRisk (+2 more)

### Community 19 - "test_zone_classifier.py"
Cohesion: 0.13
Nodes (10): make_fake_summary(), test_classify_zone_cold(), test_classify_zone_cold_boundary(), test_classify_zone_composite(), test_classify_zone_composite_boundary(), test_classify_zone_hot_dry(), test_classify_zone_temperate(), test_classify_zone_warm_humid() (+2 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, composite, isolatedModules, jsx, lib, module (+12 more)

### Community 21 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, composite, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "planData.ts"
Cohesion: 0.14
Nodes (15): COLD_PLAN, COMPOSITE_PLAN, Door, HOT_DRY_PLAN, mockPlanSpec, PlanSpec, PlanZoneKey, Room (+7 more)

### Community 23 - "zone.py"
Cohesion: 0.14
Nodes (5): post_zone(), ErrorDetail, ZoneDiagnosticValues, ZoneRequest, ZoneResponse

### Community 24 - "useReducedMotion"
Cohesion: 0.05
Nodes (87): AnimatedRoutes(), ClimateTab(), CustomClimateChart(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey (+79 more)

### Community 25 - "classify_zone"
Cohesion: 0.15
Nodes (7): classify_zone(), extract_climate_metrics(), load_zone_thresholds(), ClimateDerivedMetrics, ClimateResponse, DataQuality, MonthlyClimateSummary

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
Cohesion: 0.14
Nodes (4): EcoShelter Directory Architecture, Settings, health(), Production & Test Dependencies Specification

### Community 30 - "test_api.py"
Cohesion: 0.14
Nodes (8): DailyForecastItem, HourlyForecastItem, WeatherInfo, _extract_current(), get_weather(), _parse_daily(), _parse_hourly(), TestHealth

### Community 31 - "analyze"
Cohesion: 0.22
Nodes (3): analyze(), LocationInfo, get_location()

### Community 32 - "Core Guidelines & Operational Rules"
Cohesion: 0.20
Nodes (9): 1. Stability & Non-Breaking Changes, 2. Externalized Configurations & Constants, 3. Architecture Pattern for New Endpoints, 4. Data Provenance & Real-World Accuracy, 5. Code Quality & Beginner Readability, 6. Concise Completion Summary, Core Guidelines & Operational Rules, Incomplete Work Rules — Thermal_Shelter (EcoShelter) (+1 more)

### Community 33 - "test_climate.py"
Cohesion: 0.13
Nodes (7): clear_cache(), sample_raw_climate_data(), test_get_climate_route_lat_lon_validation(), test_get_climate_route_success(), test_get_climate_route_upstream_error_handling(), test_get_climate_summary_api_failure(), test_get_climate_summary_service_success()

### Community 34 - "climate_service.py"
Cohesion: 0.11
Nodes (6): get_climate(), _compute_calendar_date_range(), _fetch_archive_data(), _get_cache_key(), get_climate_summary(), _load_config()

### Community 36 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 37 - "LocationPicker.tsx"
Cohesion: 0.29
Nodes (10): createCustomIcon(), floodColor(), FlyController(), LocationPicker(), MapClickHandler(), MapResizer(), NominatimResult, nominatimSearch() (+2 more)

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 42 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom, typescript (+2 more)

### Community 43 - "analysis.py"
Cohesion: 0.16
Nodes (8): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope, FloodInfo, _assess_risk(), get_flood(), EcoShelter Documentation & API Reference, GloFAS Flood Risk Model & Interpretation

### Community 44 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, preview, test

### Community 45 - "ClimateServiceError"
Cohesion: 0.20
Nodes (5): clean_and_process_climate_data(), ClimateServiceError, test_clean_and_process_climate_data(), test_clean_empty_data_raises_error(), test_post_zone_endpoint_upstream_error()

## Knowledge Gaps
- **203 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 336 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DESIGN SYSTEM` connect `DESIGN SYSTEM` to `App.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `10. Component Catalogue` connect `App.tsx` to `DESIGN SYSTEM`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `react` connect `useReducedMotion` to `LibraryPage.tsx`, `App.tsx`, `LocationPicker.tsx`, `package.json`, `ShelterCanvas.tsx`, `planData.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _203 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07317073170731707 - nodes in this community are weakly interconnected._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06636500754147813 - nodes in this community are weakly interconnected._
- **Should `_patch_services` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._