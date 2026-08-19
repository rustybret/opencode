import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { Location } from "@opencode-ai/core/location"
import { AbsolutePath } from "@opencode-ai/core/schema"
import { ExternalAppEvent } from "@opencode-ai/schema/external-app-event"
import type {
  UcsExternalAppBlockage,
  UcsExternalAppCapabilities,
  UcsExternalAppCheckpointResult,
  UcsExternalAppProgress,
  UcsExternalAppSnapshot,
} from "@ucs/contracts/external-app"
import { InstanceRef, WorkspaceRef } from "@/effect/instance-ref"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Context, Effect, Layer, Queue, Stream } from "effect"
import type { Scope } from "effect"
import { ExternalApp } from "./service"

/**
 * Projection of `ExternalApp.Service` onto the EventV2 bus.
 *
 * `ExternalApp.Service` is deliberately transport-free: it holds adapters and
 * fires a plain callback on transitions. This module is the single place that
 * turns those transitions into `ExternalAppEvent` payloads and publishes them
 * through `EventV2Bridge`, which is what makes them visible on `/ucs/events`.
 *
 * ## Composition contract (Wave 3 Task 3.2 reads this)
 *
 * 1. Add `ExternalAppEvents.node` to the server layer tree. It depends on
 *    `ExternalApp.node` and `EventV2Bridge.node`; nothing else is required.
 * 2. For every adapter registered via `ExternalApp.Service.register`, call
 *    `attach(adapter.appId)` in the *same* `Scope` — `attach` is scoped exactly
 *    like `register`, so one scope close tears down both. Registering a batch
 *    first and then calling `attachRegistered()` once is equivalent.
 * 3. `attach` must run where `InstanceRef` is set (for example inside
 *    `InstanceBootstrap.run`, which `InstanceStore.boot` provides it to), or the
 *    caller must pass an explicit `location`. The `/ucs/events` handler filters
 *    on `event.location.directory`, so an untagged event is silently dropped.
 *    `attach` logs a warning rather than failing when it can resolve neither.
 *
 * ## What this module can and cannot derive
 *
 * `subscribe` hands over a `UcsExternalAppSnapshot` and nothing else, so only
 * `external-app.state-changed` and `external-app.blockage-changed` are derived
 * here. The other three originate outside the registry and are published by
 * whoever performs the operation: `capabilitiesChanged` after a `capabilities()`
 * read, `checkpointResult` after a `checkpoint()` call, `progress` from a
 * `streamProgress` subscription. They are exposed as explicit publishers instead
 * of being polled, because re-subscribing to `streamProgress` here would start a
 * second poll loop alongside the supervisor's own (see `decisions.md` D3.1-c).
 */

export interface AttachOptions {
  /** Overrides the ambient `InstanceRef`/`WorkspaceRef` derivation. */
  readonly location?: Location.Ref
}

export interface Interface {
  /** Scoped: publishes state/blockage transitions for one app until the scope closes. */
  readonly attach: (appId: string, options?: AttachOptions) => Effect.Effect<void, never, Scope.Scope>
  /** `attach` for every app currently in the registry. Apps registered later are not picked up. */
  readonly attachRegistered: (options?: AttachOptions) => Effect.Effect<void, never, Scope.Scope>
  readonly capabilitiesChanged: (appId: string, capabilities: UcsExternalAppCapabilities) => Effect.Effect<void>
  readonly checkpointResult: (appId: string, result: UcsExternalAppCheckpointResult) => Effect.Effect<void>
  readonly progress: (appId: string, progress: UcsExternalAppProgress) => Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/ExternalAppEvents") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const registry = yield* ExternalApp.Service
    const events = yield* EventV2Bridge.Service

    const attach = Effect.fn("ExternalAppEvents.attach")(function* (appId: string, options?: AttachOptions) {
      const location = options?.location ?? (yield* ambientLocation)
      if (location === undefined) {
        yield* Effect.logWarning("external app events attached without a location", {
          appId,
          detail: "/ucs/events filters on location and will drop these events",
        })
      }
      const publishOptions = location === undefined ? undefined : { location }

      // The registry calls listeners synchronously from the supervisor fiber, which
      // has neither this fiber's context nor an error channel. The queue is the
      // handoff: enqueue there, publish here, ordering preserved.
      const queue = yield* Queue.unbounded<UcsExternalAppSnapshot>()
      const unsubscribe = yield* registry.subscribe(appId, (snapshot) => {
        Queue.offerUnsafe(queue, snapshot)
      })
      yield* Effect.addFinalizer(() => Effect.sync(unsubscribe).pipe(Effect.andThen(Queue.shutdown(queue))))

      // Single-writer state: only the drain fiber forked below ever reads or replaces it.
      // Seeded from the retained snapshot so a re-attach does not replay a blockage.
      let blockage: UcsExternalAppBlockage | undefined = (yield* registry.get(appId))?.snapshot?.blockage

      yield* Effect.forkScoped(
        Stream.runForEach(Stream.fromQueue(queue), (snapshot) =>
          Effect.gen(function* () {
            yield* events.publish(ExternalAppEvent.StateChanged, { appId, snapshot }, publishOptions)
            if (sameBlockage(blockage, snapshot.blockage)) return
            blockage = snapshot.blockage
            // `null`, not an absent key: a cleared blockage is a transition, and an
            // absent key in a delta event is indistinguishable from "no change".
            yield* events.publish(
              ExternalAppEvent.BlockageChanged,
              { appId, blockage: snapshot.blockage ?? null },
              publishOptions,
            )
          }),
        ),
      )
    })

    return Service.of({
      attach,
      attachRegistered: (options?: AttachOptions) =>
        registry
          .list()
          .pipe(
            Effect.flatMap((registrations) =>
              Effect.forEach(registrations, (registration) => attach(registration.adapter.appId, options), {
                discard: true,
              }),
            ),
          ),
      capabilitiesChanged: (appId, capabilities) =>
        events.publish(ExternalAppEvent.CapabilitiesChanged, { appId, capabilities }).pipe(Effect.asVoid),
      checkpointResult: (appId, result) =>
        events.publish(ExternalAppEvent.CheckpointResult, { appId, result }).pipe(Effect.asVoid),
      progress: (appId, progress) =>
        events.publish(ExternalAppEvent.Progress, { appId, progress }).pipe(Effect.asVoid),
    })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [ExternalApp.node, EventV2Bridge.node] })

const ambientLocation = Effect.gen(function* () {
  const ctx = yield* InstanceRef
  if (!ctx) return undefined
  const workspaceID = yield* WorkspaceRef
  const location: Location.Ref = { directory: AbsolutePath.make(ctx.directory), workspaceID }
  return location
})

/** Both sides absent counts as unchanged, so a never-blocked app stays quiet. */
function sameBlockage(previous: UcsExternalAppBlockage | undefined, next: UcsExternalAppBlockage | undefined) {
  return previous?.reason === next?.reason && previous?.detail === next?.detail
}

export * as ExternalAppEvents from "./events"
