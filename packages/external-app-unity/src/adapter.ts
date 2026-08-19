import {
  type UcsExternalAppAdapter,
  type UcsExternalAppBlockage,
  type UcsExternalAppCapabilities,
  type UcsExternalAppCheckpointResult,
  type UcsExternalAppConnectParams,
  type UcsExternalAppFailure,
  type UcsExternalAppHealth,
  type UcsExternalAppMode,
  type UcsExternalAppProgress,
  type UcsExternalAppSnapshot,
  type UcsExternalAppState,
  UcsExternalAppInstanceAmbiguityError,
  UcsExternalAppProtocolError,
} from "@ucs/contracts/external-app"
import { Effect, Option } from "effect"
import { createUnityMcpClient, type UnityMcpClient, type UnityMcpClientConfig } from "./mcp-client"

/**
 * Unity-specific tier of the `UcsExternalApp` contract.
 *
 * Everything Unity knows about itself lives here — tool names, domain tags,
 * blockage derivation, progress correlation — so `@ucs/contracts` stays
 * application-agnostic. The transport wire is owned by `./mcp-client`.
 */

/** Canonical Unity capability domains. These belong to the adapter, never to `@ucs/contracts`. */
export const UNITY_DOMAIN_TAGS = [
  "unity-scene",
  "unity-script-roslyn",
  "unity-asset",
  "unity-build",
  "unity-runtime",
] as const

/** Catch-all for a discovered tool whose domain the bridge does not declare and the name does not reveal. */
const UNITY_FALLBACK_DOMAIN = "unity-editor"

/** SuperMCP tool names this adapter speaks. Unverified against a live bridge — see Task 1.1 / 4.4. */
export const UNITY_TOOLS = {
  status: "bridge_status",
  relevantTools: "get_relevant_tools",
  checkpoint: "checkpoint",
  compileStatus: "compile_status",
  testRunResult: "test_run_result",
} as const

/** MCP protocol revisions this adapter has been built against. */
const SUPPORTED_PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18"]

const DEFAULT_CAPABILITY_QUERY =
  "scene hierarchy, C# script editing, asset import, build pipeline, play mode and test runs, checkpoint restore points"
const DEFAULT_CAPABILITY_LIMIT = 32
const DEFAULT_POLL_INTERVAL_MS = 500

const HEALTH_THROTTLED_AFTER_MS = 5_000
const HEALTH_STALLED_AFTER_MS = 15_000

export interface UnitySuperMcpAdapterConfig extends UnityMcpClientConfig {
  readonly appId?: string
  readonly name?: string
  /** Bounded natural-language query for `get_relevant_tools`; the raw catalog is never dumped. */
  readonly capabilityQuery?: string
  readonly capabilityLimit?: number
  readonly pollIntervalMs?: number
}

export function createUnitySuperMcpAdapter(config: UnitySuperMcpAdapterConfig = {}): UcsExternalAppAdapter {
  const client = createUnityMcpClient(config)
  const appId = config.appId ?? "unity"
  const pollIntervalMs = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS

  let lifecycle: UcsExternalAppState = "disconnected"
  let streaming = 0
  let cachedCapabilities: UcsExternalAppCapabilities | undefined
  /** Project pinned by a successful `connect`; once set, multi-instance is resolved, not ambiguous. */
  let pinned: string | undefined

  const readStatus = () =>
    client.callTool(UNITY_TOOLS.status).pipe(Effect.flatMap((raw) => decodeBridgeStatus(raw)))

  const snapshotOf = (status: BridgeStatus): UcsExternalAppSnapshot => {
    const blockage = deriveBlockage(status, pinned)
    return {
      appId,
      state: Option.isSome(blockage) ? "blocked-on-human" : streaming > 0 ? "busy-streaming" : lifecycle,
      health: status.health,
      activeMode: status.activeMode,
      focused: status.focused,
      backgroundMode: status.backgroundMode,
      lastHeartbeatAgeMs: status.lastHeartbeatAgeMs,
      modalCount: status.modalCount,
      projectPath: status.projectPath,
      scenePath: status.scenePath,
      blockage: Option.getOrUndefined(blockage),
      updatedAt: Date.now(),
    }
  }

  const connect = (params?: UcsExternalAppConnectParams): Effect.Effect<UcsExternalAppSnapshot, UcsExternalAppFailure> =>
    Effect.gen(function* () {
      lifecycle = "connecting"
      cachedCapabilities = undefined
      pinned = undefined
      yield* client.connect()
      const status = yield* readStatus()

      if (status.protocolVersion !== undefined && !SUPPORTED_PROTOCOL_VERSIONS.includes(status.protocolVersion))
        return yield* new UcsExternalAppProtocolError({
          message: `Unity SuperMCP bridge announced an unsupported protocol version`,
          detail: status.protocolVersion,
        })

      // Guessing between editors could mutate the wrong project, so refuse instead.
      if (status.instances.length > 1 && !uniquelyMatches(status.instances, params?.projectPath))
        return yield* new UcsExternalAppInstanceAmbiguityError({
          message: `Multiple Unity instances are reachable; pass connect params that identify exactly one`,
          candidates: status.instances,
        })

      if (
        params?.projectPath !== undefined &&
        status.projectPath !== undefined &&
        status.projectPath !== params.projectPath
      )
        return yield* new UcsExternalAppInstanceAmbiguityError({
          message: `Unity SuperMCP bridge is attached to a different project than requested`,
          candidates: [params.projectPath, status.projectPath],
        })

      lifecycle = "connected"
      pinned = params?.projectPath ?? status.projectPath
      return snapshotOf(status)
    }).pipe(
      Effect.tapError(() =>
        Effect.sync(() => {
          lifecycle = "error"
        }),
      ),
    )

  const status = (): Effect.Effect<UcsExternalAppSnapshot, UcsExternalAppFailure> =>
    readStatus().pipe(Effect.map(snapshotOf))

  const capabilities = (): Effect.Effect<UcsExternalAppCapabilities, UcsExternalAppFailure> =>
    Effect.gen(function* () {
      if (cachedCapabilities) return cachedCapabilities
      const raw = yield* client.callTool(UNITY_TOOLS.relevantTools, {
        query: config.capabilityQuery ?? DEFAULT_CAPABILITY_QUERY,
        limit: config.capabilityLimit ?? DEFAULT_CAPABILITY_LIMIT,
      })
      const decoded = yield* decodeCapabilities(raw, client.serverInfo()?.version)
      cachedCapabilities = decoded
      return decoded
    })

  const checkpoint = (label: string): Effect.Effect<UcsExternalAppCheckpointResult, UcsExternalAppFailure> =>
    Effect.gen(function* () {
      const caps = yield* capabilities()
      // Hard Stop Rule: no native restore point means `Unsupported`, never a substitute.
      if (!caps.checkpointSupported)
        return {
          _tag: "Unsupported",
          reason: `Unity SuperMCP bridge exposes no native "${UNITY_TOOLS.checkpoint}" tool`,
        } as const

      const raw = yield* client.callTool(UNITY_TOOLS.checkpoint, { label })
      const record = asRecord(raw)
      const checkpointId = record && str(record, "checkpointId", "id", "checkpoint_id")
      if (!record || !checkpointId)
        return yield* new UcsExternalAppProtocolError({
          message: `Unity SuperMCP "${UNITY_TOOLS.checkpoint}" returned no checkpoint id`,
          detail: JSON.stringify(raw)?.slice(0, 200),
        })

      return {
        _tag: "Created",
        checkpointId,
        label: str(record, "label") ?? label,
        createdAt: num(record, "createdAt", "created_at", "timestamp") ?? Date.now(),
      } as const
    })

  const blockedOnHuman = (): Effect.Effect<Option.Option<UcsExternalAppBlockage>, UcsExternalAppFailure> =>
    readStatus().pipe(Effect.map((status) => deriveBlockage(status, pinned)))

  const streamProgress = (onProgress: (event: UcsExternalAppProgress) => void) => {
    let stopped = false
    let sequence = 0
    let previous: string | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    streaming = streaming + 1

    const stop = () => {
      if (stopped) return
      stopped = true
      streaming = Math.max(0, streaming - 1)
      if (timer !== undefined) clearTimeout(timer)
    }

    const emit = (tick: Omit<UcsExternalAppProgress, "sequence">) => {
      const key = `${tick.operationId}\u0000${tick.message}\u0000${tick.progress ?? ""}\u0000${tick.terminal}`
      if (key === previous) return
      previous = key
      const event: UcsExternalAppProgress = { ...tick, sequence }
      sequence = sequence + 1
      onProgress(event)
      if (tick.terminal) stop()
    }

    const poll = async () => {
      if (stopped) return
      const compile = await Effect.runPromise(read(client, UNITY_TOOLS.compileStatus))
      if (stopped) return

      if (compile && !compile.terminal) emit({ ...compile, terminal: false })

      if (!compile || compile.terminal) {
        const tests = await Effect.runPromise(read(client, UNITY_TOOLS.testRunResult))
        if (stopped) return
        if (tests && !tests.terminal) emit({ ...tests, terminal: false })
        // Exactly one terminal tick closes the stream, correlated across both reads.
        if (!tests || tests.terminal) emit({ ...(tests ?? compile ?? idle()), terminal: true })
      }

      if (stopped) return
      timer = setTimeout(poll, pollIntervalMs)
    }

    void poll()

    return stop
  }

  return {
    appId,
    name: config.name ?? "Unity",
    connect,
    status,
    capabilities,
    checkpoint,
    blockedOnHuman,
    streamProgress,
  }
}

// --- normalization ------------------------------------------------------------------------------

interface BridgeStatus {
  readonly health: UcsExternalAppHealth
  readonly activeMode: UcsExternalAppMode
  readonly focused: boolean | undefined
  readonly backgroundMode: boolean | undefined
  readonly lastHeartbeatAgeMs: number | undefined
  readonly modalCount: number | undefined
  readonly projectPath: string | undefined
  readonly scenePath: string | undefined
  readonly protocolVersion: string | undefined
  readonly safeMode: boolean
  readonly compileErrorCount: number
  readonly focusRequired: boolean
  readonly instances: readonly string[]
}

function decodeBridgeStatus(raw: unknown): Effect.Effect<BridgeStatus, UcsExternalAppProtocolError> {
  const record = asRecord(raw)
  if (!record)
    return Effect.fail(
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP "${UNITY_TOOLS.status}" returned a non-object payload`,
        detail: String(raw).slice(0, 200),
      }),
    )

  const lastHeartbeatAgeMs = num(record, "lastHeartbeatAgeMs", "pumpTickAgeMs", "heartbeatAgeMs")
  const instances = record["instances"]

  return Effect.succeed({
    health: health(record, lastHeartbeatAgeMs),
    activeMode: mode(record),
    focused: bool(record, "focused", "editorFocused", "hasFocus"),
    backgroundMode: bool(record, "backgroundMode", "runInBackground"),
    lastHeartbeatAgeMs,
    modalCount: num(record, "modalCount", "pendingModalCount", "pending_modal_count"),
    projectPath: str(record, "projectPath", "project_path"),
    scenePath: str(record, "scenePath", "activeScene", "scene_path"),
    protocolVersion: str(record, "protocolVersion", "protocol_version"),
    safeMode: bool(record, "safeMode", "safe_mode", "inSafeMode") === true,
    compileErrorCount: num(record, "compileErrorCount", "compileErrors", "compile_error_count") ?? 0,
    focusRequired: bool(record, "focusRequired", "requiresFocus") === true,
    instances: Array.isArray(instances) ? instances.filter((item): item is string => typeof item === "string") : [],
  })
}

/**
 * Blockage precedence is specificity-first, not the plan's listing order: Unity's
 * Safe Mode *is* a modal, so checking `safeMode` first keeps the more actionable
 * reason instead of collapsing it into a generic `modal`.
 */
function deriveBlockage(status: BridgeStatus, pinned: string | undefined): Option.Option<UcsExternalAppBlockage> {
  if (status.safeMode)
    return Option.some({ reason: "safe-mode", detail: "Unity is in Safe Mode; a human must resolve it" } as const)

  if ((status.modalCount ?? 0) > 0)
    return Option.some({
      reason: "modal",
      detail: `${status.modalCount} modal dialog(s) open; the adapter never dismisses them`,
    } as const)

  if (status.compileErrorCount > 0)
    return Option.some({
      reason: "compile-errors-require-human",
      detail: `${status.compileErrorCount} compile error(s) block further automation`,
    } as const)

  if (status.instances.length > 1 && !uniquelyMatches(status.instances, pinned))
    return Option.some({
      reason: "instance-selection-required",
      detail: status.instances.join(", "),
    } as const)

  if (status.focusRequired || status.focused === false)
    return Option.some({
      reason: "editor-focus-required",
      detail: "Unity requires editor focus; the adapter never steals OS focus",
    } as const)

  return Option.none()
}

function decodeCapabilities(
  raw: unknown,
  fallbackVersion: string | undefined,
): Effect.Effect<UcsExternalAppCapabilities, UcsExternalAppProtocolError> {
  const record = asRecord(raw)
  const listed = record?.["tools"] ?? record?.["actions"] ?? raw
  if (!Array.isArray(listed))
    return Effect.fail(
      new UcsExternalAppProtocolError({
        message: `Unity SuperMCP "${UNITY_TOOLS.relevantTools}" returned no tool list`,
        detail: JSON.stringify(raw)?.slice(0, 200),
      }),
    )

  const actions = listed.flatMap((item) => {
    const tool = asRecord(item)
    const id = tool && str(tool, "id", "name")
    if (!tool || !id) return []
    return [{ id, name: str(tool, "name", "title") ?? id, domain: domainOf(tool, id) }]
  })

  const canonical: readonly string[] = UNITY_DOMAIN_TAGS
  const extra = [...new Set(actions.map((action) => action.domain))].filter((tag) => !canonical.includes(tag))
  const declared = record ? bool(record, "checkpointSupported", "checkpoint_supported") : undefined

  return Effect.succeed({
    version: (record && str(record, "version", "bridgeVersion")) ?? fallbackVersion ?? "unknown",
    actions,
    domainTags: [...canonical, ...extra],
    checkpointSupported: declared ?? actions.some((action) => action.id === UNITY_TOOLS.checkpoint),
  })
}

function domainOf(tool: Record<string, unknown>, id: string) {
  const declared = str(tool, "domain", "category", "domainTag")
  if (declared) return declared
  const lowered = id.toLowerCase()
  if (lowered.includes("scene") || lowered.includes("hierarchy") || lowered.includes("gameobject")) return "unity-scene"
  if (lowered.includes("script") || lowered.includes("roslyn") || lowered.includes("compile"))
    return "unity-script-roslyn"
  if (lowered.includes("asset") || lowered.includes("prefab") || lowered.includes("import")) return "unity-asset"
  if (lowered.includes("build") || lowered.includes("player")) return "unity-build"
  if (lowered.includes("play") || lowered.includes("runtime") || lowered.includes("test")) return "unity-runtime"
  return UNITY_FALLBACK_DOMAIN
}

// --- progress -----------------------------------------------------------------------------------

interface ProgressRead {
  readonly operationId: string
  readonly message: string
  readonly progress: number | undefined
  readonly terminal: boolean
}

const TERMINAL_STATUSES = ["idle", "done", "complete", "completed", "finished", "succeeded", "success", "failed"]

function read(client: UnityMcpClient, tool: string): Effect.Effect<ProgressRead | undefined> {
  return client.callTool(tool).pipe(
    Effect.map((raw) => {
      const record = asRecord(raw)
      if (!record) return undefined
      const status = str(record, "status", "state", "phase")
      const running = bool(record, "running", "compiling", "inProgress", "isRunning")
      const finished = bool(record, "done", "finished", "complete")
      return {
        operationId: str(record, "operationId", "id", "operation_id") ?? tool,
        message: str(record, "message", "detail", "summary") ?? status ?? tool,
        // Never fabricated: absent upstream means absent downstream.
        progress: num(record, "progress", "fraction"),
        terminal:
          finished === true || running === false || (status !== undefined && TERMINAL_STATUSES.includes(status)),
      }
    }),
    Effect.catch(() => Effect.succeed(undefined)),
  )
}

function idle(): ProgressRead {
  return { operationId: "unity-idle", message: "idle", progress: undefined, terminal: true }
}

// --- tolerant field readers ---------------------------------------------------------------------

function asRecord(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function str(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return undefined
}

function num(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
  }
  return undefined
}

function bool(source: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "boolean") return value
  }
  return undefined
}

function uniquelyMatches(instances: readonly string[], projectPath: string | undefined) {
  if (projectPath === undefined) return false
  return instances.filter((instance) => instance === projectPath).length === 1
}

function health(record: Record<string, unknown>, lastHeartbeatAgeMs: number | undefined): UcsExternalAppHealth {
  const declared = str(record, "health")
  if (declared === "healthy" || declared === "throttled" || declared === "stalled" || declared === "unreachable")
    return declared
  if (lastHeartbeatAgeMs === undefined) return "healthy"
  if (lastHeartbeatAgeMs >= HEALTH_STALLED_AFTER_MS) return "stalled"
  if (lastHeartbeatAgeMs >= HEALTH_THROTTLED_AFTER_MS) return "throttled"
  return "healthy"
}

function mode(record: Record<string, unknown>): UcsExternalAppMode {
  const declared = str(record, "activeMode", "mode", "playMode")
  if (declared === "edit" || declared === "play") return declared
  const playing = bool(record, "isPlaying", "playing", "inPlayMode")
  if (playing === true) return "play"
  if (playing === false) return "edit"
  return "unknown"
}
