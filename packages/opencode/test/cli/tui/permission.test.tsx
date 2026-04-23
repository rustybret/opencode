/** @jsxImportSource @opentui/solid */
import { describe, expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import path from "path"
import { DialogProvider } from "../../../src/cli/cmd/tui/ui/dialog"
import { ToastProvider } from "../../../src/cli/cmd/tui/ui/toast"
import { KeybindProvider } from "../../../src/cli/cmd/tui/context/keybind"
import { KVProvider } from "../../../src/cli/cmd/tui/context/kv"
import { ThemeProvider } from "../../../src/cli/cmd/tui/context/theme"
import { TuiConfigProvider } from "../../../src/cli/cmd/tui/context/tui-config"
import { Prompt } from "../../../src/cli/cmd/tui/routes/session/permission"
import { Global } from "../../../src/global"

type Setup = Awaited<ReturnType<typeof testRender>>

function App(props: { onSelect: (option: "once" | "always" | "reject") => void }) {
  return (
    <TuiConfigProvider config={{}}>
      <KVProvider>
        <ThemeProvider mode="dark">
          <ToastProvider>
            <DialogProvider>
              <KeybindProvider>
                <Prompt
                  title="Permission required"
                  body={
                    <box>
                      <text>Prompt body</text>
                    </box>
                  }
                  options={{ once: "Allow once", always: "Allow always", reject: "Reject" }}
                  onSelect={props.onSelect}
                />
              </KeybindProvider>
            </DialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </KVProvider>
    </TuiConfigProvider>
  )
}

function locate(frame: string, text: string) {
  const lines = frame.split("\n")
  const y = lines.findIndex((line) => line.includes(text))
  if (y === -1) throw new Error(`Could not locate ${text}`)
  return { x: lines[y]!.indexOf(text), y }
}

async function waitForPrompt(setup: Setup) {
  for (let i = 0; i < 50; i++) {
    await setup.renderOnce()
    const frame = setup.captureCharFrame()
    if (frame.includes("Allow once") && frame.includes("Allow always") && frame.includes("Reject")) {
      return frame
    }
    await Bun.sleep(10)
  }

  throw new Error("Timed out waiting for permission prompt")
}

async function prepareKv() {
  await Bun.write(path.join(Global.Path.state, "kv.json"), JSON.stringify({}))
}

describe("permission prompt", () => {
  test("hover does not change the option Enter confirms", async () => {
    const calls: string[] = []
    await prepareKv()
    const setup = await testRender(() => <App onSelect={(option) => calls.push(option)} />, {
      width: 80,
      height: 20,
    })

    try {
      const frame = await waitForPrompt(setup)
      const reject = locate(frame, "Reject")

      setup.mockInput.pressArrow("right")
      await setup.renderOnce()

      await setup.mockMouse.moveTo(reject.x, reject.y)
      await setup.renderOnce()

      setup.mockInput.pressEnter()

      expect(calls).toEqual(["always"])
    } finally {
      setup.renderer.destroy()
    }
  })

  test("click still selects the hovered option", async () => {
    const calls: string[] = []
    await prepareKv()
    const setup = await testRender(() => <App onSelect={(option) => calls.push(option)} />, {
      width: 80,
      height: 20,
    })

    try {
      const frame = await waitForPrompt(setup)
      const reject = locate(frame, "Reject")

      setup.mockInput.pressArrow("right")
      await setup.renderOnce()

      await setup.mockMouse.click(reject.x, reject.y)

      expect(calls).toEqual(["reject"])
    } finally {
      setup.renderer.destroy()
    }
  })
})
