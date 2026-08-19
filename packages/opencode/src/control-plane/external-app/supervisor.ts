import type {
  UcsExternalAppAdapter,
  UcsExternalAppFailure,
  UcsExternalAppSnapshot,
} from "@ucs/contracts/external-app"
import { Duration, Effect, Schedule } from "effect"

/**
 * Liveness supervisor for one registered `UcsExternalAppAdapter`.
 *
 * Exactly one fiber runs per supervised adapter, forked into the caller's
 * `Scope`. Heartbeat and reconnect are phases of that single loop rather than
 * separate fibers, so two probe loops can never overlap for the same `appId`,
 * and closing the registration scope interrupts everything this module started.
 */

/** Health probe cadence. Skipped entirely while progress ticks are flowing. */
const HEARTBEAT_INTERVAL = Duration.seconds(5)
const RETRY_BASE_DELAY = Duration.seconds(1)
const RETRY_MAX_DELAY = Duration.seconds(30)

/**
 * `1s -> 2s -> 4s -> 8s -> 16s -> 30s -> 30s ...`
 *
 * `either` takes the minimum of the two delays, which caps the doubling at
 * `RETRY_MAX_DELAY`; `jittered` then scales each delay by a random `0.8..1.2`
 * factor so a fleet of adapters does not reconnect in lockstep.
 */
const retrySchedule = Schedule.exponential(RETRY_BASE_DELAY).pipe(
  Schedule.either(Schedule.spaced(RETRY_MAX_DELAY)),
  Schedule.jittered,
)

/** Only unreachability drives the reconnect loop; a protocol fault is per-call. */
const isTransportFailure = (failure: UcsExternalAppFailure) =>
  failure._tag === "UcsExternalAppTransportError" || failure._tag === "UcsExternalAppTimeoutError"

export interface Options {
  readonly adapter: UcsExternalAppAdapter
  /** Called with every authoritative snapshot, including reconciled stale ones. */
  readonly emit: (snapshot: UcsExternalAppSnapshot) => void
  readonly heartbeatInterval?: Duration.Input
}

export const start = Effect.fn("ExternalAppSupervisor.start")(function* (options: Options) {
  const interval = options.heartbeatInterval ?? HEARTBEAT_INTERVAL

  // Single-writer state: only the supervisor fiber below ever mutates these.
  let retained: UcsExternalAppSnapshot | undefined
  let streaming = false

  const publish = (snapshot: UcsExternalAppSnapshot) => {
    retained = snapshot
    options.emit(snapshot)
  }

  /** A fresh read from the app: it also re-decides whether probing is needed. */
  const observe = (snapshot: UcsExternalAppSnapshot) => {
    streaming = snapshot.state === "busy-streaming"
    publish(snapshot)
  }

  // Progress ticks stand in for health probes while the app is busy streaming,
  // and the terminal tick is what re-enables heartbeats.
  const unsubscribe = options.adapter.streamProgress((event) => {
    if (event.terminal) streaming = false
  })
  yield* Effect.addFinalizer(() => Effect.sync(unsubscribe))

  const warn = (failure: UcsExternalAppFailure) =>
    Effect.logWarning("external app probe failed", { appId: options.adapter.appId, failure })

  const handshake = Effect.gen(function* () {
    const snapshot = yield* options.adapter.connect()
    yield* options.adapter.capabilities()
    return snapshot
  })

  const reconnect = Effect.gen(function* () {
    streaming = false
    // Keep the last good snapshot verbatim - `updatedAt` stays frozen so callers
    // can tell how stale the read is - and reconcile only its reachability.
    if (retained && retained.health !== "unreachable") publish({ ...retained, health: "unreachable" })
    // Reconnecting restores health monitoring only. Requests that were in flight
    // when the transport dropped already failed to their original caller and are
    // never replayed here.
    observe(yield* handshake.pipe(Effect.retry({ while: isTransportFailure, schedule: retrySchedule })))
  }).pipe(Effect.catch(warn))

  const probe = Effect.gen(function* () {
    observe(yield* options.adapter.status())
  }).pipe(Effect.catch((failure) => (isTransportFailure(failure) ? reconnect : warn(failure))))

  const tick = Effect.gen(function* () {
    yield* Effect.sleep(interval)
    if (streaming) return
    yield* probe
  })

  yield* Effect.forkScoped(Effect.forever(tick))
})

export * as ExternalAppSupervisor from "./supervisor"
