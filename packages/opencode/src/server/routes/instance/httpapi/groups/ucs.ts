import {
  UcsCapabilityManifest,
  UcsEventEnvelope,
  UcsSessionsQuery,
  UcsTaskState,
  UcsTopology,
  UcsTopologyEntry,
} from "@ucs/contracts"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"

import { SessionID } from "@/session/schema"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQueryFields } from "../middleware/workspace-routing"
import { described } from "./metadata"

/**
 * Namespaced `ucs` server surface (Phase 1: Server Substrate).
 *
 * Read-only topology, task-state, session, and event endpoints built on the
 * `@ucs/contracts` surface. Paths derive from `UcsRouteId` so the server, CLI
 * commands, and client SDK speak the same vocabulary. Phase 2 (read-only Web
 * slice) consumes these endpoints before any write action is added later.
 */
export const UcsPaths = {
  capabilities: "/ucs/capabilities",
  topology: "/ucs/topology",
  projects: "/ucs/projects",
  work: "/ucs/work",
  sessions: "/ucs/sessions",
  events: "/ucs/events",
} as const

export const UcsSessionsListQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  ...UcsSessionsQuery.fields,
})

export const UcsSessionList = Schema.Struct({
  entries: Schema.Array(UcsTopologyEntry),
})
export type UcsSessionList = typeof UcsSessionList.Type

export const UcsProject = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String),
  worktree: Schema.optional(Schema.String),
})
export type UcsProject = typeof UcsProject.Type

const locationQuery = Schema.Struct(WorkspaceRoutingQueryFields)

export const UcsApi = HttpApi.make("ucs").add(
  HttpApiGroup.make("ucs")
    .add(
      HttpApiEndpoint.get("capabilities", UcsPaths.capabilities, {
        success: described(UcsCapabilityManifest, "Versioned capability manifest for this host."),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.capabilities",
          summary: "UCS capability manifest",
          description: "Read the versioned capability manifest describing which UCS features this host supports.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("topology", UcsPaths.topology, {
        query: locationQuery,
        success: described(UcsTopology, "Session tree and project context for the routed location."),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.topology",
          summary: "Session and project topology",
          description:
            "Read-only topology for the routed location: the session tree (primary + subagents), project context, and active-session count.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("projects", UcsPaths.projects, {
        query: locationQuery,
        success: described(Schema.Array(UcsProject), "Project list visible from the routed location."),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.projects",
          summary: "Project list",
          description: "Read-only list of projects visible from the routed location.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("work", UcsPaths.work, {
        query: locationQuery,
        success: described(UcsTaskState, "Work tracking, integrations, and evidence state."),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.work",
          summary: "Task state",
          description: "Read-only task state for the routed location: boulder progress, integration connections, evidence.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("sessions", UcsPaths.sessions, {
        query: UcsSessionsListQuery,
        success: described(UcsSessionList, "Session list with role and status context."),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.sessions",
          summary: "Session list",
          description: "Read-only session rows with role/status context, filterable by scope, status, and limit.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("events", UcsPaths.events, {
        query: locationQuery,
        success: described(
          Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/event-stream" })),
          "Server-sent event stream of session, work, integration, and evidence updates.",
        ),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.events",
          summary: "Subscribe to ucs events",
          description: "Server-sent event stream of session, work, integration, and evidence updates.",
        }),
      ),
    )
    .middleware(InstanceContextMiddleware)
    .middleware(WorkspaceRoutingMiddleware)
    .middleware(Authorization)
    .annotateMerge(OpenApi.annotations({ title: "ucs", description: "Namespaced UCS server surface (read-only)." }))
)

export type { UcsEventEnvelope }
export type { SessionID as UcsSessionID }