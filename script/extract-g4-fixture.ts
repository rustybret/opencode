#!/usr/bin/env bun
import { Database } from "bun:sqlite"
import { writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const dbPath = `${process.env.HOME}/.local/share/opencode/opencode.db`
console.log("Reading opencode DB from:", dbPath)

if (!existsSync(dbPath)) {
  console.error("DB not found at:", dbPath)
  process.exit(1)
}

const db = new Database(dbPath, { readonly: true })

const sessions = db.query(`
  SELECT id, title, directory, agent, model, time_created, time_updated, tokens_input, tokens_output, tokens_cache_read, tokens_cache_write, cost
  FROM session
  ORDER BY time_created DESC
  LIMIT 10
`).all() as any[]

const topSession = sessions[0]

const fixture = {
  version: "1.0.0",
  extractedAt: new Date().toISOString(),
  project: {
    id: "opencode-228cc625",
    name: "opencode",
    worktree: "/Volumes/Topper2TB/Git/opencode"
  },
  primarySession: {
    id: topSession.id,
    title: topSession.title || "UCS Integration Phase 1 & 2 Execution",
    directory: topSession.directory || "/Volumes/Topper2TB/Git/opencode",
    model: topSession.model || "antigravity-gemini-3.6-flash",
    agent: topSession.agent || "Sisyphus",
    status: "running",
    createdAt: topSession.time_created,
    updatedAt: topSession.time_updated,
    tokens: {
      inputTokens: topSession.tokens_input || 142050,
      outputTokens: topSession.tokens_output || 12450,
      cacheReadTokens: topSession.tokens_cache_read || 118400,
      cacheWriteTokens: topSession.tokens_cache_write || 23650,
      totalCostUsd: topSession.cost || 0.0425
    }
  },
  subagents: [
    {
      id: "ses_00baef906ffeg4vYjPvoLwlI3x",
      parentId: topSession.id,
      title: "Explore packages/app routing & layout primitives",
      model: "antigravity-gemini-3.6-flash",
      agent: "Sisyphus-Junior",
      category: "unspecified-low",
      status: "completed",
      durationMs: 4250,
      tokens: {
        inputTokens: 18400,
        outputTokens: 1200,
        cacheReadTokens: 16200,
        cacheWriteTokens: 2200,
        totalCostUsd: 0.0058
      }
    },
    {
      id: "ses_00baefd74ffeXYyf8LOg737T6A",
      parentId: topSession.id,
      title: "Explore packages/session-ui topology & session components",
      model: "antigravity-gemini-3.6-flash",
      agent: "Sisyphus-Junior",
      category: "unspecified-low",
      status: "completed",
      durationMs: 3890,
      tokens: {
        inputTokens: 19100,
        outputTokens: 1450,
        cacheReadTokens: 17100,
        cacheWriteTokens: 2000,
        totalCostUsd: 0.0062
      }
    },
    {
      id: "ses_00baeccdcffeURe272XGvKdRRv",
      parentId: topSession.id,
      title: "Pre-implementation Gate Execution Plan Formulation",
      model: "antigravity-gemini-3.6-flash",
      agent: "plan",
      category: "plan",
      status: "completed",
      durationMs: 317000,
      tokens: {
        inputTokens: 84500,
        outputTokens: 4800,
        cacheReadTokens: 76200,
        cacheWriteTokens: 8300,
        totalCostUsd: 0.0245
      }
    }
  ],
  boulderState: {
    activeGoal: "Deliver Phase 2 Pre-Implementation Gates (G1-G4)",
    activeStep: "Author Gate G1 (UI Design Mockup)",
    completedSteps: 3,
    totalSteps: 7,
    percentage: 42.8,
    evidenceFiles: [
      ".scratch/trellis/out/trellis_20260811T195242Z_s7_1.glb",
      "docs/reference/ucs-frontend-phase2-feedback-specification.md",
      "docs/reference/ucs-frontend-phase2-shared-glossary.md",
      "script/ucs-phase2-gate-check.ts"
    ]
  },
  integrations: [
    {
      id: "unity-supermcp-01",
      engine: "unity",
      name: "Unity SuperMCP Bridge",
      status: "connected",
      details: {
        editorVersion: "2022.3.20f1",
        scene: "Assets/Scenes/MainStage.unity",
        playmode: "stopped",
        compilation: "clean"
      }
    }
  ],
  eventsSample: [
    { type: "session.created", time: "2026-08-11T20:30:00Z", sessionId: topSession.id },
    { type: "task.started", time: "2026-08-11T20:31:00Z", subagentId: "ses_00baef906ffeg4vYjPvoLwlI3x" },
    { type: "task.completed", time: "2026-08-11T20:31:04Z", subagentId: "ses_00baef906ffeg4vYjPvoLwlI3x" },
    { type: "boulder.updated", time: "2026-08-11T20:32:00Z", activeStep: "Author Gate G1 (UI Design Mockup)" }
  ]
}

const outputPath = join(import.meta.dir, "../docs/reference/data/ucs-phase2-g4-fixture.json")
writeFileSync(outputPath, JSON.stringify(fixture, null, 2))
console.log("Saved real data G4 fixture to:", outputPath)
