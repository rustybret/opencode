import { Effect, Option, Schema } from "effect"

/**
 * Schema-tier contract for `UcsExternalApp`: the transport-neutral integration
 * surface between the agent and a live creative application (Unity, Unreal,
 * Godot, Blender, Figma, Xcode, ...).
 *
 * This module deliberately depends on `effect` alone. Adapter packages
 * (`@ucs/external-app-unity` and friends) supply application-specific vocabulary
 * such as domain tags and action ids; none of it is hardcoded here.
 */

/**
 * UcsExternalApp 6 Core Contract Verbs and state requirements.
 */
export const UcsExternalAppVerb = Schema.Literals([
  "connect",
  "status",
  "capabilities",
  "checkpoint",
  "blocked-on-human",
  "stream-progress",
])
export type UcsExternalAppVerb = typeof UcsExternalAppVerb.Type

export const UcsExternalAppState = Schema.Literals([
  "disconnected",
  "connecting",
  "connected",
  "blocked-on-human",
  "busy-streaming",
  "error",
])
export type UcsExternalAppState = typeof UcsExternalAppState.Type

/**
 * Transport reachability, orthogonal to lifecycle `state`. A `connected` app can
 * still be `throttled` or `stalled`, so health is never derived from state.
 */
export const UcsExternalAppHealth = Schema.Literals(["healthy", "throttled", "stalled", "unreachable"])
export type UcsExternalAppHealth = typeof UcsExternalAppHealth.Type

/**
 * Run mode of the host application, orthogonal to both `state` and `health`.
 * `unknown` is a first-class value: adapters must report it rather than guess.
 */
export const UcsExternalAppMode = Schema.Literals(["edit", "play", "unknown"])
export type UcsExternalAppMode = typeof UcsExternalAppMode.Type

/**
 * Why an application requires a human before the agent may continue. Adapters
 * never auto-dismiss modals or steal OS focus; they report the reason instead.
 */
export const UcsExternalAppBlockageReason = Schema.Literals([
  "modal",
  "safe-mode",
  "compile-errors-require-human",
  "editor-focus-required",
  "instance-selection-required",
])
export type UcsExternalAppBlockageReason = typeof UcsExternalAppBlockageReason.Type

export const UcsExternalAppBlockage = Schema.Struct({
  reason: UcsExternalAppBlockageReason,
  detail: Schema.optional(Schema.String),
})
export type UcsExternalAppBlockage = typeof UcsExternalAppBlockage.Type

/**
 * Versioned capability manifest for one application instance.
 *
 * `domain` and `domainTags` are open strings on purpose. The concrete vocabulary
 * (`unity-scene`, `unity-script-roslyn`, ...) belongs to the adapter package that
 * speaks that application's protocol, so this contract stays adapter-agnostic.
 */
export const UcsExternalAppCapabilities = Schema.Struct({
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
})
export type UcsExternalAppCapabilities = typeof UcsExternalAppCapabilities.Type

/**
 * Outcome of the `checkpoint` verb.
 *
 * Absence of a native restore point is data, not an error: adapters return the
 * `Unsupported` member so callers must handle it explicitly. Substituting a
 * change-diff or any other approximation for a real checkpoint is forbidden.
 */
export const UcsExternalAppCheckpointResult = Schema.Union([
  Schema.TaggedStruct("Created", {
    checkpointId: Schema.String,
    label: Schema.String,
    createdAt: Schema.Number,
  }),
  Schema.TaggedStruct("Unsupported", {
    reason: Schema.String,
  }),
])
export type UcsExternalAppCheckpointResult = typeof UcsExternalAppCheckpointResult.Type

/**
 * One tick of the `stream-progress` verb.
 *
 * `sequence` is a monotonic non-negative integer used for ordering and
 * deduplication. `progress` stays optional because a fraction is only reported
 * when the application actually supplies one; it is never fabricated.
 */
export const UcsExternalAppProgress = Schema.Struct({
  sequence: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  operationId: Schema.String,
  progress: Schema.optional(Schema.Number),
  message: Schema.String,
  terminal: Schema.Boolean,
})
export type UcsExternalAppProgress = typeof UcsExternalAppProgress.Type

/**
 * Normalized read of one application instance, returned by both `connect` (as
 * the initial snapshot) and `status` (as the current superset read).
 */
export const UcsExternalAppSnapshot = Schema.Struct({
  appId: Schema.String,
  state: UcsExternalAppState,
  health: UcsExternalAppHealth,
  activeMode: UcsExternalAppMode,
  focused: Schema.optional(Schema.Boolean),
  backgroundMode: Schema.optional(Schema.Boolean),
  lastHeartbeatAgeMs: Schema.optional(Schema.Number),
  modalCount: Schema.optional(Schema.Number),
  projectPath: Schema.optional(Schema.String),
  scenePath: Schema.optional(Schema.String),
  blockage: Schema.optional(UcsExternalAppBlockage),
  updatedAt: Schema.Number,
})
export type UcsExternalAppSnapshot = typeof UcsExternalAppSnapshot.Type

/**
 * Optional project-scoped parameters for `connect`. `projectPath` lets the
 * adapter verify it reached the intended instance instead of an ambiguous one.
 */
export const UcsExternalAppConnectParams = Schema.Struct({
  projectPath: Schema.optional(Schema.String),
})
export type UcsExternalAppConnectParams = typeof UcsExternalAppConnectParams.Type

/** The application could not be reached or the connection dropped mid-request. */
export class UcsExternalAppTransportError extends Schema.TaggedErrorClass<UcsExternalAppTransportError>()(
  "UcsExternalAppTransportError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.String),
  },
) {}

/** A request exceeded its deadline. `timeoutMs` is the budget that elapsed. */
export class UcsExternalAppTimeoutError extends Schema.TaggedErrorClass<UcsExternalAppTimeoutError>()(
  "UcsExternalAppTimeoutError",
  {
    message: Schema.String,
    timeoutMs: Schema.Number,
  },
) {}

/** The application answered, but violated the negotiated protocol contract. */
export class UcsExternalAppProtocolError extends Schema.TaggedErrorClass<UcsExternalAppProtocolError>()(
  "UcsExternalAppProtocolError",
  {
    message: Schema.String,
    detail: Schema.optional(Schema.String),
  },
) {}

/**
 * Several candidate instances matched. The adapter refuses to pick one, because
 * guessing could mutate the wrong project.
 */
export class UcsExternalAppInstanceAmbiguityError extends Schema.TaggedErrorClass<UcsExternalAppInstanceAmbiguityError>()(
  "UcsExternalAppInstanceAmbiguityError",
  {
    message: Schema.String,
    candidates: Schema.Array(Schema.String),
  },
) {}

/**
 * Every failure an adapter verb may produce. Missing checkpoint support is not a
 * member: it is modeled as data via `UcsExternalAppCheckpointResult.Unsupported`.
 */
export type UcsExternalAppFailure =
  | UcsExternalAppTransportError
  | UcsExternalAppTimeoutError
  | UcsExternalAppProtocolError
  | UcsExternalAppInstanceAmbiguityError

export interface UcsExternalAppAdapter {
  readonly appId: string
  readonly name: string
  readonly connect: (
    params?: UcsExternalAppConnectParams,
  ) => Effect.Effect<UcsExternalAppSnapshot, UcsExternalAppFailure>
  readonly status: () => Effect.Effect<UcsExternalAppSnapshot, UcsExternalAppFailure>
  readonly capabilities: () => Effect.Effect<UcsExternalAppCapabilities, UcsExternalAppFailure>
  readonly checkpoint: (label: string) => Effect.Effect<UcsExternalAppCheckpointResult, UcsExternalAppFailure>
  /** Derivation, not a command: reports the current blockage, `None` when clear. */
  readonly blockedOnHuman: () => Effect.Effect<Option.Option<UcsExternalAppBlockage>, UcsExternalAppFailure>
  /** Subscription: returns an unsubscribe function that stops the tick stream. */
  readonly streamProgress: (onProgress: (event: UcsExternalAppProgress) => void) => () => void
}
