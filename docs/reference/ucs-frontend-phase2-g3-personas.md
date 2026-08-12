# UCS Frontend Phase 2 — Gate G3: Persona User Stories

This document establishes the canonical persona user stories and Given/When/Then acceptance criteria for the UCS Web vertical slice. These stories map directly to the views, panels, and widgets defined in the Phase 2 Shared Architecture Glossary and Feedback Specification.

---

## 1. Personas

### 1.1 Systems Architect
* **Focus**: System topology, subagent costs, prompt-cache efficiency, and multi-project context.
* **Key Metrics**: `tokens.cacheReadTokens`, `tokens.cacheWriteTokens`, `tokens.totalCostUsd`, `cache_read`, `full_bust`.
* **Primary Views/Widgets**: View A (Session Topology Tree View), View D (Workspace / Multi-Project Selector), Widget 3 (Cache Diagnostics & Prompt Bust Panel).

### 1.2 Multi-Agent Orchestrator
* **Focus**: Live SSE event streams, tool invocations, background task states, and boulder task completion.
* **Key Metrics**: `boulder.completedSteps`, `boulder.totalSteps`, `boulder.planCompletionPercentage`, `event.type`, `event.payload`.
* **Primary Views/Widgets**: View B (Live Event Stream / Log Observer), View C (Boulder State & Evidence Inspector).

### 1.3 QA & Release Engineer
* **Focus**: AFT code health metrics, live LSP diagnostics, external app integration status, and read-only security enforcement.
* **Key Metrics**: `health.errors`, `health.warnings`, `health.deadCode`, `health.unusedExports`, `health.duplicates`, `health.todos`, `integration.connected`, `integration.playmode`.
* **Primary Views/Widgets**: Widget 2 (AFT Code Health Widget), Widget 4 (AFT Live LSP Diagnostics Panel), Widget 5 (External App Status Card).

---

## 2. User Stories & Acceptance Criteria

### 2.1 Systems Architect Stories

#### Story 1: Multi-Project Cost and Topology Monitoring
As a Systems Architect,  
I want to view the hierarchical session topology tree and cumulative costs across different workspaces,  
so that I can identify expensive subagent branches and optimize resource allocation.

* **Given** the user has selected a workspace from the Workspace Selector (View D) with registered projects in `/ucs/projects`.
* **When** the Session Topology Tree View (View A) loads the topology data from `GET /ucs/topology`.
* **Then** the tree must display each session node with its `session.role` (`primary`, `subagent`, `compaction`), `session.status` (`running`, `idle`, `completed`, `error`, `aborted`), and cumulative `tokens.totalCostUsd`.
* **And** subagent nodes must be nested under their respective parent session nodes to represent the execution hierarchy.

#### Story 2: Prompt Cache Parity and Efficiency Verification (Spec 2.2)
As a Systems Architect,  
I want to monitor prompt-cache hit ratios and bust events in real time without polluting the LLM context,  
so that I can verify that the Web UI maintains 100% prompt-cache parity with the TUI.

* **Given** the Web UI client is actively connected and streaming events via the `/ucs/events` SSE channel.
* **When** the Cache Diagnostics & Prompt Bust Panel (Widget 3) receives cache metrics from `GET /ucs/cache`.
* **Then** the panel must display the current `tokens.cacheReadTokens` and `tokens.cacheWriteTokens` alongside the count of `cache_read` hits.
* **And** the system must assert that `full_bust` remains `0`, confirming that no dynamic tables or UI presence indicators have been injected into the LLM conversation context.

---

### 2.2 Multi-Agent Orchestrator Stories

#### Story 3: Real-Time Tool and Event Stream Observation
As a Multi-Agent Orchestrator,  
I want to observe a real-time stream of agent lifecycle events and tool invocations,  
so that I can track the execution flow of parallel subagents.

* **Given** the Live Event Stream / Log Observer (View B) is connected to the `GET /ucs/events` SSE stream.
* **When** a subagent invokes a tool or changes its lifecycle state.
* **Then** the view must append a log entry containing the `event.type` and `event.payload` details.
* **And** the entry must display the associated agent identity and model ID.

#### Story 4: Boulder Task and Evidence Tracking
As a Multi-Agent Orchestrator,  
I want to inspect the active boulder task goals, step progress, and generated evidence artifacts,  
so that I can verify the completion status of complex multi-agent plans.

* **Given** the Boulder State & Evidence Inspector (View C) is loaded.
* **When** the view fetches the active task state from `GET /ucs/work`.
* **Then** the view must render the active step, the `boulder.completedSteps` out of `boulder.totalSteps`, and the calculated `boulder.planCompletionPercentage`.
* **And** it must display the count of generated evidence artifacts found in `.omo/evidence/`.

---

### 2.3 QA & Release Engineer Stories

#### Story 5: Workspace Code Health and LSP Diagnostics
As a QA & Release Engineer,  
I want to view live AFT code health metrics and detailed LSP diagnostics,  
so that I can monitor code quality and compile-state regressions during agent execution.

* **Given** the AFT Code Health Widget (Widget 2) and AFT Live LSP Diagnostics Panel (Widget 4) are active.
* **When** the workspace health data is retrieved from `GET /ucs/health` and `GET /ucs/diagnostics`.
* **Then** the Code Health Widget must display the counts for `health.errors` (E), `health.warnings` (W), `health.deadCode` (D), `health.unusedExports` (U), `health.duplicates` (C), and `health.todos` (T).
* **And** the LSP Diagnostics Panel must list the active language-server diagnostic messages, file paths, and line numbers.

#### Story 6: External App Integration Status
As a QA & Release Engineer,  
I want to monitor the connection and runtime state of external workspace adapters,  
so that I can verify that the agent's environment is properly integrated.

* **Given** the External App Status Card (Widget 5) is visible.
* **When** the integration state is parsed from the `integrations` block of `GET /ucs/work`.
* **Then** the card must display the adapter ID, the engine type (`unity`, `unreal`, `xcode`, `blender`), and the connection status (`integration.connected` as `connected`, `disconnected`, `standby`, or `error`).
* **And** it must show the engine runtime state, including whether `integration.playmode` is active.

#### Story 7: Read-Only Server Enforcement (Spec 2.4)
As a QA & Release Engineer,  
I want to ensure that the Web UI client cannot trigger any state mutations or tool executions,  
so that the server remains secure and strictly read-only.

* **Given** the Web UI client is running in a Phase 2 read-only context.
* **When** the client attempts to send a mutation request, such as `POST /session`, a prompt injection, or a tool approval response.
* **Then** the server must reject the request and return an `HTTP 403 Forbidden` response.
* **And** the frontend interface must omit all input boxes, prompt submit triggers, and mutation buttons.
