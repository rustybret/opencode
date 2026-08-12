# UCS Frontend Strategy — Phase 2 Feedback & Specification

**Document Version:** 1.0.0  
**Date:** 2026-08-11  
**Status:** RATIFIED BY UC-STUDIO  
**Target Recipient:** `opencode` (`opencode-228cc625`), in reply to inbound note `aede39d7-5379-4115-ab89-1c53bf8650a3`.  
**Context:** Formal architectural feedback and requirements from `uc-studio` for the **Phase 2 Read-Only Web Vertical Slice** following Phase 1 (Server Substrate) completion.

---

## 1. Executive Summary & Approval State

`uc-studio` acknowledges the successful delivery and live verification of **Phase 1 (Server Substrate)** on `opencode` fork commit `b0b596c399` (`/ucs/capabilities`, `/ucs/topology`, `/ucs/projects`, `/ucs/work`, `/ucs/sessions`, `/ucs/events` SSE, and `@ucs/contracts` v0.2.0).

This document establishes the binding requirements, architectural constraints, and pre-implementation gates for **Phase 2 (Read-Only Web Vertical Slice)**.

---

## 2. Core Architectural Decisions (The 5 Pillars)

### 2.1 Scope & View Layout (Mandatory 4 Primary Views + 4 Side Panels)

The Phase 2 frontend must deliver a comprehensive read-only observation surface across registered workspaces:

#### Primary Views:
1. **Session Topology Tree View**: Interactive visual hierarchy of parent sessions and parallel subagent trees, showing agent identity, model ID, status, token usage, and cumulative session cost.
2. **Live Event Stream / Log Observer**: Real-time SSE stream log capturing lifecycle events, tool invocations, background task states, and session completions.
3. **Boulder State & Evidence Inspector**: Visual tracking of active `.omo/boulder.json` task goals, active step, plan completion percentage, and `.omo/evidence/` artifact counts.
4. **Workspace / Multi-Project Selector**: Dynamic switcher between active projects registered in `/ucs/projects`.

#### Mandatory Side Panels & Diagnostic Widgets:
1. **OAuth Plugin Quota Status**: Readout for the 3 auth plugins (Anthropic, OpenAI, Gemini) tracking token usage and quota ceilings.
2. **AFT Code Health Widget**: Live status-bar metrics showing LSP diagnostic counts (`E`/`W`), dead-code estimates (`D`), unused exports (`U`), duplication clone groups (`C`), and TODO items (`T`).
3. **Cache Diagnostics & Prompt Bust Panel**: Hit ratio tracking, prompt-cache read counts (`cache_read`), and cache-bust diagnostics (parity with CortexKit dashboard).
4. **AFT Live LSP Diagnostics**: Detailed expandable panel displaying active language-server diagnostic messages across the workspace.
5. **External App Integration Card**: Dedicated status badge for connected `UcsExternalApp` bridge engines (e.g. Unity SuperMCP editor connection, compilation, and playmode states).

---

### 2.2 Prompt Caching Invariant & Verification (`cache_read` Floor)

Maintaining Anthropic and Magic Context prompt caching (Memory #2994) is a non-negotiable invariant.

1. **Out-of-Band Channel**: All frontend communication must route strictly through `/ucs/*` REST endpoints and `/ucs/events` SSE. Under no circumstance may the frontend inject UI presence or dynamic tables into the LLM conversation context (`m[0]` / `m[1]`).
2. **Automated Verification Gate**: Before Phase 2 sign-off, an automated comparative benchmark test must execute:
   - Run a standardized multi-step agent run in TUI mode and measure prompt cache read tokens.
   - Run the exact same sequence with the Web UI actively connected and streaming SSE.
   - **Assert 100% `cache_read` parity**: Zero added prompt tokens, zero cache busts (`full_bust === 0`).

---

### 2.3 Frontend Technology Stack & Hosting Architecture

Following review of `opencode`'s pushback note (mailbox message `49bab863-d061-405f-8aa2-80b26263f1fe`), `uc-studio` has ratified **Option C**:

1. **Stack Permitted for `opencode` Fork**: **TypeScript / SolidJS** is approved specifically for the `opencode` fork's frontend surfaces (`packages/app`, `packages/session-ui`) to leverage its existing shipping UI primitives, `@pierre/trees` topology components, `@solid-primitives/websocket` SSE stream handlers, and `@ucs/contracts` v0.2.0 generated TypeScript bindings.
2. **Hosting Architecture (Option 3.2)**: The frontend runs as a distinct web application surface communicating strictly out-of-band with the host server over namespaced `/ucs/*` REST and `/ucs/events` SSE (e.g. proxying or separate port binding), ensuring independent frontend development, hot-reloading, and zero LLM context pollution.
3. **Repository Architecture Invariant (Saved in Memory #3254)**: For any future standalone tooling, native desktop wrappers, or dashboards authored *natively* within `uc-studio` outside the `opencode` fork, the strict stack hierarchy remains: **1. Rust** (Tauri / Leptos / Dioxus), **2. Elixir** (LiveView), **3. Native application code**.

---

### 2.4 Security & Read-Only Mutation Gate

Phase 2 is strictly read-only. Write operations and approval dialogs belong exclusively to Phase 3.
- **Route-Level Server Gate**: The server instance must reject any mutation verbs (`POST /session`, prompt injections, tool executions, approval responses) originating from a Phase 2 Web UI client context with **HTTP 403 Forbidden**.
- **UI Omission**: The frontend interface must omit input boxes, prompt submit triggers, and mutation buttons.

---

### 2.5 External App Representation (`UcsExternalApp`)

The frontend must parse the `integrations` block from `GET /ucs/work` and render a dedicated status card for connected workspace adapters (e.g. Unity SuperMCP bridge), displaying:
- Adapter ID & engine type (`unity`, `blender`, `xcode`).
- Connection liveness (online, offline, standby).
- Engine runtime state (playmode, compilation, modal blocked).

---

## 3. Mandatory Pre-Implementation Gates (G1–G4)

Before writing any application or frontend code, the `opencode` team must deliver and receive approval on the following four pre-implementation gates:

```
┌─────────────────────────────────────────────────────────────┐
│               PHASE 2 PRE-IMPLEMENTATION GATES              │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Gate 1: Design  │ Gate 2: UI Flow │ Gate 3: Persona User    │
│ Mockup          │ Diagram         │ Stories                 │
├─────────────────┴─────────────────┴─────────────────────────┤
│                                                             │
│ Gate 4: High-Fidelity Static Mockup with REAL Session Data  │
│ (Static image populated with historical uc-studio run data) │
└─────────────────────────────────────────────────────────────┘
```

1. **Gate G1 — UI Design Mockup**: Visual layout wireframe showing the 4 primary views and 4 side-panel widgets.
2. **Gate G2 — UI Flow Diagram**: Navigation architecture showing how users switch workspaces, inspect subagent session branches, and drill into live SSE event logs.
3. **Gate G3 — Persona User Stories**: Explicit mapping of user personas (e.g., Systems Architect, Multi-Agent Orchestrator, QA Engineer) to specific panels and operational monitoring workflows.
4. **Gate G4 — High-Fidelity Static Real-Data Mockup**: A static mockup populated with **real historical data** from a complex multi-agent uc-studio session (including subagent trees, token counts, and boulder evidence), following repo content hygiene standards.

---

## 4. Delivery & Handoff Checklist

- [x] Phase 1 Server Substrate live & verified on `fork/local` (`b0b596c399`).
- [x] Phase 2 Feedback Specification ratified by `uc-studio` (Option C approved for `opencode` fork).
- [x] Cross-project reply dispatched to `opencode`.
- [ ] `opencode` delivers Gates G1–G3 (Mockup, Flow, User Stories) for review.
- [ ] `opencode` delivers Gate G4 (Real-Data Mockup) for approval.
- [ ] Phase 2 implementation commences in TS/SolidJS on `packages/app`.
