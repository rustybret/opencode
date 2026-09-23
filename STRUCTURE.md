# Codebase Structure

## Directory Layout

```
opencode/
├── packages/                       # Monorepo workspaces
│   ├── app/                        # Web application frontend (SolidJS, Vite, TailwindCSS)
│   ├── arcus/                      # Arcus Archetype A consumer template (bootstrap, toolchain, arcus.json)
│   ├── cli/                        # Standalone CLI package (lildax)
│   ├── client/                     # Typed client generated from Effect HttpApi (fetch and Effect clients)
│   ├── codemode/                   # Confined AST JavaScript execution sandbox over schema-described tools
│   ├── console/                    # OpenCode cloud console workspaces (app, core, function, mail, support)
│   ├── contracts/                  # UCS protocol contracts
│   ├── core/                       # Core domain logic, session runner, location services, SQLite DB, tools
│   ├── desktop/                    # Native desktop application (Electron wrapper around packages/app)
│   ├── effect-drizzle-sqlite/      # Effect adapter for Drizzle ORM over SQLite
│   ├── effect-sqlite-node/         # Effect SQLite bindings for Node runtime
│   ├── enterprise/                 # Enterprise policy and identity extensions
│   ├── external-app-unity/         # Unity external application integration bridge
│   ├── function/                   # Serverless Lambda handlers
│   ├── http-recorder/              # HTTP traffic recorder and replay fixtures for testing
│   ├── httpapi-codegen/            # Code generator for Effect HttpApi to TypeScript clients
│   ├── llm/                        # Unified multi-provider LLM library with automated prompt caching
│   ├── opencode/                   # CLI entry point, server daemon, build scripts, native distribution
│   ├── plugin/                     # Plugin authoring SDK and runtime types for external tools
│   ├── protocol/                   # Wire protocol schemas, Effect HttpApi specifications, error definitions
│   ├── schema/                     # Canonical domain schemas, branded IDs, durable event manifests
│   ├── script/                     # Workspace helper scripts
│   ├── sdk/                        # Legacy JavaScript client SDK
│   ├── sdk-next/                   # In-process host SDK executing the HTTP router in memory
│   ├── server/                     # Effect HttpApi server router, endpoint handlers, middleware, SSE
│   ├── session-ui/                 # Session UI components, diff viewer, prompt input, markdown streaming
│   ├── slack/                      # Slack bot integration service
│   ├── stats/                      # Telemetry and statistics service (app, core, server)
│   ├── storybook/                  # Storybook component playground
│   ├── tui/                        # Terminal user interface (SolidJS + OpenTUI)
│   └── ui/                         # Shared UI component library, theme tokens, icons, and CSS styles
├── infra/                          # SST infrastructure definitions (AWS app, console, lake, stats)
├── script/                         # Development and automation scripts (fork sync, translation, checks)
├── scripts/                        # Release and packaging pipeline scripts for Arcus distribution
├── specs/                          # Architecture specifications, RFCs, and V2 design documents
├── docs/                           # Documentation and guides
├── artifacts/                      # Build outputs and distribution bundles
├── submodules/                     # Git submodules
├── AGENTS.md                       # Repository style guide and contributor guardrails
├── ARCHITECTURE.md                 # Architectural design, layers, and data flows
├── CONTRIBUTING.md                 # Contribution guidelines
├── package.json                    # Monorepo root workspace configuration (Bun 1.3+)
├── sst.config.ts                   # SST configuration for cloud deployments
├── tsconfig.json                   # Root TypeScript compiler options
└── turbo.json                      # Turborepo task orchestration configuration
```

---

## Directory Purposes

### `packages/opencode/`

- **Purpose:** Primary application distribution package; provides CLI command routing, headless server daemon, and packaging pipelines.
- **Contains:** Yargs CLI command definitions, server bootstrap, heap monitor, build scripts for cross-platform binary compilation.
- **Key files:**
  - `packages/opencode/src/index.ts`: Main CLI entry point.
  - `packages/opencode/src/cli/cmd/serve.ts`: Headless server command (`opencode serve`).
  - `packages/opencode/src/server/server.ts`: HTTP/WebSocket server initialization and mDNS setup.
  - `packages/opencode/script/build.ts`: Standalone binary compiler.

### `packages/core/`

- **Purpose:** Core business logic, session orchestration, database persistence, location service maps, permissions, and tool execution.
- **Contains:** Session runner state machine, SQLite migrations via Drizzle, file watchers, PTY managers, built-in tool implementations.
- **Key files:**
  - `packages/core/src/session.ts`: Session domain entity and operations.
  - `packages/core/src/session/runner/llm.ts`: Session runner provider turn loop and tool continuation.
  - `packages/core/src/location-services.ts`: Per-location scoped service registry via `LayerNode`.
  - `packages/core/src/database/database.ts`: SQLite database service configuration and PRAGMA tuning.
  - `packages/core/src/tool/registry.ts`: Tool registration and execution layer.
  - `packages/core/src/permission.ts`: Permission evaluation and authorization engine.

### `packages/schema/`

- **Purpose:** Centralized, zero-dependency domain models and Effect Schema definitions.
- **Contains:** Canonical schemas for sessions, messages, models, locations, projects, durable event manifests, and branded IDs.
- **Key files:**
  - `packages/schema/src/index.ts`: Re-exported schema namespace.
  - `packages/schema/src/session.ts`: Session and message schemas.
  - `packages/schema/src/location.ts`: Location reference and workspace schemas.
  - `packages/schema/src/durable-event-manifest.ts`: Manifest of durable event types for event-sourcing.

### `packages/protocol/`

- **Purpose:** Wire protocol specifications, Effect `HttpApi` endpoint contracts, and error schemas.
- **Contains:** Declarative endpoint definitions, HTTP route groups, API middleware declarations.
- **Key files:**
  - `packages/protocol/src/api.ts`: Master Effect `HttpApi` specification.
  - `packages/protocol/src/errors.ts`: Standard wire error schemas and status codes.
  - `packages/protocol/src/groups/`: Route group specifications (`session`, `project`, `config`, `permission`, etc.).

### `packages/server/`

- **Purpose:** Concrete server implementation for the Effect `HttpApi` protocol.
- **Contains:** Endpoint handlers, route wiring, authentication middleware, CORS handling, directory-to-location mapping.
- **Key files:**
  - `packages/server/src/api.ts`: Concrete API builder mapping protocol endpoints to handlers.
  - `packages/server/src/routes.ts`: HTTP route binding and middleware application.
  - `packages/server/src/handlers/`: Route handler implementations.
  - `packages/server/src/auth.ts`: Authentication and authorization middleware.

### `packages/client/`

- **Purpose:** Generated, typesafe API client libraries derived from the Effect `HttpApi`.
- **Contains:** Zero-Effect `fetch` client, Effect-native `HttpClient`, generated endpoint interfaces.
- **Key files:**
  - `packages/client/src/index.ts`: Standard Promise-based fetch client.
  - `packages/client/src/effect.ts`: Effect-native client using `HttpClient`.
  - `packages/client/script/build.ts`: Client code generator reading from `@opencode-ai/server/api`.

### `packages/sdk-next/`

- **Purpose:** In-process host SDK allowing embedding OpenCode in Node/Bun processes without network I/O.
- **Contains:** Host builder and dependency injection layer executing the Server HTTP router in-memory.
- **Key files:**
  - `packages/sdk-next/src/index.ts`: `OpenCode.create()` and `OpenCode.layer`.

### `packages/llm/`

- **Purpose:** Unified, schema-first LLM core handling prompt caching, multi-provider routing, and normalized event streams.
- **Contains:** Provider adapters (OpenAI, Anthropic, Gemini, Bedrock, Copilot, etc.), wire framing protocols, streaming decoders.
- **Key files:**
  - `packages/llm/src/index.ts`: `LLMClient` dispatcher and `LLM.request` builder.
  - `packages/llm/src/route/index.ts`: Route definitions for provider transports.
  - `packages/llm/src/providers/`: Provider configuration factories.

### `packages/codemode/`

- **Purpose:** Confined AST JavaScript execution sandbox over schema-described tools.
- **Contains:** Acorn-based parser, safe plain-data serializer, runtime execution loop with limits.
- **Key files:**
  - `packages/codemode/src/index.ts`: `CodeMode.execute` and `CodeMode.make` runtime.

### `packages/tui/`

- **Purpose:** Interactive terminal user interface built with SolidJS and OpenTUI.
- **Contains:** Terminal layouts, prompt input, dialogs, keymaps, ANSI theme renderers.
- **Key files:**
  - `packages/tui/src/index.tsx`: TUI entry point.
  - `packages/tui/src/app.tsx`: Root UI application component.
  - `packages/tui/src/runtime.tsx`: TUI runtime and OpenTUI integration.

### `packages/app/`

- **Purpose:** Full-featured web application frontend for browser-based development.
- **Contains:** SolidJS components, layout trees, session message streams, terminal tabs, and settings views.
- **Key files:**
  - `packages/app/src/index.ts`: Web application bootstrap.
  - `packages/app/src/app.tsx`: Main application shell.
  - `packages/app/vite.js`: Vite build and development configuration.

### `packages/desktop/`

- **Purpose:** Native desktop application wrapping `packages/app` with Electron.
- **Contains:** Electron main process, preload scripts, native menus, window state persistence, auto-updater.
- **Key files:**
  - `packages/desktop/src/main/index.ts`: Electron main process entry point.
  - `packages/desktop/src/preload/index.ts`: Electron context bridge and preload script.

### `packages/ui/` & `packages/session-ui/`

- **Purpose:** Reusable UI component libraries, styling systems, and session-specific renderers.
- **Contains:** Theme tokens, buttons, inputs, icons, diff view components (`session-diff.ts`), prompt input bars, and streaming markdown renderer.
- **Key files:**
  - `packages/ui/src/theme/index.ts`: Theming and color system.
  - `packages/ui/src/styles/index.css`: Shared TailwindCSS styling.
  - `packages/session-ui/src/components/session-diff.ts`: Session file diff component.
  - `packages/session-ui/src/v2/components/prompt-input/index.tsx`: Prompt input bar component.

---

## Key File Locations

**Entry Points:**

- CLI: `packages/opencode/src/index.ts`
- Headless API Server: `packages/opencode/src/cli/cmd/serve.ts`
- Terminal UI: `packages/tui/src/index.tsx`
- Web Frontend: `packages/app/src/index.ts`
- Desktop App: `packages/desktop/src/main/index.ts`
- In-Process Host SDK: `packages/sdk-next/src/index.ts`

**Configuration:**

- Workspace Config: `package.json`, `turbo.json`, `bunfig.toml`
- Cloud Infrastructure: `sst.config.ts`, `infra/`
- TypeScript Base: `tsconfig.json`
- Fork Synchronization: `script/fork-sync-exclusions`, `script/fork-sync.sh`

**Core Logic:**

- Session State Machine & Turns: `packages/core/src/session/runner/llm.ts`
- Location Scoped Services: `packages/core/src/location-services.ts`
- Database & Migrations: `packages/core/src/database/database.ts`, `packages/core/src/database/migration.ts`
- Tool Registry: `packages/core/src/tool/registry.ts`
- Permissions Engine: `packages/core/src/permission.ts`
- LLM Provider Engine: `packages/llm/src/index.ts`
- Code Confinement: `packages/codemode/src/index.ts`

**Tests:**

- Tests must be executed from individual package directories, never from the root.
- Core tests: `packages/core/test/`
- Server tests: `packages/server/test/`
- Client tests: `packages/client/test/`
- LLM provider tests: `packages/llm/test/`
- Codemode tests: `packages/codemode/test/`
- Web UI & E2E tests: `packages/app/e2e/`, `packages/app/src/**/*.test.ts`
- TUI tests: `packages/tui/src/**/*.test.ts`

---

## Naming Conventions

**Files:**

- Use kebab-case for TypeScript files: `location-services.ts`, `durable-event-manifest.ts`, `prompt-input.tsx`.
- Use `.test.ts` / `.test.tsx` suffix for co-located test files: `session.test.ts`.
- Use `.sql.ts` suffix for Drizzle ORM schema table files: `sql.ts`, `session.sql.ts`.

**Directories:**

- Use kebab-case for all source directories: `session-ui/`, `system-context/`, `effect-drizzle-sqlite/`.

**TypeScript & Schemas:**

- Use PascalCase for Effect services, classes, and namespaces: `SessionRunner`, `ToolRegistry`, `LocationServiceMap`.
- Use snake_case for Drizzle SQLite column definitions: `project_id`, `created_at`, `aggregate_id`.
- Use dot notation to avoid unnecessary destructuring: `Location.Ref`, `Project.ID`, `EventV2.write`.

---

## Where to Add New Code

**New built-in tool:**

- Define tool schema and logic in `packages/core/src/tool/[tool-name].ts`.
- Register the tool in `packages/core/src/tool/builtins.ts` and add its dependencies to `packages/core/src/location-services.ts`.

**New LLM provider or model route:**

- Add provider configuration and route compilation in `packages/llm/src/providers/[provider-name].ts`.
- Export the provider from `packages/llm/src/providers/index.ts`.

**New domain schema or identifier:**

- Add schema definitions in `packages/schema/src/[name].ts`.
- Export from `packages/schema/src/index.ts`. If durable, register the definition in `packages/schema/src/durable-event-manifest.ts`.

**New HTTP API endpoint:**

- Add endpoint contract to the appropriate group in `packages/protocol/src/groups/[group].ts`.
- Implement endpoint handler in `packages/server/src/handlers/[group].ts`.
- Run `bun run generate` from `packages/client` to regenerate the typed client SDKs.

**New CLI command:**

- Define command specification and handler in `packages/opencode/src/cli/cmd/[command].ts` using `effectCmd` or `cmd`.
- Register the command in `packages/opencode/src/index.ts`.

**New UI component:**

- For design system primitives and icons: add to `packages/ui/src/components/[component].tsx` and export in `packages/ui/package.json`.
- For session/conversation elements: add to `packages/session-ui/src/v2/components/[component].tsx`.
- For web application views: add to `packages/app/src/components/[component].tsx`.
- For terminal UI: add to `packages/tui/src/component/[component].tsx`.

**New unit or integration test:**

- Co-locate tests alongside source as `[name].test.ts` or add to package-level `test/` directory.
- Run tests via `bun test` from the corresponding package directory (e.g. `cd packages/core && bun test`).
