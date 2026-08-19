import {
  UcsBoulderSummary,
  UcsEventEnvelope,
  UcsIntegrationState,
  UcsSessionRef,
  UcsTaskState,
  UcsTopology,
  UcsTopologyEntry,
} from "@ucs/contracts"
import type {
  UcsExternalAppCheckpointRequest,
  UcsExternalAppConnectRequest,
  UcsExternalAppListResponse,
} from "@ucs/contracts"
import type { UcsExternalAppFailure } from "@ucs/contracts/external-app"
import { listAdapters } from "@/control-plane/adapters"
import { ExternalAppEvents } from "@/control-plane/external-app/events"
import { ExternalApp } from "@/control-plane/external-app/service"
import { Workspace } from "@/control-plane/workspace"
import * as InstanceState from "@/effect/instance-state"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Session } from "@/session/session"
import { SessionStatus } from "@/session/status"
import { EventV2 } from "@opencode-ai/core/event"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import { Effect, Option, Queue } from "effect"
import * as Stream from "effect/Stream"
import { HttpServerResponse } from "effect/unstable/http"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import * as Sse from "effect/unstable/encoding/Sse"
import {
  ExternalAppBlockedError,
  ExternalAppGatewayTimeoutError,
  ExternalAppUnavailableError,
  UcsSessionsListQuery,
  UcsSessionList,
} from "../groups/ucs"
import { notFound } from "../errors"
import { InstanceHttpApi } from "../api"

function sessionEntry(info: Session.Info, status: string): UcsTopologyEntry {
  const tokens = info.tokens
  return {
    ...UcsSessionRef.make({
      id: info.id,
      title: info.title,
      agent: info.agent,
      model: info.model?.id,
      parentID: info.parentID,
      projectID: info.projectID,
      directory: info.directory,
      time: info.time.updated,
      summary: info.summary
        ? {
            additions: info.summary.additions,
            deletions: info.summary.deletions,
            files: info.summary.files,
          }
        : undefined,
      cost: info.cost ?? undefined,
      tokens: tokens
        ? {
            input: tokens.input,
            output: tokens.output,
            cacheRead: tokens.cache.read,
            cacheWrite: tokens.cache.write,
          }
        : undefined,
    }),
    role: info.parentID ? "subagent" : "primary",
    status: status || "idle",
  }
}

function eventData(data: unknown): Sse.Event {
  return {
    _tag: "Event",
    event: "message",
    id: undefined,
    data: JSON.stringify(data),
  }
}

function eventID() {
  return EventV2.ID.create()
}

function eventResponse(events: EventV2.Interface) {
  return Effect.gen(function* () {
    const instance = yield* InstanceState.context
    const workspaceID = yield* InstanceState.workspaceID
    // Listener registration is eager, so events published after this point cannot
    // be lost while the HTTP body fiber is starting or emitting server.connected.
    const queue = yield* Queue.unbounded<EventV2.Payload>()
    const unsubscribe = yield* events.listen((event) => Effect.sync(() => Queue.offerUnsafe(queue, event)))
    yield* Effect.addFinalizer(() => unsubscribe)
    const stream = Stream.fromQueue(queue).pipe(
      Stream.filter(
        (event) =>
          event.location?.directory === instance.directory &&
          (event.location.workspaceID === undefined || event.location.workspaceID === workspaceID),
      ),
      Stream.map((event): UcsEventEnvelope => ({ id: event.id, type: event.type, properties: event.data })),
    )
    const heartbeat = Stream.tick("10 seconds").pipe(
      Stream.drop(1),
      Stream.map(() => ({ id: eventID(), type: "server.heartbeat", properties: {} })),
    )
    yield* Effect.logInfo("ucs events connected")
    return HttpServerResponse.stream(
      Stream.make({ id: eventID(), type: "server.connected", properties: {} }).pipe(
        Stream.concat(stream.pipe(Stream.merge(heartbeat, { haltStrategy: "left" }))),
        Stream.map(eventData),
        Stream.pipeThroughChannel(Sse.encode()),
        Stream.encodeText,
        Stream.ensuring(Effect.logInfo("ucs events disconnected")),
      ),
      {
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
          "X-Content-Type-Options": "nosniff",
        },
      },
    )
  })
}

type BoulderFile = {
  version?: number
  taskGoal?: string
  currentStepId?: string
  updatedAt?: number
  steps?: Array<{ status: string }>
}

function readBoulderFile(raw: unknown): BoulderFile | undefined {
  if (raw === undefined || typeof raw !== "object" || raw === null) return undefined
  return raw as BoulderFile
}

function readTaskState(fs: FSUtil.Interface) {
  return Effect.gen(function* () {
    const instance = yield* InstanceState.context
    const directory = instance.directory

    const boulder = readBoulderFile(
      yield* fs.readJson(`${directory}/.omo/boulder.json`).pipe(Effect.orElseSucceed(() => undefined)),
    )
    const steps = boulder?.steps ?? []
    const summary: UcsBoulderSummary = {
      present: boulder !== undefined,
      version: boulder?.version,
      taskGoal: boulder?.taskGoal,
      currentStepId: boulder?.currentStepId,
      totalSteps: steps.length === 0 ? undefined : steps.length,
      completedSteps: steps.filter((step) => step.status === "completed").length || undefined,
      failedSteps: steps.filter((step) => step.status === "failed").length || undefined,
      pendingSteps: steps.filter((step) => step.status === "pending").length || undefined,
      updatedAt: boulder?.updatedAt,
    }

    const entries = yield* fs.readDirectoryEntries(`${directory}/.omo/evidence`).pipe(Effect.orElseSucceed(() => []))
    const evidenceCount = entries.filter((entry) => entry.type === "file").length

    return { boulder: summary, evidenceCount }
  })
}

export const ucsHandlers = HttpApiBuilder.group(InstanceHttpApi, "ucs", (handlers) =>
  Effect.gen(function* () {
    const session = yield* Session.Service
    const statusSvc = yield* SessionStatus.Service
    const events = yield* EventV2Bridge.Service
    const workspace = yield* Workspace.Service
    const fs = yield* FSUtil.Service
    const externalApp = yield* ExternalApp.Service
    const externalAppEvents = yield* ExternalAppEvents.Service

    // `ExternalApp.Service` is a server-wide registry, but `external-app.state-changed`
    // and `external-app.blockage-changed` are only deliverable when they carry the
    // routed location `/ucs/events` filters on. Attaching per directory - once,
    // cached, released when the instance is disposed - is what supplies it, and
    // keeps two SSE clients in the same directory from publishing each event twice.
    const externalAppProjection = yield* InstanceState.make(() => externalAppEvents.attachRegistered())

    const capabilities = Effect.fn("UcsHttpApi.capabilities")(function* () {
      return {
        schemaVersion: 1 as const,
        host: "opencode",
        hostVersion: InstallationVersion,
        capabilities: [
          { id: "session-topology" as const, status: "supported" as const, version: "1" },
          { id: "task-state" as const, status: "supported" as const, version: "1" },
          { id: "event-stream" as const, status: "supported" as const, version: "1" },
          { id: "multi-session" as const, status: "supported" as const, version: "1" },
          { id: "boulder-state" as const, status: "beta" as const, version: "1" },
          { id: "external-app" as const, status: "supported" as const, version: "1" },
        ],
        updatedAt: Date.now(),
      }
    })

    const topology = Effect.fn("UcsHttpApi.topology")(function* () {
      const instance = yield* InstanceState.context
      const entries = yield* session.list({ scope: "project" })
      const statuses = yield* statusSvc.list()
      const sorted = entries.sort((a, b) => b.time.updated - a.time.updated)
      return {
        location: {
          directory: instance.directory,
          workspace: yield* InstanceState.workspaceID,
          project: instance.project.id,
        },
        project: {
          id: instance.project.id,
          name: instance.project.name,
          worktree: instance.worktree,
        },
        entries: sorted.map((info) => sessionEntry(info, statuses.get(info.id)?.type ?? "idle")),
        activeSessionCount: sorted.filter((info) => (statuses.get(info.id)?.type ?? "idle") !== "idle").length,
        updatedAt: Date.now(),
      } satisfies UcsTopology
    })

    const projects = Effect.fn("UcsHttpApi.projects")(function* () {
      const instance = yield* InstanceState.context
      return [{ id: instance.project.id, name: instance.project.name, worktree: instance.worktree }]
    })

    const work = Effect.fn("UcsHttpApi.work")(function* () {
      const instance = yield* InstanceState.context
      const taskState = yield* readTaskState(fs)
      const ids = new Set((yield* workspace.list(instance.project)).map((item) => item.id))
      const statuses = (yield* workspace.status()).filter((item) => ids.has(item.workspaceID))
      const adapters = new Map(listAdapters(instance.project.id).map((entry) => [entry.type, entry.name]))
      const integrations: UcsIntegrationState[] = statuses.map((status) => ({
        id: status.workspaceID,
        connected: status.status === "connected",
        name: adapters.get(status.workspaceID),
        status: status.status,
      }))
      return {
        location: {
          directory: instance.directory,
          workspace: yield* InstanceState.workspaceID,
          project: instance.project.id,
        },
        boulder: taskState.boulder,
        integrations,
        evidenceCount: taskState.evidenceCount,
        updatedAt: Date.now(),
      } satisfies UcsTaskState
    })

    const sessions = Effect.fn("UcsHttpApi.sessions")(function* (ctx: { query: typeof UcsSessionsListQuery.Type }) {
      const directory = ctx.query.directory ? yield* InstanceState.directory : undefined
      const list = yield* session.list({
        directory: ctx.query.scope === "project" ? undefined : directory,
        scope: ctx.query.scope,
        limit: ctx.query.limit,
      })
      const statuses = yield* statusSvc.list()
      const entries = list
        .filter((info) => ctx.query.status === undefined || statuses.get(info.id)?.type === ctx.query.status)
        .sort((a, b) => b.time.updated - a.time.updated)
        .map((info) => sessionEntry(info, statuses.get(info.id)?.type ?? "idle"))
      return { entries } satisfies UcsSessionList
    })

    const subscribeEvents = Effect.fn("UcsHttpApi.events")(function* () {
      yield* InstanceState.get(externalAppProjection)
      return yield* eventResponse(events)
    })

    /** Every `:appId` route starts here: an unregistered app is a 404, never a bridge fault. */
    const registration = Effect.fn("UcsHttpApi.externalApp")(function* (appId: string) {
      const found = yield* externalApp.get(appId)
      if (found === undefined) return yield* notFound(`External app not found: ${appId}`)
      return found
    })

    const externalAppsList = Effect.fn("UcsHttpApi.externalAppsList")(function* () {
      const registrations = yield* externalApp.list()
      return {
        apps: registrations.map((entry) => ({
          appId: entry.adapter.appId,
          name: entry.adapter.name,
          // No snapshot means the supervisor has not completed a probe yet, so the
          // only honest read is "not connected, not known to be reachable". Hiding
          // the row instead would make a stopped Unity look like a host that has
          // no Unity support at all.
          state: entry.snapshot?.state ?? "disconnected",
          health: entry.snapshot?.health ?? "unreachable",
        })),
      } satisfies UcsExternalAppListResponse
    })

    const externalAppConnect = Effect.fn("UcsHttpApi.externalAppConnect")(function* (ctx: {
      params: { appId: string }
      payload: UcsExternalAppConnectRequest
    }) {
      const entry = yield* registration(ctx.params.appId)
      const snapshot = yield* entry.adapter.connect(ctx.payload).pipe(Effect.catch(writeFailure))
      // The handshake landed, but the app still owes a human an answer. This route
      // calls that a conflict; the blocked snapshot itself stays readable on
      // `GET .../status`, which is the endpoint built to report blockage (D3.3-b).
      if (snapshot.blockage)
        return yield* new ExternalAppBlockedError({
          name: "ExternalAppBlockedError",
          data: {
            message: `External app is blocked on a human: ${ctx.params.appId}`,
            reason: snapshot.blockage.reason,
          },
        })
      return snapshot
    })

    const externalAppStatus = Effect.fn("UcsHttpApi.externalAppStatus")(function* (ctx: {
      params: { appId: string }
    }) {
      const entry = yield* registration(ctx.params.appId)
      return yield* entry.adapter.status().pipe(Effect.catch(readFailure))
    })

    const externalAppCapabilities = Effect.fn("UcsHttpApi.externalAppCapabilities")(function* (ctx: {
      params: { appId: string }
    }) {
      const entry = yield* registration(ctx.params.appId)
      const capabilities = yield* entry.adapter.capabilities().pipe(Effect.catch(readFailure))
      yield* externalAppEvents.capabilitiesChanged(ctx.params.appId, capabilities)
      return capabilities
    })

    const externalAppCheckpoint = Effect.fn("UcsHttpApi.externalAppCheckpoint")(function* (ctx: {
      params: { appId: string }
      payload: UcsExternalAppCheckpointRequest
    }) {
      const entry = yield* registration(ctx.params.appId)
      // Read the blockage fresh rather than trusting the retained snapshot: a
      // restore point taken while a modal is open would capture a state nobody
      // agreed to, and the retained copy can be up to one heartbeat stale.
      const blockage = yield* entry.adapter.blockedOnHuman().pipe(Effect.catch(writeFailure))
      if (Option.isSome(blockage))
        return yield* new ExternalAppBlockedError({
          name: "ExternalAppBlockedError",
          data: {
            message: `External app is blocked on a human: ${ctx.params.appId}`,
            reason: blockage.value.reason,
          },
        })
      // `Unsupported` is a 200 carrying data, never an error: no native restore
      // point means no substitute is ever taken on the app's behalf (D3.3-a).
      const result = yield* entry.adapter.checkpoint(ctx.payload.label).pipe(Effect.catch(writeFailure))
      yield* externalAppEvents.checkpointResult(ctx.params.appId, result)
      return result
    })

    return handlers
      .handle("capabilities", capabilities)
      .handle("topology", topology)
      .handle("projects", projects)
      .handle("work", work)
      .handle("sessions", sessions)
      .handleRaw("events", subscribeEvents)
      .handle("externalAppsList", externalAppsList)
      .handle("externalAppConnect", externalAppConnect)
      .handle("externalAppStatus", externalAppStatus)
      .handle("externalAppCapabilities", externalAppCapabilities)
      .handle("externalAppCheckpoint", externalAppCheckpoint)
  }),
)

/**
 * Adapter-tier failure to HTTP status, for the routes that declare no 409.
 *
 * `UcsExternalAppInstanceAmbiguityError` is reachable only from `connect`, but it
 * is a member of `UcsExternalAppFailure`, so it must land somewhere here: 502 with
 * its reason preserved, rather than a 409 the read routes never declared (D3.3-b).
 */
function readFailure(
  failure: UcsExternalAppFailure,
  // Annotated because `Effect.catch` narrows to the first branch's error otherwise.
): Effect.Effect<never, ExternalAppUnavailableError | ExternalAppGatewayTimeoutError> {
  if (failure._tag === "UcsExternalAppTimeoutError")
    return Effect.fail(
      new ExternalAppGatewayTimeoutError({
        name: "ExternalAppGatewayTimeoutError",
        data: { message: failure.message },
      }),
    )
  return Effect.fail(
    new ExternalAppUnavailableError({
      name: "ExternalAppUnavailableError",
      data: { message: failure.message, reason: unavailableReason(failure) },
    }),
  )
}

/** Mutating routes add the 409: refusing to guess between editors is a conflict, not a fault. */
function writeFailure(
  failure: UcsExternalAppFailure,
): Effect.Effect<never, ExternalAppBlockedError | ExternalAppUnavailableError | ExternalAppGatewayTimeoutError> {
  if (failure._tag === "UcsExternalAppInstanceAmbiguityError")
    return Effect.fail(
      new ExternalAppBlockedError({
        name: "ExternalAppBlockedError",
        data: { message: failure.message, reason: "instance-selection-required" },
      }),
    )
  return readFailure(failure)
}

/** 502 collapses two faults; `reason` is what keeps "retry" and "do not retry" apart (D3.3-d). */
function unavailableReason(failure: UcsExternalAppFailure) {
  if (failure._tag === "UcsExternalAppProtocolError") return "protocol"
  if (failure._tag === "UcsExternalAppInstanceAmbiguityError") return "instance-selection-required"
  return "transport"
}