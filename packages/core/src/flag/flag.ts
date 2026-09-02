import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["OPENCODE_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("OPENCODE_EXPERIMENTAL") : truthy(key)
}

const overrides: Record<string, any> = {}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  OPENCODE_AUTO_HEAP_SNAPSHOT: truthy("OPENCODE_AUTO_HEAP_SNAPSHOT"),
  OPENCODE_GIT_BASH_PATH: process.env["OPENCODE_GIT_BASH_PATH"],
  get OPENCODE_CONFIG() {
    return "OPENCODE_CONFIG" in overrides ? overrides["OPENCODE_CONFIG"] : process.env["OPENCODE_CONFIG"]
  },
  set OPENCODE_CONFIG(value: string | undefined) {
    overrides["OPENCODE_CONFIG"] = value
  },
  get OPENCODE_CONFIG_CONTENT() {
    return "OPENCODE_CONFIG_CONTENT" in overrides
      ? overrides["OPENCODE_CONFIG_CONTENT"]
      : process.env["OPENCODE_CONFIG_CONTENT"]
  },
  set OPENCODE_CONFIG_CONTENT(value: string | undefined) {
    overrides["OPENCODE_CONFIG_CONTENT"] = value
  },
  get OPENCODE_DISABLE_AUTOUPDATE() {
    return "OPENCODE_DISABLE_AUTOUPDATE" in overrides
      ? overrides["OPENCODE_DISABLE_AUTOUPDATE"]
      : truthy("OPENCODE_DISABLE_AUTOUPDATE")
  },
  set OPENCODE_DISABLE_AUTOUPDATE(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_AUTOUPDATE"] = value
  },
  get OPENCODE_ALWAYS_NOTIFY_UPDATE() {
    return "OPENCODE_ALWAYS_NOTIFY_UPDATE" in overrides
      ? overrides["OPENCODE_ALWAYS_NOTIFY_UPDATE"]
      : truthy("OPENCODE_ALWAYS_NOTIFY_UPDATE")
  },
  set OPENCODE_ALWAYS_NOTIFY_UPDATE(value: boolean | undefined) {
    overrides["OPENCODE_ALWAYS_NOTIFY_UPDATE"] = value
  },
  get OPENCODE_DISABLE_PRUNE() {
    return "OPENCODE_DISABLE_PRUNE" in overrides
      ? overrides["OPENCODE_DISABLE_PRUNE"]
      : truthy("OPENCODE_DISABLE_PRUNE")
  },
  set OPENCODE_DISABLE_PRUNE(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_PRUNE"] = value
  },
  get OPENCODE_DISABLE_TERMINAL_TITLE() {
    return "OPENCODE_DISABLE_TERMINAL_TITLE" in overrides
      ? overrides["OPENCODE_DISABLE_TERMINAL_TITLE"]
      : truthy("OPENCODE_DISABLE_TERMINAL_TITLE")
  },
  set OPENCODE_DISABLE_TERMINAL_TITLE(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_TERMINAL_TITLE"] = value
  },
  get OPENCODE_SHOW_TTFD() {
    return "OPENCODE_SHOW_TTFD" in overrides
      ? overrides["OPENCODE_SHOW_TTFD"]
      : truthy("OPENCODE_SHOW_TTFD")
  },
  set OPENCODE_SHOW_TTFD(value: boolean | undefined) {
    overrides["OPENCODE_SHOW_TTFD"] = value
  },
  get OPENCODE_DISABLE_AUTOCOMPACT() {
    return "OPENCODE_DISABLE_AUTOCOMPACT" in overrides
      ? overrides["OPENCODE_DISABLE_AUTOCOMPACT"]
      : truthy("OPENCODE_DISABLE_AUTOCOMPACT")
  },
  set OPENCODE_DISABLE_AUTOCOMPACT(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_AUTOCOMPACT"] = value
  },
  get OPENCODE_DISABLE_MODELS_FETCH() {
    return "OPENCODE_DISABLE_MODELS_FETCH" in overrides
      ? overrides["OPENCODE_DISABLE_MODELS_FETCH"]
      : truthy("OPENCODE_DISABLE_MODELS_FETCH")
  },
  set OPENCODE_DISABLE_MODELS_FETCH(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_MODELS_FETCH"] = value
  },
  get OPENCODE_DISABLE_MOUSE() {
    return "OPENCODE_DISABLE_MOUSE" in overrides
      ? overrides["OPENCODE_DISABLE_MOUSE"]
      : truthy("OPENCODE_DISABLE_MOUSE")
  },
  set OPENCODE_DISABLE_MOUSE(value: boolean | undefined) {
    overrides["OPENCODE_DISABLE_MOUSE"] = value
  },
  get OPENCODE_FAKE_VCS() {
    return "OPENCODE_FAKE_VCS" in overrides
      ? overrides["OPENCODE_FAKE_VCS"]
      : process.env["OPENCODE_FAKE_VCS"]
  },
  set OPENCODE_FAKE_VCS(value: string | undefined) {
    overrides["OPENCODE_FAKE_VCS"] = value
  },
  get OPENCODE_SERVER_PASSWORD() {
    return "OPENCODE_SERVER_PASSWORD" in overrides
      ? overrides["OPENCODE_SERVER_PASSWORD"]
      : process.env["OPENCODE_SERVER_PASSWORD"]
  },
  set OPENCODE_SERVER_PASSWORD(value: string | undefined) {
    overrides["OPENCODE_SERVER_PASSWORD"] = value
  },
  get OPENCODE_SERVER_USERNAME() {
    return "OPENCODE_SERVER_USERNAME" in overrides
      ? overrides["OPENCODE_SERVER_USERNAME"]
      : process.env["OPENCODE_SERVER_USERNAME"]
  },
  set OPENCODE_SERVER_USERNAME(value: string | undefined) {
    overrides["OPENCODE_SERVER_USERNAME"] = value
  },
  OPENCODE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("OPENCODE_DISABLE_FFF"),

  // Experimental
  OPENCODE_EXPERIMENTAL_FILEWATCHER: Config.boolean("OPENCODE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("OPENCODE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  get OPENCODE_MODELS_URL() {
    return "OPENCODE_MODELS_URL" in overrides
      ? overrides["OPENCODE_MODELS_URL"]
      : process.env["OPENCODE_MODELS_URL"]
  },
  set OPENCODE_MODELS_URL(value: string | undefined) {
    overrides["OPENCODE_MODELS_URL"] = value
  },
  get OPENCODE_MODELS_PATH() {
    return "OPENCODE_MODELS_PATH" in overrides
      ? overrides["OPENCODE_MODELS_PATH"]
      : process.env["OPENCODE_MODELS_PATH"]
  },
  set OPENCODE_MODELS_PATH(value: string | undefined) {
    overrides["OPENCODE_MODELS_PATH"] = value
  },
  get OPENCODE_DB() {
    return "OPENCODE_DB" in overrides ? overrides["OPENCODE_DB"] : process.env["OPENCODE_DB"]
  },
  set OPENCODE_DB(value: string | undefined) {
    overrides["OPENCODE_DB"] = value
  },

  get OPENCODE_WORKSPACE_ID() {
    return "OPENCODE_WORKSPACE_ID" in overrides
      ? overrides["OPENCODE_WORKSPACE_ID"]
      : process.env["OPENCODE_WORKSPACE_ID"]
  },
  set OPENCODE_WORKSPACE_ID(value: string | undefined) {
    overrides["OPENCODE_WORKSPACE_ID"] = value
  },
  get OPENCODE_EXPERIMENTAL_WORKSPACES() {
    return "OPENCODE_EXPERIMENTAL_WORKSPACES" in overrides
      ? overrides["OPENCODE_EXPERIMENTAL_WORKSPACES"]
      : enabledByExperimental("OPENCODE_EXPERIMENTAL_WORKSPACES")
  },
  set OPENCODE_EXPERIMENTAL_WORKSPACES(value: boolean | undefined) {
    overrides["OPENCODE_EXPERIMENTAL_WORKSPACES"] = value
  },

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get OPENCODE_DISABLE_PROJECT_CONFIG() {
    return truthy("OPENCODE_DISABLE_PROJECT_CONFIG")
  },
  get OPENCODE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("OPENCODE_EXPERIMENTAL_REFERENCES")
  },
  get OPENCODE_TUI_CONFIG() {
    return process.env["OPENCODE_TUI_CONFIG"]
  },
  get OPENCODE_CONFIG_DIR() {
    return process.env["OPENCODE_CONFIG_DIR"]
  },
  get OPENCODE_PURE() {
    return truthy("OPENCODE_PURE")
  },
  get OPENCODE_PERMISSION() {
    return process.env["OPENCODE_PERMISSION"]
  },
  get OPENCODE_PLUGIN_META_FILE() {
    return process.env["OPENCODE_PLUGIN_META_FILE"]
  },
  get OPENCODE_CLIENT() {
    return process.env["OPENCODE_CLIENT"] ?? "cli"
  },
}
