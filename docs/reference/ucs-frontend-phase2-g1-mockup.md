# UCS Frontend Strategy — Gate G1 UI Design Mockup

**Document Version:** 1.0.0  
**Date:** 2026-08-11  
**Status:** DRAFT FOR REVIEW  
**Target Recipient:** `uc-studio`  

---

## 1. Executive Summary & Overview

This document defines the visual layout, component hierarchy, data bindings, and responsive behavior for the **Phase 2 Read-Only Web Vertical Slice** of the User Context System (UCS) Web interface. Built using **TypeScript / SolidJS** (`@opencode-ai/app` + `@opencode-ai/session-ui`), this interface provides a comprehensive, real-time observation surface for active workspaces and multi-agent sessions.

### 1.1 Core Architectural Invariants
1. **Prompt Caching Parity (`cache_read` Floor)**: To satisfy the prompt caching invariant (Memory #2994), all frontend communication routes strictly out-of-band via namespaced `/ucs/*` REST endpoints and `/ucs/events` SSE. The frontend does not inject any UI presence indicators or dynamic tables into the LLM conversation context, ensuring 100% `cache_read` parity with the TUI and zero cache busts (`full_bust === 0`).
2. **Strict Read-Only Posture**: In accordance with the Phase 2 specification (Spec 2.4), all input fields, submission controls, and mutation triggers are omitted from the UI. The server-side substrate enforces this by returning `HTTP 403 Forbidden` for any mutation requests originating from the Web UI client context.
3. **Hosting Isolation**: The frontend runs as an independent web application surface, proxying or binding to a separate port, allowing hot-reloading and isolated development without polluting the core server execution.

---

## 2. Primary Views

The interface is structured around four primary views that display the state of the workspace, session hierarchy, event logs, and task progress.

### 2.1 Session Topology Tree View (View A)
* **Description**: Interactive visual hierarchy of parent sessions and parallel subagent trees, showing agent identity, model ID, status, token usage, and cumulative session cost.
* **Component Breakdown**:
  - `<SessionTopologyTree>`: Container component managing the tree layout and rendering nodes.
  - `<TopologyNode>`: Individual node representing a session, styled based on its role and status.
  - `<NodeMetrics>`: Inline badge displaying token counts and cumulative cost.
* **Data Fields**:
  - `id`: Unique session identifier.
  - `parentId`: Parent session identifier (null for primary session).
  - `role`: `primary` | `subagent` | `compaction`
  - `status`: `running` | `idle` | `completed` | `error` | `aborted`
  - `modelId`: The LLM model used (e.g., `claude-3-5-sonnet`).
  - `inputTokens`: Number of input tokens consumed.
  - `outputTokens`: Number of output tokens consumed.
  - `cacheReadTokens`: Number of prompt cache read tokens.
  - `cacheWriteTokens`: Number of prompt cache write tokens.
  - `totalCostUsd`: Cumulative cost of the session in USD.
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/topology`
  - **Data Status**: `supported` (Phase-1 endpoint)

### 2.2 Live Event Stream / Log Observer (View B)
* **Description**: Real-time SSE stream log capturing lifecycle events, tool invocations, background task states, and session completions.
* **Component Breakdown**:
  - `<LiveEventStream>`: Main container that connects to the SSE stream and manages the log buffer.
  - `<EventLogList>`: Virtualized list rendering log entries efficiently.
  - `<EventLogItem>`: Individual log entry component with syntax highlighting for payloads.
  - `<EventPayloadViewer>`: Expandable modal/drawer for inspecting detailed JSON payloads.
* **Data Fields**:
  - `id`: Unique event identifier.
  - `timestamp`: ISO timestamp of the event.
  - `type`: Event type (e.g., `session_start`, `tool_call`, `tool_response`, `session_complete`).
  - `payload`: JSON object containing tool name, arguments, result, or error.
  - `agentId`: Identifier of the agent that triggered the event.
  - `modelId`: Model ID associated with the agent.
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/events` (SSE)
  - **Data Status**: `supported` (Phase-1 endpoint)

### 2.3 Boulder State & Evidence Inspector (View C)
* **Description**: Visual tracking of active `.omo/boulder.json` task goals, active step, plan completion percentage, and `.omo/evidence/` artifact counts.
* **Component Breakdown**:
  - `<BoulderInspector>`: Container displaying the active task goal and step list.
  - `<StepProgressBar>`: Visual progress bar showing plan completion percentage.
  - `<EvidenceGrid>`: Grid layout displaying generated evidence artifacts.
  - `<EvidenceCard>`: Card component representing an individual evidence file.
* **Data Fields**:
  - `activeStep`: Description of the currently executing step.
  - `completedSteps`: Number of completed steps in the plan.
  - `totalSteps`: Total number of steps in the plan.
  - `planCompletionPercentage`: Calculated percentage of plan completion.
  - `evidenceCount`: Total count of evidence files in `.omo/evidence/`.
  - `evidenceFiles`: Array of file metadata (name, size, path, timestamp).
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/work`
  - **Data Status**: `supported (beta)` (Phase-1 endpoint)

### 2.4 Workspace / Multi-Project Selector (View D)
* **Description**: Dynamic switcher between active projects registered in `/ucs/projects`.
* **Component Breakdown**:
  - `<WorkspaceSelector>`: Dropdown or sidebar list for switching projects.
  - `<ProjectList>`: List of registered projects.
  - `<ProjectCard>`: Card displaying project name, path, and active status.
* **Data Fields**:
  - `id`: Unique project identifier.
  - `name`: Display name of the project.
  - `path`: Absolute path to the project root.
  - `status`: `active` | `inactive`
  - `lastActive`: Timestamp of last activity.
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/projects`
  - **Data Status**: `supported` (Phase-1 endpoint)

---

## 3. Side-Panel Widgets

The right-hand side panel (or overlay drawer on smaller screens) hosts diagnostic widgets. Note that while the Phase 2 Feedback Specification header refers to "4 Side Panels", it explicitly lists 5 widgets; all 5 are implemented here.

### 3.1 OAuth Plugin Quota Status Panel (Widget 1)
* **Description**: Readout for the 3 auth plugins (Anthropic, OpenAI, Gemini) tracking token usage and quota ceilings.
* **Component Breakdown**:
  - `<OAuthQuotaPanel>`: Container displaying quota cards for each provider.
  - `<QuotaProgressBar>`: Visual representation of token usage against the ceiling.
* **Data Fields**:
  - `provider`: `anthropic` | `openai` | `gemini`
  - `tokenUsage`: Number of tokens consumed in the current billing cycle.
  - `quotaCeiling`: Maximum token limit.
  - `resetTime`: Timestamp when the quota resets.
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/quota` *(proposed)*
  - **Data Status**: `planned` (Phase 2.5 endpoint)

### 3.2 AFT Code Health Widget (Widget 2)
* **Description**: Live status-bar metrics showing LSP diagnostic counts (`E`/`W`), dead-code estimates (`D`), unused exports (`U`), duplication clone groups (`C`), and TODO items (`T`).
* **Component Breakdown**:
  - `<AftCodeHealthWidget>`: Compact status bar component.
  - `<MetricBadge>`: Individual badge for each metric category.
* **Data Fields**:
  - `errors`: Count of active LSP errors (E).
  - `warnings`: Count of active LSP warnings (W).
  - `deadCode`: Count of suspected dead-code symbols (D).
  - `unusedExports`: Count of unused exports (U).
  - `duplicates`: Count of duplicate code clone groups (C).
  - `todos`: Count of TODO comments in the workspace (T).
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/health` *(proposed)*
  - **Data Status**: `planned` (Phase 2.5 endpoint)

### 3.3 Cache Diagnostics & Prompt Bust Panel (Widget 3)
* **Description**: Hit ratio tracking, prompt-cache read counts (`cache_read`), and cache-bust diagnostics (parity with CortexKit dashboard).
* **Component Breakdown**:
  - `<CacheDiagnosticsPanel>`: Container displaying cache efficiency metrics.
  - `<HitRatioGauge>`: Circular gauge showing the cache hit ratio.
* **Data Fields**:
  - `cacheReadTokens`: Total tokens read from prompt cache.
  - `cacheWriteTokens`: Total tokens written to prompt cache.
  - `cacheHitRatio`: Percentage of prompt tokens served from cache.
  - `fullBustCount`: Number of cache bust events (must remain `0`).
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/cache` *(proposed)*
  - **Data Status**: `planned` (Phase 2.5 endpoint)

### 3.4 AFT Live LSP Diagnostics Panel (Widget 4)
* **Description**: Detailed expandable panel displaying active language-server diagnostic messages across the workspace.
* **Component Breakdown**:
  - `<AftLspDiagnosticsPanel>`: Container listing active diagnostics.
  - `<DiagnosticItem>`: Expandable item showing file path, line number, and error message.
* **Data Fields**:
  - `filePath`: Relative path to the file containing the diagnostic.
  - `line`: 1-based line number.
  - `column`: 1-based column number.
  - `severity`: `error` | `warning`
  - `message`: The diagnostic message from the LSP.
  - `ruleId`: The rule identifier (if available).
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/diagnostics` *(proposed)*
  - **Data Status**: `planned` (Phase 2.5 endpoint)

### 3.5 External App Status Card (Widget 5)
* **Description**: Dedicated status badge for connected `UcsExternalApp` bridge engines (e.g. Unity SuperMCP editor connection, compilation, and playmode states).
* **Component Breakdown**:
  - `<ExternalAppStatusCard>`: Card displaying connection and runtime state.
  - `<IntegrationBadge>`: Status badge for active integrations.
* **Data Fields**:
  - `adapterId`: Identifier of the external adapter (e.g., `unity-supermcp`).
  - `engineType`: `unity` | `unreal` | `xcode` | `blender`
  - `connectionStatus`: `connected` | `disconnected` | `standby` | `error`
  - `playmode`: Boolean indicating if playmode is active.
  - `compilation`: Boolean indicating if compilation is in progress.
  - `modalBlocked`: Boolean indicating if the editor is blocked by a modal dialog.
* **Data Source Annotation**:
  - **Endpoint**: `GET /ucs/work` (`integrations` block)
  - **Data Status**: `supported` (Phase-1 endpoint)

---

## 4. Responsive ASCII Wireframes

### 4.1 Mobile Breakpoint (375px)
On mobile devices, the layout is a single-column stacked view. Navigation tabs switch between the primary views, and the side panels are accessible via an overlay drawer.

```
+---------------------------------------+
| [=] UCS Studio Web           [Projects] |
+---------------------------------------+
| [Proj: opencode]                      |
+---------------------------------------+
| [ Topology ] [ Events ] [ Boulder ]   |
+---------------------------------------+
| SESSION TOPOLOGY TREE                 |
|                                       |
| v primary (running)                   |
|   |-- model: claude-3-5-sonnet        |
|   |-- cost: $0.124                    |
|   |                                   |
|   +-- subagent-1 (completed)          |
|       |-- model: gpt-4o               |
|       |-- cost: $0.045                |
|                                       |
+---------------------------------------+
| [!] Code Health: E0 W6 | D696 U662    |
+---------------------------------------+
| [=] Open Side Panels Drawer           |
+---------------------------------------+
```

### 4.2 Tablet Breakpoint (768px)
On tablet devices, the layout splits into a dual-column view. The primary view occupies the left column, while a collapsible side-panel column occupies the right.

```
+-----------------------------------------------------------------------+
| [=] UCS Studio Web             [Project: opencode v]                  |
+-----------------------------------------------------------------------+
| [ Topology ] [ Live Events ] [ Boulder & Evidence ]                   |
+-----------------------------------------------------------------------+
| PRIMARY VIEW (Session Topology Tree)  | SIDE PANELS (Collapsible)     |
|                                       |                               |
| v primary (running)                   | +-- OAuth Quota Status ------+ |
|   |-- model: claude-3-5-sonnet        | | Anthropic: 45k / 100k      | |
|   |-- cost: $0.124                    | | OpenAI:    12k / 50k       | |
|   |                                   | +----------------------------+ |
|   +-- subagent-1 (completed)          | +-- AFT Code Health ---------+ |
|       |-- model: gpt-4o               | | E: 0 | W: 6 | D: 696       | |
|       |-- cost: $0.045                | | U: 662 | C: 432 | T: 0     | |
|                                       | +----------------------------+ |
|                                       | +-- Cache Diagnostics -------+ |
|                                       | | Hit Ratio: 84.2%           | |
|                                       | | Full Busts: 0 (Parity OK)  | |
|                                       | +----------------------------+ |
|                                       | +-- External App (Unity) ----+ |
|                                       | | Status: Connected          | |
|                                       | | Playmode: Active           | |
|                                       | +----------------------------+ |
+-----------------------------------------------------------------------+
```

### 4.3 Desktop Breakpoint (1280px)
On desktop screens, a multi-pane layout is used. The left pane contains the workspace selector, the center pane displays the primary views (topology and event stream stacked or side-by-side), and the right pane displays the grid of side-panel widgets.

```
+-----------------------------------------------------------------------------------------------------------------------+
| UCS Studio Web                                                                                  [Project: opencode v] |
+-----------------------------------------------------------------------------------------------------------------------+
| WORKSPACE SELECTOR    | PRIMARY VIEW: SESSION TOPOLOGY TREE                   | SIDE PANELS & DIAGNOSTIC WIDGETS      |
|                       |                                                       |                                       |
| Active Projects:      | v primary (running)                                   | +-- OAuth Quota Status (Planned) ----+ |
| > opencode            |   |-- model: claude-3-5-sonnet                        | | Anthropic: 45,230 / 100,000 tokens | |
|   /git/opencode       |   |-- cost: $0.124                                    | | OpenAI:    12,400 / 50,000 tokens  | |
|                       |   |-- tokens: 8.2k in / 1.4k out                      | | Gemini:    5,000 / 20,000 tokens   | |
|   uc-studio           |   |                                                   | +------------------------------------+ |
|   /git/uc-studio      |   +-- subagent-1 (completed)                          | +-- AFT Code Health (Planned) -------+ |
|                       |       |-- model: gpt-4o                               | | E: 0 | W: 6 | D: 696 | U: 662      | |
|   effect-smol         |       |-- cost: $0.045                                | | C: 432 | T: 0                      | |
|   /git/effect-smol    |       |-- tokens: 2.1k in / 0.8k out                  | +------------------------------------+ |
|                       |       |                                               | +-- Cache Diagnostics (Planned) -----+ |
|                       |       +-- subagent-2 (running)                        | | Hit Ratio: 84.2%                   | |
|                       |           |-- model: claude-3-5-sonnet                | | cache_read: 12,450 tokens          | |
|                       |           |-- cost: $0.032                                | | full_bust:  0 (Parity OK)          | |
|                       |                                                       | +------------------------------------+ |
|                       |-------------------------------------------------------| +-- AFT Live LSP Diagnostics --------+ |
|                       | LIVE EVENT STREAM / LOG OBSERVER                      | | [W] packages/app/src/app.tsx:12    | |
|                       |                                                       | |     Unused import 'Button'         | |
|                       | [10:30:00] session_start: primary (claude-3-5-sonnet) | +------------------------------------+ |
|                       | [10:30:05] tool_call: read (path: "package.json")     | +-- External App Status (Unity) -----+ |
|                       | [10:30:06] tool_call: read (success)                  | | Adapter: unity-supermcp            | |
|                       | [10:30:10] subagent_spawn: subagent-1 (gpt-4o)        | | Status:  Connected                 | |
|                       | [10:30:15] tool_call: grep (pattern: "UcsTopology")   | | Playmode: Active | Compiling: No   | |
|                       |                                                       | +------------------------------------+ |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 5. Read-Only Server Gate & Input Omissions

To enforce the read-only security posture of Phase 2, the frontend interface completely omits all input and mutation controls. The server-side substrate acts as the final gate, rejecting any write operations with an `HTTP 403 Forbidden` response.

### 5.1 Omitted UI Elements
The following interactive elements are explicitly omitted from the Phase 2 frontend:
1. **Prompt Input Fields**: No textareas, text inputs, or chat boxes for sending prompts or messages to the agent.
2. **Submission Triggers**: No "Send", "Submit", "Run", or "Execute" buttons.
3. **Tool Approval Controls**: No buttons or dialogs to approve, reject, or modify pending tool executions.
4. **Feedback Inputs**: No text fields for providing feedback or instructions when rejecting tool calls.
5. **Workspace Mutations**: No buttons to add, register, edit, or delete projects in the Workspace Selector.
6. **Session Lifecycle Controls**: No buttons to start, pause, resume, abort, or terminate sessions.
7. **Configuration Editors**: No settings panels or forms to modify agent configurations, model parameters, or environment variables.

### 5.2 Server-Side Enforcement
The server substrate enforces this gate at the route level. Any client attempting to access mutation endpoints will receive an immediate `HTTP 403 Forbidden` response. The affected endpoints include:
* `POST /ucs/sessions` (Session creation)
* `POST /ucs/tools/approve` (Tool execution approval)
* `POST /ucs/tools/reject` (Tool execution rejection)
* `POST /ucs/projects` (Project registration)
* `DELETE /ucs/projects/:id` (Project deregistration)
* `PUT /ucs/config` (Configuration updates)
