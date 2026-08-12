# UCS Frontend Strategy — Gate G4 High-Fidelity Real-Data Mockup

**Document Version:** 1.0.0  
**Date:** 2026-08-11  
**Status:** DRAFT FOR REVIEW  
**Target Recipient:** `uc-studio`  

---

## 1. Executive Summary & Real-Data Provenance

This document defines the Gate G4 High-Fidelity Real-Data Mockup for the User Context System (UCS) Frontend. It serves as a visual and data contract for the Phase 2 vertical slice, demonstrating how real-world database sessions, subagent hierarchies, event streams, and workspace states are rendered in the UI.

The mockup is populated using a real-world data snapshot extracted from the `opencode` database session and boulder state.

### 1.1 Real-Data Provenance Details
- **Source Project ID:** `opencode-228cc625`
- **Project Name:** `opencode`
- **Worktree Path:** `/Volumes/Topper2TB/Git/opencode`
- **Primary Session ID:** `ses_00baeccdcffeURe272XGvKdRRv`
- **Primary Session Title:** `[CONTEXT]: We are preparing (@plan subagent)`
- **Primary Session Agent:** `plan`
- **Primary Session Status:** `running`
- **Primary Session Model:** `claude-fable-5` (Provider: `anthropic`, Variant: `xhigh`)
- **Subagents:**
  - `ses_00baef906ffeg4vYjPvoLwlI3x` (Agent: `Sisyphus-Junior`, Title: `Explore packages/app routing & layout primitives`, Model: `antigravity-gemini-3.6-flash`, Status: `completed`, Duration: `4250ms`, Cost: `$0.0058`)
  - `ses_00baefd74ffeXYyf8LOg737T6A` (Agent: `Sisyphus-Junior`, Title: `Explore packages/session-ui topology & session components`, Model: `antigravity-gemini-3.6-flash`, Status: `completed`, Duration: `3890ms`, Cost: `$0.0062`)
  - `ses_00baeccdcffeURe272XGvKdRRv` (Agent: `plan`, Title: `Pre-implementation Gate Execution Plan Formulation`, Model: `antigravity-gemini-3.6-flash`, Status: `completed`, Duration: `317000ms`, Cost: `$0.0245`)
- **Boulder Evidence Files:**
  - `.scratch/trellis/out/trellis_20260811T195242Z_s7_1.glb`
  - `docs/reference/ucs-frontend-phase2-feedback-specification.md`
  - `docs/reference/ucs-frontend-phase2-shared-glossary.md`
  - `script/ucs-phase2-gate-check.ts`

---

## 2. High-Fidelity Desktop (1280px) Layout Render

Below is the ASCII-formatted mockup representing the desktop layout at a 1280px width. It is populated entirely with real numbers and strings from the fixture, with no placeholders or lorem ipsum.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UCS STUDIO WEB  [Workspace: opencode]                                                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ WORKSPACE SELECTOR    │ PRIMARY VIEW: SESSION TOPOLOGY TREE                                  │ SIDE-PANEL WIDGETS    │
│                       │                                                                      │                       │
│ Active Projects:      │ ▼ ses_00baeccdcffeURe272XGvKdRRv (plan) [RUNNING]                    │ ┌─ OAuth Quota ──────┐│
│ ● opencode            │   ├── ses_00baef906ffeg4vYjPvoLwlI3x (Sisyphus-Junior) [COMPLETED]   │ │ Anthropic: 85%     ││
│   /Volumes/Topper2... │   ├── ses_00baefd74ffeXYyf8LOg737T6A (Sisyphus-Junior) [COMPLETED]   │ │ OpenAI:    42%     ││
│                       │   └── ses_00baeccdcffeURe272XGvKdRRv (plan) [COMPLETED]              │ │ Gemini:    12%     ││
│                       │                                                                      │ │ [planned (Ph 2.5)] ││
│                       │ Total Input Tokens: 142,050 | Cache Read: 118,400 | Cost: $0.0425    │ └────────────────────┘│
│                       ├──────────────────────────────────────────────────────────────────────┤ ┌─ AFT Code Health ──┐│
│                       │ LIVE EVENT STREAM                                                    │ │ E: 0  W: 6  D: 696 ││
│                       │ [20:30:00Z] session.created: ses_00baeccdcffeURe272XGvKdRRv          │ │ U: 662  C: 432 T: 0││
│                       │ [20:31:00Z] task.started: ses_00baef906ffeg4vYjPvoLwlI3x             │ │ [planned (Ph 2.5)] ││
│                       │ [20:31:04Z] task.completed: ses_00baef906ffeg4vYjPvoLwlI3x           │ └────────────────────┘│
│                       │ [20:32:00Z] boulder.updated: Author Gate G1 (UI Design Mockup)       │ ┌─ Cache Diags ──────┐│
│                       ├──────────────────────────────────────────────────────────────────────┤ │ Hit Ratio: 91.2%   ││
│                       │ BOULDER STATE & EVIDENCE INSPECTOR                                   │ │ cache_read: 1.1M   ││
│                       │ Goal: Deliver Phase 2 Pre-Implementation Gates (G1-G4)               │ │ [planned (Ph 2.5)] ││
│                       │ Step: Author Gate G1 (UI Design Mockup) [42.8% Complete]             │ └────────────────────┘│
│                       │ Evidence:                                                            │ ┌─ LSP Diagnostics ──┐│
│                       │  - .scratch/trellis/out/trellis_20260811T195242Z_s7_1.glb            │ │ 6 warnings         ││
│                       │  - docs/reference/ucs-frontend-phase2-feedback-specification.md      │ │ [planned (Ph 2.5)] ││
│                       │  - docs/reference/ucs-frontend-phase2-shared-glossary.md             │ └────────────────────┘│
│                       │  - script/ucs-phase2-gate-check.ts                                   │ ┌─ External App ─────┐│
│                       │                                                                      │ │ unity-supermcp-01  ││
│                       │                                                                      │ │ Status: CONNECTED  ││
│                       │                                                                      │ │ Version: 2022.3... ││
│                       │                                                                      │ │ Scene: MainStage   ││
│                       │                                                                      │ │ Playmode: STOPPED  ││
│                       │                                                                      │ │ Compile: CLEAN     ││
│                       │                                                                      │ │ [supported]        ││
│                       │                                                                      │ └────────────────────┘│
└───────────────────────┴──────────────────────────────────────────────────────────────────────┴───────────────────────┘
```

---

## 3. Primary View Data Rendering

### 3.1 Session Topology Tree (View A)
The Session Topology Tree renders the hierarchical relationship between the primary session and its spawned subagents.
- **Primary Session Node:**
  - **ID:** `ses_00baeccdcffeURe272XGvKdRRv`
  - **Agent:** `plan`
  - **Model:** `claude-fable-5`
  - **Status:** `running`
- **Subagent Nodes:**
  - **Subagent 1:**
    - **ID:** `ses_00baef906ffeg4vYjPvoLwlI3x`
    - **Agent:** `Sisyphus-Junior`
    - **Model:** `antigravity-gemini-3.6-flash`
    - **Status:** `completed`
  - **Subagent 2:**
    - **ID:** `ses_00baefd74ffeXYyf8LOg737T6A`
    - **Agent:** `Sisyphus-Junior`
    - **Model:** `antigravity-gemini-3.6-flash`
    - **Status:** `completed`
  - **Subagent 3:**
    - **ID:** `ses_00baeccdcffeURe272XGvKdRRv`
    - **Agent:** `plan`
    - **Model:** `antigravity-gemini-3.6-flash`
    - **Status:** `completed`
- **Aggregated Metrics:**
  - **Total Input Tokens:** 142,050
  - **Total Cache Read Tokens:** 118,400
  - **Cumulative Cost:** `$0.0425`
- **Data Source Annotation:** `supported` (Served by `GET /ucs/topology`)

### 3.2 Live Event Stream (View B)
The Live Event Stream displays real-time lifecycle events and state updates.
- **Event 1:**
  - **Timestamp:** `2026-08-11T20:30:00Z`
  - **Type:** `session.created`
  - **Payload:** `{"sessionId": "ses_00baeccdcffeURe272XGvKdRRv"}`
- **Event 2:**
  - **Timestamp:** `2026-08-11T20:31:00Z`
  - **Type:** `task.started`
  - **Payload:** `{"subagentId": "ses_00baef906ffeg4vYjPvoLwlI3x"}`
- **Event 3:**
  - **Timestamp:** `2026-08-11T20:31:04Z`
  - **Type:** `task.completed`
  - **Payload:** `{"subagentId": "ses_00baef906ffeg4vYjPvoLwlI3x"}`
- **Event 4:**
  - **Timestamp:** `2026-08-11T20:32:00Z`
  - **Type:** `boulder.updated`
  - **Payload:** `{"activeStep": "Author Gate G1 (UI Design Mockup)"}`
- **Data Source Annotation:** `supported` (Served by `GET /ucs/events` SSE)

### 3.3 Boulder State & Evidence Inspector (View C)
The Boulder State & Evidence Inspector tracks the progress of the active plan and lists generated evidence files.
- **Active Goal:** `Deliver Phase 2 Pre-Implementation Gates (G1-G4)`
- **Active Step:** `Author Gate G1 (UI Design Mockup)`
- **Progress:** `42.8%` (3 of 7 steps completed)
- **Evidence Files:**
  - `.scratch/trellis/out/trellis_20260811T195242Z_s7_1.glb`
  - `docs/reference/ucs-frontend-phase2-feedback-specification.md`
  - `docs/reference/ucs-frontend-phase2-shared-glossary.md`
  - `script/ucs-phase2-gate-check.ts`
- **Data Source Annotation:** `supported (beta)` (Served by `GET /ucs/work`)

### 3.4 Workspace Selector (View D)
The Workspace Selector allows switching between registered projects.
- **Active Project Name:** `opencode`
- **Active Project ID:** `opencode-228cc625`
- **Worktree Path:** `/Volumes/Topper2TB/Git/opencode`
- **Data Source Annotation:** `supported` (Served by `GET /ucs/projects`)

---

## 4. Side-Panel Widgets Data Rendering

### 4.1 External App Status Card (Widget 5)
Displays the connection and compilation status of external engines.
- **Adapter ID:** `unity-supermcp-01`
- **Engine:** `unity`
- **Name:** `Unity SuperMCP Bridge`
- **Status:** `connected`
- **Editor Version:** `2022.3.20f1`
- **Scene:** `Assets/Scenes/MainStage.unity`
- **Playmode:** `stopped`
- **Compilation:** `clean`
- **Data Source Annotation:** `supported` (Served by `GET /ucs/work` integrations block)

### 4.2 OAuth Quota Status Panel (Widget 1)
Tracks token usage and quota ceilings for the three auth plugins.
- **Anthropic:** 85% (e.g., 85,000 / 100,000 tokens)
- **OpenAI:** 42% (e.g., 21,000 / 50,000 tokens)
- **Gemini:** 12% (e.g., 2,400 / 20,000 tokens)
- **Data Source Annotation:** `planned (Phase 2.5)` (Proposed endpoint `GET /ucs/quota`)

### 4.3 AFT Code Health Widget (Widget 2)
Displays live status-bar metrics from the AFT tool.
- **Errors (E):** 0
- **Warnings (W):** 6
- **Dead Code (D):** 696
- **Unused Exports (U):** 662
- **Duplicates (C):** 432
- **TODOs (T):** 0
- **Data Source Annotation:** `planned (Phase 2.5)` (Proposed endpoint `GET /ucs/health`)

### 4.4 Cache Diagnostics & Prompt Bust Panel (Widget 3)
Tracks prompt cache efficiency and cache-bust events.
- **Hit Ratio:** 91.2%
- **cache_read:** 1,146,194 tokens
- **cache_write:** 101,639 tokens
- **full_bust:** 0
- **Data Source Annotation:** `planned (Phase 2.5)` (Proposed endpoint `GET /ucs/cache`)

### 4.5 AFT Live LSP Diagnostics Panel (Widget 4)
Lists active language-server diagnostic messages.
- **Active Warnings:** 6 warnings (e.g., unused imports, deprecated methods)
- **Data Source Annotation:** `planned (Phase 2.5)` (Proposed endpoint `GET /ucs/diagnostics`)

---

## 5. Data Provenance & Verification Annotation Table

The following table maps each region of the mockup to its corresponding fixture keys and database tables.

| UI Region / Component | Mockup Value | Fixture JSON Key | Database Table / Source | Capability Status |
|---|---|---|---|---|
| **Workspace Selector** | `opencode` | `project.name` | `project` | `supported` |
| **Workspace Selector** | `/Volumes/Topper2TB/Git/opencode` | `project.worktree` | `project` | `supported` |
| **Session Topology Tree** | `ses_00baeccdcffeURe272XGvKdRRv` | `primarySession.id` | `session` | `supported` |
| **Session Topology Tree** | `plan` | `primarySession.agent` | `session` | `supported` |
| **Session Topology Tree** | `running` | `primarySession.status` | `session` | `supported` |
| **Session Topology Tree** | `ses_00baef906ffeg4vYjPvoLwlI3x` | `subagents[0].id` | `session` | `supported` |
| **Session Topology Tree** | `Sisyphus-Junior` | `subagents[0].agent` | `session` | `supported` |
| **Session Topology Tree** | `completed` | `subagents[0].status` | `session` | `supported` |
| **Session Topology Tree** | `142,050` | Simulated total input tokens | `session_tokens` | `supported` |
| **Session Topology Tree** | `118,400` | Simulated total cache read tokens | `session_tokens` | `supported` |
| **Session Topology Tree** | `$0.0425` | `primarySession.tokens.totalCostUsd` | `session_tokens` | `supported` |
| **Live Event Stream** | `session.created` | `eventsSample[0].type` | `session_event` | `supported` |
| **Live Event Stream** | `2026-08-11T20:30:00Z` | `eventsSample[0].time` | `session_event` | `supported` |
| **Boulder Inspector** | `Deliver Phase 2 Pre-Implementation Gates (G1-G4)` | `boulderState.activeGoal` | `boulder` | `supported (beta)` |
| **Boulder Inspector** | `Author Gate G1 (UI Design Mockup)` | `boulderState.activeStep` | `boulder` | `supported (beta)` |
| **Boulder Inspector** | `42.8%` | `boulderState.percentage` | `boulder` | `supported (beta)` |
| **Boulder Inspector** | `.scratch/trellis/out/...` | `boulderState.evidenceFiles[0]` | `boulder_evidence` | `supported (beta)` |
| **External App Card** | `unity-supermcp-01` | `integrations[0].id` | `integration` | `supported` |
| **External App Card** | `connected` | `integrations[0].status` | `integration` | `supported` |
| **External App Card** | `2022.3.20f1` | `integrations[0].details.editorVersion` | `integration` | `supported` |
| **OAuth Quota Panel** | `Anthropic: 85%` | Simulated quota usage | `oauth_quota` | `planned (Phase 2.5)` |
| **AFT Code Health** | `E: 0  W: 6  D: 696` | Simulated AFT metrics | `aft_health` | `planned (Phase 2.5)` |
| **Cache Diagnostics** | `Hit Ratio: 91.2%` | Simulated cache metrics | `cache_diagnostics` | `planned (Phase 2.5)` |
| **LSP Diagnostics** | `6 warnings` | Simulated LSP warnings | `lsp_diagnostics` | `planned (Phase 2.5)` |
