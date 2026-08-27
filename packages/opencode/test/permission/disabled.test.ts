import { describe, it, expect } from "bun:test"
import { disabled, fromConfig, merge, visibleTools } from "../../src/permission"

describe("Permission.disabled", () => {
  const allTools = ["edit", "write", "apply_patch", "read", "list_mcp_resources", "list_mcp_resource_templates", "read_mcp_resource", "bash"]

  it("a. Granular allows after catch-all", () => {
    const ruleset = fromConfig({ edit: { "*": "deny", "plans/*.md": "allow", ".omo/**": "allow" } })
    const hidden = disabled(["write", "edit", "apply_patch"], ruleset)
    expect(hidden.size).toBe(0)
  })

  it("b. Trailing catch-all deny", () => {
    const rulesetA = fromConfig({ edit: { "plans/*.md": "allow" } })
    const ruleset = merge(rulesetA, fromConfig({ edit: "deny" }))
    const hidden = disabled(["write", "edit", "apply_patch"], ruleset)
    expect(hidden.size).toBe(3)
    expect(hidden.has("edit")).toBe(true)
    expect(hidden.has("write")).toBe(true)
    expect(hidden.has("apply_patch")).toBe(true)
  })

  it("c. Carve-out restored after deny", () => {
    const ruleset = merge(fromConfig({ edit: "deny" }), [{ permission: "edit", pattern: ".omo/**", action: "allow" }])
    const hidden = disabled(["write", "edit", "apply_patch"], ruleset)
    expect(hidden.size).toBe(0)
  })

  it("d. Sub-pattern deny after catch-all deny", () => {
    const ruleset = [
      { permission: "edit", pattern: "*", action: "deny" as const },
      { permission: "edit", pattern: "plans/*.md", action: "deny" as const }
    ]
    const hidden = disabled(["write", "edit", "apply_patch"], ruleset)
    expect(hidden.size).toBe(3)
  })

  it("e. Catch-all allow / no rules", () => {
    const hidden1 = disabled(allTools, fromConfig({ "*": "allow" }))
    expect(hidden1.size).toBe(0)

    const hidden2 = disabled(allTools, [])
    expect(hidden2.size).toBe(0)
  })

  it("f. Tool-to-permission mapping", () => {
    const ruleset = fromConfig({ edit: "deny", read: "deny" })
    const hidden = disabled(allTools, ruleset)
    expect(hidden.has("edit")).toBe(true)
    expect(hidden.has("write")).toBe(true)
    expect(hidden.has("apply_patch")).toBe(true)
    expect(hidden.has("read")).toBe(true)
    expect(hidden.has("list_mcp_resources")).toBe(true)
    expect(hidden.has("list_mcp_resource_templates")).toBe(true)
    expect(hidden.has("read_mcp_resource")).toBe(true)
    expect(hidden.has("bash")).toBe(false)
  })

  it("g. Permission-wildcard allowlist", () => {
    const ruleset = fromConfig({ "*": "deny", read: "allow" })
    const hidden = disabled(["write", "read"], ruleset)
    expect(hidden.has("write")).toBe(true)
    expect(hidden.has("read")).toBe(false)
  })

  it("h. visibleTools filters a record consistently", () => {
    const tools = {
      edit: 1,
      write: 2,
      read: 3,
      bash: 4
    }
    const ruleset = fromConfig({ edit: "deny" })
    const visible = visibleTools(tools, ruleset)
    expect(Object.keys(visible)).toEqual(["read", "bash"])
  })
})
