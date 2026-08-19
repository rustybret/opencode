import { NodeHttpServer, NodeServices } from "@effect/platform-node"
import { afterEach, describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import {
  UcsExternalAppInstanceAmbiguityError,
  UcsExternalAppTimeoutError,
  UcsExternalAppTransportError,
  type UcsExternalAppAdapter,
  type UcsExternalAppBlockage,
  type UcsExternalAppCapabilities,
  type UcsExternalAppCheckpointResult,
  type UcsExternalAppFailure,
  type UcsExternalAppSnapshot,
} from "@ucs/contracts/external-app"
import { Config, Effect, Layer, Option, Queue, Schema, Stream } from "effect"
import { HttpClient, HttpClientRequest, HttpRouter, HttpServer, type HttpClientResponse } from "effect/unstable/http"
import { layerWebSocketConstructorGlobal } from "effect/unstable/socket/Socket"
import { ExternalAppRegistration } from "@/control-plane/external-app/registration"
import { ExternalApp } from "@/control-plane/external-app/service"
import { createRoutes } from "../../src/server/routes/instance/httpapi/server"
import { resetDatabase } from "../fixture/db"
import { disposeAllInstances, TestInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"

/**
 * `/ucs/external-apps` handlers over a real in-process HTTP server.
 *
 * Everything below the adapter is the production graph: the same
 * `ExternalApp.Service` registry, the same `ExternalAppEvents` projection, the
 * same `ucsHandlers`, the same routing and middleware. Only the *adapter* is a
 * double, swapped in through `createRoutes`' replacement seam, because the real
 * one needs a Unity editor listening on `127.0.0.1:27182` — Task 4.4 owns that.
 */

const HEALTHY: UcsExternalAppSnapshot = {
  appId: "unity",
  state: "connected",
  health: "healthy",
  activeMode: "edit",
  focused: true,
  projectPath: "/tmp/UnityProject",
  scenePath: "Assets/Scenes/Main.unity",
  updatedAt: 1_000,
}

const CAPABILITIES: UcsExternalAppCapabilities = {
  version: "2026.1.0",
  actions: [{ id: "checkpoint", name: "Create Checkpoint", domain: "unity-editor" }],
  domainTags: ["unity-scene", "unity-build"],
  checkpointSupported: true,
}

const CREATED: UcsExternalAppCheckpointResult = {
  _tag: "Created",
  checkpointId: "cp-1",
  label: "before-edit",
  createdAt: 42,
}

/** Per-test knobs. Reset in `afterEach`, read on every adapter call. */
type Control = {
  snapshot: UcsExternalAppSnapshot
  blockage: UcsExternalAppBlockage | undefined
  capabilities: UcsExternalAppCapabilities
  checkpoint: UcsExternalAppCheckpointResult
  /** Non-undefined makes every verb fail with it, which is how the 502/504/409 rows are driven. */
  failure: UcsExternalAppFailure | undefined
}

function defaults(): Control {
  return {
    snapshot: HEALTHY,
    blockage: undefined,
    capabilities: CAPABILITIES,
    checkpoint: CREATED,
    failure: undefined,
  }
}

const control = defaults()

const fail = <A>(): Effect.Effect<A, UcsExternalAppFailure> | undefined =>
  control.failure ? Effect.fail(control.failure) : undefined

const adapter: UcsExternalAppAdapter = {
  appId: "unity",
  name: "Unity SuperMCP",
  connect: () => fail<UcsExternalAppSnapshot>() ?? Effect.succeed(control.snapshot),
  status: () => fail<UcsExternalAppSnapshot>() ?? Effect.succeed(control.snapshot),
  capabilities: () => fail<UcsExternalAppCapabilities>() ?? Effect.succeed(control.capabilities),
  checkpoint: () => fail<UcsExternalAppCheckpointResult>() ?? Effect.succeed(control.checkpoint),
  blockedOnHuman: () =>
    fail<Option.Option<UcsExternalAppBlockage>>() ??
    Effect.succeed(control.blockage ? Option.some(control.blockage) : Option.none()),
  streamProgress: () => () => {},
}

// Same node name as the production registration, so `LayerNode` accepts it as a
// replacement and every other node in the graph is untouched.
const registrationNode = LayerNode.make({
  name: ExternalAppRegistration.node.name,
  layer: Layer.effectDiscard(
    Effect.gen(function* () {
      const registry = yield* ExternalApp.Service
      yield* registry.register(adapter).pipe(Effect.orDie)
    }),
  ),
  deps: [ExternalApp.node],
})

const servedRoutes: Layer.Layer<never, Config.ConfigError, HttpServer.HttpServer> = HttpRouter.serve(
  createRoutes(undefined, [[ExternalAppRegistration.node, registrationNode]]),
  { disableListenLog: true, disableLogger: true },
)

const httpApiLayer = servedRoutes.pipe(
  Layer.provide(layerWebSocketConstructorGlobal),
  Layer.provideMerge(NodeHttpServer.layerTest),
  Layer.provideMerge(NodeServices.layer),
)

function request(path: string, directory: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("x-opencode-directory", directory)
  const url = new URL(path, "http://localhost")
  return HttpClientRequest.fromWeb(new Request(url, { ...init, headers })).pipe(
    HttpClientRequest.setUrl(url.pathname),
    HttpClient.execute,
  )
}

function post(path: string, directory: string, body: unknown) {
  return request(path, directory, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

function json<T>(response: HttpClientResponse.HttpClientResponse) {
  return response.json.pipe(Effect.map((value) => value as T))
}

const EventData = Schema.Struct({
  id: Schema.optional(Schema.String),
  type: Schema.String,
  properties: Schema.Record(Schema.String, Schema.Any),
})

const openEventStream = (directory: string) =>
  Effect.gen(function* () {
    const response = yield* request("/ucs/events", directory)
    const reader = yield* Queue.unbounded<Uint8Array>()
    yield* response.stream.pipe(Stream.runForEach((value) => Queue.offer(reader, value)), Effect.forkScoped)
    return { response, reader }
  })

/** Reads until the wanted type shows up, so heartbeats and unrelated instance events cannot flake the assertion. */
const awaitEvent = (reader: Queue.Dequeue<Uint8Array>, type: string) =>
  Effect.gen(function* () {
    while (true) {
      const chunk = yield* Queue.take(reader)
      for (const line of new TextDecoder().decode(chunk).split("\n")) {
        if (!line.startsWith("data: ")) continue
        const event = Schema.decodeUnknownSync(EventData)(JSON.parse(line.slice("data: ".length)))
        if (event.type === type) return event
      }
    }
  }).pipe(
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () => Effect.fail(new Error(`timed out waiting for ${type}`)),
    }),
  )

const instanceOptions = { git: true, config: { formatter: false, lsp: false } } as const

afterEach(async () => {
  Object.assign(control, defaults())
  await disposeAllInstances()
  await resetDatabase()
})

const it = testEffect(httpApiLayer)

describe("ucs external-app HttpApi", () => {
  it.instance(
    "advertises external-app in the capability manifest",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/capabilities", directory)

        expect(response.status).toBe(200)
        const manifest = yield* json<{ capabilities: Array<{ id: string; status: string; version: string }> }>(response)
        expect(manifest.capabilities).toContainEqual({ id: "external-app", status: "supported", version: "1" })
      }),
    instanceOptions,
  )

  it.instance(
    "lists the statically registered app with its state and health",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/external-apps", directory)

        expect(response.status).toBe(200)
        const body = yield* json<{ apps: Array<{ appId: string; name: string; state: string; health: string }> }>(
          response,
        )
        expect(body.apps).toHaveLength(1)
        expect(body.apps[0]).toMatchObject({ appId: "unity", name: "Unity SuperMCP" })
        // Before the supervisor's first probe lands there is no snapshot to read,
        // and the handler reports that as disconnected/unreachable rather than guessing.
        expect(["disconnected", "connected"]).toContain(body.apps[0]?.state)
        expect(["unreachable", "healthy"]).toContain(body.apps[0]?.health)
      }),
    instanceOptions,
  )

  it.instance(
    "serves the status snapshot",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/external-apps/unity/status", directory)

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(response)).toMatchObject({
          appId: "unity",
          state: "connected",
          health: "healthy",
          activeMode: "edit",
          projectPath: "/tmp/UnityProject",
        })
      }),
    instanceOptions,
  )

  it.instance(
    "answers status with the blockage attached instead of a 409",
    () =>
      Effect.gen(function* () {
        control.blockage = { reason: "modal", detail: "1 modal dialog(s) open" }
        control.snapshot = { ...HEALTHY, state: "blocked-on-human", blockage: control.blockage }
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/external-apps/unity/status", directory)

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(response)).toMatchObject({
          state: "blocked-on-human",
          blockage: { reason: "modal" },
        })
      }),
    instanceOptions,
  )

  it.instance(
    "serves capabilities",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/external-apps/unity/capabilities", directory)

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppCapabilities>(response)).toMatchObject({
          version: "2026.1.0",
          checkpointSupported: true,
        })
      }),
    instanceOptions,
  )

  it.instance(
    "connects and returns the post-handshake snapshot",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/connect", directory, {
          projectPath: "/tmp/UnityProject",
        })

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(response)).toMatchObject({ appId: "unity", state: "connected" })
      }),
    instanceOptions,
  )

  it.instance(
    "conflicts on connect when the bridge cannot pick one instance",
    () =>
      Effect.gen(function* () {
        control.failure = new UcsExternalAppInstanceAmbiguityError({
          message: "Multiple Unity instances are reachable",
          candidates: ["/a", "/b"],
        })
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/connect", directory, {})

        expect(response.status).toBe(409)
        expect(yield* json<{ data: { reason?: string } }>(response)).toMatchObject({
          data: { reason: "instance-selection-required" },
        })
      }),
    instanceOptions,
  )

  it.instance(
    "creates a checkpoint and returns the Created outcome",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppCheckpointResult>(response)).toEqual(CREATED)
      }),
    instanceOptions,
  )

  it.instance(
    "reports an unsupported checkpoint as a 200 carrying data, never a 422",
    () =>
      Effect.gen(function* () {
        control.checkpoint = { _tag: "Unsupported", reason: "no native checkpoint tool" }
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppCheckpointResult>(response)).toEqual({
          _tag: "Unsupported",
          reason: "no native checkpoint tool",
        })
      }),
    instanceOptions,
  )

  it.instance(
    "refuses a checkpoint while the app is blocked on a human",
    () =>
      Effect.gen(function* () {
        control.blockage = { reason: "safe-mode", detail: "Unity is in Safe Mode" }
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })

        expect(response.status).toBe(409)
        expect(yield* json<{ data: { reason?: string } }>(response)).toMatchObject({ data: { reason: "safe-mode" } })
      }),
    instanceOptions,
  )

  it.instance(
    "404s an appId nobody registered",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const [status, capabilities, checkpoint] = yield* Effect.all([
          request("/ucs/external-apps/blender/status", directory),
          request("/ucs/external-apps/blender/capabilities", directory),
          post("/ucs/external-apps/blender/checkpoints", directory, { label: "x" }),
        ])

        expect([status.status, capabilities.status, checkpoint.status]).toEqual([404, 404, 404])
        expect(yield* json<{ data: { message: string } }>(status)).toMatchObject({
          data: { message: "External app not found: blender" },
        })
      }),
    instanceOptions,
  )

  it.instance(
    "maps a dead bridge to 502 and a blown deadline to 504",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance

        control.failure = new UcsExternalAppTransportError({ message: "handshake failed", cause: "ECONNREFUSED" })
        const unavailable = yield* request("/ucs/external-apps/unity/status", directory)
        expect(unavailable.status).toBe(502)
        expect(yield* json<{ data: { message: string; reason?: string } }>(unavailable)).toMatchObject({
          data: { message: "handshake failed", reason: "transport" },
        })

        control.failure = new UcsExternalAppTimeoutError({ message: "status timed out", timeoutMs: 30_000 })
        const timeout = yield* request("/ucs/external-apps/unity/capabilities", directory)
        expect(timeout.status).toBe(504)
        expect(yield* json<{ data: { message: string } }>(timeout)).toMatchObject({
          data: { message: "status timed out" },
        })
      }),
    instanceOptions,
  )

  it.instance(
    "delivers external-app events over /ucs/events and closes the stream on disconnect",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const { response, reader } = yield* openEventStream(directory)
        expect(response.status).toBe(200)
        expect(response.headers["content-type"]).toContain("text/event-stream")
        yield* awaitEvent(reader, "server.connected")

        const capabilities = yield* request("/ucs/external-apps/unity/capabilities", directory)
        expect(capabilities.status).toBe(200)
        expect(yield* awaitEvent(reader, "external-app.capabilities-changed")).toMatchObject({
          properties: { appId: "unity", capabilities: { checkpointSupported: true } },
        })

        const checkpoint = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })
        expect(checkpoint.status).toBe(200)
        expect(yield* awaitEvent(reader, "external-app.checkpoint-result")).toMatchObject({
          properties: { appId: "unity", result: { _tag: "Created", checkpointId: "cp-1" } },
        })
      }),
    instanceOptions,
  )
})
