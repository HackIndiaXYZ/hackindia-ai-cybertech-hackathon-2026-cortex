# Graph Report - Backend  (2026-10-01)

## Corpus Check
- Corpus is ~5,928 words - fits in a single context window. You may not need a graph.

## Summary
- 143 nodes · 224 edges · 17 communities (6 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.92)
- Token cost: 1,200 input · 600 output

## Community Hubs (Navigation)
- Environmental Analysis & Summarization
- Classification Rules & Logic
- API Architecture & Specifications
- Endpoint Integration & Mock Tests
- GloFAS Flood Service
- Open-Meteo Weather Service
- Coordinate Validation Tests
- Analysis Endpoint & Geocoding
- Graphify Workflow & Rules
- Graph Navigation Guidance

## God Nodes (most connected - your core abstractions)
1. `analyze_environment()` - 29 edges
2. `_patch_services()` - 12 edges
3. `TestClassification` - 10 edges
4. `analyze()` - 9 edges
5. `TestConditions` - 9 edges
6. `TestCoordinateValidation` - 9 edges
7. `LocationInfo` - 8 edges
8. `WeatherInfo` - 6 edges
9. `FloodInfo` - 6 edges
10. `AnalysisInfo` - 6 edges

## Surprising Connections (you probably didn't know these)
- `analyze()` --uses--> `AnalysisResponse`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze()` --uses--> `LocationRequest`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze_environment()` --calls--> `AnalysisInfo`  [EXTRACTED]
  backend/app/analysis/environment_analyzer.py → backend/app/schemas/analysis_schema.py
- `analyze()` --calls--> `analyze_environment()`  [EXTRACTED]
  backend/app/api/routes/analysis.py → backend/app/analysis/environment_analyzer.py
- `analyze()` --calls--> `get_flood()`  [EXTRACTED]
  backend/app/api/routes/analysis.py → backend/app/services/flood_service.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (17 total, 11 thin omitted)

### Community 0 - "Environmental Analysis & Summarization"
Cohesion: 0.11
Nodes (6): analyze_environment(), _build_summary(), _detect_conditions(), TestClassification, TestConditions, TestSummary

### Community 1 - "Classification Rules & Logic"
Cohesion: 0.10
Nodes (8): _classify(), ClassificationRule, ConditionRule, AnalysisInfo, AnalysisResponse, ErrorDetail, ErrorResponse, LocationRequest

### Community 2 - "API Architecture & Specifications"
Cohesion: 0.09
Nodes (7): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope, EcoShelter Directory Architecture, Settings, health(), Production & Test Dependencies Specification

### Community 3 - "Endpoint Integration & Mock Tests"
Cohesion: 0.14
Nodes (5): LocationInfo, _patch_services(), TestHealth, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "GloFAS Flood Service"
Cohesion: 0.28
Nodes (5): FloodInfo, _assess_risk(), get_flood(), EcoShelter Documentation & API Reference, GloFAS Flood Risk Model & Interpretation

### Community 5 - "Open-Meteo Weather Service"
Cohesion: 0.28
Nodes (3): WeatherInfo, _extract_current(), get_weather()

## Knowledge Gaps
- **7 isolated node(s):** `Settings`, `EcoShelter Backend-Only Scope`, `EcoShelter Directory Architecture`, `Graph Navigation Token Optimization`, `Graphify Knowledge Graph Rules` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 63 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_environment()` connect `Environmental Analysis & Summarization` to `Classification Rules & Logic`, `API Architecture & Specifications`, `Analysis Endpoint & Geocoding`?**
  _High betweenness centrality (0.282) - this node is a cross-community bridge._
- **Why does `AnalysisInfo` connect `Classification Rules & Logic` to `Environmental Analysis & Summarization`, `Endpoint Integration & Mock Tests`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Why does `TestCoordinateValidation` connect `Coordinate Validation Tests` to `Endpoint Integration & Mock Tests`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `analyze()` (e.g. with `AnalysisResponse` and `LocationRequest`) actually correct?**
  _`analyze()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `EcoShelter Backend-Only Scope`, `EcoShelter Directory Architecture` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Environmental Analysis & Summarization` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._
- **Should `Classification Rules & Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._