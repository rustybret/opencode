// Rehearsal harness for `live-unity-e2e.ts`: a real Streamable HTTP Unity
// SuperMCP double, so the driver's full sequence can be exercised over a socket
// without a Unity Editor. Not a substitute for Task 4.4's live run — the tool
// names and payload shapes here are the adapter's *assumed* contract, which only
// a live bridge (Task 1.1's protocol lock) can confirm.
//
//   bun scripts/rehearsal-bridge.mjs &
//   UNITY_SUPERMCP_URL=http://127.0.0.1:27182/mcp bun run scripts/live-unity-e2e.ts
//
// REHEARSAL_BRIDGE_PORT overrides the port so it never collides with a real editor.
import { createServer } from "node:http"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

const port = Number(process.env["REHEARSAL_BRIDGE_PORT"] ?? 27182)
let compilePolls = 0

const TOOLS = {
  bridge_status: () => ({
    protocolVersion: "2025-06-18",
    health: "healthy",
    mode: "edit",
    focused: true,
    backgroundMode: false,
    lastHeartbeatAgeMs: 90,
    modalCount: 0,
    projectPath: "/Users/dev/UnityProject",
    scenePath: "Assets/Scenes/Main.unity",
    safeMode: false,
    compileErrorCount: 0,
    instances: ["/Users/dev/UnityProject"],
  }),
  get_relevant_tools: () => ({
    version: "2026.1.0",
    tools: [
      { id: "scene_open", name: "Open Scene" },
      { id: "script_edit", name: "Edit C# Script" },
      { id: "checkpoint", name: "Create Checkpoint" },
    ],
  }),
  checkpoint: (args) => ({ checkpointId: "cp-e2e-0001", label: args.label, createdAt: Date.now() }),
  compile_status: () => {
    compilePolls += 1
    if (compilePolls <= 2)
      return {
        operationId: "compile-1",
        status: "compiling",
        running: true,
        message: "Compiling scripts",
        progress: compilePolls === 1 ? 0.4 : 0.8,
      }
    return { operationId: "compile-1", status: "done", running: false, message: "Compile finished", progress: 1 }
  },
  test_run_result: () => ({ operationId: "compile-1", status: "idle", message: "no tests running" }),
  session_changes: () => ({ changes: [{ path: "Assets/Scenes/Main.unity", kind: "modified" }] }),
  script_edit: (args) => ({ ok: true, applied: args }),
}

function makeServer() {
  const server = new Server({ name: "unity-supermcp-mock-http", version: "2026.1.0" }, { capabilities: { tools: {} } })
  server.setRequestHandler(ListToolsRequestSchema, () =>
    Promise.resolve({ tools: Object.keys(TOOLS).map((name) => ({ name, inputSchema: { type: "object" } })) }),
  )
  server.setRequestHandler(CallToolRequestSchema, ({ params }) => {
    const handler = TOOLS[params.name]
    if (!handler) throw new Error(`mock bridge has no tool "${params.name}"`)
    return Promise.resolve({ content: [], structuredContent: handler(params.arguments ?? {}) })
  })
  return server
}

// One transport per MCP session, the SDK's documented Streamable HTTP pattern.
// The driver opens two sessions (adapter + raw evidence client), so a single
// shared stateless transport is not enough.
const sessions = {}

createServer((req, res) => {
  const chunks = []
  req.on("data", (chunk) => chunks.push(chunk))
  req.on("end", async () => {
    const raw = Buffer.concat(chunks).toString()
    const body = raw.length > 0 ? JSON.parse(raw) : undefined
    res.on("finish", () => console.log(`<- ${req.method} ${res.statusCode} :: ${raw.slice(0, 90)}`))

    const existing = sessions[req.headers["mcp-session-id"]]
    if (existing) return existing.handleRequest(req, res, body)

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (id) => {
        sessions[id] = transport
      },
    })
    await makeServer().connect(transport)
    await transport.handleRequest(req, res, body)
  })
}).listen(port, "127.0.0.1", () => console.log(`mock unity supermcp bridge listening on 127.0.0.1:${port}`))
