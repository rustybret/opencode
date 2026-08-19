import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

/**
 * In-process Unity SuperMCP bridge double.
 *
 * The real bridge at `127.0.0.1:27182/mcp` is unreachable during Wave 2 (Task 1.1
 * is blocked), so every test in this package drives an `InMemoryTransport` pair.
 * No socket is opened and no live editor is contacted.
 */

export type BridgeHandler = (args: Record<string, unknown>) => unknown

export interface BridgeOptions {
  /** Return the raw MCP `CallToolResult` verbatim instead of wrapping in `structuredContent`. */
  readonly raw?: boolean
  readonly serverVersion?: string
}

export function startBridge(handlers: Record<string, BridgeHandler>, options: BridgeOptions = {}) {
  const server = new Server(
    { name: "unity-supermcp-mock", version: options.serverVersion ?? "0.9.9" },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({
      tools: Object.keys(handlers).map((name) => ({ name, inputSchema: { type: "object" as const } })),
    }),
  )

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const handler = handlers[params.name]
    if (!handler) throw new Error(`mock bridge has no tool "${params.name}"`)
    const result = await handler(params.arguments ?? {})
    if (options.raw) return result as Record<string, unknown>
    return { content: [], structuredContent: result as Record<string, unknown> }
  })

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const ready = server.connect(serverTransport)

  return {
    transport: () => clientTransport,
    close: async () => {
      await ready
      await server.close()
    },
  }
}

/** A healthy, unblocked, edit-mode Unity instance. Spread and override per test. */
export const HEALTHY_STATUS = {
  protocolVersion: "2025-06-18",
  health: "healthy",
  mode: "edit",
  focused: true,
  backgroundMode: false,
  lastHeartbeatAgeMs: 120,
  modalCount: 0,
  projectPath: "/Users/dev/UnityProject",
  scenePath: "Assets/Scenes/Main.unity",
  safeMode: false,
  compileErrorCount: 0,
  instances: ["/Users/dev/UnityProject"],
}

/** A bounded `get_relevant_tools` answer, including the native `checkpoint` tool. */
export const RELEVANT_TOOLS = {
  version: "2026.1.0",
  tools: [
    { id: "scene_open", name: "Open Scene" },
    { id: "script_edit", name: "Edit C# Script" },
    { id: "asset_import", name: "Import Asset" },
    { id: "build_player", name: "Build Player" },
    { id: "play_mode_enter", name: "Enter Play Mode" },
    { id: "checkpoint", name: "Create Checkpoint" },
  ],
}
