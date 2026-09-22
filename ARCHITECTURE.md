# Architecture

## Pattern Overview

**Overall:** Effect-Native Layered Monorepo with Event-Sourced Projections and Scoped Location Services

**Key Characteristics:**
- **Strict Unidirectional Dependency Graph:** Enforce runtime dependencies flowing from `Schema` to `Core` and `Protocol`, then from `Core` and `Protocol` to `Server`. `Client` runtime code depends on `Schema` and `Protocol` but never on `Core` or `Server`. `sdk-next` composes `Client`, `Core`, and `Server` in-memory.
- **Typed Functional Core:** Use Effect (`effect`) primitives (`Effect`, `Layer`, `Context`, `Scope`, `Schema`, `Stream`) across business logic, lifecycle scopes, and resource acquisition.
- **Dual-Scope Service Hierarchy:** Maintain process-global services (database, session store, execution coordinator, application tools) alongside per-workspace/worktree location-scoped services (`LocationServices` via `LayerMap` keyed by `Location.Ref`).
- **Event-Sourced Session Execution:** Record durable events (`session_input`, `event`, `event_sequence`) in SQLite and project them into read-optimized SQL tables (`session`, `session_message`, `session_part`) via transactional projectors.
- **Unified Provider-Agnostic LLM Engine:** Normalize all provider interactions (OpenAI, Anthropic, Bedrock, Gemini, Copilot, etc.) through `@opencode-ai/llm` using canonical `LLMRequest`, `LLMClient`, automated prompt caching, and structured `LLMEvent` streams.
- **Sandboxed Tool Execution:** Confine dynamic script evaluation via `@opencode-ai/codemode`, executing bounded JavaScript ASTs directly over schema-defined tools without process or filesystem escapes.

---

## Layers

### Schema Layer
- **Purpose:** Define the authoritative canonical domain models, identifiers, and event shapes with runtime validation.
- **Location:** `packages/schema/`
- **Contains:** Effect Schema codecs (`Schema.Struct`, `Schema.TaggedErrorClass`), branded identifier factories (`Session.ID`, `Location.Ref`, `Project.ID`), durable event definitions (`durable-event-manifest.ts`).
- **Depends on:** `effect`
- **Used by:** `packages/protocol`, `packages/core`, `packages/server`, `packages/client`, `packages/llm`, `packages/opencode`, `packages/app`, `packages/tui`.

### Protocol Layer
- **Purpose:** Define wire protocols, Effect `HttpApi` endpoint specifications, middleware contracts, and error schemas.
- **Location:** `packages/protocol/`
- **Contains:** Endpoint definitions (`packages/protocol/src/api.ts`), API group contracts (`packages/protocol/src/groups/`), wire errors (`packages/protocol/src/errors.ts`), middleware declarations (`packages/protocol/src/middleware/`).
- **Depends on:** `@opencode-ai/schema`, `effect`.
- **Used by:** `packages/server`, `packages/client`.

### Core Layer
- **Purpose:** Execute core business logic, session orchestration, location-scoped service maps, tool registries, file system operations, and database persistence.
- **Location:** `packages/core/`
- **Contains:** Session state machine (`packages/core/src/session/`), location service lifecycle (`packages/core/src/location-services.ts`), SQLite database via Drizzle (`packages/core/src/database/database.ts`), permissions (`packages/core/src/permission.ts`), file watcher and search (`packages/core/src/filesystem/`), terminal PTY (`packages/core/src/pty.ts`), configuration (`packages/core/src/config.ts`).
- **Depends on:** `@opencode-ai/schema`, `@opencode-ai/llm`, `@opencode-ai/plugin`, `@opencode-ai/effect-drizzle-sqlite`, `@opencode-ai/effect-sqlite-node`, `drizzle-orm`, `effect`.
- **Used by:** `packages/server`, `packages/sdk-next`, `packages/opencode`, `packages/tui`.

### Server Layer
- **Purpose:** Implement Effect `HttpApi` handlers, HTTP routing, Server-Sent Events (SSE), authentication, and WebSocket handling.
- **Location:** `packages/server/`
- **Contains:** Route implementations (`packages/server/src/routes.ts`), endpoint handlers (`packages/server/src/handlers/`), auth middleware (`packages/server/src/auth.ts`), CORS (`packages/server/src/cors.ts`), location resolution (`packages/server/src/location.ts`).
- **Depends on:** `@opencode-ai/core`, `@opencode-ai/protocol`, `effect`, `drizzle-orm`.
- **Used by:** `packages/opencode`, `packages/sdk-next`.

### Client Layer
- **Purpose:** Provide strongly typed API clients generated directly from the authoritative Effect `HttpApi`.
- **Location:** `packages/client/`
- **Contains:** Zero-Effect standard `fetch` client (`packages/client/src/index.ts`), Effect network client with `HttpClient` (`packages/client/src/effect.ts`), generated types and groups (`packages/client/src/generated/`).
- **Depends on:** `@opencode-ai/schema`, `@opencode-ai/protocol`.
- **Used by:** `packages/app`, `packages/session-ui`, `packages/sdk-next`, external consumers.

### In-Process Host SDK (`sdk-next`)
- **Purpose:** Provide an Effect-native, in-process OpenCode host executing the Server's HTTP router in memory with zero network I/O.
- **Location:** `packages/sdk-next/`
- **Contains:** Host builder and layer provider (`packages/sdk-next/src/index.ts`).
- **Depends on:** `@opencode-ai/client`, `@opencode-ai/core`, `@opencode-ai/server`, `effect`.
- **Used by:** In-process integrations, unit and integration test harnesses.

### LLM Subsystem
- **Purpose:** Provide schema-first, provider-neutral model invocation, automated prompt caching, and normalized streaming.
- **Location:** `packages/llm/`
- **Contains:** Client dispatcher (`packages/llm/src/index.ts`), route compilers (`packages/llm/src/route/index.ts`), provider adapters (`packages/llm/src/providers/`), wire protocols (`packages/llm/src/protocols/`).
- **Depends on:** `@opencode-ai/schema`, `effect`.
- **Used by:** `@opencode-ai/core`.

### Confinement Subsystem (`codemode`)
- **Purpose:** Execute bounded JavaScript orchestration scripts directly over schema-described tool definitions without ambient node/process authorities.
- **Location:** `packages/codemode/`
- **Contains:** AST evaluator, tool tree caller, resource/timeout accountant (`packages/codemode/src/index.ts`).
- **Depends on:** `effect`, `acorn`, `typescript`.
- **Used by:** `@opencode-ai/opencode`, `@opencode-ai/core`.

### User Interfaces & Applications
- **Purpose:** Deliver interactive development interfaces across CLI, Terminal (TUI), Web, and Desktop.
- **Location:**
  - CLI & Packaging: `packages/opencode/`
  - Terminal UI: `packages/tui/`
  - Web Application: `packages/app/`
  - Desktop (Electron): `packages/desktop/`
  - Shared UI & Theming: `packages/ui/`, `packages/session-ui/`
- **Contains:** SolidJS components, OpenTUI renderers, Electron main process, Yargs CLI subcommands.

---

## Data Flow

### 1. Session Prompt & Continuation Pipeline

1. **Input Admission:** Client posts prompt to `sessions.prompt` (`packages/server/src/handlers/session.ts`), which writes an inbox entry into `session_input` and commits a `PromptAdmitted` durable event (`packages/core/src/session.ts`).
2. **Execution Scheduling:** `SessionExecution.resume(sessionID)` schedules an execution fiber on the coordinator (`packages/core/src/session/execution.ts`).
3. **Location Service Resolution:** The runner acquires the cached `LocationServices` for `session.location` via `LocationServiceMap.get(locationRef)` (`packages/core/src/location-services.ts`).
4. **Context Epoch Reconciliation:** `SystemContextRegistry` gathers environment facts, directory `AGENTS.md` rules, and active skill guidance. It initializes or updates the `ContextEpochStore` snapshot atomically (`packages/core/src/session/context-epoch.ts`).
5. **Prompt Promotion:** The runner promotes admitted inbox records into visible session history, committing a `Prompted` event (`packages/core/src/session/runner/llm.ts`).
6. **LLM Provider Turn:** History is mapped to canonical `@opencode-ai/llm` messages via `toLLMMessages`. `LLMClient.stream(request)` initiates streaming with prompt cache breakpoints automatically positioned (`packages/core/src/session/runner/llm.ts`).
7. **Incremental Streaming & Persistence:** Assistant deltas, usage, and reasoning events stream through `EventV2` and are stored in SQLite (`packages/core/src/session/runner/publish-llm-event.ts`).
8. **Tool Call Invocation:** When the model calls a tool, the runner records a `ToolCalled` durable event, authorizes the action against `PermissionV2`, and invokes the executor via `ToolRegistry` (`packages/core/src/tool/registry.ts`).
9. **Tool Settlement & Resumption:** Tool fibers resolve, emitting `ToolFinished` durable events. The runner reloads projected history and begins the next provider turn until settlement or interruption.

### 2. Event Sourcing and Projection Pipeline

1. **Durable Event Write:** Domain mutations invoke `EventV2.write(events)` (`packages/core/src/event.ts`).
2. **Atomic Sequence Assignment:** Events are verified against `DurableEventManifest` and appended to SQLite `EventTable` and `EventSequenceTable` with strict aggregate sequence counters (`packages/core/src/event/sql.ts`).
3. **Synchronous Projection:** `SessionProjector` applies events to read-optimized projection tables (`session`, `session_message`, `session_part`) within the database transaction (`packages/core/src/session/projector.ts`).
4. **PubSub Broadcast:** `EventV2.publish` broadcasts committed payloads to local subscribers and connected SSE streams (`packages/core/src/event.ts`).

### 3. Location-Scoped Service Acquisition

1. **Ref Resolution:** Incoming requests supply a directory or workspace path header (`x-opencode-directory`), resolving to a `Location.Ref` (`packages/core/src/location.ts`).
2. **Layer Compilation:** `LocationServiceMap` lazily compiles a scoped `Layer` via `LayerNode.hoist` for that location, isolating file watchers, PTY instances, and tool registrations (`packages/core/src/location-services.ts`).
3. **Scope Disposal:** When a location is closed or invalidated, its `Scope` terminates all attached child fibers, watch handles, and temporary resources cleanly.

---

## Key Abstractions

### `Location.Ref` & `LocationServiceMap`
- **Purpose:** Represents the filesystem and workspace boundary for an execution context. Caches and isolates location-specific services.
- **Location:** `packages/core/src/location.ts`, `packages/core/src/location-services.ts`
- **Pattern:** Scoped Dependency Injection container via `effect/LayerMap`.

### `SessionRunner`
- **Purpose:** Coordinates provider turn cycles, input queue promotion, context epochs, tool execution fibers, and termination conditions.
- **Location:** `packages/core/src/session/runner/index.ts`, `packages/core/src/session/runner/llm.ts`
- **Pattern:** Finite State Machine / Orchestrator over functional collaborators.

### `Tool.Definition` & `ToolRegistry`
- **Purpose:** Opaque, schema-validated executable tool definition. Separates host application tools from location-specific tool registrations.
- **Location:** `packages/core/src/tool.ts`, `packages/core/src/tool/registry.ts`
- **Pattern:** Layered Service Registry with scoped overrides (Location registrations override Process Application tools).

### `ContextEpochStore`
- **Purpose:** Stores immutable prompt context baselines and diffs for prompt cache stability, tracking environment facts and instructions.
- **Location:** `packages/core/src/session/context-epoch.ts`, `packages/core/src/system-context/index.ts`
- **Pattern:** Snapshot / Delta versioning.

### `LLMClient` & `Route`
- **Purpose:** Provider-agnostic interface translating canonical model requests into provider-specific payloads, streaming formats, and caching protocols.
- **Location:** `packages/llm/src/index.ts`, `packages/llm/src/route/index.ts`
- **Pattern:** Strategy / Adapter pattern implemented as pure functional Effect routes.

### `CodeMode`
- **Purpose:** In-memory, AST-confined execution sandbox for model-generated JavaScript programs invoking schema-described tools.
- **Location:** `packages/codemode/src/index.ts`
- **Pattern:** Sandboxed Interpreter without `eval` or ambient capabilities.

### `HttpApiApp`
- **Purpose:** Authoritative HTTP router and schema validation runtime mapping protocol definitions to endpoint implementations.
- **Location:** `packages/server/src/api.ts`, `packages/server/src/routes.ts`
- **Pattern:** Effect `HttpApi` declarative contract.

---

## Entry Points

### Standalone CLI
- **Location:** `packages/opencode/src/index.ts`
- **Triggers:** Command-line execution (`opencode [command]`).
- **Responsibilities:** Parse CLI arguments via Yargs, initialize global flags and memory monitoring (`Heap.start()`), dispatch to subcommands (`serve`, `run`, `tui`, `agent`, `session`, `upgrade`, etc.).

### Headless API Server
- **Location:** `packages/opencode/src/cli/cmd/serve.ts`, `packages/opencode/src/server/server.ts`
- **Triggers:** `opencode serve` command.
- **Responsibilities:** Start HTTP and WebSocket listeners, bind mDNS discovery, serve OpenAPI specs, route requests through `HttpApiApp`.

### Terminal UI (TUI)
- **Location:** `packages/opencode/src/cli/cmd/tui.ts`, `packages/tui/src/index.tsx`
- **Triggers:** Default `opencode` command in interactive terminal, or `opencode attach`.
- **Responsibilities:** Launch SolidJS OpenTUI terminal application, manage keybindings, render interactive prompt and session stream.

### Web Application
- **Location:** `packages/app/src/index.ts`
- **Triggers:** Browser navigation to OpenCode web server or Vite dev server.
- **Responsibilities:** SolidJS single-page application rendering workspace tabs, session diffs, message feeds, and file trees.

### Desktop Application
- **Location:** `packages/desktop/src/main/index.ts`
- **Triggers:** Native application launch via Electron.
- **Responsibilities:** Create native application window, manage system menus, configure auto-updater, host local web UI.

### In-Process Host SDK
- **Location:** `packages/sdk-next/src/index.ts`
- **Triggers:** Invocation of `OpenCode.create()`.
- **Responsibilities:** Instantiate in-memory server router and client without binding network ports.

---

## Error Handling

**Strategy:** Typed, composable functional errors using Effect schemas and data-driven diagnostics.

- **Domain Errors:** Use `Schema.TaggedErrorClass` for typed domain failures across packages (e.g. `InvalidDurableEventError`, `MessageDecodeError`, `SessionAlreadyProjected`).
- **Tool Failures:** Use `ToolFailure` to convey expected operational errors to the model. Do not convert host defects or fiber cancellations into model-visible tool errors.
- **Confinement Diagnostics:** `@opencode-ai/codemode` returns structured `CodeMode.Diagnostic` records (`ParseError`, `UnsupportedSyntax`, `UnknownTool`, `InvalidToolInput`, `ToolFailure`, `TimeoutExceeded`) rather than throwing exceptions.
- **Cancellation & Interruption:** Treat Effect fiber interruption as first-class cancellation. Propagate cancellation signals through `Scope` to terminate sub-processes, watchers, and active tool executions cleanly.
- **API Transport Errors:** Lower internal failures into standard HTTP error responses according to `packages/protocol/src/errors.ts`.

---

## Cross-Cutting Concerns

**Logging:**
- Use Effect logging facilities (`Effect.logDebug`, `Effect.logInfo`, `Effect.logError`).
- Configure log levels through CLI options (`--log-level`, `OPENCODE_LOG_LEVEL`) and log output destinations (`--print-logs`).

**Observability & Tracing:**
- Integrate OpenTelemetry tracing via `@effect/opentelemetry` and `@opentelemetry/api` (`packages/core/src/observability.ts`).
- Propagate trace contexts across HTTP routes, session runner loops, and provider invocations.

**Caching:**
- LLM prompt caching is active by default across Anthropic, Bedrock, OpenAI, and Gemini (`packages/llm/src/index.ts`).
- In-memory service caching per location via `LocationServiceMap`.
- Project and repository cache management via `RepositoryCache` (`packages/core/src/repository-cache.ts`).

**Storage:**
- Primary persistence: Local SQLite database via WAL mode, busy timeout of 5000ms, tuned cache size, and Drizzle ORM migrations (`packages/core/src/database/database.ts`).
- File storage and session snapshots: Managed through `packages/core/src/snapshot.ts` and `packages/core/src/storage/`.
