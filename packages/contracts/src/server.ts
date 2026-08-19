import { Schema } from "effect"
import {
  UcsExternalAppBlockage,
  UcsExternalAppCapabilities,
  UcsExternalAppCheckpointResult,
  UcsExternalAppConnectParams,
  UcsExternalAppHealth,
  UcsExternalAppProgress,
  UcsExternalAppSnapshot,
  UcsExternalAppState,
} from "./external-app"

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

/**
 * Control-plane request/response bodies for the `ucs.external-apps` route family.
 *
 * Every payload shape is reused from `./external-app` rather than redeclared, so
 * the HTTP surface and the adapter contract can never drift apart. Route-specific
 * names exist only to document which endpoint each shape belongs to.
 */

/** Per-app row of `GET /ucs/external-apps`: identity plus the two orthogonal statuses. */
export const UcsExternalAppSummary = Schema.Struct({
  appId: Schema.String,
  name: Schema.String,
  state: UcsExternalAppState,
  health: UcsExternalAppHealth,
})
export type UcsExternalAppSummary = typeof UcsExternalAppSummary.Type

/** `GET /ucs/external-apps` — registered applications with connection state and health. */
export const UcsExternalAppListResponse = Schema.Struct({
  apps: Schema.Array(UcsExternalAppSummary),
})
export type UcsExternalAppListResponse = typeof UcsExternalAppListResponse.Type

/** `POST /ucs/external-apps/:appId/connect` request body (see decision D1.2-d). */
export const UcsExternalAppConnectRequest = UcsExternalAppConnectParams
export type UcsExternalAppConnectRequest = typeof UcsExternalAppConnectRequest.Type

/** `POST /ucs/external-apps/:appId/connect` — the initial post-handshake snapshot. */
export const UcsExternalAppConnectResponse = UcsExternalAppSnapshot
export type UcsExternalAppConnectResponse = typeof UcsExternalAppConnectResponse.Type

/** `GET /ucs/external-apps/:appId/status` — current health, mode, context, blockage. */
export const UcsExternalAppStatusResponse = UcsExternalAppSnapshot
export type UcsExternalAppStatusResponse = typeof UcsExternalAppStatusResponse.Type

/** `GET /ucs/external-apps/:appId/capabilities` — actions, domain tags, checkpoint support. */
export const UcsExternalAppCapabilitiesResponse = UcsExternalAppCapabilities
export type UcsExternalAppCapabilitiesResponse = typeof UcsExternalAppCapabilitiesResponse.Type

/** `POST /ucs/external-apps/:appId/checkpoints` request body. The label is required. */
export const UcsExternalAppCheckpointRequest = Schema.Struct({
  label: Schema.String,
})
export type UcsExternalAppCheckpointRequest = typeof UcsExternalAppCheckpointRequest.Type

/**
 * `POST /ucs/external-apps/:appId/checkpoints` — `Created` or `Unsupported`.
 * Missing native restore-point support is a successful response carrying data,
 * never an HTTP error.
 */
export const UcsExternalAppCheckpointResponse = UcsExternalAppCheckpointResult
export type UcsExternalAppCheckpointResponse = typeof UcsExternalAppCheckpointResponse.Type

/**
 * Typed payloads for the external-app events published over `/ucs/events`.
 *
 * This is a standalone building block: `UcsEventEnvelope.properties` stays
 * `Schema.Unknown` because the envelope is shared by every ucs event domain, and
 * narrowing it would break topology, evidence, and the rest. Binding these tags
 * to envelope `type` strings, and splitting them into durable vs ephemeral
 * delivery, is the event-manifest's job in the host package.
 *
 * All members except `external-app.progress` are durable; progress ticks are the
 * ephemeral intermediate stream.
 */
export const UcsExternalAppEventPayload = Schema.Union([
  Schema.TaggedStruct("external-app.state-changed", {
    appId: Schema.String,
    snapshot: UcsExternalAppSnapshot,
  }),
  Schema.TaggedStruct("external-app.capabilities-changed", {
    appId: Schema.String,
    capabilities: UcsExternalAppCapabilities,
  }),
  Schema.TaggedStruct("external-app.blockage-changed", {
    appId: Schema.String,
    blockage: Schema.NullOr(UcsExternalAppBlockage),
  }),
  Schema.TaggedStruct("external-app.checkpoint-result", {
    appId: Schema.String,
    result: UcsExternalAppCheckpointResult,
  }),
  Schema.TaggedStruct("external-app.progress", {
    appId: Schema.String,
    progress: UcsExternalAppProgress,
  }),
])
export type UcsExternalAppEventPayload = typeof UcsExternalAppEventPayload.Type
