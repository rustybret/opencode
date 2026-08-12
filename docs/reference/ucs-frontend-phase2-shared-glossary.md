# UCS Frontend Phase 2 — Shared Architecture Glossary & Data Contract Mapping

**Version:** 1.0.0  
**Date:** 2026-08-11  
**Status:** CANONICAL REFERENCE FOR GATES G1–G4  
**Target Recipient:** `opencode` & `uc-studio`  

---

## 1. Terminology & View Definitions

| Term | Canonical Name | Description |
|---|---|---|
| View A | **Session Topology Tree View** | Interactive visual hierarchy of primary sessions and parallel subagent trees, showing agent identity, model ID, status, token usage, and cumulative session cost. |
| View B | **Live Event Stream / Log Observer** | Real-time SSE stream log capturing lifecycle events, tool invocations, background task states, and session completions. |
| View C | **Boulder State & Evidence Inspector** | Visual tracking of active `.omo/boulder.json` task goals, active step, plan completion percentage, and `.omo/evidence/` artifact counts. |
| View D | **Workspace / Multi-Project Selector** | Dynamic switcher between active projects registered in `/ucs/projects`. |
| Widget 1 | **OAuth Plugin Quota Status Panel** | Readout for the 3 auth plugins (Anthropic, OpenAI, Gemini) tracking token usage and quota ceilings. |
| Widget 2 | **AFT Code Health Widget** | Live status-bar metrics showing LSP diagnostic counts (`E`/`W`), dead-code estimates (`D`), unused exports (`U`), duplication clone groups (`C`), and TODO items (`T`). |
| Widget 3 | **Cache Diagnostics & Prompt Bust Panel** | Hit ratio tracking, prompt-cache read counts (`cache_read`), and cache-bust diagnostics (parity with CortexKit dashboard). |
| Widget 4 | **AFT Live LSP Diagnostics Panel** | Detailed expandable panel displaying active language-server diagnostic messages across the workspace. |
| Widget 5 | **External App Status Card** | Dedicated status badge for connected `UcsExternalApp` bridge engines (e.g. Unity SuperMCP editor connection, compilation, and playmode states). |

---

## 2. Capability Status Vocabulary

- **`supported`**: Served live by Phase 1 REST/SSE endpoints (`/ucs/*`). Fully functional in Phase 2.
- **`beta`**: Served live by Phase 1 endpoints but marked experimental (e.g. `boulder-state`).
- **`planned`**: Endpoint or backend logic scheduled for Phase 2.5 or Phase 3. Frontend renders degraded or empty state with a "Planned (Phase 2.5)" badge.
- **`absent`**: Data source not available on the current host. Frontend renders "Not Available" badge.

---

## 3. Data Source & Endpoint Mapping Matrix

| Surface | Component / Panel | Serving Endpoint | Capabilities / Contract | Data Status |
|---|---|---|---|---|
| Primary View A | Session Topology Tree | `GET /ucs/topology` | `@ucs/contracts` `UcsTopologyEntry` | `supported` |
| Primary View B | Live Event Stream Log | `GET /ucs/events` | `@ucs/contracts` `UcsEventEnvelope` | `supported` |
| Primary View C | Boulder & Evidence Inspector | `GET /ucs/work` | `@ucs/contracts` `UcsBoulderSummary` | `supported` (beta) |
| Primary View D | Multi-Project Selector | `GET /ucs/projects` | `@ucs/contracts` `UcsProject` | `supported` |
| Widget 1 | OAuth Plugin Quota Status | `GET /ucs/quota` *(proposed)* | Auth plugin token counts | `planned` (Phase 2.5) |
| Widget 2 | AFT Code Health Status | `GET /ucs/health` *(proposed)* | AFT metrics (`E/W/D/U/C/T`) | `planned` (Phase 2.5) |
| Widget 3 | Cache Diagnostics & Prompt Bust | `GET /ucs/cache` *(proposed)* | `cache_read`, `full_bust` | `planned` (Phase 2.5) |
| Widget 4 | AFT Live LSP Diagnostics | `GET /ucs/diagnostics` *(proposed)* | LSP diagnostic items | `planned` (Phase 2.5) |
| Widget 5 | External App Status Card | `GET /ucs/work` (`integrations`) | `@ucs/contracts` `UcsIntegrationState` | `supported` |

---

## 4. Layout Breakpoints & Dimensions

- **Mobile (375px)**: Single column stacked; view tabs; side-panel overlay drawer.
- **Tablet (768px)**: Dual column (Primary view + collapsible side panel column); view tabs.
- **Desktop (1280px+)**: Multi-pane (Left nav + Project switcher; Center primary view; Right side-panel grid).

---

## 5. Enum & Field Specifications (from `@ucs/contracts`)

- **Session Roles**: `primary`, `subagent`, `compaction`
- **Session Status**: `running`, `idle`, `completed`, `error`, `aborted`
- **Token Fields**: `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `totalCostUsd`
- **Integration Types**: `unity`, `unreal`, `xcode`, `blender`
- **Integration Status**: `connected`, `disconnected`, `standby`, `error`
