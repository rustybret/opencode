#!/usr/bin/env bun
/**
 * extract-session.ts
 *
 * Extracts complete opencode session transcripts including dropped/compacted
 * tool outputs from the magic-context DB. Outputs JSONL in OpenAI chat format,
 * ready for Harmony encoding via format-harmony.py.
 *
 * Usage:
 *   bun scripts/finetune/extract-session.ts [options]
 *
 * Options:
 *   --session <id>       Extract a single session by ID
 *   --all                Extract all sessions across all channel DBs
 *   --min-turns <n>      Minimum user turns to include (default: 2)
 *   --output <path>      Output JSONL path (default: ./sessions.jsonl)
 *   --no-dropped         Exclude dropped/compacted tool outputs
 *   --no-compartments    Exclude historian compartment summaries
 *   --list               List available sessions and exit
 */

import { Database } from "bun:sqlite"
import { writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from "fs"
import { dirname, join } from "path"

const HOME = process.env.HOME ?? ""
const DATA_DIR = process.env.XDG_DATA_HOME ?? join(HOME, ".local", "share")

// magic-context DB: legacy path has source_contents; shared path is newer
const MC_DB_LEGACY = join(DATA_DIR, "opencode", "storage", "plugin", "magic-context", "context.db")
const MC_DB_SHARED = join(DATA_DIR, "cortexkit", "magic-context", "context.db")
const MC_DB_PATH = existsSync(MC_DB_LEGACY) ? MC_DB_LEGACY : MC_DB_SHARED

const OC_ROOT = join(DATA_DIR, "opencode")
const args = process.argv.slice(2)
const getArg = (flag: string) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined }
const hasFlag = (flag: string) => args.includes(flag)

const sessionId = getArg("--session")
const extractAll = hasFlag("--all")
const minTurns = parseInt(getArg("--min-turns") ?? "2")
const outputPath = getArg("--output") ?? "./sessions.jsonl"
const includeDropped = !hasFlag("--no-dropped")
const includeCompartments = !hasFlag("--no-compartments")
const listOnly = hasFlag("--list")

if (!sessionId && !extractAll && !listOnly) {
  console.error("Usage: bun extract-session.ts --session <id> | --all | --list")
  process.exit(1)
}

if (!existsSync(MC_DB_PATH)) {
  console.error(`magic-context DB not found at:\n  ${MC_DB_LEGACY}\n  ${MC_DB_SHARED}`)
  process.exit(1)
}

// Returns all opencode channel DB paths
function allChannelDbs(): string[] {
  return readdirSync(OC_ROOT)
    .filter(f => f.startsWith("opencode") && f.endsWith(".db") && !f.endsWith("-shm") && !f.endsWith("-wal"))
    .map(f => join(OC_ROOT, f))
}

function openDb(path: string): Database | null {
  try { return new Database(path, { readonly: true }) } catch { return null }
}

function findChannelDb(sid: string): { db: Database; path: string } | null {
  for (const p of allChannelDbs()) {
    const db = openDb(p)
    if (!db) continue
    try {
      const row = db.query<{ id: string }, [string]>("SELECT id FROM session WHERE id = ? LIMIT 1").get(sid)
      if (row) return { db, path: p }
    } catch { /* skip */ }
    db.close()
  }
  return null
}

const mcDb = new Database(MC_DB_PATH, { readonly: true })

// ── List mode ──────────────────────────────────────────────────────────────

if (listOnly) {
  for (const p of allChannelDbs()) {
    const db = openDb(p)
    if (!db) continue
    try {
      const sessions = db.query<{ id: string; title: string; agent: string; time_created: number }, []>(
        "SELECT id, title, agent, time_created FROM session ORDER BY time_created DESC LIMIT 20"
      ).all()
      for (const s of sessions) {
        const date = new Date(s.time_created).toISOString().slice(0, 10)
        console.log(`${date}  ${s.id}  ${(s.agent ?? "").padEnd(30)}  ${s.title?.slice(0, 60) ?? ""}`)
      }
    } catch { /* skip */ }
    db.close()
  }
  process.exit(0)
}

// ── Types ───────────────────────────────────────────────────────────────────

interface OcSession { id: string; title: string; agent: string; time_created: number; project_id: string }
interface OcMessage { id: string; role: string; time_created: number }
interface OcPart { id: string; message_id: string; type: string; data: string }
interface McTag {
  id: number; session_id: string; message_id: string; type: string; status: string
  tag_number: number; drop_mode: string; tool_name: string | null
  byte_size: number; reasoning_byte_size: number; caveman_depth: number
}
interface SourceContent { tag_id: number; content: string }
interface Compartment { sequence: number; title: string; content: string; start_message_id: string; end_message_id: string }

interface Turn {
  role: "user" | "assistant" | "tool" | "compartment"
  content: string
  tool_name?: string
  tool_call_id?: string
  status: "active" | "dropped" | "compacted"
  reasoning?: string
}

// Tags store message_id as "msg_xxx:p0" — strip the :pN suffix for joining
function stripPartSuffix(msgId: string): string {
  const colon = msgId.lastIndexOf(":")
  return colon !== -1 && msgId.slice(colon + 1).match(/^p\d+$/) ? msgId.slice(0, colon) : msgId
}


function extractSession(ocDb: Database, sid: string): Turn[] | null {
  const messages = ocDb.query<OcMessage, [string]>(
    "SELECT id, json_extract(data,'$.role') as role, time_created FROM message WHERE session_id = ? ORDER BY time_created"
  ).all(sid)

  if (!messages.length) return null

  const parts = ocDb.query<OcPart, [string]>(
    "SELECT id, message_id, json_extract(data,'$.type') as type, data FROM part WHERE session_id = ? ORDER BY time_created"
  ).all(sid)

  const partsByMsg = new Map<string, OcPart[]>()
  for (const p of parts) {
    const arr = partsByMsg.get(p.message_id) ?? []
    arr.push(p)
    partsByMsg.set(p.message_id, arr)
  }

  // Load magic-context tags — strip :pN suffix to get bare message IDs
  const tags = mcDb.query<McTag, [string]>(
    "SELECT id, session_id, message_id, type, status, tag_number, drop_mode, tool_name, byte_size, reasoning_byte_size, caveman_depth FROM tags WHERE session_id = ? ORDER BY tag_number"
  ).all(sid)

  const tagByBareId = new Map<string, McTag>()
  const droppedTagIds = new Set<number>()
  for (const t of tags) {
    const bare = stripPartSuffix(t.message_id)
    tagByBareId.set(bare, t)
    if (t.status === "dropped" || t.status === "compacted") droppedTagIds.add(t.id)
  }

  // Load source_contents for dropped tags
  const sourceMap = new Map<number, string>()
  if (includeDropped && droppedTagIds.size > 0) {
    const ids = [...droppedTagIds].join(",")
    const rows = mcDb.query<SourceContent, []>(
      `SELECT tag_id, content FROM source_contents WHERE session_id = '${sid}' AND tag_id IN (${ids})`
    ).all()
    for (const r of rows) sourceMap.set(r.tag_id, r.content)
  }

  // Load compartments (historian summaries of pruned history)
  const compartments = includeCompartments
    ? mcDb.query<Compartment, [string]>(
        "SELECT sequence, title, content, start_message_id, end_message_id FROM compartments WHERE session_id = ? ORDER BY sequence"
      ).all(sid)
    : []

  const turns: Turn[] = []

  // Inject compartment summaries as historian turns before message processing
  for (const c of compartments) {
    turns.push({
      role: "compartment",
      content: `[Historian Summary — ${c.title}]\n${c.content}`,
      status: "compacted",
    })
  }

  // Process messages in order
  for (const msg of messages) {
    const tag = tagByBareId.get(msg.id)
    const status = (tag?.status ?? "active") as Turn["status"]
    const msgParts = partsByMsg.get(msg.id) ?? []

    if (!includeDropped && (status === "dropped" || status === "compacted")) continue

    if (msg.role === "user") {
      let content = ""
      for (const p of msgParts) {
        if (p.type === "text") {
          const d = JSON.parse(p.data)
          content += (d.text ?? "") + "\n"
        }
      }
      content = content.trim()
      if (!content && tag && sourceMap.has(tag.id)) content = sourceMap.get(tag.id)!
      if (content) turns.push({ role: "user", content, status })
      continue
    }

    if (msg.role === "assistant") {
      let textContent = ""
      let reasoning = ""

      for (const p of msgParts) {
        const d = JSON.parse(p.data)
        if (p.type === "text" && d.text) textContent += d.text
        if (p.type === "reasoning" && d.text) reasoning += d.text
        if (p.type === "tool") {
          const toolOutput = d.state?.output
          if (toolOutput !== undefined) {
            let output: string
            try { output = typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput) }
            catch { output = String(toolOutput) }
            turns.push({
              role: "tool",
              content: output,
              tool_name: d.tool ?? undefined,
              tool_call_id: d.callID ?? d.id ?? undefined,
              status,
            })
          }
        }
      }

      if (!textContent && tag && sourceMap.has(tag.id)) textContent = sourceMap.get(tag.id)!

      const content = textContent.trim()
      if (content || reasoning) {
        turns.push({
          role: "assistant",
          content,
          ...(reasoning.trim() ? { reasoning: reasoning.trim() } : {}),
          status,
        } as Turn & { reasoning?: string })
      }
    }
  }

  return turns
}

function turnsToMessages(turns: Turn[]) {
  const messages: Record<string, unknown>[] = []
  for (const t of turns) {
    if (t.role === "compartment") {
      messages.push({ role: "system", content: t.content, _source: "compartment" })
      continue
    }
    if (t.role === "tool") {
      messages.push({
        role: "tool",
        content: t.content,
        ...(t.tool_name ? { name: t.tool_name } : {}),
        ...(t.tool_call_id ? { tool_call_id: t.tool_call_id } : {}),
      })
      continue
    }
    messages.push({ role: t.role, content: t.content })
  }
  return messages
}

// ── Main ────────────────────────────────────────────────────────────────────

const outputDir = dirname(outputPath)
if (outputDir && outputDir !== ".") mkdirSync(outputDir, { recursive: true })
writeFileSync(outputPath, "")

// Collect sessionId → channel DB path across all channels
const sessionMap = new Map<string, string>()
if (sessionId) {
  const found = findChannelDb(sessionId)
  if (!found) { console.error(`Session not found: ${sessionId}`); process.exit(1) }
  sessionMap.set(sessionId, found.path)
  found.db.close()
} else {
  for (const p of allChannelDbs()) {
    const db = openDb(p)
    if (!db) continue
    try {
      const sessions = db.query<{ id: string }, []>("SELECT id FROM session ORDER BY time_created DESC").all()
      for (const s of sessions) sessionMap.set(s.id, p)
    } catch { /* skip */ }
    db.close()
  }
}

let exported = 0
let skipped = 0

for (const [sid, dbPath] of sessionMap) {
  const ocDb = openDb(dbPath)
  if (!ocDb) { skipped++; continue }

  let meta: OcSession | null = null
  try {
    const cols = ocDb.query<{ name: string }, []>("PRAGMA table_info(session)").all().map(r => r.name)
    const select = ["id", "title", "agent", "time_created", "project_id"]
      .filter(c => cols.includes(c)).join(", ")
    meta = ocDb.query<OcSession, [string]>(`SELECT ${select} FROM session WHERE id = ? LIMIT 1`).get(sid)
  } catch { /* older schema — skip meta */ }

  const turns = extractSession(ocDb, sid)
  ocDb.close()

  if (!turns) { skipped++; continue }

  const userTurns = turns.filter(t => t.role === "user").length
  if (userTurns < minTurns) { skipped++; continue }

  const record = {
    session_id: sid,
    agent: meta?.agent ?? null,
    title: meta?.title ?? null,
    time_created: meta?.time_created ?? null,
    messages: turnsToMessages(turns),
  }
  const json = JSON.stringify(record)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
  appendFileSync(outputPath, json + "\n")
  exported++
  process.stdout.write(`\rExported ${exported} sessions (${skipped} skipped)...`)
}

console.log(`\nDone. ${exported} sessions → ${outputPath}`)
console.log(`Next: python3 scripts/finetune/format-harmony.py ${outputPath}`)
