import { describe, expect } from "bun:test"
import type { UcsExternalAppAdapter, UcsExternalAppProgress, UcsExternalAppSnapshot } from "@ucs/contracts/external-app"
import { UcsExternalAppTransportError } from "@ucs/contracts/external-app"
import { Clock, Effect, Option, Random } from "effect"
import { TestClock } from "effect/testing"
import { ExternalAppSupervisor } from "@/control-plane/external-app/supervisor"
import { it } from "../lib/effect"

// Jitter is `delay * 0.8 * (1 - r) + delay * 1.2 * r`, so r = 0.5 reproduces the
// unjittered delay exactly and lets the backoff sequence be asserted verbatim.
const randomMidpoint = {
  nextDoubleUnsafe: () => 0.5,
  nextIntUnsafe: () => 0,
}

interface FakeState {
  snapshot: UcsExternalAppSnapshot
  /** Transport failures still to be served before calls start succeeding. */
  failures: number
  inflight: number
  maxInflight: number
}

// Scripted stand-in for any adapter: this suite tests the supervisor's state
// machine, never a concrete application integration.
function makeFake(appId: string) {
  const calls: { verb: string; at: number }[] = []
  const state: FakeState = {
    snapshot: { appId, state: "connected", health: "healthy", activeMode: "edit", updatedAt: 1_000 },
    failures: 0,
    inflight: 0,
    maxInflight: 0,
  }
  let progress: ((event: UcsExternalAppProgress) => void) | undefined

  const serve = <A>(verb: string, value: () => A) =>
    Effect.gen(function* () {
      calls.push({ verb, at: yield* Clock.currentTimeMillis })
      state.inflight += 1
      state.maxInflight = Math.max(state.maxInflight, state.inflight)
      state.inflight -= 1
      if (state.failures > 0) {
        state.failures -= 1
        return yield* new UcsExternalAppTransportError({ message: `${verb} unreachable` })
      }
      return value()
    })

  const adapter: UcsExternalAppAdapter = {
    appId,
    name: `${appId} fake`,
    connect: () => serve("connect", () => state.snapshot),
    status: () => serve("status", () => state.snapshot),
    capabilities: () =>
      serve("capabilities", () => ({ version: "1.0.0", actions: [], domainTags: [], checkpointSupported: false })),
    checkpoint: (label) => Effect.succeed({ _tag: "Unsupported" as const, reason: label }),
    blockedOnHuman: () => Effect.succeed(Option.none()),
    streamProgress: (onProgress) => {
      progress = onProgress
      return () => {
        progress = undefined
      }
    },
  }

  return {
    adapter,
    state,
    timesOf: (verb: string) => calls.filter((call) => call.verb === verb).map((call) => call.at),
    emitProgress: (event: UcsExternalAppProgress) => progress?.(event),
    subscribed: () => progress !== undefined,
  }
}

const advance = (seconds: number) =>
  Effect.gen(function* () {
    for (let elapsed = 0; elapsed < seconds; elapsed++) yield* TestClock.adjust("1 second")
  })

const deltas = (values: ReadonlyArray<number>) => values.slice(1).map((value, index) => value - values[index])

describe("control-plane.external-app.supervisor", () => {
  it.effect("retries the handshake on 1s..30s capped exponential backoff", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")
      yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: () => {} })

      yield* advance(5)
      // 1 status failure opens the reconnect loop, 7 connect failures follow.
      fake.state.failures = 8
      yield* advance(105)

      expect(deltas(fake.timesOf("connect"))).toEqual([1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000])
      expect(fake.state.maxInflight).toBe(1)
    }).pipe(Effect.provideService(Random.Random, randomMidpoint)),
  )

  it.effect("retains the last good snapshot with a frozen updatedAt while unreachable", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")
      const emitted: UcsExternalAppSnapshot[] = []
      yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: (snapshot) => emitted.push(snapshot) })

      yield* advance(5)
      expect(emitted).toEqual([{ appId: "unity", state: "connected", health: "healthy", activeMode: "edit", updatedAt: 1_000 }])

      // Long enough that the adapter is still unreachable at the end of the window.
      fake.state.failures = 20
      yield* advance(35)

      // Same snapshot identity and timestamp, only reachability reconciled, and
      // no repeated emission while the retry loop keeps failing.
      expect(emitted.length).toBe(2)
      expect(emitted[1]).toEqual({
        appId: "unity",
        state: "connected",
        health: "unreachable",
        activeMode: "edit",
        updatedAt: 1_000,
      })
    }).pipe(Effect.provideService(Random.Random, randomMidpoint)),
  )

  it.effect("re-runs connect then capabilities on reconnect and emits the fresh snapshot", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")
      const emitted: UcsExternalAppSnapshot[] = []
      yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: (snapshot) => emitted.push(snapshot) })

      yield* advance(5)
      fake.state.failures = 2
      fake.state.snapshot = { ...fake.state.snapshot, updatedAt: 9_000 }
      yield* advance(10)

      expect(fake.timesOf("connect")).toEqual([10_000, 11_000])
      expect(fake.timesOf("capabilities")).toEqual([11_000])
      expect(emitted.at(-1)).toEqual({
        appId: "unity",
        state: "connected",
        health: "healthy",
        activeMode: "edit",
        updatedAt: 9_000,
      })
    }).pipe(Effect.provideService(Random.Random, randomMidpoint)),
  )

  it.effect("runs exactly one probe per heartbeat across a reconnect cycle", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")
      yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: () => {} })

      yield* advance(5)
      fake.state.failures = 2
      yield* advance(11)

      // A leaked heartbeat loop would double up the probes after the reconnect.
      expect(fake.timesOf("status")).toEqual([5_000, 10_000, 16_000])
      yield* advance(5)
      expect(fake.timesOf("status")).toEqual([5_000, 10_000, 16_000, 21_000])
      expect(fake.state.maxInflight).toBe(1)
    }).pipe(Effect.provideService(Random.Random, randomMidpoint)),
  )

  it.effect("skips the heartbeat while streaming and resumes on the terminal tick", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")
      fake.state.snapshot = { ...fake.state.snapshot, state: "busy-streaming" }
      yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: () => {} })

      yield* advance(15)
      expect(fake.timesOf("status")).toEqual([5_000])

      fake.state.snapshot = { ...fake.state.snapshot, state: "connected" }
      fake.emitProgress({ sequence: 0, operationId: "build", message: "done", terminal: true })
      yield* advance(5)

      expect(fake.timesOf("status")).toEqual([5_000, 20_000])
    }),
  )

  it.effect("interrupts the supervisor fiber and unsubscribes when the scope closes", () =>
    Effect.gen(function* () {
      const fake = makeFake("unity")

      yield* Effect.scoped(
        Effect.gen(function* () {
          yield* ExternalAppSupervisor.start({ adapter: fake.adapter, emit: () => {} })
          yield* advance(5)
          expect(fake.subscribed()).toBe(true)
        }),
      )

      yield* advance(60)

      expect(fake.timesOf("status")).toEqual([5_000])
      expect(fake.subscribed()).toBe(false)
    }),
  )
})
