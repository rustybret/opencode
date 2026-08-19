#!/usr/bin/env bun
import type { UcsExternalAppProgress } from "@ucs/contracts/external-app"
import { Effect, Option, Schema } from "effect"
import { createUnityMcpClient, createUnitySuperMcpAdapter, UNITY_SUPERMCP_DEFAULT_URL } from "../src/index"

/**
 * Live Unity SuperMCP end-to-end verification driver (Wave 4, Task 4.4).
 *
 * Drives the real bridge through the plan's validation sequence:
 * connect -> checkpoint -> bounded edit -> streamed progress -> session_changes
 * verify -> terminal state, and prints a structured report plus a timestamped
 * trace. Every phase is recorded rather than thrown, so an unreachable editor
 * produces evidence instead of a stack trace.
 *
 * Safety posture, inherited from the plan:
 *  - Mutations require `LIVE_MUTATION_ALLOW=1` *and* a `Created` checkpoint.
 *  - The protocol is not locked (Task 1.1 is blocked), so the driver refuses to
 *    guess a mutating tool name; naming one via `LIVE_MUTATION_TOOL` is opt-in.
 *  - `session_changes` is verification evidence only, never a checkpoint stand-in.
 *  - A blocked-on-human editor halts mutations; modals are never auto-dismissed.
 *
 * Environment:
 *   UNITY_SUPERMCP_URL      bridge endpoint (default 127.0.0.1:27182/mcp)
 *   LIVE_MUTATION_ALLOW     "1" unlocks the bounded edit + verify phases
 *   LIVE_MUTATION_TOOL      explicit bounded edit tool name (opt-in)
 *   LIVE_MUTATION_ARGS      JSON object of arguments for that tool
 *   UNITY_PROJECT_PATH      pins the target project, rejecting ambiguous instances
 *   E2E_TIMEOUT_MS          per-call deadline (default 15000)
 *   E2E_PROGRESS_TIMEOUT_MS terminal-tick deadline (default 20000)
 *   E2E_REPORT_PATH         optional path for the JSON report
 *
 * Exit codes: 0 pass | 1 phase failure | 2 bridge unreachable | 3 protocol-lock hard stop.
 */

const EXIT = { pass: 0, failed: 1, unreachable: 2, hardStop: 3 } as const

const decodeJson = Schema.decodeUnknownOption(Schema.UnknownFromJsonString)

const endpoint = process.env["UNITY_SUPERMCP_URL"] ?? UNITY_SUPERMCP_DEFAULT_URL
const mutationAllowed = process.env["LIVE_MUTATION_ALLOW"] === "1"
const mutationTool = process.env["LIVE_MUTATION_TOOL"]
const projectPath = process.env["UNITY_PROJECT_PATH"]
const timeoutMs = Number(process.env["E2E_TIMEOUT_MS"] ?? 15_000)
const progressTimeoutMs = Number(process.env["E2E_PROGRESS_TIMEOUT_MS"] ?? 20_000)

type PhaseStatus = "pass" | "fail" | "skip"

interface Phase {
  readonly name: string
  readonly status: PhaseStatus
  readonly detail: string
  readonly data?: unknown
  readonly elapsedMs: number
}

const startedAt = Date.now()
const phases: Phase[] = []

const record = (name: string, status: PhaseStatus, detail: string, data?: unknown) => {
  const phase: Phase = { name, status, detail, data, elapsedMs: Date.now() - startedAt }
  phases.push(phase)
  const marker = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "SKIP"
  console.log(`[${new Date().toISOString()}] ${marker} ${name.padEnd(24)} ${detail}`)
  return phase
}

console.log(`# live-unity-e2e :: ${endpoint}`)
console.log(
  `# mutations=${mutationAllowed ? "allowed" : "blocked"} tool=${mutationTool ?? "<none>"} project=${projectPath ?? "<any>"}`,
)

const adapter = createUnitySuperMcpAdapter({ url: endpoint, timeoutMs, appId: "unity", name: "Unity" })

// --- 1. connect: MCP handshake + bridge_status snapshot -------------------------------------------
const connected = await settle(adapter.connect(projectPath ? { projectPath } : undefined))
if (!connected.ok) {
  record("connect", "fail", describe(connected.error))
  await finish(EXIT.unreachable, "bridge unreachable or handshake rejected")
}
const snapshot = connected.ok ? connected.value : undefined
record("connect", "pass", `state=${snapshot?.state} health=${snapshot?.health} mode=${snapshot?.activeMode}`, snapshot)

// --- 2. capabilities: bounded discovery + protocol-lock gate --------------------------------------
const caps = await settle(adapter.capabilities())
if (!caps.ok) {
  record("capabilities", "fail", describe(caps.error))
  await finish(EXIT.failed, "capability discovery failed")
}
const capabilities = caps.ok ? caps.value : undefined
record(
  "capabilities",
  "pass",
  `version=${capabilities?.version} actions=${capabilities?.actions.length} checkpointSupported=${capabilities?.checkpointSupported}`,
  capabilities,
)

// --- 3. checkpoint: user-visible restore point before anything destructive ------------------------
const checkpointed = await settle(adapter.checkpoint("e2e-before-test"))
if (!checkpointed.ok) {
  record("checkpoint", "fail", describe(checkpointed.error))
  await finish(EXIT.failed, "checkpoint verb failed")
}
const checkpoint = checkpointed.ok ? checkpointed.value : undefined
if (checkpoint?._tag !== "Created") {
  record("checkpoint", "fail", `Unsupported: ${checkpoint?.reason ?? "no native checkpoint tool"}`, checkpoint)
  await finish(EXIT.hardStop, "Hard Stop Rule: bridge exposes no native checkpoint; destructive actions blocked")
}
record(
  "checkpoint",
  "pass",
  `id=${checkpoint?._tag === "Created" ? checkpoint.checkpointId : ""} label=e2e-before-test`,
  checkpoint,
)

// --- 4. status + blocked-on-human -----------------------------------------------------------------
const current = await settle(adapter.status())
if (!current.ok) {
  record("status", "fail", describe(current.error))
  await finish(EXIT.failed, "status verb failed")
}
record(
  "status",
  "pass",
  `state=${current.ok ? current.value.state : ""} modals=${current.ok ? (current.value.modalCount ?? 0) : 0}`,
  current.ok ? current.value : undefined,
)

const blockage = await settle(adapter.blockedOnHuman())
const blocked = blockage.ok && Option.isSome(blockage.value) ? blockage.value.value : undefined
record(
  "blocked-on-human",
  blockage.ok ? "pass" : "fail",
  blockage.ok ? (blocked ? `blocked: ${blocked.reason}` : "clear") : describe(blockage.error),
  blocked,
)

// --- 5. bounded edit (mutation-gated) --------------------------------------------------------------
const evidence = createUnityMcpClient({ url: endpoint, timeoutMs, clientName: "ucs-live-unity-e2e" })
if (!mutationAllowed) record("evidence-session", "skip", "raw session not opened while mutations are blocked")
if (mutationAllowed) {
  const ready = await settle(evidence.connect())
  record(
    "evidence-session",
    ready.ok ? "pass" : "fail",
    ready.ok ? "second MCP session open for raw tool reads" : describe(ready.error),
  )
}

if (!mutationAllowed) record("bounded-edit", "skip", "LIVE_MUTATION_ALLOW is not 1")
if (mutationAllowed && blocked) record("bounded-edit", "skip", `editor is blocked-on-human (${blocked.reason}); never auto-dismissed`)
if (mutationAllowed && !blocked && !mutationTool)
  record(
    "bounded-edit",
    "skip",
    "no LIVE_MUTATION_TOOL named; the bridge protocol is unlocked (Task 1.1) so no tool name is guessed",
  )
if (mutationAllowed && !blocked && mutationTool) {
  const args = Option.getOrUndefined(decodeJson(process.env["LIVE_MUTATION_ARGS"] ?? "{}"))
  const edited = await settle(evidence.callTool(mutationTool, asArgs(args)))
  record(
    "bounded-edit",
    edited.ok ? "pass" : "fail",
    edited.ok ? `${mutationTool} applied` : describe(edited.error),
    edited.ok ? edited.value : undefined,
  )
}

// --- 6. streamed progress: monotonic sequence, exactly one terminal ---------------------------------
const ticks: UcsExternalAppProgress[] = []
const reachedTerminal = await new Promise<boolean>((resolve) => {
  const timer = setTimeout(() => {
    stop()
    resolve(false)
  }, progressTimeoutMs)
  const stop = adapter.streamProgress((event) => {
    ticks.push(event)
    if (!event.terminal) return
    clearTimeout(timer)
    resolve(true)
  })
})
const monotonic = ticks.every((tick, index) => tick.sequence === index)
const terminals = ticks.filter((tick) => tick.terminal).length
const streamOk = reachedTerminal && monotonic && terminals === 1 && ticks.at(-1)?.terminal === true
record(
  "stream-progress",
  streamOk ? "pass" : "fail",
  `ticks=${ticks.length} terminal=${terminals} monotonic=${monotonic} withinDeadline=${reachedTerminal}`,
  ticks,
)

// --- 7. session_changes verification evidence (never a checkpoint substitute) -----------------------
if (!mutationAllowed) record("session-changes-verify", "skip", "LIVE_MUTATION_ALLOW is not 1")
if (mutationAllowed) {
  const changes = await settle(evidence.callTool("session_changes"))
  record(
    "session-changes-verify",
    changes.ok ? "pass" : "fail",
    changes.ok ? "evidence captured (verification only, not a restore point)" : describe(changes.error),
    changes.ok ? changes.value : undefined,
  )
}

// --- 8. terminal state: the stream must have unwound back off busy-streaming -------------------------
const settled = await settle(adapter.status())
const terminalState = settled.ok ? settled.value.state : undefined
record(
  "terminal-state",
  settled.ok && terminalState !== "busy-streaming" ? "pass" : "fail",
  settled.ok ? `state=${terminalState} health=${settled.value.health}` : describe(settled.error),
  settled.ok ? settled.value : undefined,
)

await Effect.runPromise(evidence.close())
await finish(phases.some((phase) => phase.status === "fail") ? EXIT.failed : EXIT.pass, "sequence complete")

// --- helpers -----------------------------------------------------------------------------------------

/** Settles an Effect into recordable data so one bad verb cannot abort the trace. */
function settle<A, E>(effect: Effect.Effect<A, E>) {
  return Effect.runPromise(effect).then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  )
}

function asArgs(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

/** Surfaces the typed failure's payload — `cause`/`detail` carry the operator-actionable reason. */
function describe(error: unknown) {
  if (typeof error !== "object" || error === null) return String(error)
  const failure = error as { _tag?: unknown; message?: unknown; cause?: unknown; detail?: unknown; timeoutMs?: unknown }
  const reason = failure.cause ?? failure.detail ?? failure.timeoutMs
  if (failure._tag !== undefined)
    return `${String(failure._tag)}: ${String(failure.message ?? "")}${reason === undefined ? "" : ` (${String(reason)})`}`
  if (error instanceof Error) return error.message
  return String(error)
}

/** Prints the structured report, optionally writes it, and exits. Never returns. */
async function finish(code: number, verdict: string): Promise<never> {
  const report = {
    endpoint,
    verdict,
    exitCode: code,
    mutationAllowed,
    startedAt: new Date(startedAt).toISOString(),
    durationMs: Date.now() - startedAt,
    counts: {
      pass: phases.filter((phase) => phase.status === "pass").length,
      fail: phases.filter((phase) => phase.status === "fail").length,
      skip: phases.filter((phase) => phase.status === "skip").length,
    },
    phases,
  }

  console.log("\n# report")
  console.log(JSON.stringify(report, null, 2))
  const target = process.env["E2E_REPORT_PATH"]
  if (target) await Bun.write(target, JSON.stringify(report, null, 2))
  console.log(`\n# verdict: ${verdict} (exit ${code})`)
  process.exit(code)
}
