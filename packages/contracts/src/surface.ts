import { Schema } from "effect"

/**
 * Namespaced `ucs` API surface rule and route/command IDs.
 *
 * Rule: all UCS API additions use the `ucs` surface prefix rather than
 * modifying unrelated upstream semantics. Server routes, CLI commands, and
 * client SDK method names must derive from these IDs so every surface speaks
 * the same vocabulary (Phase 1 deliverable: CLI/server command and API naming
 * conventions).
 */
export const UcsApiPrefix = "ucs"

export const UcsRouteId = Schema.Literals(["ucs.topology",
  "ucs.project",
  "ucs.work",
  "ucs.integration",
  "ucs.session",
  "ucs.evidence",
  "ucs.events",
  "ucs.capabilities",
  "ucs.external-apps",])
export type UcsRouteId = typeof UcsRouteId.Type

export const UcsCommandId = Schema.Literals(["ucs.status",
  "ucs.sessions",
  "ucs.projects",
  "ucs.work",
  "ucs.integrations",
  "ucs.evidence",
  "ucs.capabilities",])
export type UcsCommandId = typeof UcsCommandId.Type

/** HTTP path prefix for all namespaced UCS endpoints, e.g. /ucs/topology. */
export const ucsApiPath = (route: UcsRouteId): string => `/${UcsApiPrefix}/${route.replace(`${UcsApiPrefix}.`, "")}`
