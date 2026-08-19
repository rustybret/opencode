import { describe, expect, test } from "bun:test"
import {
  UcsExternalAppInstanceAmbiguityError,
  UcsExternalAppProtocolError,
  type UcsExternalAppProgress,
} from "@ucs/contracts/external-app"
import { Effect, Option } from "effect"
import { createUnitySuperMcpAdapter, UNITY_DOMAIN_TAGS, UNITY_TOOLS } from "../src/adapter"
import { type BridgeHandler, HEALTHY_STATUS, RELEVANT_TOOLS, startBridge } from "./fixture"

function adapterOn(handlers: Record<string, BridgeHandler>, pollIntervalMs = 5) {
  const bridge = startBridge(handlers)
  const adapter = createUnitySuperMcpAdapter({ transport: bridge.transport, pollIntervalMs, timeoutMs: 2_000 })
  return { adapter, close: bridge.close }
}

function statusOnly(overrides: Record<string, unknown> = {}) {
  return { [UNITY_TOOLS.status]: () => ({ ...HEALTHY_STATUS, ...overrides }) }
}

async function blockage(overrides: Record<string, unknown>) {
  const { adapter, close } = adapterOn(statusOnly(overrides))
  // Some blockages (instance ambiguity) legitimately fail the handshake first.
  await Effect.runPromise(Effect.ignore(adapter.connect()))
  const result = await Effect.runPromise(adapter.blockedOnHuman())
  await close()
  return result
}

describe("createUnitySuperMcpAdapter — identity", () => {
  test("exposes an appId and human name", () => {
    const adapter = createUnitySuperMcpAdapter()
    expect(adapter.appId).toBe("unity")
    expect(adapter.name).toBe("Unity")
  })

  test("identity is overridable per instance", () => {
    const adapter = createUnitySuperMcpAdapter({ appId: "unity-b", name: "Unity (secondary)" })
    expect(adapter.appId).toBe("unity-b")
    expect(adapter.name).toBe("Unity (secondary)")
  })
})

describe("connect", () => {
  test("handshakes and returns the initial snapshot", async () => {
    const { adapter, close } = adapterOn(statusOnly())
    const snapshot = await Effect.runPromise(adapter.connect())

    expect(snapshot.appId).toBe("unity")
    expect(snapshot.state).toBe("connected")
    expect(snapshot.health).toBe("healthy")
    expect(snapshot.activeMode).toBe("edit")
    expect(snapshot.projectPath).toBe("/Users/dev/UnityProject")
    expect(snapshot.scenePath).toBe("Assets/Scenes/Main.unity")
    expect(snapshot.blockage).toBeUndefined()
    expect(snapshot.updatedAt).toBeGreaterThan(0)

    await close()
  })

  test("accepts a matching projectPath", async () => {
    const { adapter, close } = adapterOn(statusOnly())
    const snapshot = await Effect.runPromise(adapter.connect({ projectPath: "/Users/dev/UnityProject" }))
    expect(snapshot.state).toBe("connected")
    await close()
  })

  test("refuses a projectPath the bridge does not serve", async () => {
    const { adapter, close } = adapterOn(statusOnly())
    const failure = await Effect.runPromise(Effect.flip(adapter.connect({ projectPath: "/Users/dev/Other" })))

    expect(failure).toBeInstanceOf(UcsExternalAppInstanceAmbiguityError)
    expect((failure as UcsExternalAppInstanceAmbiguityError).candidates).toEqual([
      "/Users/dev/Other",
      "/Users/dev/UnityProject",
    ])

    await close()
  })

  test("refuses to guess between several reachable instances", async () => {
    const { adapter, close } = adapterOn(statusOnly({ instances: ["/a/One", "/b/Two"], projectPath: undefined }))
    const failure = await Effect.runPromise(Effect.flip(adapter.connect()))

    expect(failure).toBeInstanceOf(UcsExternalAppInstanceAmbiguityError)
    expect((failure as UcsExternalAppInstanceAmbiguityError).candidates).toEqual(["/a/One", "/b/Two"])

    await close()
  })

  test("an unambiguous projectPath resolves a multi-instance bridge", async () => {
    const { adapter, close } = adapterOn(statusOnly({ instances: ["/a/One", "/b/Two"], projectPath: "/a/One" }))
    const snapshot = await Effect.runPromise(adapter.connect({ projectPath: "/a/One" }))
    expect(snapshot.state).toBe("connected")
    await close()
  })

  test("rejects an unsupported protocol version", async () => {
    const { adapter, close } = adapterOn(statusOnly({ protocolVersion: "1999-01-01" }))
    const failure = await Effect.runPromise(Effect.flip(adapter.connect()))

    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)
    expect((failure as UcsExternalAppProtocolError).detail).toBe("1999-01-01")

    await close()
  })

  test("a non-object bridge_status payload is a protocol error", async () => {
    const bridge = startBridge(
      { [UNITY_TOOLS.status]: () => ({ content: [{ type: "text", text: '"unity is fine, trust me"' }] }) },
      { raw: true },
    )
    const adapter = createUnitySuperMcpAdapter({ transport: bridge.transport })
    const failure = await Effect.runPromise(Effect.flip(adapter.connect()))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)
    await bridge.close()
  })
})

describe("status", () => {
  test("reports state, health and mode orthogonally", async () => {
    const { adapter, close } = adapterOn(statusOnly({ mode: "play", health: undefined, lastHeartbeatAgeMs: 9_000 }))
    await Effect.runPromise(adapter.connect())
    const snapshot = await Effect.runPromise(adapter.status())

    expect(snapshot.state).toBe("connected")
    expect(snapshot.health).toBe("throttled")
    expect(snapshot.activeMode).toBe("play")

    await close()
  })

  test("derives stalled health from a long heartbeat gap", async () => {
    const { adapter, close } = adapterOn(statusOnly({ health: undefined, lastHeartbeatAgeMs: 30_000 }))
    await Effect.runPromise(adapter.connect())
    expect((await Effect.runPromise(adapter.status())).health).toBe("stalled")
    await close()
  })

  test("honors a health value the bridge declares itself", async () => {
    const { adapter, close } = adapterOn(statusOnly({ health: "unreachable", lastHeartbeatAgeMs: 1 }))
    await Effect.runPromise(adapter.connect())
    expect((await Effect.runPromise(adapter.status())).health).toBe("unreachable")
    await close()
  })

  test("reports unknown mode rather than guessing", async () => {
    const { adapter, close } = adapterOn(statusOnly({ mode: undefined }))
    await Effect.runPromise(adapter.connect())
    expect((await Effect.runPromise(adapter.status())).activeMode).toBe("unknown")
    await close()
  })

  test("switches state to blocked-on-human and embeds the blockage", async () => {
    const { adapter, close } = adapterOn(statusOnly({ modalCount: 2 }))
    await Effect.runPromise(adapter.connect())
    const snapshot = await Effect.runPromise(adapter.status())

    expect(snapshot.state).toBe("blocked-on-human")
    expect(snapshot.modalCount).toBe(2)
    expect(snapshot.blockage?.reason).toBe("modal")

    await close()
  })
})

describe("blockedOnHuman", () => {
  test("returns None when the editor is clear", async () => {
    expect(Option.isNone(await blockage({}))).toBe(true)
  })

  test("an open modal reports reason modal", async () => {
    const result = await blockage({ modalCount: 1 })
    expect(Option.getOrThrow(result).reason).toBe("modal")
  })

  test("Safe Mode outranks the modal it renders", async () => {
    const result = await blockage({ safeMode: true, modalCount: 1 })
    expect(Option.getOrThrow(result).reason).toBe("safe-mode")
  })

  test("compile errors require a human", async () => {
    const result = await blockage({ compileErrorCount: 3 })
    const value = Option.getOrThrow(result)
    expect(value.reason).toBe("compile-errors-require-human")
    expect(value.detail).toContain("3")
  })

  test("multiple instances require a selection", async () => {
    const result = await blockage({ instances: ["/a/One", "/b/Two"] })
    expect(Option.getOrThrow(result).reason).toBe("instance-selection-required")
  })

  test("an unfocused editor requires focus, which the adapter never steals", async () => {
    const result = await blockage({ focused: false })
    const value = Option.getOrThrow(result)
    expect(value.reason).toBe("editor-focus-required")
    expect(value.detail).toContain("never steals")
  })
})

describe("capabilities", () => {
  test("issues a bounded get_relevant_tools query and never dumps the catalog", async () => {
    let seen: Record<string, unknown> | undefined
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: (args) => {
        seen = args
        return RELEVANT_TOOLS
      },
    })

    await Effect.runPromise(adapter.connect())
    const caps = await Effect.runPromise(adapter.capabilities())

    expect(typeof seen?.["query"]).toBe("string")
    expect(seen?.["limit"]).toBe(32)
    expect(caps.version).toBe("2026.1.0")
    expect(caps.actions).toHaveLength(6)
    expect(caps.checkpointSupported).toBe(true)

    await close()
  })

  test("tags every discovered action with a Unity domain", async () => {
    const { adapter, close } = adapterOn({ ...statusOnly(), [UNITY_TOOLS.relevantTools]: () => RELEVANT_TOOLS })
    await Effect.runPromise(adapter.connect())
    const caps = await Effect.runPromise(adapter.capabilities())

    expect(caps.actions.map((action) => action.domain)).toEqual([
      "unity-scene",
      "unity-script-roslyn",
      "unity-asset",
      "unity-build",
      "unity-runtime",
      "unity-editor",
    ])
    for (const tag of UNITY_DOMAIN_TAGS) expect(caps.domainTags).toContain(tag)

    await close()
  })

  test("prefers a domain the bridge declares over the inferred one", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: () => ({ tools: [{ id: "shader_warm", domain: "unity-shader" }] }),
    })
    await Effect.runPromise(adapter.connect())
    const caps = await Effect.runPromise(adapter.capabilities())

    expect(caps.actions[0]).toEqual({ id: "shader_warm", name: "shader_warm", domain: "unity-shader" })
    expect(caps.domainTags).toEqual([...UNITY_DOMAIN_TAGS, "unity-shader"])

    await close()
  })

  test("falls back to the MCP server version when the bridge omits one", async () => {
    const { adapter, close } = adapterOn({ ...statusOnly(), [UNITY_TOOLS.relevantTools]: () => ({ tools: [] }) })
    await Effect.runPromise(adapter.connect())
    expect((await Effect.runPromise(adapter.capabilities())).version).toBe("0.9.9")
    await close()
  })

  test("a missing tool list is a protocol error", async () => {
    const { adapter, close } = adapterOn({ ...statusOnly(), [UNITY_TOOLS.relevantTools]: () => ({ ok: true }) })
    await Effect.runPromise(adapter.connect())
    const failure = await Effect.runPromise(Effect.flip(adapter.capabilities()))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)
    await close()
  })
})

describe("checkpoint", () => {
  test("creates a native restore point", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: () => RELEVANT_TOOLS,
      [UNITY_TOOLS.checkpoint]: (args) => ({ checkpointId: "cp-1", label: args["label"], createdAt: 1_700_000_000 }),
    })

    await Effect.runPromise(adapter.connect())
    const result = await Effect.runPromise(adapter.checkpoint("before refactor"))

    expect(result).toEqual({
      _tag: "Created",
      checkpointId: "cp-1",
      label: "before refactor",
      createdAt: 1_700_000_000,
    })

    await close()
  })

  test("returns Unsupported — not a throw, not a substitute — when the bridge has no checkpoint tool", async () => {
    let checkpointCalls = 0
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: () => ({ tools: [{ id: "session_changes", name: "Session Changes" }] }),
      [UNITY_TOOLS.checkpoint]: () => {
        checkpointCalls = checkpointCalls + 1
        return { checkpointId: "never" }
      },
    })

    await Effect.runPromise(adapter.connect())
    const result = await Effect.runPromise(adapter.checkpoint("before refactor"))

    expect(result._tag).toBe("Unsupported")
    expect(checkpointCalls).toBe(0)

    await close()
  })

  test("honors an explicit checkpointSupported: false from the bridge", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: () => ({ ...RELEVANT_TOOLS, checkpointSupported: false }),
    })

    await Effect.runPromise(adapter.connect())
    expect((await Effect.runPromise(adapter.checkpoint("x")))._tag).toBe("Unsupported")

    await close()
  })

  test("a checkpoint result without an id is a protocol error", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.relevantTools]: () => RELEVANT_TOOLS,
      [UNITY_TOOLS.checkpoint]: () => ({ ok: true }),
    })

    await Effect.runPromise(adapter.connect())
    const failure = await Effect.runPromise(Effect.flip(adapter.checkpoint("x")))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)

    await close()
  })
})

describe("streamProgress", () => {
  function collect(adapter: ReturnType<typeof createUnitySuperMcpAdapter>) {
    const events: UcsExternalAppProgress[] = []
    return new Promise<UcsExternalAppProgress[]>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("stream never terminated")), 5_000)
      const unsubscribe = adapter.streamProgress((event) => {
        events.push(event)
        if (!event.terminal) return
        clearTimeout(timer)
        unsubscribe()
        resolve(events)
      })
    })
  }

  test("emits monotonic, deduplicated ticks ending in exactly one terminal event", async () => {
    let compileCall = 0
    let testCall = 0
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.compileStatus]: () => {
        compileCall = compileCall + 1
        if (compileCall <= 2)
          return {
            operationId: "compile-1",
            status: "compiling",
            compiling: true,
            message: "Compiling scripts",
            progress: 0.25,
          }
        if (compileCall === 3)
          return {
            operationId: "compile-1",
            status: "compiling",
            compiling: true,
            message: "Compiling scripts",
            progress: 0.75,
          }
        return { operationId: "compile-1", status: "done", compiling: false, message: "Compile finished" }
      },
      [UNITY_TOOLS.testRunResult]: () => {
        testCall = testCall + 1
        if (testCall === 1)
          return { operationId: "tests-1", status: "running", running: true, message: "Running tests" }
        return { operationId: "tests-1", status: "succeeded", running: false, message: "Tests passed" }
      },
    })

    await Effect.runPromise(adapter.connect())
    const events = await collect(adapter)

    expect(events.map((event) => event.sequence)).toEqual([0, 1, 2, 3])
    expect(events.filter((event) => event.terminal)).toHaveLength(1)
    expect(events[events.length - 1]?.terminal).toBe(true)
    expect(events[events.length - 1]?.message).toBe("Tests passed")

    // Identical consecutive reads (compile poll 1 and 2) collapse into one tick.
    expect(events[0]).toEqual({
      sequence: 0,
      operationId: "compile-1",
      message: "Compiling scripts",
      progress: 0.25,
      terminal: false,
    })
    expect(events[1]?.progress).toBe(0.75)
    expect(events[2]?.operationId).toBe("tests-1")

    for (let index = 1; index < events.length; index++)
      expect(events[index]!.sequence).toBeGreaterThan(events[index - 1]!.sequence)

    await close()
  })

  test("never fabricates a progress fraction the bridge did not supply", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.compileStatus]: () => ({ operationId: "compile-2", status: "done", message: "Compile finished" }),
      [UNITY_TOOLS.testRunResult]: () => ({ operationId: "compile-2", status: "idle", message: "No tests queued" }),
    })

    await Effect.runPromise(adapter.connect())
    const events = await collect(adapter)

    expect(events).toHaveLength(1)
    expect(events[0]?.terminal).toBe(true)
    expect(events[0]?.progress).toBeUndefined()

    await close()
  })

  test("a failing progress tool still terminates the stream instead of hanging", async () => {
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.compileStatus]: () => {
        throw new Error("compile pump unavailable")
      },
      [UNITY_TOOLS.testRunResult]: () => {
        throw new Error("test pump unavailable")
      },
    })

    await Effect.runPromise(adapter.connect())
    const events = await collect(adapter)

    expect(events).toHaveLength(1)
    expect(events[0]?.terminal).toBe(true)
    expect(events[0]?.operationId).toBe("unity-idle")

    await close()
  })

  test("unsubscribing before the terminal tick stops the poll loop", async () => {
    let calls = 0
    const { adapter, close } = adapterOn({
      ...statusOnly(),
      [UNITY_TOOLS.compileStatus]: () => {
        calls = calls + 1
        return { operationId: "compile-3", status: "compiling", compiling: true, message: `tick ${calls}` }
      },
      [UNITY_TOOLS.testRunResult]: () => ({ operationId: "compile-3", status: "running", running: true }),
    })

    await Effect.runPromise(adapter.connect())
    const unsubscribe = adapter.streamProgress(() => {})
    await new Promise((resolve) => setTimeout(resolve, 40))
    unsubscribe()
    const settled = calls
    await new Promise((resolve) => setTimeout(resolve, 40))

    expect(calls).toBe(settled)

    await close()
  })
})
