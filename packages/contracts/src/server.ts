import { Schema } from "effect"

/**
 * Server-surface schema contracts for the namespaced `ucs` API group.
 *
 * These schemas describe the JSON bodies served by the instance-level
 * `UcsGroup` (topology, task-state, sessions, events). They are host-neutral
 * and schema-tier: the server handlers construct these values and the fork
 * surfaces (Web/TUI/CLI/Desktop) decode them. They deliberately do not
 * reference `@opencode-ai/schema` types so the package keeps its single
 * `effect` dependency and stays usable by any host adapter.
 */

/** A routed directory reference. `workspace` is optional because local routes have none. */
export const UcsLocationRef = Schema.Struct({
  directory: Schema.String,
  workspace: Schema.optional(Schema.String),
  project: Schema.optional(Schema.String),
})
export type UcsLocationRef = typeof UcsLocationRef.Type

/** Concise per-session topology entry. */
export const UcsSessionRef = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  agent: Schema.optional(Schema.String),
  model: Schema.optional(Schema.String),
  parentID: Schema.optional(Schema.String),
  projectID: Schema.optional(Schema.String),
  directory: Schema.optional(Schema.String),
  time: Schema.optional(Schema.Number),
  summary: Schema.optional(
    Schema.Struct({
      additions: Schema.Number,
      deletions: Schema.Number,
      files: Schema.Number,
    }),
  ),
  cost: Schema.optional(Schema.Number),
  tokens: Schema.optional(
    Schema.Struct({
      input: Schema.optional(Schema.Number),
      output: Schema.optional(Schema.Number),
      cacheRead: Schema.optional(Schema.Number),
      cacheWrite: Schema.optional(Schema.Number),
    }),
  ),
})
export type UcsSessionRef = typeof UcsSessionRef.Type

/** Session role within a topology: primary agent vs one of its subagents. */
export const UcsSessionRole = Schema.Literals(["primary", "subagent"])
export type UcsSessionRole = typeof UcsSessionRole.Type

/** One row of the multi-session topology tree. */
export const UcsTopologyEntry = Schema.Struct({
  ...UcsSessionRef.fields,
  role: UcsSessionRole,
  status: Schema.optional(Schema.String),
  currentStep: Schema.optional(Schema.String),
})
export type UcsTopologyEntry = typeof UcsTopologyEntry.Type

/** Read-only topology for a routed location: session tree plus project context. */
export const UcsTopology = Schema.Struct({
  location: UcsLocationRef,
  project: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      name: Schema.optional(Schema.String),
      worktree: Schema.optional(Schema.String),
    }),
  ),
  entries: Schema.Array(UcsTopologyEntry),
  activeSessionCount: Schema.Number,
  updatedAt: Schema.Number,
})
export type UcsTopology = typeof UcsTopology.Type

/** Boulder state summary exposed by task-state. The full schema lives in ./boulder. */
export const UcsBoulderSummary = Schema.Struct({
  present: Schema.Boolean,
  version: Schema.optional(Schema.Number),
  taskGoal: Schema.optional(Schema.String),
  currentStepId: Schema.optional(Schema.String),
  totalSteps: Schema.optional(Schema.Number),
  completedSteps: Schema.optional(Schema.Number),
  failedSteps: Schema.optional(Schema.Number),
  pendingSteps: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
})
export type UcsBoulderSummary = typeof UcsBoulderSummary.Type

/** Per-integration connection state. */
export const UcsIntegrationState = Schema.Struct({
  id: Schema.String,
  connected: Schema.Boolean,
  name: Schema.optional(Schema.String),
  status: Schema.optional(Schema.String),
  detail: Schema.optional(Schema.String),
})
export type UcsIntegrationState = typeof UcsIntegrationState.Type

/** Task-state: work tracking, integrations, and evidence for a routed location. */
export const UcsTaskState = Schema.Struct({
  location: UcsLocationRef,
  boulder: UcsBoulderSummary,
  integrations: Schema.Array(UcsIntegrationState),
  evidenceCount: Schema.Number,
  updatedAt: Schema.Number,
})
export type UcsTaskState = typeof UcsTaskState.Type

/** Query filters for the ucs sessions list. */
export const UcsSessionsQuery = Schema.Struct({
  scope: Schema.optional(Schema.Literals(["project"])),
  status: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.NumberFromString),
})
export type UcsSessionsQuery = typeof UcsSessionsQuery.Type

/** One event in the ucs SSE stream (schema-tier envelope; payload is opaque JSON). */
export const UcsEventEnvelope = Schema.Struct({
  id: Schema.String,
  type: Schema.String,
  properties: Schema.Unknown,
})
export type UcsEventEnvelope = typeof UcsEventEnvelope.Type