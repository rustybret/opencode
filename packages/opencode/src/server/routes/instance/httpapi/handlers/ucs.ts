import {
  UcsBoulderSummary,
  UcsEventEnvelope,
  UcsIntegrationState,
  UcsSessionRef,
  UcsTaskState,
  UcsTopology,
  UcsTopologyEntry,
} from "@ucs/contracts"
import { listAdapters } from "@/control-plane/adapters"
import { Workspace } from "@/control-plane/workspace"
import * as InstanceState from "@/effect/instance-state"
import { EventV2Bridge } from "@/event-v2-bridge"
import { Session } from "@/session/session"
import { SessionStatus } from "@/session/status"
import { EventV2 } from "@opencode-ai/core/event"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import { Effect, Queue } from "effect"
import * as Stream from "effect/Stream"
import { HttpServerResponse } from "effect/unstable/http"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import * as Sse from "effect/unstable/encoding/Sse"
import { UcsSessionsListQuery, UcsSessionList } from "../groups/ucs"
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
      return yield* eventResponse(events)
    })

    return handlers
      .handle("capabilities", capabilities)
      .handle("topology", topology)
      .handle("projects", projects)
      .handle("work", work)
      .handle("sessions", sessions)
      .handleRaw("events", subscribeEvents)
  }),
)