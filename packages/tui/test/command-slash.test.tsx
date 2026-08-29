/** @jsxImportSource @opentui/solid */
import { createDefaultOpenTuiKeymap } from "@opentui/keymap/opentui"
import { createBindingLookup } from "@opentui/keymap/extras"
import { testRender, useRenderer } from "@opentui/solid"
import { expect, test } from "bun:test"
import { onCleanup } from "solid-js"
import { TuiKeybind } from "../src/config/keybind"
import { OpencodeKeymapProvider, registerOpencodeKeymap, useCommandSlashes } from "../src/keymap"
import { createCommandShim } from "../src/plugin/command-shim"

function createResolvedKeymapConfig(input: TuiKeybind.KeybindOverrides = {}) {
  const keybinds = TuiKeybind.parse(input)
  return {
    keybinds: createBindingLookup(TuiKeybind.toBindingConfig(keybinds), {
      commandMap: TuiKeybind.CommandMap,
      bindingDefaults: TuiKeybind.bindingDefaults(),
    }),
    leader_timeout: 2000,
  }
}

test("commands registered via modern api.keymap.registerLayer surface in useCommandSlashes", async () => {
  let slashesList: ReturnType<ReturnType<typeof useCommandSlashes>> = []

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const config = createResolvedKeymapConfig()
    const offKeymap = registerOpencodeKeymap(keymap, renderer, config)

    const offLayer = keymap.registerLayer({
      commands: [
        {
          name: "custom.plugin.diff",
          title: "View custom diff",
          slashName: "custom-diff",
          slashAliases: ["cdiff"],
          run() {},
        },
        {
          name: "custom.plugin.slash_object",
          title: "Custom Slash Object",
          slash: {
            name: "cslash",
            aliases: ["cs"],
          },
          run() {},
        },
        {
          name: "internal.key.only",
          title: "Internal action",
          run() {},
        },
      ],
    })

    function Consumer() {
      const slashes = useCommandSlashes()
      slashesList = slashes()
      return <box />
    }

    onCleanup(() => {
      offLayer()
      offKeymap()
    })

    return (
      <OpencodeKeymapProvider keymap={keymap}>
        <Consumer />
      </OpencodeKeymapProvider>
    )
  }

  const app = await testRender(() => <Harness />)
  try {
    expect(slashesList.map((s) => s.display)).toContain("/custom-diff")
    expect(slashesList.map((s) => s.display)).toContain("/cslash")
    expect(slashesList.map((s) => s.display)).not.toContain("/internal.key.only")

    const diffSlash = slashesList.find((s) => s.display === "/custom-diff")
    expect(diffSlash?.aliases).toEqual(["/cdiff"])
    expect(diffSlash?.description).toBe("View custom diff")

    const slashObj = slashesList.find((s) => s.display === "/cslash")
    expect(slashObj?.aliases).toEqual(["/cs"])
    expect(slashObj?.description).toBe("Custom Slash Object")
  } finally {
    app.renderer.destroy()
  }
})

test("commands registered via legacy api.command.register surface in useCommandSlashes", async () => {
  let slashesList: ReturnType<ReturnType<typeof useCommandSlashes>> = []

  function Harness() {
    const renderer = useRenderer()
    const keymap = createDefaultOpenTuiKeymap(renderer)
    const config = createResolvedKeymapConfig()
    const offKeymap = registerOpencodeKeymap(keymap, renderer, config)

    const fakeDialog = {
      stack: [],
      replace() {},
      clear() {},
      setSize() {},
      size: "medium" as const,
    }

    const commandApi = createCommandShim(keymap, fakeDialog, config.keybinds)!

    const offLegacy = commandApi.register(() => [
      {
        title: "Legacy Plugin Command",
        value: "legacy-plugin",
        description: "Does something in v1 plugin",
        onSelect() {},
      },
      {
        title: "Legacy Plugin With Slash",
        value: "legacy-named",
        description: "Custom slash name in v1",
        slash: {
          name: "v1slash",
          aliases: ["v1s"],
        },
        onSelect() {},
      },
    ])

    function Consumer() {
      const slashes = useCommandSlashes()
      slashesList = slashes()
      return <box />
    }

    onCleanup(() => {
      offLegacy()
      offKeymap()
    })

    return (
      <OpencodeKeymapProvider keymap={keymap}>
        <Consumer />
      </OpencodeKeymapProvider>
    )
  }

  const app = await testRender(() => <Harness />)
  try {
    expect(slashesList.map((s) => s.display)).toContain("/legacy-plugin")
    expect(slashesList.map((s) => s.display)).toContain("/v1slash")

    const legacyPlugin = slashesList.find((s) => s.display === "/legacy-plugin")
    expect(legacyPlugin?.description).toBe("Does something in v1 plugin")

    const legacyWithSlash = slashesList.find((s) => s.display === "/v1slash")
    expect(legacyWithSlash?.description).toBe("Custom slash name in v1")
    expect(legacyWithSlash?.aliases).toEqual(["/v1s"])
  } finally {
    app.renderer.destroy()
  }
})
