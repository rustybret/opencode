export * as ExternalAppEvent from "./external-app-event"

import { Schema } from "effect"
import { Event } from "./event"
import { NonNegativeInt, optional } from "./schema"

/**
 * EventV2 definitions for `UcsExternalApp` — the integration surface between the
 * agent and a live creative application (Unity, Unreal, Godot, Blender, ...).
 *
 * The five `type` strings and their payload fields mirror `UcsExternalAppEventPayload`
 * in `@ucs/contracts/server` field-for-field. They are re-declared here rather than
 * imported: `@opencode-ai/schema` depends on `effect` alone, and every event module in
 * this package owns its own shapes. See `decisions.md` D3.1-a.
 *
 * Everything except `external-app.progress` is durable, aggregated by `appId`
 * (plan §3 D2). Progress ticks are the ephemeral intermediate stream: they are
 * high-frequency, superseded by their own terminal tick, and worthless to replay.
 */

/** Durable events share one aggregate: the app they describe. */
const options = {
  durable: {
    aggregate: "appId",
    version: 1,
  },
} as const

export const State = Schema.Literals([
  "disconnected",
  "connecting",
  "connected",
  "blocked-on-human",
  "busy-streaming",
  "error",
])
export type State = typeof State.Type

/** Transport reachability, orthogonal to lifecycle `state`. */
export const Health = Schema.Literals(["healthy", "throttled", "stalled", "unreachable"])
export type Health = typeof Health.Type

/** Run mode of the host application. `unknown` is reported, never guessed. */
export const Mode = Schema.Literals(["edit", "play", "unknown"])
export type Mode = typeof Mode.Type

export const BlockageReason = Schema.Literals([
  "modal",
  "safe-mode",
  "compile-errors-require-human",
  "editor-focus-required",
  "instance-selection-required",
])
export type BlockageReason = typeof BlockageReason.Type

export const Blockage = Schema.Struct({
  reason: BlockageReason,
  detail: optional(Schema.String),
}).annotate({ identifier: "ExternalAppEvent.Blockage" })
export interface Blockage extends Schema.Schema.Type<typeof Blockage> {}

export const Snapshot = Schema.Struct({
  appId: Schema.String,
  state: State,
  health: Health,
  activeMode: Mode,
  focused: optional(Schema.Boolean),
  backgroundMode: optional(Schema.Boolean),
  lastHeartbeatAgeMs: optional(Schema.Number),
  modalCount: optional(Schema.Number),
  projectPath: optional(Schema.String),
  scenePath: optional(Schema.String),
  blockage: optional(Blockage),
  /** Frozen while the app is unreachable, so consumers can compute staleness. */
  updatedAt: Schema.Number,
}).annotate({ identifier: "ExternalAppEvent.Snapshot" })
export interface Snapshot extends Schema.Schema.Type<typeof Snapshot> {}

export const Capabilities = Schema.Struct({
  version: Schema.String,
  actions: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      domain: Schema.String,
    }),
  ),
  domainTags: Schema.Array(Schema.String),
  checkpointSupported: Schema.Boolean,
}).annotate({ identifier: "ExternalAppEvent.Capabilities" })
export interface Capabilities extends Schema.Schema.Type<typeof Capabilities> {}

/** Absence of a native restore point is data, not an error. */
export const CheckpointOutcome = Schema.Union([
  Schema.TaggedStruct("Created", {
    checkpointId: Schema.String,
    label: Schema.String,
    createdAt: Schema.Number,
  }),
  Schema.TaggedStruct("Unsupported", {
    reason: Schema.String,
  }),
]).annotate({ identifier: "ExternalAppEvent.CheckpointOutcome" })
export type CheckpointOutcome = typeof CheckpointOutcome.Type

export const ProgressTick = Schema.Struct({
  sequence: NonNegativeInt,
  operationId: Schema.String,
  /** Only present when the application actually supplies a fraction. */
  progress: optional(Schema.Number),
  message: Schema.String,
  terminal: Schema.Boolean,
}).annotate({ identifier: "ExternalAppEvent.ProgressTick" })
export interface ProgressTick extends Schema.Schema.Type<typeof ProgressTick> {}

export const StateChanged = Event.define({
  type: "external-app.state-changed",
  ...options,
  schema: {
    appId: Schema.String,
    snapshot: Snapshot,
  },
})

export const CapabilitiesChanged = Event.define({
  type: "external-app.capabilities-changed",
  ...options,
  schema: {
    appId: Schema.String,
    capabilities: Capabilities,
  },
})

/**
 * `Schema.NullOr`, not `optional`: a cleared blockage must travel as an explicit
 * `null`, because an absent key in a delta event means "no change" instead.
 */
export const BlockageChanged = Event.define({
  type: "external-app.blockage-changed",
  ...options,
  schema: {
    appId: Schema.String,
    blockage: Schema.NullOr(Blockage),
  },
})

export const CheckpointResult = Event.define({
  type: "external-app.checkpoint-result",
  ...options,
  schema: {
    appId: Schema.String,
    result: CheckpointOutcome,
  },
})

export const Progress = Event.define({
  type: "external-app.progress",
  schema: {
    appId: Schema.String,
    progress: ProgressTick,
  },
})

export const DurableDefinitions = Event.inventory(StateChanged, CapabilitiesChanged, BlockageChanged, CheckpointResult)

export const Definitions = Event.inventory(
  StateChanged,
  CapabilitiesChanged,
  BlockageChanged,
  CheckpointResult,
  Progress,
)
