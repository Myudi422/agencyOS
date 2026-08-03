---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project uses Graphify knowledge graph located at `graphify-out/`.

Prerequisites & Setup:
- **Installation Check**: If `graphify` command is not found/installed on the environment, run `pip install graphifyy` first to install Graphify (PyPI package: `graphifyy`).
- **Graph Initialization**: If `graphify-out/graph.json` does not exist, build the initial graph by running `graphify .`

Rules:
- **Query First**: For codebase or architecture questions, query the graph using `graphify query "<question>"` (CLI) or `query_graph` (MCP). Use `graphify path "<A>" "<B>"` for relationship discovery and `graphify explain "<symbol>"` for detailed node analysis. This returns a scoped AST subgraph, preventing token leakage from scanning raw files or executing wide greps.
- **Wiki Navigation**: If `graphify-out/wiki/index.md` exists, navigate it before reading raw source files.
- **Architecture Overview**: Read `graphify-out/GRAPH_REPORT.md` only for broad high-level architecture reviews or if targeted queries do not return sufficient context.
- **Keep Graph Fresh**: After modifying code files in any session, run `graphify update .` to update the AST graph (FAST, 0 API/LLM token cost).