import fs from "node:fs"
import path from "node:path"
import { Global } from "@opencode-ai/core/global"

/**
 * On-disk registry of live TCP listeners, one JSON record per process.
 *
 * Written when `Server.listen` binds a real socket (serve / web / --port / TUI worker),
 * removed when the listener stops. External consumers (e.g. the oh-my-openagent
 * cross-project mailbox) use the presence of a record for their own pid to decide
 * whether this opencode process is externally reachable, and read `url` for the
 * real bound address instead of guessing ports.
 *
 * Everything here is best-effort: registry failures must never break the server.
 */

export interface ListenerRecord {
  pid: number
  url: string
  hostname: string
  port: number
  startedAt: number
}

function registryDir(): string {
  return path.join(Global.Path.state, "instances")
}

function recordPath(pid: number): string {
  return path.join(registryDir(), `${pid}.json`)
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function sweepStaleRecords(dir: string): void {
  let entries: string[]
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    const match = /^(\d+)\.json$/.exec(entry)
    if (!match) continue
    const pid = Number(match[1])
    if (pid === process.pid || isPidAlive(pid)) continue
    try {
      fs.rmSync(path.join(dir, entry), { force: true })
    } catch {
      // best-effort sweep; a locked or already-removed file is fine
    }
  }
}

export function publishListener(input: { url: URL; hostname: string; port: number }): void {
  try {
    const dir = registryDir()
    fs.mkdirSync(dir, { recursive: true })
    sweepStaleRecords(dir)
    const record: ListenerRecord = {
      pid: process.pid,
      url: input.url.toString(),
      hostname: input.hostname,
      port: input.port,
      startedAt: Date.now(),
    }
    const tmp = path.join(dir, `.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 })
    fs.renameSync(tmp, recordPath(process.pid))
  } catch {
    // registry is advisory only
  }
}

export function unpublishListener(): void {
  try {
    fs.rmSync(recordPath(process.pid), { force: true })
  } catch {
    // registry is advisory only
  }
}

// Finalizers do not run on signal-driven exits, so also unpublish on process exit;
// records surviving a hard kill are swept by the next publishListener call.
process.on("exit", unpublishListener)

export * as ListenerRegistry from "./listener-registry"
