# Graph Report - Backend  (2026-10-03)

## Corpus Check
- 26 files · ~11,176 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .example 1, (none) 1, .ini 1)

## Summary
- 179 nodes · 316 edges · 15 communities (6 shown, 9 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- analyze_environment
- analysis_schema.py
- analysis.py
- test_api.py
- app.js
- environment_analyzer.py
- Graphify Knowledge Graph Rules
- Graph Navigation Token Optimization

## God Nodes (most connected - your core abstractions)
1. `analyze_environment()` - 29 edges
2. `initEventListeners()` - 15 edges
3. `_patch_services()` - 12 edges
4. `showToast()` - 12 edges
5. `TestClassification` - 10 edges
6. `renderSavedReportsList()` - 10 edges
7. `analyze()` - 9 edges
8. `TestConditions` - 9 edges
9. `TestCoordinateValidation` - 9 edges
10. `renderReport()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `analyze_environment()` --calls--> `AnalysisInfo`  [EXTRACTED]
  backend/app/analysis/environment_analyzer.py → backend/app/schemas/analysis_schema.py
- `analyze()` --calls--> `analyze_environment()`  [EXTRACTED]
  backend/app/api/routes/analysis.py → backend/app/analysis/environment_analyzer.py
- `analyze()` --uses--> `AnalysisResponse`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze()` --uses--> `LocationRequest`  [INFERRED]
  backend/app/api/routes/analysis.py → backend/app/schemas/analysis_schema.py
- `analyze()` --calls--> `get_flood()`  [EXTRACTED]
  backend/app/api/routes/analysis.py → backend/app/services/flood_service.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **EcoShelter Architecture & Rule Standards** — agents_rules_agent_rules, agents_rules_architecture_spec, backend_readme_ecoshelter [INFERRED 0.85]

## Communities (15 total, 9 thin omitted)

### Community 0 - "analyze_environment"
Cohesion: 0.12
Nodes (4): analyze_environment(), TestClassification, TestConditions, TestSummary

### Community 1 - "analysis_schema.py"
Cohesion: 0.11
Nodes (11): analyze(), AnalysisInfo, AnalysisResponse, ErrorDetail, ErrorResponse, FloodInfo, LocationRequest, WeatherInfo (+3 more)

### Community 2 - "analysis.py"
Cohesion: 0.08
Nodes (11): Analyze Pipeline Specification, Agent Architecture & Backend Rules, EcoShelter Backend-Only Scope, EcoShelter Directory Architecture, Settings, health(), _assess_risk(), get_flood() (+3 more)

### Community 3 - "test_api.py"
Cohesion: 0.10
Nodes (6): LocationInfo, _patch_services(), TestCoordinateValidation, TestHealth, TestServiceFailures, TestSuccessfulResponse

### Community 4 - "app.js"
Cohesion: 0.15
Nodes (34): APP_STATE, checkBackendHealth(), clearAllSavedReports(), deleteSavedReport(), downloadFile(), downloadReportAsCsv(), downloadReportAsJson(), elements (+26 more)

### Community 5 - "environment_analyzer.py"
Cohesion: 0.13
Nodes (5): _build_summary(), _classify(), _detect_conditions(), ClassificationRule, ConditionRule

## Knowledge Gaps
- **9 isolated node(s):** `Settings`, `APP_STATE`, `elements`, `EcoShelter Backend-Only Scope`, `EcoShelter Directory Architecture` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 65 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyze_environment()` connect `analyze_environment` to `analysis_schema.py`, `analysis.py`, `environment_analyzer.py`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `AnalysisInfo` connect `analysis_schema.py` to `analyze_environment`, `test_api.py`, `environment_analyzer.py`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `initEventListeners()` (e.g. with `clearAllSavedReports()` and `exportAllSavedReports()`) actually correct?**
  _`initEventListeners()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Settings`, `APP_STATE`, `elements` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyze_environment` be split into smaller, more focused modules?**
  _Cohesion score 0.12433862433862433 - nodes in this community are weakly interconnected._
- **Should `analysis_schema.py` be split into smaller, more focused modules?**
  _Cohesion score 0.10666666666666667 - nodes in this community are weakly interconnected._
- **Should `analysis.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._