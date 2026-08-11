import { Schema } from "effect"

/**
 * Versioned capability manifest describing which UCS features a host supports.
 *
 * A host adapter (omo-opencode, omo-codex, omo-senpi) declares capabilities
 * against this manifest so surfaces can render feature-gated UI and the fork
 * can verify contract conformance (Phase 4 adapter conformance fixtures).
 */
export const UcsCapabilityId = Schema.Literals(["session-topology",
  "task-state",
  "event-stream",
  "multi-session",
  "boulder-state",
  "mailbox",
  "team-mode",
  "evidence",
  "approvals",
  "external-app",
  "skill-registry",
  "tool-registry",
  "agent-registry",])
export type UcsCapabilityId = typeof UcsCapabilityId.Type

export const UcsCapabilityStatus = Schema.Literals(["supported", "beta", "planned", "absent"])
export type UcsCapabilityStatus = typeof UcsCapabilityStatus.Type

export const UcsCapabilityEntry = Schema.Struct({
  id: UcsCapabilityId,
  status: UcsCapabilityStatus,
  version: Schema.String,
})
export type UcsCapabilityEntry = typeof UcsCapabilityEntry.Type

export const UcsCapabilityManifest = Schema.Struct({
  schemaVersion: Schema.Literal(1),
  host: Schema.String,
  hostVersion: Schema.String,
  capabilities: Schema.Array(UcsCapabilityEntry),
  updatedAt: Schema.Number,
})
export type UcsCapabilityManifest = typeof UcsCapabilityManifest.Type
