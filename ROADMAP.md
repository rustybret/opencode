# Ultra Creative Studio OpenCode Fork Roadmap

**Status:** Strategy & Architecture Roadmap (UC-Studio Feedback Incorporated)

**Date:** 2026-08-10

**Scope:** The `rustybret/opencode` fork as the primary Ultra Creative Studio (UCS) frontend and runtime. This document does not plan implementation work for the Codex, Claude, or Pi/Senpi hosts except where their shared contracts constrain the OpenCode design.

## Executive Decision

Make the OpenCode fork the **UCS reference application**: the place where UCS owns the user experience for desktop, Web, TUI, CLI, and server operation. Keep the UCS/OmO capability layer portable so the same agent, skill, tool, and integration concepts can continue to serve Codex, Claude, and Pi/Senpi through their adapters.

The target architecture is deliberately split into three planes:

1. **Upstream OpenCode plane:** provider/runtime/session/server primitives kept as close to `upstream/dev` as practical.
2. **UCS capability plane:** harness-neutral agents, skills, tools, project/work coordination, SuperMCP contracts, memory, and policy.
3. **UCS OpenCode frontend plane:** fork-owned Web, Desktop, TUI, CLI, server/API presentation, navigation, workflows, and opinionated defaults.

The fork should diverge intentionally in the frontend plane, not accidentally throughout the runtime. The plugin remains the compatibility and capability seam; the fork becomes the product surface.

## Evidence Base

This draft is grounded in:

- The fork's two-branch maintenance model and `script/fork-sync.sh`.
- OpenCode package boundaries under `packages/app`, `packages/desktop`, `packages/tui`, `packages/opencode`, `packages/plugin`, `packages/protocol`, `packages/schema`, and generated SDKs.
- The current OpenCode plugin contract in `packages/plugin/src/index.ts`.
- The OpenCode V2 Effect and Promise plugin API design under `packages/plugin/src/v2/`.
- UCS repository documentation in `/Volumes/Topper2TB/Git/uc-studio/README.md` and `AGENTS.md`.
- The UCS OpenCode adapter contract in `uc-studio/packages/omo-opencode/`.
- Structured feedback received from `uc-studio-8ce41322` on 2026-08-10 (mailbox message ID `134fb143-3462-4234-b928-93b1d53806fe`; trace recorded in `.omo/mailbox-trace.jsonl`).
- Primary upstream documentation and source references listed in [Research Sources](#research-sources).

### Feedback status

The direct `uc-studio` project is registered in the repository-local allowlist as `uc-studio-8ce41322`, and the plan-tier feedback request has been **answered**: structured feedback arrived on 2026-08-10 as mailbox message `134fb143-3462-4234-b928-93b1d53806fe` (trace in `.omo/mailbox-trace.jsonl`) and is treated as UCS-agent input to this revision. Phase 0 is no longer blocked on missing feedback; the remaining Phase 0 blocker is the **dual context-ownership conflict** between `packages/core/src/system-context/index.ts` and `packages/core/src/session/context-epoch.ts`, which must be resolved (Option 1 preferred) before any write path is implemented.

## Product Thesis

UCS should not be an OpenCode skin or a collection of prompts. It should be an opinionated creative-production environment in which:

- humans, agents, and external tools share durable project context;
- projects have visible intent, plans, tasks, assets, builds, and decisions;
- agents operate through bounded tools and explicit permissions;
- SuperMCP integrations connect the agent to creative applications and engines;
- every surface presents the same product model at the level appropriate to that surface;
- upstream OpenCode improvements can be imported without rewriting UCS product decisions.

The differentiator is the **closed feedback loop** between intent, agent execution, project state, external creative tools, and review. UCS should optimize for iterative, multi-shot work rather than one-shot code generation.

## Current Owner Decisions

These decisions came from the owner interview on 2026-08-10 and should guide the next planning revision:

- **Ownership:** Hybrid, plugin-first. UCS capabilities stay portable; only necessary OpenCode frontend/control-plane behavior is fork-native.
- **Fork posture:** Deliberate private frontend fork. Upstream runtime improvements should continue flowing in through `opencode-mirror` and `fork/local`.
- **Project scope:** UCS owns a full durable project/work domain, not only a session UX overlay.
- **Surface order:** Web, TUI, CLI/server, and shared capability work proceed in parallel; Desktop is intentionally last.
- **Reference integration:** `unitySuperMCP`, integrated with the Unity Editor, is the reference pattern for future integrations such as Unreal, Godot, Roblox, Blender, Figma, Xcode, and Android Studio. It is not a commitment to implement all integrations in the first slice.
- **Approval:** Policy-selected approval gates; projects, agents, and integrations may define different mutation-risk policies.
- **Initial platform matrix:** Web/headless; Linux x86 and ARM; Windows; macOS Apple Silicon only. Desktop packaging is last within that matrix.
- **Telemetry:** Reuse and redirect existing analytics/telemetry into the UCS platform, with no explicit prompt/file/user-content store and a default 30-day retention policy. Provide opt-out to the minimum required for operation and granular opt-in for additional performance, product, and marketing metrics. Web cookie/storage permissions must remain purpose-separated.
- **UCS feedback:** Direct `uc-studio` project access should be registered so the uc-studio agent can review the contract before Phase 0 closes.

The mixed state-authority answer remains intentionally unresolved; the proposed four-layer model below is the next decision artifact.

## Blocking Conflict: Dual Context Ownership

### Current Implementation Status
The codebase contains two parallel context management systems. System Context Registry is implemented at `packages/core/src/system-context/index.ts` via the `SystemContext.Source<A>` interface, which defines `key`, `codec`, `load`, `baseline`, `update`, and `removed`. The registry service itself is defined at `packages/core/src/system-context/registry.ts` as `@opencode/v2/SystemContextRegistry`, with builtins located in `packages/core/src/system-context/builtins.ts`. 

Alongside this, the Context Epoch system is implemented at `packages/core/src/session/context-epoch.ts`. Database support is established through migrations `packages/core/src/database/migration/20260605042240_add_context_epoch_agent.ts` and `packages/core/src/database/migration/20260622142730_simplify_session_context_epoch.ts`.

### The Active Code Conflict
A direct conflict exists between the System Context Registry and Magic Context (MC). MC owns the `m[0]` frozen baseline and the `m[1]` volatile delta. Because both systems attempt to manage and compact the session context, they compete for ownership. This dual ownership causes severe issues. For example, uc-studio must explicitly disable host compaction by setting `compaction.auto: false` and `compaction.prune: false` to prevent dual compaction cycles.

Furthermore, state injections, such as editor selection, Unity play-mode status, project switches, and presence, occur before the `cache_control` breakpoint. This placement invalidates the prompt cache prefix, destroying prompt caching efficiency.

### Resolution Options

#### Option 1 (Preferred): Magic Context Implements `SystemContext.Source`
Under this option, Magic Context implements the `SystemContext.Source` interface. Reconciliation runs through a single pipeline. The host manages epoch boundaries, while Magic Context retains ownership of the actual content. This approach preserves prompt-cache prefix stability.

#### Option 2 (Fallback): Registry Disabled When Magic Context is Active
This option uses a configuration gate to disable the System Context Registry entirely whenever Magic Context is active. Magic Context retains sole ownership of the context.

#### Option 3 (Documented Alternative): Partition by `SystemContext.Key`
We partition ownership using `SystemContext.Key`. The System Context Registry owns host-native sources, including current working directory, git status, and editor selection. Magic Context owns memory and history. This option requires a strict guarantee that registry output never precedes the `cache_control` breakpoint of Magic Context.

## Non-Goals And Boundaries

The following are out of scope unless separately approved:

- replacing Codex, Claude, or Pi/Senpi frontends;
- forcing visual or feature parity across every host;
- building a generic plugin marketplace before the core product loop works;
- making OpenCode a general-purpose CRM, issue tracker, or enterprise PM suite;
- adding cloud sync, billing, analytics, or hosted collaboration as an implicit dependency;
- changing the upstream OpenCode public API merely to avoid designing a UCS adapter;
- duplicating UCS project state independently in Web, Desktop, TUI, and the plugin;
- implementing all SuperMCP integrations before one vertical slice proves the contract;
- treating generated SDK files as hand-maintained source;
- enabling snapshot tracking by default in deployments (the fork policy is `"snapshot": false`).

## Target Architecture

### 1. Upstream OpenCode Core

Prefer upstream-compatible use of:

- provider and model runtime;
- session execution and compaction;
- permissions and tool execution;
- server lifecycle and HTTP routing;
- protocol/schema definitions;
- client SDK generation;
- baseline TUI and application primitives.

Host-native changes are justified only when UCS requires a capability that cannot be expressed through the public plugin/API seams and the capability is central to the reference product.

### 2. UCS Capability Plane

This plane should be reusable across hosts and should not import Web, Electron, OpenCode TUI, or host-specific types. It owns the domain vocabulary and behavior for:

- agents and categories;
- skills and skill discovery;
- tools and tool policy;
- project plans, tasks, decisions, and milestones;
- team coordination and durable mailboxes;
- memory/context integration;
- `UcsExternalApp` integration descriptors and lifecycle (via SuperMCP transport where applicable);
- provider/model policy and fallback rules;
- audit/evidence records;
- privacy and telemetry policy.

The existing UCS/OmO package family is evidence that this separation is feasible: shared core packages feed host adapters such as `omo-opencode`, `omo-codex`, and `omo-senpi`.

### 3. UCS OpenCode Frontend Plane

This plane is intentionally fork-owned:

- `packages/app/`: UCS Web information architecture, session/project workflows, design system, and browser interaction model.
- `packages/desktop/`: Electron shell, native menus, OS integration, window lifecycle, storage, updater, and signed distribution.
- `packages/tui/` plus OpenCode TUI entrypoints: terminal-first project/session control, compact status, and recovery workflows.
- `packages/opencode/src/cli/`: UCS CLI commands, launch/attach behavior, scripting contracts, and server orchestration.
- `packages/opencode/src/server/`: only the fork-native API/control-plane features that cannot be supplied through the plugin.

The Web and Desktop layers should share product components and data contracts. The TUI should share domain operations and command semantics, but it should not be forced into visual parity with Web/Desktop.

### 4. Bridge Contracts

The bridge between the planes should be explicit:

- OpenCode plugin API for agents, tools, hooks, auth, providers, skills, and runtime transforms.
- OpenCode TUI plugin/runtime API for terminal extensions.
- HTTP API/protocol/schema for server-backed UCS state and cross-surface events.
- Shared SDK/client types generated from source schemas.
- SuperMCP event and command contracts for external creative applications.
- Versioned capability manifest describing which UCS features a host supports.

#### Stable Contracts (`@ucs/contracts`)
To ensure interoperability across the ecosystem and insulate the fork from sync breakages, publish `@ucs/contracts` holding only stable schemas and interfaces:
- **Plugin ABI**: Standard execution contract `server(input, options) -> Promise<Hooks>`.
- **Boulder state schema**: JSON structure for tracking task execution and recovery (`packages/boulder-state` + `.omo/boulder.json`).
- **Team Mode storage layout**: Directory structure and configuration format (`~/.omo/teams/{name}/`).
- **Zod v4 config schema**: Validation schema for project-level configuration.
- **Mailbox envelope**: Message routing structure containing `messageId`, `correlationId`, `inReplyToMessageId`, `intent`, `priority`, and `hopPath`.
- **Skill manifest provenance**: Security metadata tracking `source_repo`, `source_rev`, and per-file sha256 hashes.

#### Core Dependency Law
All stable contracts must sit at the **Schema tier or below**. This preserves the strict architecture dependency direction:
$$\text{Schema} \rightarrow \{\text{Core}, \text{Protocol}\} \rightarrow \text{Server}$$
Client runtime code may depend on Schema and Protocol, but never Core or Server. A `@ucs/contracts` package consumed by both frontend and server must obey this law so running `bun run generate` from `packages/client` never breaks.

#### Unstable Internals (DO NOT FREEZE)
The following internal implementation details are subject to change and must NOT be exposed as stable contracts:
- **Message layout**: Internal `m[0]` and `m[1]` message structures (owned by Magic Context).
- **AFT transport selection**: Logic choosing between `BridgePool` stdio and `SubcTransportPool` daemon. Expose capabilities, never the transport.
- **Pipeline internals**: Execution flow of the 6-phase agent pipeline. Expose phase names for observability, never let a frontend inject at a phase.
- **Routing tables**: Category and model routing configurations.
- **Hashline format**: The `LINE#ID` string format used for line-level tracking.

### UcsExternalApp Contract

Rather than building Unity-specific frontend plumbing, define a generic `UcsExternalApp` integration contract with Unity (`unitySuperMCP`) as implementation #1. This generalizes to Unreal, Godot, Roblox, Blender, Figma, Xcode, and Android Studio.

#### 6 Core Contract Verbs
Every external application adapter implements six standard capabilities:
1. `connect`: Establish connection, authenticate, and retrieve remote application state.
2. `status`: Query live connection health, active mode, and scene/project context.
3. `capabilities`: Inspect supported external actions, tools, and event types.
4. `checkpoint`: Trigger a user-visible restore point or snapshot before destructive operations.
5. `blocked-on-human`: Signal that the external application is halted waiting for human modal interaction (e.g. Unity Safe Mode dialog, Xcode prompt).
6. `stream-progress`: Stream intermediate status for long-running operations (e.g. domain reload, build/compile).

#### 5 Event/State Requirements
1. **Streaming progress**: Long operations (domain reload, shader compile) take minutes and invalidate handles. Requires streaming progress events (directly parallel to AFT's `bg_events` StreamData lane; build one streaming progress abstraction for both).
2. **Modal/blocking interruption**: External applications throw OS-level modal dialogs that halt automation. "External app blocked, human input required" must be a first-class agent state (`blocked-on-human`), not an error.
3. **Connection lifecycle**: Mid-session reconnect must be survivable without taking down the OpenCode session or dropping history.
4. **Restore points**: Surface checkpoint and restore operations as user-visible restore points.
5. **Background-throttle awareness**: External applications (like Unity Editor) throttle CPU/GPU when unfocused. The UI/agent must distinguish a throttled, healthy job from a stalled or hung process to prevent users from killing valid runs.

### 5. Four-Layer State Authority Model

“A mixture of all four” is workable only if each layer has a narrow authority boundary:

| Layer | Authoritative for | Not authoritative for |
|---|---|---|
| Repository intent | Project goals, constraints, plans, skills, policy, reusable project configuration | Live session state, secrets, transient process state |
| OpenCode local runtime | Sessions, messages, tool execution, provider state, local event cursor, ephemeral cache | Cross-machine project truth or marketing/analytics data |
| UCS coordination store | Work items, milestones, integration registrations, evidence index, cross-session/project coordination, consent ledger | Raw prompts/files unless explicitly approved and separately classified |
| Optional remote replication | Explicitly selected coordination/telemetry records for approved team or product features | Anything not covered by a declared purpose and retention policy |

The first implementation should use an append/reconcile model rather than four competing mutable sources. Each record needs an authority label, stable ID, version, timestamps, provenance, and conflict policy. Remote replication should be a projection or event stream until the owner explicitly chooses it as authoritative for a domain.

### 6. Privacy And Telemetry Profile

The UCS telemetry design should follow a maintained privacy-control framework rather than inventing an informal “anonymous” label. Use the released NIST Privacy Framework as the current control baseline while tracking the NIST Privacy Framework 1.1 initial public draft, and map product behavior against current ICO and CNIL guidance for data minimization, purpose limitation, retention, consent, cookies/storage, access, deletion, and demonstrable opt-out.

The product profile should be:

- **Operational minimum by default:** crash, startup, version, health, and aggregate performance signals only; no prompts, file contents, tool arguments, auth material, project names, paths, or raw external-tool payloads.
- **30-day default retention:** enforce server-side TTL and document the exact event classes covered; shorter retention is preferred where the purpose allows it.
- **Opt-out:** reduce collection to the minimum required to run, secure, update, and support the product. If a signal is not required for operation, it must stop.
- **Granular opt-in:** separate consent for additional performance diagnostics, product analytics, marketing measurement, and experiments. Do not bundle these purposes.
- **Web storage/cookies:** use purpose-separated consent categories and do not repurpose essential storage as analytics consent.
- **Desktop/TUI/CLI:** provide equivalent settings and an inspectable local consent record even where browser cookies do not apply.
- **Data-subject controls:** define export, deletion, consent withdrawal, and retention-expiry behavior for every remotely replicated record.
- **Evidence:** maintain a telemetry event registry containing purpose, fields, classification, retention, destination, consent requirement, and owner.

This is an engineering target profile, not a legal conclusion. Counsel or a qualified privacy reviewer must validate the final deployment and jurisdictional obligations.

## Must-Have Workflows

### Tier 1 (Non-negotiable)
- **Multi-session concurrency with visible session tree**: Support one primary agent coordinating with N subagents, rendering the topology clearly in the interface (1 primary + N subagents is the standard pattern; today topology is invisible, which is a major debugging cost).
- **Background task lifecycle stream**: Implement the `bg_events` StreamData lane, `ParentWakeNotifier`, and a strict FIFO queue capped at 5 concurrent tasks per model/provider (`providerID/modelID`).
- **Durable work state via Boulder**: Track execution state using `packages/boulder-state` and persist progress locally in `.omo/boulder.json`. Do not invent a second work model.
- **Policy-matched approvals with audit trail**: Enforce permission rules for tool execution with policy match shown, and maintain a tamper-evident audit log of user approvals.
- **Todo/plan visibility**: Expose active plans and todo lists directly in the interface as first-class elements, not buried in chat scrollback.

### Tier 2
- **Cross-project mailbox inbox**: Provide a unified view of inbound messages and requests sent between different project agents.
- **Team Mode topology**: Manage agent team configurations and roles stored under `~/.omo/teams/{name}/` (`config.json`, `state.json`, `mailbox/`, `tasklist.jsonl`, `worktrees/`).
- **Evidence browser**: Allow users to inspect generated artifacts, logs, and run details stored in `.omo/evidence/`.
- **Diff review**: Render code changes and file diffs clearly before staging or committing.
- **Skill/MCP inspector**: List active Model Context Protocol servers, registered tools, and loaded skills with provenance (`source_repo`, `source_rev`, per-file sha256).

### Tier 3 (Deferred)
- **Model/provider config editors**: Graphical interfaces to manage API keys, endpoints, and model parameters.
- **Telemetry dashboards**: Visual charts for token usage, latency, and cost tracking.
- **Marketplace UI**: A browser for discovering and installing community skills or plugins.

> **Risk Note**: Avoid drifting into a generic chat window with buttons. The terminal and web interfaces must render the state that the harness already tracks, rather than inventing separate UI-only state.

## Ownership Matrix

| Surface | UCS owns | OpenCode upstream owns | Primary gate |
|---|---|---|---|
| Web | Information architecture, navigation, project views, agent/task UX, visual system, workflows | Transport primitives and compatible SDK usage | Unit + browser tests + Playwright evidence |
| Desktop | Native shell, menus, windows, storage, updater, OS integrations, UCS launch experience | Shared app renderer and server protocol where retained | Typecheck + packaged smoke + platform review |
| TUI | UCS command vocabulary, project/session control, compact status and recovery affordances | OpenTUI/runtime primitives and compatible baseline | TUI smoke + command behavior evidence |
| CLI | UCS commands, scripting, attach/serve ergonomics, diagnostics | Provider/session/server primitives | CLI JSON/API smoke and exit-code checks |
| Server/API | UCS namespaced routes and control-plane features | Existing OpenCode routes and lifecycle | HTTP exercise + schema generation + auth tests |
| Plugin | UCS capability registration and hook composition | Stable host plugin contract | Hook ordering, lifecycle, and compatibility tests |
| Other hosts | Shared capability packages and adapter contracts | Host-specific UX and lifecycle | Their own adapter gates; not this roadmap's implementation scope |

## Plugin And Hook Strategy

### Stable V1 compatibility seam

The current V1 plugin type is:

```ts
type Plugin = (input: PluginInput, options?: PluginOptions) => Promise<Hooks>
```

The host loads plugin modules sequentially and triggers returned hooks in order. This is useful for deterministic composition, but the hook object is broad and mutation-oriented. UCS should use one top-level OpenCode plugin entrypoint and compose internal capabilities behind it rather than registering dozens of unrelated top-level plugins.

The fork currently targets the V1 configuration shape (`plugin`). Upstream V2 uses an ordered `plugins` field, a new default-export/`setup` API, and explicitly does not run V1 plugins unchanged. The roadmap must therefore define a versioned adapter boundary rather than silently assuming one config or entrypoint works across both generations.

The stable V1 host automatically installs npm plugin packages into an OpenCode cache, while local plugins are imported directly and do not receive dependency installation automatically. The UCS distribution plan must choose between a packaged adapter, a controlled cache, or a local workspace package; it must not rely on every project independently rebuilding the dependency tree.

### V2 adoption posture

The V2 Effect/Promise APIs provide scoped registration, namespaced transforms, sequential runtime hooks, and explicit domain reloads. They are a promising future seam for UCS catalog/agent/command/integration/reference/skill domains, but the roadmap must treat them as **version-pinned and compatibility-tested**, not as an assumption of stability.

Upstream currently documents V2 as beta: entrypoints, hook shapes, draft shapes, and configuration may change before stable release. Upstream also documents ordered plugin activation, sequential hook execution, scoped cleanup/reload, isolated dependency installation, and the requirement that published plugins target a compatible OpenCode release. These facts make a compatibility layer and release matrix mandatory rather than optional.

Recommended posture:

1. Keep the UCS production adapter compatible with the current stable V1 host contract.
2. Introduce a UCS internal registration model that can target V1 today and V2 later.
3. Pilot V2 behind a capability flag and a contract test suite.
4. Do not make the entire UCS product dependent on V2 until upstream compatibility and reload semantics are proven in the fork.

### Deterministic internal phases

The UCS plugin should own a documented phase graph, for example:

1. bootstrap/configuration;
2. capability discovery;
3. policy and permission guards;
4. input/session transforms;
5. tool definition and execution guards;
6. model/provider transforms;
7. continuation/compaction;
8. event publication and project-state updates;
9. disposal.

Each hook must declare its phase, ordering key, idempotency behavior, failure policy, and observability event. A flat list of hook files is not a sufficient product contract.

## Project And Agent Product Model

The roadmap should converge on one domain model, even if the first implementation stores some records in existing OpenCode tables/files.

### Project

An intentional creative effort with a root/workspace set, goals, constraints, active plans, assets, integrations, and participants.

### Work item

A bounded task or milestone with owner, status, evidence, dependencies, and links to sessions, files, builds, or external-tool actions.

### Agent

A named role with model policy, tool permissions, skills, operating mode, and escalation rules. Agents are not merely model aliases.

### Skill

A versioned, inspectable operating procedure with explicit tools, inputs, outputs, safety constraints, and verification requirements.

### Tool

A capability with a typed contract, permission policy, provenance, timeout/resource budget, and user-visible result semantics.

### Integration

An external system connection such as Unity, Unreal, Blender, Figma, Xcode, Discord, or Slack, with explicit capabilities, events, authentication, and failure behavior.

### Evidence

A reviewer-readable record of what was run, what was observed, what it proves, and what was omitted. Evidence is part of project trust, not only CI output.

The first implementation must decide whether these records are authoritative in OpenCode's database, UCS-owned files/database, or an external control plane. The roadmap deliberately does not choose that without owner approval.

## Roadmap Phases

### Phase 0: Alignment And Contract Freeze

**Purpose:** Resolve the decisions that would otherwise force rework.

**Deliverables:**

- UCS-agent feedback returned and attached to the roadmap.
- Product vocabulary and non-goals approved.
- Source of truth for project/work state chosen.
- Plugin-first versus host-native criteria approved.
- Supported surfaces and platform matrix chosen.
- Privacy, telemetry, and external-network policy chosen.

**Gate:** No implementation begins until P0 questions are answered and the UCS agent confirms the capability boundary.

### Phase 1: Fork Inventory And Divergence Budget

**Purpose:** Establish which files are allowed to diverge and how each divergence survives upstream sync.

**Deliverables:**

- An ownership map for Web, Desktop, TUI, CLI, Server/API, Plugin API, Protocol/Schema, and generated SDKs.
- A divergence ledger with owner, rationale, upstream status, merge risk, and rollback plan.
- A rule that all UCS API additions use a namespaced surface such as `ucs` rather than modifying unrelated upstream semantics.
- Sync rehearsal procedure using `opencode-mirror` → `fork/local`.
- Explicit generated-file policy: source edits first, regeneration second, generated outputs never hand-edited.

**Gate:** A clean upstream merge rehearsal and a documented answer for every planned host-native change.

### Phase 2: UCS Frontend Foundation

**Purpose:** Establish one UCS information architecture across Web/Desktop/TUI without implementing the full product.

**Deliverables:**

- Shared domain navigation: Home, Projects, Work, Agents, Skills, Tools, Integrations, Sessions, Builds, and Settings.
- Shared terminology and route/command IDs.
- Web design-system foundation and responsive layout.
- Desktop shell contract for menus, windows, deep links, notifications, storage, and updater.
- TUI command map for the same domain operations, adapted to terminal constraints.
- CLI/server command and API naming conventions.

**Gate:** A clickable or executable shell with one project/session path working on Web, TUI, and CLI/server. Desktop is explicitly deferred to the later Desktop phase; it must consume the same contracts rather than define them.

### Phase 3: First Vertical Slice

**Purpose:** Prove the UCS loop with one real creative workflow.

**Recommended slice:** project → plan → agent task → policy-selected bounded tool action through `unitySuperMCP` → Unity Editor event → review/evidence → updated project state.

**Deliverables:**

- One project view and one work-item view.
- One opinionated agent role with a small approved skill set.
- One SuperMCP integration with a typed action/event contract.
- One review/evidence flow.
- Session and project state visible in Web and available through CLI/server; TUI exposes status/control, not necessarily the full view.

**Gate:** Real end-to-end execution against `unitySuperMCP` and Unity Editor, with isolated test state, recorded evidence, and no mocks standing in for the critical external action. The integration contract must be generic enough to become the template for other UCS applications.

### Phase 4: Capability Plane Integration

**Purpose:** Turn the vertical slice into reusable UCS capabilities.

**Deliverables:**

- Versioned agent/category registry.
- Skill registry with source, version, tool requirements, and verification metadata.
- Tool registry with permission and resource policy.
- Team/task coordination contract.
- Memory/context integration contract.
- Provider/model policy and fallback contract.
- OpenCode adapter with deterministic hook phases.
- Adapter conformance fixtures that other hosts can consume without importing OpenCode UI/runtime code.

**Gate:** OpenCode behavior is complete enough for the reference product, while shared packages remain host-neutral and Codex/Claude/Pi/Senpi adapters still build against their own contracts.

### Phase 5: UCS Server And Control Plane

**Purpose:** Add only the server-side state and APIs required by the product model.

**Deliverables:**

- Namespaced UCS HTTP API groups and schemas.
- Project/work/integration endpoints with authorization boundaries.
- Event stream semantics for session, work, integration, and evidence updates.
- Generated client SDK updates from source protocol/schema changes.
- Migration and rollback policy for persisted data.
- Headless server mode suitable for Desktop, Web, CLI, and remote operation.

**Gate:** API exercise coverage, authentication/authorization tests, generated SDK verification, migration test, and an upstream merge rehearsal.

### Phase 6: Surface Completion

**Purpose:** Expand the reference experience while preserving deliberate differences between surfaces. Web, TUI, CLI/server, and shared capability work continue in parallel; Desktop is last.

**Web:** Full project/work/agent/skill/integration navigation, review, and multi-session workflows.

**Desktop (last):** Native workspace management, notifications, deep links, terminal/PTY integration, updater and packaging, platform permissions, and platform-specific UX for macOS Apple Silicon, Linux, and Windows.

**TUI:** Fast project/session switching, work status, agent/task control, logs, approvals, and recovery; avoid reproducing Web's visual density.

**CLI/server:** Automation-friendly commands, JSON output, attach/serve, diagnostics, import/export, and operational controls.

**Gate:** Surface-specific QA, accessibility/keyboard review for Web/Desktop, TUI smoke, CLI contract tests, server HTTP exercise, and packaged Desktop smoke.

### Phase 7: Upstream And Release Operations

**Purpose:** Make the fork maintainable as a product, not merely functional as a branch.

**Deliverables:**

- Regular upstream sync rehearsal and merge-risk report.
- Release manifest identifying upstream, UCS capability, and UCS frontend versions.
- Compatibility matrix for OpenCode host/plugin API versions.
- Compatibility matrix must cover the stable V1 adapter and the beta V2 adapter separately; V2 changes require a pinned OpenCode release and a published compatible plugin build.
- Binary build and artifact smoke for supported platforms.
- Rollback procedure for frontend, plugin, API, and data migrations.
- Deployment defaults including `"snapshot": false`.
- Release notes that distinguish upstream changes from UCS changes.
- Telemetry/privacy target profile and retention/consent audit.

**Gate:** A signed/verified artifact, real server bootstrap, Web/Desktop/TUI/CLI smoke coverage, and a documented rollback path.

## Upstream Sync Strategy

Continue the existing fork model:

- `opencode-mirror`: pristine upstream mirror;
- `fork/local`: permanent UCS customization layer.

Add a third conceptual classification inside `fork/local`:

1. **Upstream-compatible:** changes that can be proposed upstream or merged with low conflict.
2. **UCS capability:** reusable packages/adapter logic that should remain separate from frontend code.
3. **UCS frontend:** deliberate fork-owned product behavior.

Every fork-local change should record one classification. The frontend plane is allowed to diverge, but it must not silently pull capability-plane concerns into `packages/app` or Electron-only code.

### Merge-risk rules

- Prefer new namespaced files and route groups over broad edits to upstream files.
- Keep public protocol/API changes additive and generated from source.
- Keep UCS visual design and navigation changes localized to `packages/app`, `packages/desktop`, and TUI feature/plugin surfaces.
- Keep host-specific code out of shared packages.
- Re-run generation after protocol/server changes.
- Rehearse merges before large frontend refactors are allowed to accumulate.
- Preserve protected fork files and exclusion manifests.
- Never let a release watcher dynamically rewrite the architecture during a build.
- Avoid per-project dependency installation and generated `.opencode/package.json` churn where a packaged, version-pinned binary or centrally managed plugin cache is sufficient; the stable host's default npm cache is `~/.cache/opencode/node_modules`, while local plugin dependencies must be made visible from the plugin configuration directory.
- Keep Desktop behind the shared Web/TUI/CLI/server contracts; do not let Electron IPC or native storage become the domain authority.

## Verification Model

Every phase must produce evidence, not only code or passing unit tests.

### Required evidence categories

- **Contract:** types/schema/API shape and compatibility.
- **Behavior:** real user-facing or agent-facing execution.
- **Isolation:** test state, XDG/config/database separation, and unchanged host state.
- **Integration:** external SuperMCP or provider interaction where applicable.
- **Merge:** upstream sync rehearsal and generated-file cleanliness.
- **Operations:** artifact startup, health, logs, and rollback behavior.

### Surface gates

- Web: package-local typecheck, targeted unit/browser tests, Playwright behavior and visual evidence.
- Desktop: renderer/main/preload typecheck, packaged build, native shell smoke, updater/deep-link/IPC checks.
- TUI: package-local typecheck/tests, tmux or equivalent smoke, key command behavior, recovery checks.
- CLI/server: package-local typecheck/tests, JSON contract checks, server bootstrap, HTTP API exercise, and exit-code assertions.
- Plugin: hook-order tests, duplicate-load tests, disposal tests, capability/permission tests, and live host smoke.
- Protocol/API: source-schema tests, generated SDK diff review, authorization tests, migration tests.

## Risk Register

| Risk | Consequence | Mitigation |
|---|---|---|
| Plugin/host boundary blur | Permanent merge burden and duplicated logic | Require plugin-first/host-native justification per feature |
| Web/Desktop/TUI treated as one product surface | Incomplete UX and untestable milestones | Separate ownership and gates per surface |
| UCS project state duplicated across systems | Conflicts, migration pain, unclear authority | Decide one source of truth in Phase 0 |
| V2 plugin API changes upstream | Adapter breakage | Version pin, compatibility layer, conformance tests |
| API/schema divergence | Generated SDK and server drift | Source-first edits and mandatory generation gate |
| SuperMCP integration assumptions | Expensive rework or unsafe actions | One real vertical slice and explicit capability contracts |
| Frontend fork grows without merge budget | Upstream sync becomes unaffordable | Divergence ledger and regular merge rehearsal |
| Desktop native scope expands | Signing/platform delays | Web-first shared capability, native-only behavior by exception |
| TUI parity demand | Separate frontend becomes a second product | Define TUI as control/status surface unless approved otherwise |
| Privacy/telemetry ambiguity | Loss of trust and accidental data exposure | Phase 0 data-boundary and telemetry decision |
| Missing UCS-agent feedback | Roadmap encodes wrong cross-project assumptions | Block Phase 0 completion until feedback is returned or explicitly waived |
| Snapshot storage recurrence | Boot-drive exhaustion during tests/deployments | Keep `"snapshot": false` as deployment default and verify it operationally |
| Per-project plugin dependency churn | Hundreds of generated dependency trees, slow startup, or version mismatch | Package the UCS adapter, pin host/plugin versions, isolate caches, and add disk-growth smoke checks |
| Ambiguous mixed state authority | Lost updates, conflicting records, impossible migrations | Assign every record to one authority layer and use explicit projections/reconciliation |
| Over-broad telemetry | Privacy, trust, and compliance exposure | Classify events, prohibit content-bearing fields, enforce 30-day TTL, and audit opt-out/consent |

## Owner Interview: Decisions Required

These questions are intentionally extensive because each answer changes architecture, ownership, or verification.

### P0: Roadmap blockers

1. Is UCS project/work state authoritative in OpenCode's database, UCS-owned storage, git-tracked files, or a remote control plane?
2. Does UCS own durable project management, or only the UX over existing OpenCode sessions/workspaces?
3. Are Web, Desktop, TUI, CLI, server/API, and plugin API all first-class in the first release, or is there an ordered priority?
4. Should the OpenCode fork remain compatible with upstream OpenCode installations, or only this fork?
5. Which features must be plugin-first, and which are explicitly allowed to be host-native fork code?
6. May UCS change the public OpenCode protocol/plugin API, or must all changes remain additive and namespaced?
7. What is the desired upstream posture: upstreamable changes, long-lived private divergence, or a deliberate mixture?
8. What exactly must the uc-studio agent sign off on before Phase 0 closes?
9. **Decision:** Register the `uc-studio` project for direct agent-to-agent feedback; this remains an environment/allowlist prerequisite before Phase 0 closes.
10. Which data must never leave the local machine, beyond the telemetry exclusions already recorded above?

### P1: Product scope

11. Is “frontend ownership” design ownership, implementation ownership, release ownership, or all three?
12. Should Desktop be a native shell around the Web product, or have native-only UCS workflows?
13. Should TUI provide project/work control only, or full project-management parity?
14. Should CLI expose UCS domain commands, or only launch/attach/serve and diagnostics?
15. Should UCS projects map one-to-one to OpenCode projects, or can one UCS project span repositories/workspaces?
16. Is portfolio/multi-project navigation required?
17. Are builds, assets, designs, and external-tool artifacts first-class UCS records or links only?
18. Is human approval a project-level, work-item-level, tool-call-level, or policy-level concept?
19. Which agent roles are opinionated UCS defaults, and which remain user-configurable?
20. Are skills curated by UCS, user-authored, project-authored, or all three with precedence rules?
21. Are tools allowed to mutate external applications automatically, or must SuperMCP actions be approval-gated?
22. Which integrations are required for the first vertical slice: Unity, Unreal, Godot, Roblox, Blender, Figma, Xcode, Android Studio, Discord, Slack, or another target?
23. Is cross-app state synchronization live, event-driven, periodically reconciled, or manually refreshed?
24. Does UCS need offline-first behavior?
25. Is cloud/remote server operation required in the first release?

### P2: Delivery and operations

26. Which platforms are supported at release: macOS, Linux, Windows, Web-only, headless server?
27. What is the minimum artifact verification expected before a release is trusted?
28. Should every milestone include an upstream merge rehearsal?
29. What is the rollback strategy for schema/API changes?
30. What is the acceptable frontend divergence budget per upstream release?
31. Who owns UX/design review for fork-local frontend changes?
32. Who owns UCS capability contracts when an external host adapter disagrees with OpenCode?
33. What evidence must be retained, for how long, and where?
34. Is telemetry completely disabled, locally recorded only, or opt-in and anonymized?
35. What is the release-channel model for upstream, UCS capability, and UCS frontend versions?
36. Does the deployment policy require `snapshot: false` in every generated config, container, and packaged desktop default?
37. Which existing UCS QA scripts are safe to run during roadmap validation, given the prior disk-space incident?

## UCS-Agent Feedback Gate

Before implementation begins, obtain a response from the uc-studio agent covering:

- must-have UCS user, agent, and project workflows;
- stable UCS contracts and package ownership;
- required SuperMCP integrations and event/state flows;
- what belongs in UCS core, the OpenCode fork, or an adapter;
- release/versioning and upstream-sync expectations;
- non-negotiable UX decisions per surface;
- privacy, telemetry, and security constraints;
- first vertical-slice and production-readiness acceptance criteria.

Until that response exists, this document is a strategy draft, not a frozen implementation plan.

## Recommended Immediate Sequence

1. Receive and attach the pending direct uc-studio-agent feedback.
2. Resolve the remaining P0 questions, especially state authority, upstream compatibility, API-change policy, and telemetry data boundaries.
3. Convert this document into a decision-complete implementation plan with one vertical slice and explicit file/package targets.
4. Create the divergence ledger before modifying frontend or protocol code.
5. Implement only the first vertical slice, with real integration evidence and an upstream merge rehearsal.

## Research Sources

Primary upstream sources consulted:

- [OpenCode plugin package source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin)
- [OpenCode V2 Effect plugin API source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin/src/v2/effect)
- [OpenCode V2 Promise plugin API source](https://github.com/anomalyco/opencode/tree/dev/packages/plugin/src/v2/promise)
- [OpenCode plugin documentation](https://opencode.ai/docs/plugins/)
- [OpenCode V2 plugin documentation](https://opencode.ai/v2/docs/build/plugins)
- [OpenCode V1-to-V2 migration notes](https://opencode.ai/v2/docs/migrate-v1)
- [OpenCode repository](https://github.com/anomalyco/opencode)
- [NIST Privacy Framework 1.1](https://www.nist.gov/privacy-framework)
- [ICO data protection principles](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles-a-guide-to-the-data-protection-principles/)
- [ICO cookies and similar technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/cookies-and-similar-technologies/)
- [CNIL cookies and other trackers guidance](https://www.cnil.fr/en/cookies-and-other-trackers/cookies/what-you-need-know-about-cookies)

Repository-local sources:

- `AGENTS.md`
- `script/fork-sync.sh`
- `script/fork-sync-exclusions`
- `packages/plugin/src/index.ts`
- `packages/plugin/src/v2/effect/README.md`
- `packages/plugin/src/v2/promise/README.md`
- `packages/app/`
- `packages/desktop/`
- `packages/tui/`
- `packages/opencode/src/cli/`
- `packages/opencode/src/server/`
- `packages/protocol/`
- `packages/schema/`
- `packages/client/src/generated/`
- `/Volumes/Topper2TB/Git/uc-studio/README.md`
- `/Volumes/Topper2TB/Git/uc-studio/AGENTS.md`
- `/Volumes/Topper2TB/Git/uc-studio/packages/omo-opencode/`

## Approval State

**Not approved for implementation.** This roadmap is intentionally awaiting:

1. direct or relayed uc-studio-agent feedback;
2. answers to the P0 owner questions;
3. an explicit decision on the first vertical slice and supported surface priority.
