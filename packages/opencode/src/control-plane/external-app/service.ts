import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import type { UcsExternalAppAdapter, UcsExternalAppSnapshot } from "@ucs/contracts/external-app"
import { Context, Effect, Layer, Schema } from "effect"
import type { Scope } from "effect"
import { ExternalAppSupervisor } from "./supervisor"

/**
 * Scoped registry of live `UcsExternalAppAdapter` instances.
 *
 * Registration is bound to the caller's `Scope`: the adapter, its retained
 * snapshot, its subscribers, and its supervisor fiber all disappear together
 * when that scope closes. This is deliberately separate from the workspace
 * provisioning adapter registry in `../adapters`, which solves an unrelated
 * problem with plain module-level functions.
 */

export class AlreadyRegisteredError extends Schema.TaggedErrorClass<AlreadyRegisteredError>()(
  "ExternalAppAlreadyRegisteredError",
  {
    appId: Schema.String,
  },
) {
  override get message() {
    return `External app is already registered: ${this.appId}`
  }
}

/** One registered adapter plus the latest snapshot the supervisor observed. */
export interface Registration {
  readonly adapter: UcsExternalAppAdapter
  /** `undefined` until the first successful probe; stale (frozen `updatedAt`) while unreachable. */
  readonly snapshot: UcsExternalAppSnapshot | undefined
}

type Listener = (snapshot: UcsExternalAppSnapshot) => void

interface Entry {
  readonly adapter: UcsExternalAppAdapter
  snapshot: UcsExternalAppSnapshot | undefined
}

export interface Interface {
  readonly register: (adapter: UcsExternalAppAdapter) => Effect.Effect<void, AlreadyRegisteredError, Scope.Scope>
  readonly get: (appId: string) => Effect.Effect<Registration | undefined>
  readonly list: () => Effect.Effect<ReadonlyArray<Registration>>
  /** Seam for downstream event projection. Fires on state/health/mode transitions only. */
  readonly subscribe: (appId: string, onChange: Listener) => Effect.Effect<() => void>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/ExternalApp") {}

/** A repeated identical snapshot every heartbeat is noise, not a transition. */
function transitioned(previous: UcsExternalAppSnapshot, next: UcsExternalAppSnapshot) {
  return (
    previous.state !== next.state || previous.health !== next.health || previous.activeMode !== next.activeMode
  )
}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const entries = new Map<string, Entry>()
    const listeners = new Map<string, Set<Listener>>()

    const register = Effect.fn("ExternalApp.register")(function* (adapter: UcsExternalAppAdapter) {
      if (entries.has(adapter.appId)) return yield* new AlreadyRegisteredError({ appId: adapter.appId })

      const entry: Entry = { adapter, snapshot: undefined }
      entries.set(adapter.appId, entry)
      // Registered before the supervisor so it runs after the supervisor fiber is
      // interrupted: the registry never hands out an adapter with a live fiber.
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          if (entries.get(adapter.appId) === entry) entries.delete(adapter.appId)
        }),
      )

      yield* ExternalAppSupervisor.start({
        adapter,
        emit: (snapshot) => {
          const previous = entry.snapshot
          entry.snapshot = snapshot
          if (previous && !transitioned(previous, snapshot)) return
          for (const listener of listeners.get(adapter.appId) ?? []) listener(snapshot)
        },
      })

      yield* Effect.logInfo("external app registered", { appId: adapter.appId, name: adapter.name })
    })

    const get = (appId: string) => Effect.sync(() => entries.get(appId))

    const list = () => Effect.sync((): ReadonlyArray<Registration> => Array.from(entries.values()))

    const subscribe = (appId: string, onChange: Listener) =>
      Effect.sync(() => {
        const set = listeners.get(appId) ?? new Set<Listener>()
        set.add(onChange)
        listeners.set(appId, set)
        return () => {
          set.delete(onChange)
          if (set.size === 0) listeners.delete(appId)
        }
      })

    return Service.of({ register, get, list, subscribe })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [] })

export * as ExternalApp from "./service"
