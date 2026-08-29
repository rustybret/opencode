import { describe, expect, test } from "bun:test"
import { ConfigParse } from "../../src/config/parse"

describe("ConfigParse.jsonc", () => {
  test("parses clean jsonc without BOM", () => {
    const raw = '{\n  // comment\n  "key": "value"\n}'
    const result = ConfigParse.jsonc(raw, "opencode.jsonc")
    expect(result).toEqual({ key: "value" })
  })

  test("parses jsonc with leading UTF-8 BOM (\\uFEFF)", () => {
    const rawWithBom = '\uFEFF{\n  // PowerShell 5.1 BOM\n  "model": "anthropic/claude-3-5-sonnet",\n  "snapshot": false\n}'
    const result = ConfigParse.jsonc(rawWithBom, "opencode.jsonc")
    expect(result).toEqual({
      model: "anthropic/claude-3-5-sonnet",
      snapshot: false,
    })
  })

  test("parses jsonc with trailing comma and BOM", () => {
    const rawWithBom = '\uFEFF{\n  "items": [1, 2, ],\n}'
    const result = ConfigParse.jsonc(rawWithBom, "opencode.jsonc")
    expect(result).toEqual({
      items: [1, 2],
    })
  })
})
