import { describe, expect, test } from "bun:test"
import { Option, Schema } from "effect"
import {
  UcsExternalAppBlockage,
  UcsExternalAppBlockageReason,
  UcsExternalAppCapabilities,
  UcsExternalAppCheckpointResult,
  UcsExternalAppConnectParams,
  UcsExternalAppHealth,
  UcsExternalAppInstanceAmbiguityError,
  UcsExternalAppMode,
  UcsExternalAppProgress,
  UcsExternalAppProtocolError,
  UcsExternalAppSnapshot,
  UcsExternalAppState,
  UcsExternalAppTimeoutError,
  UcsExternalAppTransportError,
  UcsExternalAppVerb,
} from "../src/external-app"
import type { UcsExternalAppFailure } from "../src/external-app"

const decodeVerb = Schema.decodeUnknownOption(UcsExternalAppVerb)
const decodeState = Schema.decodeUnknownOption(UcsExternalAppState)
const decodeHealth = Schema.decodeUnknownOption(UcsExternalAppHealth)
const decodeMode = Schema.decodeUnknownOption(UcsExternalAppMode)
const decodeBlockageReason = Schema.decodeUnknownOption(UcsExternalAppBlockageReason)

const decodeBlockage = Schema.decodeUnknownOption(UcsExternalAppBlockage)
const encodeBlockage = Schema.encodeSync(UcsExternalAppBlockage)

const decodeCapabilities = Schema.decodeUnknownOption(UcsExternalAppCapabilities)
const encodeCapabilities = Schema.encodeSync(UcsExternalAppCapabilities)

const decodeCheckpoint = Schema.decodeUnknownOption(UcsExternalAppCheckpointResult)
const encodeCheckpoint = Schema.encodeSync(UcsExternalAppCheckpointResult)

const decodeProgress = Schema.decodeUnknownOption(UcsExternalAppProgress)
const encodeProgress = Schema.encodeSync(UcsExternalAppProgress)

const decodeSnapshot = Schema.decodeUnknownOption(UcsExternalAppSnapshot)
const encodeSnapshot = Schema.encodeSync(UcsExternalAppSnapshot)

const decodeConnectParams = Schema.decodeUnknownOption(UcsExternalAppConnectParams)
const encodeConnectParams = Schema.encodeSync(UcsExternalAppConnectParams)

const decodeTransportError = Schema.decodeUnknownOption(UcsExternalAppTransportError)
const encodeTransportError = Schema.encodeSync(UcsExternalAppTransportError)

const decodeTimeoutError = Schema.decodeUnknownOption(UcsExternalAppTimeoutError)
const encodeTimeoutError = Schema.encodeSync(UcsExternalAppTimeoutError)

const decodeProtocolError = Schema.decodeUnknownOption(UcsExternalAppProtocolError)
const encodeProtocolError = Schema.encodeSync(UcsExternalAppProtocolError)

const decodeInstanceAmbiguityError = Schema.decodeUnknownOption(UcsExternalAppInstanceAmbiguityError)
const encodeInstanceAmbiguityError = Schema.encodeSync(UcsExternalAppInstanceAmbiguityError)

describe("UcsExternalAppVerb", () => {
  test("accepts exactly the 6 core verbs", () => {
    const verbs = ["connect", "status", "capabilities", "checkpoint", "blocked-on-human", "stream-progress"] as const
    for (const verb of verbs) expect(decodeVerb(verb)).toEqual(Option.some(verb))
  })

  test("rejects unknown verbs and non-string input", () => {
    expect(Option.isNone(decodeVerb("teleport"))).toBe(true)
    expect(Option.isNone(decodeVerb("Connect"))).toBe(true)
    expect(Option.isNone(decodeVerb(7))).toBe(true)
  })
})

describe("UcsExternalAppState", () => {
  test("accepts every lifecycle state", () => {
    const states = ["disconnected", "connecting", "connected", "blocked-on-human", "busy-streaming", "error"] as const
    for (const state of states) expect(decodeState(state)).toEqual(Option.some(state))
  })

  test("rejects malformed state strings", () => {
    expect(Option.isNone(decodeState("paused"))).toBe(true)
    expect(Option.isNone(decodeState("blocked_on_human"))).toBe(true)
    expect(Option.isNone(decodeState(""))).toBe(true)
  })
})

describe("UcsExternalAppHealth", () => {
  test("accepts every health value, orthogonal to state", () => {
    for (const health of ["healthy", "throttled", "stalled", "unreachable"] as const)
      expect(decodeHealth(health)).toEqual(Option.some(health))
  })

  test("rejects health values borrowed from the state vocabulary", () => {
    expect(Option.isNone(decodeHealth("degraded"))).toBe(true)
    expect(Option.isNone(decodeHealth("connected"))).toBe(true)
    expect(Option.isNone(decodeHealth(null))).toBe(true)
  })
})

describe("UcsExternalAppMode", () => {
  test("accepts every mode including the explicit unknown", () => {
    for (const mode of ["edit", "play", "unknown"] as const) expect(decodeMode(mode)).toEqual(Option.some(mode))
  })

  test("rejects modes outside the vocabulary", () => {
    expect(Option.isNone(decodeMode("record"))).toBe(true)
    expect(Option.isNone(decodeMode(undefined))).toBe(true)
  })
})

describe("UcsExternalAppBlockageReason", () => {
  test("accepts every blockage reason", () => {
    const reasons = [
      "modal",
      "safe-mode",
      "compile-errors-require-human",
      "editor-focus-required",
      "instance-selection-required",
    ] as const
    for (const reason of reasons) expect(decodeBlockageReason(reason)).toEqual(Option.some(reason))
  })

  test("rejects free-form reasons", () => {
    expect(Option.isNone(decodeBlockageReason("network"))).toBe(true)
    expect(Option.isNone(decodeBlockageReason("safe mode"))).toBe(true)
  })
})

describe("UcsExternalAppBlockage", () => {
  test("round-trips with and without detail", () => {
    const withDetail = { reason: "modal", detail: "Import settings dialog is open" } as const
    expect(encodeBlockage(Option.getOrThrow(decodeBlockage(withDetail)))).toEqual(withDetail)

    const withoutDetail = { reason: "instance-selection-required" } as const
    const decoded = Option.getOrThrow(decodeBlockage(withoutDetail))
    expect(decoded.detail).toBeUndefined()
    expect(encodeBlockage(decoded)).toEqual(withoutDetail)
  })

  test("rejects an invalid reason, a missing reason, and a non-string detail", () => {
    expect(Option.isNone(decodeBlockage({ reason: "network" }))).toBe(true)
    expect(Option.isNone(decodeBlockage({ detail: "no reason given" }))).toBe(true)
    expect(Option.isNone(decodeBlockage({ reason: "modal", detail: 12 }))).toBe(true)
  })
})

describe("UcsExternalAppCapabilities", () => {
  const manifest = {
    version: "1.4.0",
    actions: [
      { id: "scene.open", name: "Open Scene", domain: "unity-scene" },
      { id: "build.player", name: "Build Player", domain: "unity-build" },
    ],
    domainTags: ["unity-scene", "unity-script-roslyn", "unity-build"],
    checkpointSupported: true,
  }

  test("round-trips a full manifest", () => {
    expect(encodeCapabilities(Option.getOrThrow(decodeCapabilities(manifest)))).toEqual(manifest)
  })

  test("stays adapter-agnostic: domain tags are open strings, not a closed Unity enum", () => {
    const godot = {
      version: "0.1.0",
      actions: [{ id: "node.add", name: "Add Node", domain: "godot-scene" }],
      domainTags: ["godot-scene", "figma-frame", "blender-mesh"],
      checkpointSupported: false,
    }
    expect(encodeCapabilities(Option.getOrThrow(decodeCapabilities(godot)))).toEqual(godot)
  })

  test("rejects a missing checkpointSupported flag and a malformed action", () => {
    expect(Option.isNone(decodeCapabilities({ version: "1.0.0", actions: [], domainTags: [] }))).toBe(true)
    expect(
      Option.isNone(
        decodeCapabilities({
          version: "1.0.0",
          actions: [{ id: "scene.open", name: "Open Scene" }],
          domainTags: [],
          checkpointSupported: true,
        }),
      ),
    ).toBe(true)
    expect(
      Option.isNone(
        decodeCapabilities({ version: "1.0.0", actions: [], domainTags: "unity-scene", checkpointSupported: true }),
      ),
    ).toBe(true)
  })
})

describe("UcsExternalAppCheckpointResult", () => {
  test("round-trips the Created member", () => {
    const created = {
      _tag: "Created",
      checkpointId: "cp_01",
      label: "before destructive edit",
      createdAt: 1_760_000,
    } as const
    expect(encodeCheckpoint(Option.getOrThrow(decodeCheckpoint(created)))).toEqual(created)
  })

  test("round-trips the Unsupported member: absent native checkpoint is data, never a silent substitution", () => {
    const unsupported = { _tag: "Unsupported", reason: "bridge exposes no native checkpoint tool" } as const
    const decoded = Option.getOrThrow(decodeCheckpoint(unsupported))
    expect(decoded._tag).toBe("Unsupported")
    expect(decoded).not.toBeInstanceOf(Error)
    expect(encodeCheckpoint(decoded)).toEqual(unsupported)
  })

  test("rejects a Created payload missing checkpointId", () => {
    expect(Option.isNone(decodeCheckpoint({ _tag: "Created", label: "no id", createdAt: 1 }))).toBe(true)
  })

  test("rejects an untagged payload and an unknown tag", () => {
    expect(Option.isNone(decodeCheckpoint({ checkpointId: "cp_01", label: "x", createdAt: 1 }))).toBe(true)
    expect(Option.isNone(decodeCheckpoint({ _tag: "Skipped", reason: "why not" }))).toBe(true)
  })

  test("rejects an Unsupported payload carrying Created fields but no reason", () => {
    expect(Option.isNone(decodeCheckpoint({ _tag: "Unsupported", checkpointId: "cp_01" }))).toBe(true)
  })
})

describe("UcsExternalAppProgress", () => {
  test("round-trips a tick that reports a real fraction", () => {
    const tick = { sequence: 3, operationId: "compile_01", progress: 0.42, message: "compiling", terminal: false }
    expect(encodeProgress(Option.getOrThrow(decodeProgress(tick)))).toEqual(tick)
  })

  test("round-trips a terminal tick with no fraction: progress is never fabricated", () => {
    const terminal = { sequence: 9, operationId: "compile_01", message: "compile succeeded", terminal: true }
    const decoded = Option.getOrThrow(decodeProgress(terminal))
    expect(decoded.progress).toBeUndefined()
    expect(encodeProgress(decoded)).toEqual(terminal)
  })

  test("rejects a non-monotonic-capable sequence: negative, fractional, NaN, or infinite", () => {
    const base = { operationId: "compile_01", message: "compiling", terminal: false }
    expect(Option.isNone(decodeProgress({ ...base, sequence: -1 }))).toBe(true)
    expect(Option.isNone(decodeProgress({ ...base, sequence: 1.5 }))).toBe(true)
    expect(Option.isNone(decodeProgress({ ...base, sequence: Number.NaN }))).toBe(true)
    expect(Option.isNone(decodeProgress({ ...base, sequence: Number.POSITIVE_INFINITY }))).toBe(true)
  })

  test("rejects a tick missing the terminal flag or the operation id", () => {
    expect(Option.isNone(decodeProgress({ sequence: 0, operationId: "compile_01", message: "compiling" }))).toBe(true)
    expect(Option.isNone(decodeProgress({ sequence: 0, message: "compiling", terminal: false }))).toBe(true)
  })
})

describe("UcsExternalAppSnapshot", () => {
  test("round-trips the minimal shape returned by connect", () => {
    const minimal = {
      appId: "unity",
      state: "connecting",
      health: "healthy",
      activeMode: "unknown",
      updatedAt: 1_760_000_000,
    } as const
    expect(encodeSnapshot(Option.getOrThrow(decodeSnapshot(minimal)))).toEqual(minimal)
  })

  test("round-trips the full superset shape returned by status", () => {
    const full = {
      appId: "unity",
      state: "blocked-on-human",
      health: "stalled",
      activeMode: "edit",
      focused: false,
      backgroundMode: true,
      lastHeartbeatAgeMs: 7_500,
      modalCount: 1,
      projectPath: "/Volumes/Work/MyGame",
      scenePath: "Assets/Scenes/Main.unity",
      blockage: { reason: "modal", detail: "Safe Mode prompt" },
      updatedAt: 1_760_000_042,
    } as const
    expect(encodeSnapshot(Option.getOrThrow(decodeSnapshot(full)))).toEqual(full)
  })

  test("keeps state, health, and mode orthogonal", () => {
    const decoded = Option.getOrThrow(
      decodeSnapshot({
        appId: "unity",
        state: "connected",
        health: "throttled",
        activeMode: "play",
        updatedAt: 1,
      }),
    )
    expect(decoded.state).toBe("connected")
    expect(decoded.health).toBe("throttled")
    expect(decoded.activeMode).toBe("play")
  })

  test("rejects a malformed state string", () => {
    expect(
      Option.isNone(
        decodeSnapshot({ appId: "unity", state: "paused", health: "healthy", activeMode: "edit", updatedAt: 1 }),
      ),
    ).toBe(true)
  })

  test("rejects an invalid health enum value", () => {
    expect(
      Option.isNone(
        decodeSnapshot({ appId: "unity", state: "connected", health: "degraded", activeMode: "edit", updatedAt: 1 }),
      ),
    ).toBe(true)
  })

  test("rejects a missing required field and a malformed nested blockage", () => {
    expect(
      Option.isNone(decodeSnapshot({ appId: "unity", state: "connected", health: "healthy", activeMode: "edit" })),
    ).toBe(true)
    expect(
      Option.isNone(
        decodeSnapshot({
          appId: "unity",
          state: "blocked-on-human",
          health: "healthy",
          activeMode: "edit",
          blockage: { reason: "network" },
          updatedAt: 1,
        }),
      ),
    ).toBe(true)
  })
})

describe("UcsExternalAppConnectParams", () => {
  test("round-trips with and without a project path", () => {
    const scoped = { projectPath: "/Volumes/Work/MyGame" }
    expect(encodeConnectParams(Option.getOrThrow(decodeConnectParams(scoped)))).toEqual(scoped)
    expect(encodeConnectParams(Option.getOrThrow(decodeConnectParams({})))).toEqual({})
  })

  test("rejects a non-string project path", () => {
    expect(Option.isNone(decodeConnectParams({ projectPath: 42 }))).toBe(true)
  })
})

describe("UcsExternalApp typed failures", () => {
  test("UcsExternalAppTransportError round-trips with and without a cause", () => {
    const withCause = {
      _tag: "UcsExternalAppTransportError",
      message: "connection refused",
      cause: "ECONNREFUSED",
    } as const
    expect(encodeTransportError(Option.getOrThrow(decodeTransportError(withCause)))).toEqual(withCause)

    const instance = new UcsExternalAppTransportError({ message: "connection refused" })
    expect(instance._tag).toBe("UcsExternalAppTransportError")
    expect(encodeTransportError(instance)).toEqual({
      _tag: "UcsExternalAppTransportError",
      message: "connection refused",
    })
  })

  test("UcsExternalAppTimeoutError round-trips and requires timeoutMs", () => {
    const encoded = { _tag: "UcsExternalAppTimeoutError", message: "bridge_status timed out", timeoutMs: 5_000 } as const
    expect(encodeTimeoutError(Option.getOrThrow(decodeTimeoutError(encoded)))).toEqual(encoded)
    expect(Option.isNone(decodeTimeoutError({ _tag: "UcsExternalAppTimeoutError", message: "timed out" }))).toBe(true)
  })

  test("UcsExternalAppProtocolError round-trips and rejects a non-string detail", () => {
    const encoded = {
      _tag: "UcsExternalAppProtocolError",
      message: "unexpected result shape",
      detail: "missing tools",
    } as const
    expect(encodeProtocolError(Option.getOrThrow(decodeProtocolError(encoded)))).toEqual(encoded)
    expect(
      Option.isNone(decodeProtocolError({ _tag: "UcsExternalAppProtocolError", message: "bad", detail: { a: 1 } })),
    ).toBe(true)
  })

  test("UcsExternalAppInstanceAmbiguityError carries the refused candidates", () => {
    const encoded = {
      _tag: "UcsExternalAppInstanceAmbiguityError",
      message: "multiple editors matched",
      candidates: ["http://127.0.0.1:27182/mcp", "http://127.0.0.1:27183/mcp"],
    } as const
    const decoded = Option.getOrThrow(decodeInstanceAmbiguityError(encoded))
    expect(decoded.candidates).toEqual(encoded.candidates)
    expect(encodeInstanceAmbiguityError(decoded)).toEqual(encoded)
    expect(
      Option.isNone(
        decodeInstanceAmbiguityError({ _tag: "UcsExternalAppInstanceAmbiguityError", message: "ambiguous" }),
      ),
    ).toBe(true)
  })

  test("every error is a yieldable Error and a member of UcsExternalAppFailure", () => {
    const failures: ReadonlyArray<UcsExternalAppFailure> = [
      new UcsExternalAppTransportError({ message: "connection refused" }),
      new UcsExternalAppTimeoutError({ message: "timed out", timeoutMs: 5_000 }),
      new UcsExternalAppProtocolError({ message: "unexpected result shape" }),
      new UcsExternalAppInstanceAmbiguityError({ message: "ambiguous", candidates: [] }),
    ]
    for (const failure of failures) expect(failure).toBeInstanceOf(Error)
    expect(failures.map((failure) => failure._tag)).toEqual([
      "UcsExternalAppTransportError",
      "UcsExternalAppTimeoutError",
      "UcsExternalAppProtocolError",
      "UcsExternalAppInstanceAmbiguityError",
    ])
  })

  test("missing checkpoint support is not a failure member: it is a checkpoint result", () => {
    const decoded = Option.getOrThrow(decodeCheckpoint({ _tag: "Unsupported", reason: "no native checkpoint tool" }))
    expect(decoded._tag).toBe("Unsupported")
    expect(decoded).not.toBeInstanceOf(Error)
  })
})
