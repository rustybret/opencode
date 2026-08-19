import { NodeHttpServer, NodeServices } from "@effect/platform-node"
import { afterEach, describe, expect } from "bun:test"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import type {
  UcsExternalAppAdapter,
  UcsExternalAppBlockage,
  UcsExternalAppCapabilities,
  UcsExternalAppCheckpointResult,
  UcsExternalAppSnapshot,
} from "@ucs/contracts/external-app"
import { Config, ConfigProvider, Effect, Layer, Option, Queue, Schema, Stream } from "effect"
import { HttpClient, HttpClientRequest, HttpRouter, HttpServer, type HttpClientResponse } from "effect/unstable/http"
import { layerWebSocketConstructorGlobal } from "effect/unstable/socket/Socket"
import { ExternalAppRegistration } from "@/control-plane/external-app/registration"
import { ExternalApp } from "@/control-plane/external-app/service"
import { ServerAuth } from "@/server/auth"
import { createRoutes } from "../../src/server/routes/instance/httpapi/server"
import { resetDatabase } from "../fixture/db"
import { disposeAllInstances, TestInstance } from "../fixture/fixture"
import { testEffect } from "../lib/effect"

/**
 * Task 4.2: `/ucs/external-apps` and `/ucs/events` end to end over a real
 * in-process HTTP server.
 *
 * Where `ucs-external-app-handlers.test.ts` pins the handler-to-status mapping,
 * this file exercises the surface a client actually meets: the `Authorization`
 * middleware in front of every route, the round trip of each verb, and the SSE
 * stream carrying the events those verbs produce. Two server layers are built
 * from the same production `createRoutes` graph — one with no server password
 * and one with `OPENCODE_SERVER_PASSWORD` set — because auth is a property of
 * the composed server, not something a handler can be asked about in isolation.
 *
 * The adapter is the only double, swapped through `createRoutes`' replacement
 * seam: the real one needs a Unity editor on `127.0.0.1:27182`, which Task 4.4
 * owns.
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

/** Per-test knobs, reset in `afterEach` and read on every adapter call. */
type Control = {
  snapshot: UcsExternalAppSnapshot
  blockage: UcsExternalAppBlockage | undefined
  capabilities: UcsExternalAppCapabilities
  checkpoint: UcsExternalAppCheckpointResult
}

function defaults(): Control {
  return {
    snapshot: HEALTHY,
    blockage: undefined,
    capabilities: CAPABILITIES,
    checkpoint: CREATED,
  }
}

const control = defaults()

const adapter: UcsExternalAppAdapter = {
  appId: "unity",
  name: "Unity SuperMCP",
  connect: () => Effect.succeed(control.snapshot),
  status: () => Effect.succeed(control.snapshot),
  capabilities: () => Effect.succeed(control.capabilities),
  checkpoint: () => Effect.succeed(control.checkpoint),
  blockedOnHuman: () => Effect.succeed(control.blockage ? Option.some(control.blockage) : Option.none()),
  streamProgress: () => () => {},
}

// Same node name as the production registration, so `LayerNode` accepts it as a
// replacement and every other node in the server graph stays untouched.
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

const replacements = [[ExternalAppRegistration.node, registrationNode]] satisfies LayerNode.Replacements

const openRoutes: Layer.Layer<never, Config.ConfigError, HttpServer.HttpServer> = HttpRouter.serve(
  createRoutes(undefined, replacements),
  { disableListenLog: true, disableLogger: true },
)

// A whole ConfigProvider swap rather than `ServerAuth.Config.configLayer`:
// `createRoutes` provides `ServerAuth.Config.layer` internally, so the password
// can only be injected underneath it, through the config that layer reads.
const securedRoutes: Layer.Layer<never, Config.ConfigError, HttpServer.HttpServer> = HttpRouter.serve(
  createRoutes(undefined, replacements).pipe(
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({ OPENCODE_SERVER_PASSWORD: "secret", OPENCODE_SERVER_USERNAME: "opencode" }),
      ),
    ),
  ),
  { disableListenLog: true, disableLogger: true },
)

const platform = <A, E>(layer: Layer.Layer<A, E, HttpServer.HttpServer>) =>
  layer.pipe(
    Layer.provide(layerWebSocketConstructorGlobal),
    Layer.provideMerge(NodeHttpServer.layerTest),
    Layer.provideMerge(NodeServices.layer),
  )

function request(path: string, directory: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("x-opencode-directory", directory)
  const url = new URL(path, "http://localhost")
  return HttpClientRequest.fromWeb(new Request(url, { ...init, headers })).pipe(
    // Query has to survive: `auth_token` is how an EventSource authenticates.
    HttpClientRequest.setUrl(`${url.pathname}${url.search}`),
    HttpClient.execute,
  )
}

function post(path: string, directory: string, body: unknown, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set("content-type", "application/json")
  return request(path, directory, { ...init, method: "POST", headers, body: JSON.stringify(body) })
}

function json<T>(response: HttpClientResponse.HttpClientResponse) {
  return response.json.pipe(Effect.map((value) => value as T))
}

const basic = (username: string, password: string) => ServerAuth.header({ username, password }) ?? ""

// Derived from the same header the server parses, and deliberately not built with
// `Buffer.from`: pulling node's Buffer typings into this program makes @types/node's
// `EventEmitter` win over bun-types and breaks `src/bus/global.ts` under tsgo.
const authToken = (username: string, password: string) => basic(username, password).slice("Basic ".length)

const EventData = Schema.Struct({
  id: Schema.optional(Schema.String),
  type: Schema.String,
  properties: Schema.Record(Schema.String, Schema.Any),
})
type EventData = typeof EventData.Type

/**
 * SSE client that parses into a queue of *events*, not of chunks.
 *
 * A chunk boundary is not an event boundary: two events published back to back
 * routinely arrive in one write, and a reader that decodes a chunk and stops at
 * the first match silently drops whatever followed it in the same chunk. The
 * line buffer plus a per-event queue is what lets a test await two consecutive
 * events without racing the transport.
 */
const openEventStream = (directory: string, init: RequestInit = {}, path = "/ucs/events") =>
  Effect.gen(function* () {
    const response = yield* request(path, directory, init)
    const events = yield* Queue.unbounded<EventData>()
    const decoder = new TextDecoder()
    let pending = ""
    yield* response.stream.pipe(
      Stream.runForEach((chunk) =>
        Effect.sync(() => {
          pending += decoder.decode(chunk, { stream: true })
          const lines = pending.split("\n")
          pending = lines.pop() ?? ""
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            Queue.offerUnsafe(events, Schema.decodeUnknownSync(EventData)(JSON.parse(line.slice("data: ".length))))
          }
        }),
      ),
      Effect.forkScoped,
    )
    return { response, events }
  })

/** Skips heartbeats and unrelated instance events instead of asserting on stream position. */
const awaitEvent = (events: Queue.Dequeue<EventData>, type: string, duration: `${number} seconds` = "5 seconds") =>
  Effect.gen(function* () {
    while (true) {
      const event = yield* Queue.take(events)
      if (event.type === type) return event
    }
  }).pipe(
    Effect.timeoutOrElse({
      duration,
      orElse: () => Effect.fail(new Error(`timed out waiting for ${type}`)),
    }),
  )

const instanceOptions = { git: true, config: { formatter: false, lsp: false } } as const

/** Every `:appId` route, plus the list, in the order a client would discover them. */
const externalAppRoutes = (directory: string, init: RequestInit = {}) =>
  Effect.all([
    request("/ucs/external-apps", directory, init),
    post("/ucs/external-apps/unity/connect", directory, {}, init),
    request("/ucs/external-apps/unity/status", directory, init),
    request("/ucs/external-apps/unity/capabilities", directory, init),
    post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" }, init),
  ])

afterEach(async () => {
  Object.assign(control, defaults())
  await disposeAllInstances()
  await resetDatabase()
})

const it = testEffect(platform(openRoutes))
const itSecured = testEffect(platform(securedRoutes))

describe("ucs external-app authorization", () => {
  itSecured.instance(
    "rejects every external-app route and the event stream without credentials",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const responses = yield* externalAppRoutes(directory)
        const events = yield* request("/ucs/events", directory)

        expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401, 401])
        for (const response of responses) expect(response.headers["www-authenticate"] ?? "").toContain("Basic")
        expect(events.status).toBe(401)
      }),
    instanceOptions,
  )

  itSecured.instance(
    "rejects the wrong password and the wrong username",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const [badPassword, badUser] = yield* Effect.all([
          request("/ucs/external-apps", directory, { headers: { authorization: basic("opencode", "wrong") } }),
          request("/ucs/external-apps", directory, { headers: { authorization: basic("intruder", "secret") } }),
        ])

        expect([badPassword.status, badUser.status]).toEqual([401, 401])
      }),
    instanceOptions,
  )

  itSecured.instance(
    "serves every external-app route once basic credentials are supplied",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const init = { headers: { authorization: basic("opencode", "secret") } }
        const [list, connect, status, capabilities, checkpoint] = yield* externalAppRoutes(directory, init)

        expect([list.status, connect.status, status.status, capabilities.status, checkpoint.status]).toEqual([
          200, 200, 200, 200, 200,
        ])
        expect(yield* json<{ apps: Array<{ appId: string }> }>(list)).toMatchObject({ apps: [{ appId: "unity" }] })
        expect(yield* json<UcsExternalAppSnapshot>(status)).toMatchObject({ appId: "unity", state: "connected" })
        expect(yield* json<UcsExternalAppCheckpointResult>(checkpoint)).toEqual(CREATED)
      }),
    instanceOptions,
  )

  itSecured.instance(
    "authorizes the event stream through the auth_token query an EventSource can send",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const token = encodeURIComponent(authToken("opencode", "secret"))
        const { response, events } = yield* openEventStream(directory, {}, `/ucs/events?auth_token=${token}`)

        expect(response.status).toBe(200)
        expect(response.headers["content-type"]).toContain("text/event-stream")
        yield* awaitEvent(events, "server.connected")
      }),
    instanceOptions,
  )
})

describe("ucs external-app routes", () => {
  it.instance(
    "lists the registered app with its registration status",
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
        // A registered app with no completed probe yet reports disconnected/unreachable
        // rather than guessing; after the first heartbeat it reports the real snapshot.
        expect(["disconnected", "connected"]).toContain(body.apps[0]?.state)
        expect(["unreachable", "healthy"]).toContain(body.apps[0]?.health)
      }),
    instanceOptions,
  )

  it.instance(
    "returns the post-handshake snapshot from connect",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/connect", directory, {
          projectPath: "/tmp/UnityProject",
        })

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(response)).toMatchObject({
          appId: "unity",
          state: "connected",
          health: "healthy",
          projectPath: "/tmp/UnityProject",
        })
      }),
    instanceOptions,
  )

  it.instance(
    "conflicts on connect when the handshake lands on an app blocked on a human",
    () =>
      Effect.gen(function* () {
        control.snapshot = {
          ...HEALTHY,
          state: "blocked-on-human",
          blockage: { reason: "safe-mode", detail: "Unity is in Safe Mode" },
        }
        const { directory } = yield* TestInstance
        const response = yield* post("/ucs/external-apps/unity/connect", directory, {})

        expect(response.status).toBe(409)
        expect(yield* json<{ data: { reason?: string } }>(response)).toMatchObject({ data: { reason: "safe-mode" } })
      }),
    instanceOptions,
  )

  it.instance(
    "serves the status snapshot, blockage included",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const healthy = yield* request("/ucs/external-apps/unity/status", directory)

        expect(healthy.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(healthy)).toMatchObject({
          appId: "unity",
          state: "connected",
          health: "healthy",
          activeMode: "edit",
          scenePath: "Assets/Scenes/Main.unity",
        })

        control.snapshot = { ...HEALTHY, state: "blocked-on-human", blockage: { reason: "modal", detail: "1 modal" } }
        const blocked = yield* request("/ucs/external-apps/unity/status", directory)

        // Discovering the blockage is the point of this endpoint, so it is a 200.
        expect(blocked.status).toBe(200)
        expect(yield* json<UcsExternalAppSnapshot>(blocked)).toMatchObject({
          state: "blocked-on-human",
          blockage: { reason: "modal" },
        })
      }),
    instanceOptions,
  )

  it.instance(
    "serves the advertised capabilities",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const response = yield* request("/ucs/external-apps/unity/capabilities", directory)

        expect(response.status).toBe(200)
        expect(yield* json<UcsExternalAppCapabilities>(response)).toEqual(CAPABILITIES)
      }),
    instanceOptions,
  )

  it.instance(
    "creates a restore point, and reports missing support as a 200 carrying data",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const created = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })

        expect(created.status).toBe(200)
        expect(yield* json<UcsExternalAppCheckpointResult>(created)).toEqual(CREATED)

        control.checkpoint = { _tag: "Unsupported", reason: "no native checkpoint tool" }
        const unsupported = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })

        // Never a 422: no native restore point means no substitute is taken.
        expect(unsupported.status).toBe(200)
        expect(yield* json<UcsExternalAppCheckpointResult>(unsupported)).toEqual({
          _tag: "Unsupported",
          reason: "no native checkpoint tool",
        })
      }),
    instanceOptions,
  )

  it.instance(
    "404s every :appId route for an app nobody registered",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const [connect, status, capabilities, checkpoint] = yield* Effect.all([
          post("/ucs/external-apps/blender/connect", directory, {}),
          request("/ucs/external-apps/blender/status", directory),
          request("/ucs/external-apps/blender/capabilities", directory),
          post("/ucs/external-apps/blender/checkpoints", directory, { label: "x" }),
        ])

        expect([connect.status, status.status, capabilities.status, checkpoint.status]).toEqual([404, 404, 404, 404])
        expect(yield* json<{ data: { message: string } }>(status)).toMatchObject({
          data: { message: "External app not found: blender" },
        })
      }),
    instanceOptions,
  )
})

describe("ucs external-app events", () => {
  it.instance(
    "streams capability and checkpoint events, and survives a subscriber disconnecting",
    () =>
      Effect.gen(function* () {
        const { directory } = yield* TestInstance
        const survivor = yield* openEventStream(directory)
        expect(survivor.response.status).toBe(200)
        expect(survivor.response.headers["content-type"]).toContain("text/event-stream")
        yield* awaitEvent(survivor.events, "server.connected")

        // A second subscriber on the same directory, torn down while the first stays open.
        yield* Effect.scoped(
          Effect.gen(function* () {
            const transient = yield* openEventStream(directory)
            yield* awaitEvent(transient.events, "server.connected")

            const capabilities = yield* request("/ucs/external-apps/unity/capabilities", directory)
            expect(capabilities.status).toBe(200)
            expect(yield* awaitEvent(transient.events, "external-app.capabilities-changed")).toMatchObject({
              properties: { appId: "unity", capabilities: { checkpointSupported: true } },
            })
            expect(yield* awaitEvent(survivor.events, "external-app.capabilities-changed")).toMatchObject({
              properties: { appId: "unity", capabilities: { version: "2026.1.0" } },
            })
          }),
        )

        // The transient subscriber's finalizers have run. The bus must be intact:
        // the surviving stream keeps delivering, and a fresh client still connects.
        const checkpoint = yield* post("/ucs/external-apps/unity/checkpoints", directory, { label: "before-edit" })
        expect(checkpoint.status).toBe(200)
        expect(yield* awaitEvent(survivor.events, "external-app.checkpoint-result")).toMatchObject({
          properties: { appId: "unity", result: { _tag: "Created", checkpointId: "cp-1" } },
        })

        const rejoined = yield* openEventStream(directory)
        expect(rejoined.response.status).toBe(200)
        yield* awaitEvent(rejoined.events, "server.connected")

        control.capabilities = { ...CAPABILITIES, version: "2026.2.0" }
        const again = yield* request("/ucs/external-apps/unity/capabilities", directory)
        expect(again.status).toBe(200)
        expect(yield* awaitEvent(rejoined.events, "external-app.capabilities-changed")).toMatchObject({
          properties: { capabilities: { version: "2026.2.0" } },
        })
      }),
    instanceOptions,
    30_000,
  )

  it.instance(
    "projects the supervisor's own state and blockage transitions onto the stream",
    () =>
      Effect.gen(function* () {
        // The supervisor's first heartbeat probe is what produces these two: they
        // originate in the registry, not in a request, which is exactly what the
        // `/ucs/events` projection exists to carry.
        control.snapshot = {
          ...HEALTHY,
          state: "blocked-on-human",
          activeMode: "play",
          blockage: { reason: "modal", detail: "1 modal dialog(s) open" },
        }
        const { directory } = yield* TestInstance
        const { events } = yield* openEventStream(directory)
        yield* awaitEvent(events, "server.connected")

        expect(yield* awaitEvent(events, "external-app.state-changed", "20 seconds")).toMatchObject({
          properties: {
            appId: "unity",
            snapshot: { state: "blocked-on-human", activeMode: "play", blockage: { reason: "modal" } },
          },
        })
        expect(yield* awaitEvent(events, "external-app.blockage-changed", "20 seconds")).toMatchObject({
          properties: { appId: "unity", blockage: { reason: "modal", detail: "1 modal dialog(s) open" } },
        })
      }),
    instanceOptions,
    45_000,
  )
})
