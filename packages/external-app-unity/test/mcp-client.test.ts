import { describe, expect, test } from "bun:test"
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import {
  UcsExternalAppProtocolError,
  UcsExternalAppTimeoutError,
  UcsExternalAppTransportError,
} from "@ucs/contracts/external-app"
import { Effect } from "effect"
import { createUnityMcpClient, UNITY_SUPERMCP_DEFAULT_TIMEOUT_MS, UNITY_SUPERMCP_DEFAULT_URL } from "../src/mcp-client"
import { startBridge } from "./fixture"

/** Runs the effect exactly once — a second run would hit the SDK's one-transport-per-client guard. */
function failureOf<A, E>(effect: Effect.Effect<A, E>) {
  return Effect.runPromise(Effect.flip(effect))
}

describe("createUnityMcpClient", () => {
  test("defaults target the SuperMCP Streamable HTTP endpoint", () => {
    const client = createUnityMcpClient()
    expect(client.url).toBe(UNITY_SUPERMCP_DEFAULT_URL)
    expect(client.timeoutMs).toBe(UNITY_SUPERMCP_DEFAULT_TIMEOUT_MS)
  })

  test("connects in process and returns structuredContent verbatim", async () => {
    const bridge = startBridge({ bridge_status: () => ({ health: "healthy", modalCount: 0 }) })
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    expect(client.serverInfo()?.name).toBe("unity-supermcp-mock")

    const result = await Effect.runPromise(client.callTool("bridge_status"))
    expect(result).toEqual({ health: "healthy", modalCount: 0 })

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("forwards tool arguments to the bridge", async () => {
    let seen: Record<string, unknown> | undefined
    const bridge = startBridge({
      get_relevant_tools: (args) => {
        seen = args
        return { tools: [] }
      },
    })
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    await Effect.runPromise(client.callTool("get_relevant_tools", { query: "scene", limit: 4 }))
    expect(seen).toEqual({ query: "scene", limit: 4 })

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("falls back to parsing a JSON text block", async () => {
    const bridge = startBridge(
      { bridge_status: () => ({ content: [{ type: "text", text: JSON.stringify({ safeMode: true }) }] }) },
      { raw: true },
    )
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    expect(await Effect.runPromise(client.callTool("bridge_status"))).toEqual({ safeMode: true })

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("a non-JSON text block is a protocol error", async () => {
    const bridge = startBridge({ bridge_status: () => ({ content: [{ type: "text", text: "not json" }] }) }, { raw: true })
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    const failure = await failureOf(client.callTool("bridge_status"))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)
    expect(failure._tag).toBe("UcsExternalAppProtocolError")

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("a result with neither structuredContent nor text is a protocol error", async () => {
    const bridge = startBridge({ bridge_status: () => ({ content: [] }) }, { raw: true })
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    const failure = await failureOf(client.callTool("bridge_status"))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("an isError result is a protocol error carrying the detail", async () => {
    const bridge = startBridge(
      { checkpoint: () => ({ isError: true, content: [{ type: "text", text: "checkpoint unavailable" }] }) },
      { raw: true },
    )
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    const failure = await failureOf(client.callTool("checkpoint"))
    expect(failure).toBeInstanceOf(UcsExternalAppProtocolError)
    expect((failure as UcsExternalAppProtocolError).detail).toBe("checkpoint unavailable")

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("a refused transport becomes UcsExternalAppTransportError", async () => {
    const refusing: Transport = {
      start: () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:27182")),
      send: () => Promise.resolve(),
      close: () => Promise.resolve(),
    }
    const client = createUnityMcpClient({ transport: () => refusing })

    const failure = await failureOf(client.connect())
    expect(failure).toBeInstanceOf(UcsExternalAppTransportError)
    expect((failure as UcsExternalAppTransportError).cause).toContain("ECONNREFUSED")
  })

  test("a thrown tool handler becomes UcsExternalAppTransportError", async () => {
    const bridge = startBridge({
      bridge_status: () => {
        throw new Error("bridge pump stalled")
      },
    })
    const client = createUnityMcpClient({ transport: bridge.transport })

    await Effect.runPromise(client.connect())
    const failure = await failureOf(client.callTool("bridge_status"))
    expect(failure).toBeInstanceOf(UcsExternalAppTransportError)

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("a stalled call becomes UcsExternalAppTimeoutError carrying the real budget", async () => {
    const bridge = startBridge({ bridge_status: () => new Promise(() => {}) })
    const client = createUnityMcpClient({ transport: bridge.transport, timeoutMs: 40 })

    await Effect.runPromise(client.connect())
    const failure = await failureOf(client.callTool("bridge_status"))
    expect(failure).toBeInstanceOf(UcsExternalAppTimeoutError)
    expect((failure as UcsExternalAppTimeoutError).timeoutMs).toBe(40)

    await Effect.runPromise(client.close())
    await bridge.close()
  })

  test("close is idempotent and never fails", async () => {
    const client = createUnityMcpClient()
    await Effect.runPromise(client.close())
    await Effect.runPromise(client.close())
  })
})
