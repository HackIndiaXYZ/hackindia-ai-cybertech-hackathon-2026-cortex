# Graph Report - Backend  (2026-10-23)

## Corpus Check
- 82 files · ~45,623 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: .css 5, (none) 3, .example 1)

## Summary
- 488 nodes · 920 edges · 34 communities (19 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- analyze_environment
- analysis_schema.py
- TestCoordinateValidation
- test_api.py
- App.tsx
- DESIGN SYSTEM
- frontend/README.md
- package.json
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization
- ShelterTab.tsx
- PlanSVG.tsx
- WeatherTab.tsx
- compilerOptions
- compilerOptions
- DashboardPage.tsx
- weather_service.py
- useReducedMotion
- main.py
- analyze
- analysis.py
- flood_service.py
- .oxlintrc.json
- React + TypeScript + Vite
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `useReducedMotion()` - 54 edges
2. `analyze_environment()` - 29 edges
3. `react` - 23 edges
4. `framer-motion` - 20 edges
5. `lucide-react` - 19 edges
6. `compilerOptions` - 18 edges
7. `DESIGN SYSTEM` - 18 edges
8. `useClimateZone()` - 15 edges
9. `compilerOptions` - 15 edges
10. `_patch_services()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `10. Component Catalogue` --references--> `DisclaimerBanner()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/DisclaimerBanner.tsx
- `10. Component Catalogue` --references--> `LocationSearch()`  [INFERRED]
  frontend/DESIGN_SYSTEM.md → frontend/client/src/components/LocationSearch.tsx
- `analyze()` --uses--> `AnalysisResponse`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze()` --uses--> `ErrorDetail`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze()` --uses--> `LocationRequest`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (34 total, 15 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.07
Nodes (9): analyze_environment(), _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule, TestClassification, TestConditions (+1 more)

### Community 1 - "analysis_schema.py"
Cohesion: 0.20
Nodes (6): AnalysisInfo, AnalysisResponse, ErrorDetail, ErrorResponse, LocationRequest, WeatherInfo

### Community 3 - "test_api.py"
Cohesion: 0.15
Nodes (5): LocationInfo, _patch_services(), TestHealth, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "App.tsx"
Cohesion: 0.09
Nodes (35): AnimatedRoutes(), App(), AnimatedBackground(), CONFIGS, Particle, rnd(), ZoneConfig, DisclaimerBanner() (+27 more)

### Community 5 - "DESIGN SYSTEM"
Cohesion: 0.06
Nodes (30): 11. Accessibility Rules, 12. Mock Data, 13. File & Folder Conventions, 14. Development Conventions, 15. Post-Task Testing Checklist, 16. Quick Reference � Design Token Cheat-Sheet, 1. Product Overview, 2. The Living Climate Concept (+22 more)

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (42): dependencies, framer-motion, leaflet, lucide-react, react, react-dom, react-leaflet, react-router-dom (+34 more)

### Community 17 - "ShelterTab.tsx"
Cohesion: 0.20
Nodes (16): CanvasSkeleton(), MONTHS, ShelterTab(), ActiveClimateArchetype, CLIMATE_SHELTER_CONFIGS, ClimateFeatureAnnotation, ClimateShelterConfig, mapClassificationToArchetype() (+8 more)

### Community 18 - "PlanSVG.tsx"
Cohesion: 0.36
Nodes (6): Door, mockPlanSpec, PlanSpec, Room, Window, PlanSVGProps

### Community 19 - "WeatherTab.tsx"
Cohesion: 0.09
Nodes (25): ALERT_EMOJI, ALERT_STYLES, AlertBanner(), AlertBannerProps, AlertType, CountUp(), CustomTooltip(), DayCard() (+17 more)

### Community 20 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 21 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, composite, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "DashboardPage.tsx"
Cohesion: 0.10
Nodes (29): CircularProgress(), classificationToZone(), SemiCircleGauge(), ZoneRiskTab(), createCustomIcon(), floodColor(), FlyController(), LocationPicker() (+21 more)

### Community 24 - "useReducedMotion"
Cohesion: 0.06
Nodes (57): ClimateTab(), CustomClimateChart(), CountUpScore(), CRITERIA, DesignsTab(), PRESETS, WeightKey, PlanTab() (+49 more)

### Community 29 - "main.py"
Cohesion: 0.20
Nodes (3): EcoShelter Directory Architecture, health(), Production & Test Dependencies Specification

### Community 30 - "analyze"
Cohesion: 0.22
Nodes (4): analyze(), get_location(), _extract_current(), get_weather()

### Community 32 - "analysis.py"
Cohesion: 0.25
Nodes (5): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope, EcoShelter Documentation & API Reference, GloFAS Flood Risk Model & Interpretation

### Community 33 - "flood_service.py"
Cohesion: 0.32
Nodes (3): FloodInfo, _assess_risk(), get_flood()

### Community 36 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 38 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **173 isolated node(s):** `Settings`, `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components` (+168 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 236 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `DashboardPage.tsx` to `App.tsx`, `package.json`, `ShelterTab.tsx`, `PlanSVG.tsx`, `WeatherTab.tsx`, `useReducedMotion`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `DESIGN SYSTEM` connect `DESIGN SYSTEM` to `App.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `10. Component Catalogue` connect `App.tsx` to `DESIGN SYSTEM`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `Settings`, `$schema`, `plugins` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.07293868921775898 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08603145235892692 - nodes in this community are weakly interconnected._
- **Should `DESIGN SYSTEM` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._