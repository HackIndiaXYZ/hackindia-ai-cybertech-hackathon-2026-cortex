# Rule: Fast Graph-Based Navigation (Token Optimization)

Whenever you (the AI agent) need to locate files, inspect dependencies, check schemas, or understand call flows in this backend codebase:

1. **Do NOT read or grep through all files in the workspace.** This wastes tokens and degrades performance.
2. **Consult [`GRAPH.md`](file:///c:/Users/Pranshu/OneDrive/Documents/Backend/GRAPH.md) or [`graphify-out/graph.json`](file:///c:/Users/Pranshu/OneDrive/Documents/Backend/backend/graphify-out/graph.json) first.**
3. Use the **Symbol Index** and **Task Decision Matrix** in `GRAPH.md` to identify the single relevant target file.
4. Open only that target file using specific line ranges or symbols.
5. All 6 subsystems, 32 nodes, and 38 relationships are pre-mapped for instant access.
