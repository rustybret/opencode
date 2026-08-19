import { Client, type ClientOptions } from "@modelcontextprotocol/sdk/client/index.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import {
  UcsExternalAppProtocolError,
  UcsExternalAppTimeoutError,
  UcsExternalAppTransportError,
} from "@ucs/contracts/external-app"
import { Effect } from "effect"

/**
 * Transport tier for the Unity SuperMCP bridge.
 *
 * This module owns the MCP wire only: handshake, headers, deadlines, and the
 * translation of SDK-level faults into the typed `@ucs/contracts` failure union.
 * It deliberately knows nothing about Unity vocabulary — normalizing a tool
 * payload into `UcsExternalAppSnapshot` and friends is `adapter.ts`'s job, which
 * is why `callTool` resolves to the raw MCP payload.
 */

export const UNITY_SUPERMCP_DEFAULT_URL = "http://127.0.0.1:27182/mcp"
export const UNITY_SUPERMCP_DEFAULT_TIMEOUT_MS = 30_000

const CLIENT_OPTIONS = {
  capabilities: {},
} satisfies ClientOptions

export interface UnityMcpClientConfig {
  /** Bridge endpoint. Defaults to the SuperMCP Streamable HTTP address. */
  readonly url?: string
  /** Extra request headers (auth tokens, instance pinning) forwarded on every call. */
  readonly headers?: Record<string, string>
  /** Per-request deadline in milliseconds; surfaces as `UcsExternalAppTimeoutError.timeoutMs`. */
  readonly timeoutMs?: number
  readonly clientName?: string
  readonly clientVersion?: string
  /**
   * Test seam. Supplying a factory bypasses Streamable HTTP entirely so fixtures
   * can drive an in-process `InMemoryTransport` without opening a socket.
   */
  readonly transport?: () => Transport
}

export type UnityMcpCallFailure = UcsExternalAppTransportError | UcsExternalAppTimeoutError | UcsExternalAppProtocolError

export interface UnityMcpClient {
  readonly url: string
  readonly timeoutMs: number
  readonly connect: () => Effect.Effect<void, UcsExternalAppTransportError | UcsExternalAppTimeoutError>
  /** Raw MCP tool payload; domain normalization belongs to the adapter tier. */
  readonly callTool: (name: string, args?: Record<string, unknown>) => Effect.Effect<unknown, UnityMcpCallFailure>
  readonly serverInfo: () => { readonly name: string; readonly version: string } | undefined
  readonly close: () => Effect.Effect<void>
}

export function createUnityMcpClient(config: UnityMcpClientConfig = {}): UnityMcpClient {
  const url = config.url ?? UNITY_SUPERMCP_DEFAULT_URL
  const timeoutMs = config.timeoutMs ?? UNITY_SUPERMCP_DEFAULT_TIMEOUT_MS
  const client = new Client(
    { name: config.clientName ?? "ucs-external-app-unity", version: config.clientVersion ?? "0.1.0" },
    CLIENT_OPTIONS,
  )

  const transport = () =>
    config.transport?.() ??
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: config.headers ? { headers: config.headers } : undefined,
    })

  const connect = () =>
    Effect.tryPromise({
      try: (signal) => client.connect(transport(), { signal }),
      catch: (error) =>
        new UcsExternalAppTransportError({
          message: `Unity SuperMCP handshake failed at ${url}`,
          cause: describe(error),
        }),
    }).pipe(
      Effect.timeoutOrElse({
        duration: timeoutMs,
        orElse: () =>
          Effect.fail(
            new UcsExternalAppTimeoutError({ message: `Unity SuperMCP handshake exceeded its deadline`, timeoutMs }),
          ),
      }),
    )

  const callTool = (name: string, args?: Record<string, unknown>) =>
    Effect.tryPromise({
      try: (signal) => client.callTool({ name, arguments: args ?? {} }, undefined, { signal }),
      catch: (error) =>
        new UcsExternalAppTransportError({
          message: `Unity SuperMCP tool call "${name}" failed`,
          cause: describe(error),
        }),
    }).pipe(
      Effect.timeoutOrElse({
        duration: timeoutMs,
        orElse: () =>
          Effect.fail(
            new UcsExternalAppTimeoutError({ message: `Unity SuperMCP tool call "${name}" timed out`, timeoutMs }),
          ),
      }),
      Effect.flatMap((result) => payload(name, result)),
    )

  return {
    url,
    timeoutMs,
    connect,
    callTool,
    serverInfo: () => client.getServerVersion(),
    close: () => Effect.tryPromise(() => client.close()).pipe(Effect.ignore),
  }
}

/**
 * Unwraps an MCP `CallToolResult` into the payload the adapter reasons about.
 * `structuredContent` wins when present; otherwise the first text block is
 * parsed as JSON, because SuperMCP encodes state reads that way. Anything else
 * — an error result, a non-JSON body, a shapeless response — is a protocol
 * violation rather than a transport fault.
 */
function payload(name: string, result: unknown): Effect.Effect<unknown, UcsExternalAppProtocolError> {
  if (typeof result !== "object" || result === null)
    return Effect.fail(
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP tool "${name}" returned a non-object result`,
        detail: describe(result),
      }),
    )

  const record = result as { isError?: unknown; structuredContent?: unknown; content?: unknown }
  const text = firstText(record.content)

  if (record.isError === true)
    return Effect.fail(
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP tool "${name}" reported an error result`,
        detail: text ?? describe(record.structuredContent),
      }),
    )

  if (record.structuredContent !== undefined) return Effect.succeed(record.structuredContent)

  if (text === undefined)
    return Effect.fail(
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP tool "${name}" returned neither structuredContent nor a text block`,
      }),
    )

  return Effect.try({
    try: () => JSON.parse(text) as unknown,
    catch: () =>
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP tool "${name}" returned a text block that is not JSON`,
        detail: text.slice(0, 200),
      }),
  })
}

function firstText(content: unknown) {
  if (!Array.isArray(content)) return undefined
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue
    const candidate = block as { type?: unknown; text?: unknown }
    if (candidate.type === "text" && typeof candidate.text === "string") return candidate.text
  }
  return undefined
}

function describe(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}
