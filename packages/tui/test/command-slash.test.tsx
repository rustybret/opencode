/** @jsxImportSource @opentui/solid */
import { testRender } from "@opentui/solid"
import { expect, test } from "bun:test"
import { ConfigProvider } from "../src/config"
import { Keymap } from "../src/context/keymap"
import { createTuiResolvedConfig } from "./fixture/tui-runtime"

/**
 * `useCommands` is the seam the prompt's slash completion reads. It must expose
 * each command's declared `slash` payload (name plus aliases) so autocomplete can
 * expand it, and must leave commands without a slash unmarked so they never appear.
 */

test("useCommands exposes declared slash names and aliases", async () => {
  let commands = () => [] as ReturnType<ReturnType<typeof Keymap.useCommands>>

  function Harness() {
    Keymap.createLayer(() => ({
      commands: [
        {
          id: "custom.plugin.diff",
          title: "View custom diff",
          description: "Shows the plugin diff",
          slash: { name: "custom-diff", aliases: ["cdiff"] },
          run() {},
        },
        {
          id: "custom.plugin.slash_object",
          title: "Custom Slash Object",
          slash: { name: "cslash", aliases: ["cs"] },
          run() {},
        },
        {
          id: "internal.key.only",
          title: "Internal action",
          run() {},
        },
      ],
    }))

    const reachable = Keymap.useCommands()
    commands = () => reachable()
    return <box />
  }

  const app = await testRender(() => (
    <ConfigProvider config={createTuiResolvedConfig()}>
      <Keymap.Provider>
        <Harness />
      </Keymap.Provider>
    </ConfigProvider>
  ))
  try {
    const byId = new Map(commands().map((command) => [command.id, command]))

    expect(byId.get("custom.plugin.diff")?.slash).toEqual({ name: "custom-diff", aliases: ["cdiff"] })
    expect(byId.get("custom.plugin.diff")?.title).toBe("View custom diff")
    expect(byId.get("custom.plugin.diff")?.description).toBe("Shows the plugin diff")

    expect(byId.get("custom.plugin.slash_object")?.slash).toEqual({ name: "cslash", aliases: ["cs"] })
    expect(byId.get("custom.plugin.slash_object")?.description).toBeUndefined()

    // A command without a slash must stay unmarked so autocomplete skips it entirely.
    expect(byId.get("internal.key.only")?.slash).toBeUndefined()
  } finally {
    app.renderer.destroy()
  }
})

test("useCommands rejects a slash command without an id", async () => {
  function Harness() {
    // `groupCommands` requires an id for slash commands; an id-less slash must throw
    // rather than silently register an unreachable prompt entry.
    Keymap.createLayer(() => ({
      commands: [{ title: "Nameless", slash: { name: "nameless" }, run() {} }],
    }))
    return <box />
  }

  await expect(
    testRender(() => (
      <ConfigProvider config={createTuiResolvedConfig()}>
        <Keymap.Provider>
          <Harness />
        </Keymap.Provider>
      </ConfigProvider>
    )),
  ).rejects.toThrow()
})