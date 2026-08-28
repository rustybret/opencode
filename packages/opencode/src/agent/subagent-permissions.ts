import { PermissionV1 } from "@opencode-ai/core/v1/permission"
import type { Agent } from "./agent"
import { evaluate } from "../permission"

/**
 * Build the `permission` ruleset for a subagent's session when it's spawned
 * via the task tool. Combines:
 *
 * 1. The parent session's deny rules and external_directory rules.
 *    Parent agent restrictions only govern that agent; the subagent's own
 *    permissions determine its capabilities.
 * 2. Default `todowrite` and `task` denies if the subagent's own ruleset
 *    doesn't already permit them.
 */
export function deriveSubagentSessionPermission(input: {
  parentSessionPermission: PermissionV1.Ruleset
  subagent: Agent.Info
}): PermissionV1.Ruleset {
  const canTask = input.subagent.permission.some((rule) => rule.permission === "task")
  const canTodo = input.subagent.permission.some((rule) => rule.permission === "todowrite")

  const externalDirectoryRules = input.parentSessionPermission.filter(
    (rule) => rule.permission === "external_directory"
  )

  // Group parent session rules by permission (excluding external_directory)
  const rulesByPermission = new Map<string, PermissionV1.Rule[]>()
  for (const rule of input.parentSessionPermission) {
    if (rule.permission === "external_directory") continue
    const group = rulesByPermission.get(rule.permission) ?? []
    group.push(rule)
    rulesByPermission.set(rule.permission, group)
  }

  const propagatedRules: PermissionV1.Rule[] = []
  for (const group of rulesByPermission.values()) {
    const hasDeny = group.some((rule) => rule.action === "deny")
    if (!hasDeny) continue

    for (const rule of group) {
      if (rule.action === "deny") {
        propagatedRules.push(rule)
      } else {
        // Intersection projection: parent carve-outs never grant beyond the child's own capabilities
        if (evaluate(rule.permission, rule.pattern, input.subagent.permission).action !== "deny") {
          propagatedRules.push(rule)
        }
      }
    }
  }

  return [
    ...externalDirectoryRules,
    ...propagatedRules,
    ...(canTodo ? [] : [{ permission: "todowrite" as const, pattern: "*" as const, action: "deny" as const }]),
    ...(canTask ? [] : [{ permission: "task" as const, pattern: "*" as const, action: "deny" as const }]),
  ]
}
