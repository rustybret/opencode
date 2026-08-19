import { describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import type { UcsExternalAppAdapter, UcsExternalAppSnapshot } from "@ucs/contracts/external-app"
import { Effect, Option } from "effect"
import { TestClock } from "effect/testing"
import { ExternalApp } from "@/control-plane/external-app/service"
import { testEffect } from "../lib/effect"

const it = testEffect(LayerNode.compile(ExternalApp.node))

// Deliberately not the real Unity adapter: this suite owns the registry
// contract, so it must stay decoupled from any concrete adapter package.
function makeFake(appId: string) {
  const state: { snapshot: UcsExternalAppSnapshot } = {
    snapshot: { appId, state: "connected", health: "healthy", activeMode: "edit", updatedAt: 1_000 },
  }

  const adapter: UcsExternalAppAdapter = {
    appId,
    name: `${appId} fake`,
    connect: () => Effect.succeed(state.snapshot),
    status: () => Effect.succeed(state.snapshot),
    capabilities: () =>
      Effect.succeed({ version: "1.0.0", actions: [], domainTags: [], checkpointSupported: false }),
    checkpoint: (label) => Effect.succeed({ _tag: "Unsupported" as const, reason: `no checkpoint for ${label}` }),
    blockedOnHuman: () => Effect.succeed(Option.none()),
    streamProgress: () => () => {},
  }

  return { adapter, state }
}

describe("control-plane.external-app.service", () => {
  it.effect("registers an adapter and exposes it through get and list", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const unity = makeFake("unity")
      const blender = makeFake("blender")

      yield* apps.register(unity.adapter)
      yield* apps.register(blender.adapter)

      expect((yield* apps.get("unity"))?.adapter).toBe(unity.adapter)
      expect((yield* apps.get("unity"))?.snapshot).toBeUndefined()
      expect((yield* apps.get("nope"))).toBeUndefined()
      expect((yield* apps.list()).map((entry) => entry.adapter.appId).sort()).toEqual(["blender", "unity"])
    }),
  )

  it.effect("unregisters when the registering scope closes", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const unity = makeFake("unity")

      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* apps.register(unity.adapter)
          expect((yield* apps.list()).length).toBe(1)
        }),
      )

      expect(yield* apps.list()).toEqual([])
      expect(yield* apps.get("unity")).toBeUndefined()
    }),
  )

  it.effect("rejects a duplicate appId instead of overwriting the registration", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const first = makeFake("unity")
      const second = makeFake("unity")

      yield* apps.register(first.adapter)
      const failure = yield* Effect.flip(apps.register(second.adapter))

      expect(failure._tag).toBe("ExternalAppAlreadyRegisteredError")
      expect(failure.appId).toBe("unity")
      expect((yield* apps.get("unity"))?.adapter).toBe(first.adapter)
      expect((yield* apps.list()).length).toBe(1)
    }),
  )

  it.effect("re-registers the same appId once the previous scope has closed", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const first = makeFake("unity")
      const second = makeFake("unity")

      yield* Effect.scoped(apps.register(first.adapter))
      yield* apps.register(second.adapter)

      expect((yield* apps.get("unity"))?.adapter).toBe(second.adapter)
    }),
  )

  it.effect("fills the registration snapshot from the supervisor heartbeat", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const unity = makeFake("unity")

      yield* apps.register(unity.adapter)
      yield* TestClock.adjust("5 seconds")

      expect((yield* apps.get("unity"))?.snapshot?.updatedAt).toBe(1_000)
    }),
  )

  it.effect("notifies subscribers on transitions only, and stops after unsubscribe", () =>
    Effect.gen(function* () {
      const apps = yield* ExternalApp.Service
      const unity = makeFake("unity")
      const seen: UcsExternalAppSnapshot[] = []

      yield* apps.register(unity.adapter)
      const unsubscribe = yield* apps.subscribe("unity", (snapshot) => {
        seen.push(snapshot)
      })

      yield* TestClock.adjust("5 seconds")
      // Identical snapshot on the next probe: a repeat is not a transition.
      yield* TestClock.adjust("5 seconds")
      expect(seen.length).toBe(1)

      unity.state.snapshot = { ...unity.state.snapshot, health: "throttled", updatedAt: 2_000 }
      yield* TestClock.adjust("5 seconds")
      expect(seen.map((snapshot) => snapshot.health)).toEqual(["healthy", "throttled"])

      unsubscribe()
      unity.state.snapshot = { ...unity.state.snapshot, health: "stalled", updatedAt: 3_000 }
      yield* TestClock.adjust("5 seconds")

      expect(seen.length).toBe(2)
      expect((yield* apps.get("unity"))?.snapshot?.health).toBe("stalled")
    }),
  )
})
