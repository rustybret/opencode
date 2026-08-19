import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { createUnitySuperMcpAdapter } from "@ucs/external-app-unity"
import { Effect, Layer } from "effect"
import { ExternalApp } from "./service"

/**
 * Static registration of the reference `UcsExternalAppAdapter` set.
 *
 * `ExternalApp.Service` is a registry, not a catalogue: it holds whatever a
 * caller registers into that caller's `Scope` and knows nothing about Unity.
 * This node is the one place that decides which adapters an opencode server
 * ships with by default, so `service.ts` stays adapter-agnostic and the concrete
 * `@ucs/external-app-unity` import has a single entry point in this package.
 *
 * Registration runs in the layer's own scope, which is the server graph's
 * lifetime: the adapter, its retained snapshot, and its supervisor fiber are
 * released when the server layer is finalized. Every route family therefore
 * observes the same registry instance.
 *
 * The adapter is registered whether or not a bridge is currently reachable —
 * `UcsExternalAppSnapshot.health` is what reports reachability, and hiding an
 * unreachable app from `GET /ucs/external-apps` would make "Unity is not
 * running" indistinguishable from "this host has no Unity support at all".
 */

const layer = Layer.effectDiscard(
  Effect.gen(function* () {
    const registry = yield* ExternalApp.Service
    // Never fatal to server startup: a duplicate id means something else already
    // owns that adapter, which is a composition mistake, not a request failure.
    yield* registry
      .register(createUnitySuperMcpAdapter({ appId: "unity", name: "Unity SuperMCP" }))
      .pipe(
        Effect.catch((error) => Effect.logWarning("external app registration skipped", { appId: error.appId })),
      )
  }),
)

export const node = LayerNode.make({
  name: "@opencode/ExternalAppRegistration",
  layer: layer,
  deps: [ExternalApp.node],
})

export * as ExternalAppRegistration from "./registration"
