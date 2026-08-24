import { cmd } from "./cmd"
import { UI } from "@/cli/ui"
import { errorMessage } from "@opencode-ai/tui/util/error"
import { validateSession } from "../tui/validate-session"
import { ServerAuth } from "@/server/auth"

export function resolveAttachUrl(
  input?: string,
  config?: { server?: { hostname?: string; port?: number } },
): string {
  const defaultHostname = config?.server?.hostname || "127.0.0.1"
  const defaultPort = config?.server?.port || 4096

  if (!input || !input.trim()) {
    return `http://${defaultHostname}:${defaultPort}`
  }

  const trimmed = input.trim()

  // If the input is purely numeric digits (e.g. "4097", "8080"), treat as port on default host
  if (/^\d+$/.test(trimmed)) {
    const port = parseInt(trimmed, 10)
    return `http://${defaultHostname}:${port}`
  }

  // Prepend http:// if missing protocol scheme
  let withScheme = trimmed
  if (!/^https?:\/\//i.test(withScheme)) {
    withScheme = `http://${withScheme}`
  }

  try {
    const parsed = new URL(withScheme)
    // Check if port was explicitly specified in the input string
    const hasExplicitPort = parsed.port !== "" || /:\d+(\/|$|\?|#)/.test(withScheme)
    if (!hasExplicitPort) {
      parsed.port = String(defaultPort)
    }
    const result = parsed.toString()
    // Strip trailing slash added by WHATWG URL when path is default "/" and input didn't have "/"
    if (parsed.pathname === "/" && !withScheme.endsWith("/") && !trimmed.endsWith("/")) {
      return result.slice(0, -1)
    }
    return result
  } catch {
    return withScheme
  }
}

export const AttachCommand = cmd({
  command: "attach [url]",
  describe: "attach to a running opencode server",
  builder: (yargs) =>
    yargs
      .positional("url", {
        type: "string",
        describe: "http://127.0.0.1:4096, port number, or server hostname",
        demandOption: false,
      })
      .option("dir", {
        type: "string",
        description: "directory to run in",
      })
      .option("continue", {
        alias: ["c"],
        describe: "continue the last session",
        type: "boolean",
      })
      .option("session", {
        alias: ["s"],
        type: "string",
        describe: "session id to continue",
      })
      .option("fork", {
        type: "boolean",
        describe: "fork the session when continuing (use with --continue or --session)",
      })
      .option("password", {
        alias: ["p"],
        type: "string",
        describe: "basic auth password (defaults to OPENCODE_SERVER_PASSWORD)",
      })
      .option("username", {
        alias: ["u"],
        type: "string",
        describe: "basic auth username (defaults to OPENCODE_SERVER_USERNAME or 'opencode')",
      })
      .option("mini", {
        type: "boolean",
        describe: "start the minimal interactive interface",
        default: false,
      })
      .option("replay", {
        type: "boolean",
        hidden: true,
      })
      .option("no-replay", {
        type: "boolean",
        describe: "disable mini session history replay on resume and after resize",
      })
      .option("replay-limit", {
        type: "number",
        describe: "cap visible mini replay to the newest N messages",
      }),
  handler: async (args) => {
    if (args.replay === true) {
      UI.error("--replay is not supported; replay is enabled by default")
      process.exitCode = 1
      return
    }
    const noReplay = args.replay === false || args.noReplay === true

    const directory = (() => {
      if (!args.dir) return undefined
      try {
        process.chdir(args.dir)
        return process.cwd()
      } catch {
        // If the directory doesn't exist locally (remote attach), pass it through.
        return args.dir
      }
    })()

    const { Config } = await import("@/config/config")
    const { AppRuntime } = await import("@/effect/app-runtime")
    const globalConfig = await AppRuntime.runPromise(Config.Service.use((cfg) => cfg.getGlobal())).catch(
      () => undefined,
    )

    const url = resolveAttachUrl(args.url, globalConfig)

    if (args.mini) {
      const { runMini } = await import("./run")
      await runMini({
        attach: url,
        directory,
        password: args.password,
        username: args.username,
        continue: args.continue,
        session: args.session,
        fork: args.fork,
        replay: noReplay ? false : undefined,
        replayLimit: args.replayLimit,
      })
      return
    }

    const unsupported = [
      ["--no-replay", noReplay],
      ["--replay-limit", args.replayLimit !== undefined],
    ].find((entry) => entry[1])?.[0]
    if (unsupported) {
      UI.error(`${unsupported} requires --mini`)
      process.exitCode = 1
      return
    }

    const { TuiConfig } = await import("@/config/tui")
    if (args.fork && !args.continue && !args.session) {
      UI.error("--fork requires --continue or --session")
      process.exitCode = 1
      return
    }

    const headers = ServerAuth.headers({ password: args.password, username: args.username })
    const config = await TuiConfig.get()

    try {
      await validateSession({
        url,
        sessionID: args.session,
        directory,
        headers,
      })
    } catch (error) {
      UI.error(errorMessage(error))
      process.exitCode = 1
      return
    }

    const { Effect } = await import("effect")
    const { run } = await import("../tui/layer")
    const { createLegacyTuiPluginHost } = await import("@/plugin/tui/runtime")
    await Effect.runPromise(
      run({
        url,
        config,
        pluginHost: createLegacyTuiPluginHost(),
        args: {
          continue: args.continue,
          sessionID: args.session,
          fork: args.fork,
        },
        directory,
        headers,
      }),
    )
  },
})
