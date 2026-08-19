import {
  UcsCapabilityManifest,
  UcsEventEnvelope,
  UcsExternalAppCapabilitiesResponse,
  UcsExternalAppCheckpointRequest,
  UcsExternalAppCheckpointResponse,
  UcsExternalAppConnectRequest,
  UcsExternalAppConnectResponse,
  UcsExternalAppListResponse,
  UcsExternalAppStatusResponse,
  UcsSessionsQuery,
  UcsTaskState,
  UcsTopology,
  UcsTopologyEntry,
} from "@ucs/contracts"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"

import { SessionID } from "@/session/schema"
import { ApiNotFoundError } from "../errors"
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
  externalApps: "/ucs/external-apps",
  externalAppConnect: "/ucs/external-apps/:appId/connect",
  externalAppStatus: "/ucs/external-apps/:appId/status",
  externalAppCapabilities: "/ucs/external-apps/:appId/capabilities",
  externalAppCheckpoint: "/ucs/external-apps/:appId/checkpoints",
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

/**
 * HTTP-tier error classes for the `ucs.external-apps` route family.
 *
 * These are the wire projection of the `@ucs/contracts` domain failures, not the
 * failures themselves — the names are deliberately distinct from
 * `UcsExternalAppTransportError` / `UcsExternalAppTimeoutError` and friends so a
 * handler never confuses the adapter-tier failure it caught with the HTTP status
 * it is about to return. `ApiNotFoundError` covers the 404 (unregistered
 * `appId`) and is reused as-is rather than re-declared.
 *
 * A checkpoint the app cannot take is NOT represented here: `UcsExternalAppCheckpointResponse`
 * carries an `Unsupported` member, so missing restore-point support is a 200 with data.
 */

/** 409: the app is `blocked-on-human`, or `connect` could not disambiguate the target instance. */
export class ExternalAppBlockedError extends Schema.ErrorClass<ExternalAppBlockedError>("ExternalAppBlockedError")(
  {
    name: Schema.Literal("ExternalAppBlockedError"),
    data: Schema.Struct({
      message: Schema.String,
      reason: Schema.optional(Schema.String),
    }),
  },
  { httpApiStatus: 409 },
) {}

/** 502: the bridge transport failed, or answered with a payload that is not valid protocol. */
export class ExternalAppUnavailableError extends Schema.ErrorClass<ExternalAppUnavailableError>(
  "ExternalAppUnavailableError",
)(
  {
    name: Schema.Literal("ExternalAppUnavailableError"),
    data: Schema.Struct({
      message: Schema.String,
      // Two domain failures collapse onto this one status; `reason` keeps
      // transport-level and protocol-level faults distinguishable by clients.
      reason: Schema.optional(Schema.String),
    }),
  },
  { httpApiStatus: 502 },
) {}

/** 504: the bridge accepted the call but did not answer inside its deadline. */
export class ExternalAppGatewayTimeoutError extends Schema.ErrorClass<ExternalAppGatewayTimeoutError>(
  "ExternalAppGatewayTimeoutError",
)(
  {
    name: Schema.Literal("ExternalAppGatewayTimeoutError"),
    data: Schema.Struct({
      message: Schema.String,
    }),
  },
  { httpApiStatus: 504 },
) {}

/** Every `:appId` route can 404 on an unregistered app, or fail at the bridge. */
const externalAppReadErrors = [ApiNotFoundError, ExternalAppUnavailableError, ExternalAppGatewayTimeoutError] as const

/** Mutating routes add 409; reading the status of a blocked app is how a caller discovers the blockage. */
const externalAppWriteErrors = [...externalAppReadErrors, ExternalAppBlockedError] as const

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
    .add(
      HttpApiEndpoint.get("externalAppsList", UcsPaths.externalApps, {
        query: locationQuery,
        success: described(
          UcsExternalAppListResponse,
          "Registered external applications with connection state and health.",
        ),
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.external-apps",
          summary: "External application list",
          description:
            "Registered external creative applications visible from the routed location, with each app's connection state and health.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.post("externalAppConnect", UcsPaths.externalAppConnect, {
        params: { appId: Schema.String },
        query: locationQuery,
        payload: UcsExternalAppConnectRequest,
        success: described(UcsExternalAppConnectResponse, "Snapshot captured immediately after the handshake."),
        error: externalAppWriteErrors,
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.external-apps.connect",
          summary: "Connect an external application",
          description:
            "Run the bridge handshake for a registered external application and return the resulting snapshot. Conflicts when the app is blocked on a human or when the requested project path does not uniquely select one running instance.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("externalAppStatus", UcsPaths.externalAppStatus, {
        params: { appId: Schema.String },
        query: locationQuery,
        success: described(UcsExternalAppStatusResponse, "Current state, health, active mode, context, and blockage."),
        error: externalAppReadErrors,
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.external-apps.status",
          summary: "External application status",
          description:
            "Current snapshot for one external application. A blocked app answers 200 with its blockage attached \u2014 discovering the blockage is the point of this endpoint, so it is never a 409.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.get("externalAppCapabilities", UcsPaths.externalAppCapabilities, {
        params: { appId: Schema.String },
        query: locationQuery,
        success: described(
          UcsExternalAppCapabilitiesResponse,
          "Advertised actions, domain tags, and native checkpoint support.",
        ),
        error: externalAppReadErrors,
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.external-apps.capabilities",
          summary: "External application capabilities",
          description:
            "Actions the bridge advertises for one external application, its domain tags, and whether it supports native restore points.",
        }),
      ),
    )
    .add(
      HttpApiEndpoint.post("externalAppCheckpoint", UcsPaths.externalAppCheckpoint, {
        params: { appId: Schema.String },
        query: locationQuery,
        payload: UcsExternalAppCheckpointRequest,
        success: described(UcsExternalAppCheckpointResponse, "Checkpoint created, or reported as unsupported."),
        error: externalAppWriteErrors,
      }).annotateMerge(
        OpenApi.annotations({
          identifier: "ucs.external-apps.checkpoint",
          summary: "Create an external application checkpoint",
          description:
            "Request a native restore point from an external application. An app with no native restore-point support answers 200 with the Unsupported result rather than an error; no substitute checkpoint is ever taken on its behalf.",
        }),
      ),
    )
    .middleware(InstanceContextMiddleware)
    .middleware(WorkspaceRoutingMiddleware)
    .middleware(Authorization)
    .annotateMerge(
      OpenApi.annotations({
        title: "ucs",
        description: "Namespaced UCS server surface: read-only topology and task state, plus external-app control.",
      }),
    )
)

export type { UcsEventEnvelope }
export type { SessionID as UcsSessionID }