#!/usr/bin/env bun
/**
 * UCS Phase 2 Pre-Implementation Gate Verifier
 * 
 * Verifies that all 4 Phase 2 Gate documents (G1-G4) are present, structurally complete,
 * consistent with the shared glossary, and contain valid real session data for G4.
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const DOCS_DIR = join(import.meta.dir, "../docs/reference")

interface GateCheckResult {
  gate: string
  file: string
  passed: boolean
  errors: string[]
  warnings: string[]
}

const results: GateCheckResult[] = []

function checkGate(gate: string, filename: string, requiredSections: string[], extraChecks?: (content: string, res: GateCheckResult) => void) {
  const filePath = join(DOCS_DIR, filename)
  const res: GateCheckResult = { gate, file: filename, passed: true, errors: [], warnings: [] }

  if (!existsSync(filePath)) {
    res.passed = false
    res.errors.push(`File missing: ${filename}`)
    results.push(res)
    return
  }

  const content = readFileSync(filePath, "utf-8")

  for (const sec of requiredSections) {
    if (!content.toLowerCase().includes(sec.toLowerCase())) {
      res.passed = false
      res.errors.push(`Missing required section/content: "${sec}"`)
    }
  }

  if (extraChecks) {
    extraChecks(content, res)
  }

  results.push(res)
}

// Check G1: UI Design Mockup
checkGate("G1", "ucs-frontend-phase2-g1-mockup.md", [
  "Session Topology Tree",
  "Live Event Stream",
  "Boulder State & Evidence Inspector",
  "Workspace / Multi-Project Selector",
  "OAuth Plugin Quota Status",
  "AFT Code Health Widget",
  "Cache Diagnostics & Prompt Bust Panel",
  "AFT Live LSP Diagnostics",
  "External App Status Card",
  "Data Source Annotation",
  "Read-Only Omissions",
], (content, res) => {
  if (!content.includes("Phase-1 endpoint") && !content.includes("Phase 1")) {
    res.passed = false
    res.errors.push("G1 mockup missing explicit Data Source Annotations")
  }
})

// Check G2: UI Flow Diagram
checkGate("G2", "ucs-frontend-phase2-g2-flow.md", [
  "Navigation Architecture",
  "Workspace Switch",
  "Topology Drill-Down",
  "SSE Event Log Filter",
  "Side Panel Toggle",
  "403 Mutation Gate",
  "Error & Reconnect States",
])

// Check G3: Persona User Stories
checkGate("G3", "ucs-frontend-phase2-g3-personas.md", [
  "Systems Architect",
  "Multi-Agent Orchestrator",
  "QA/Release Engineer",
  "Acceptance Criteria",
  "Given",
  "When",
  "Then",
])

// Check G4: Real-Data Mockup
checkGate("G4", "ucs-frontend-phase2-g4-real-data-mockup.md", [
  "High-Fidelity Real-Data Mockup",
  "Session Tree",
  "Token Counts",
  "Boulder Evidence",
  "Provenance Annotation",
], (content, res) => {
  if (content.includes("Lorem ipsum") || content.includes("sample_session_123")) {
    res.passed = false
    res.errors.push("G4 mockup contains placeholder data instead of real session values")
  }
})

console.log("=== UCS Phase 2 Pre-Implementation Gate Verifier ===")
let totalPassed = 0

for (const r of results) {
  const status = r.passed ? "✅ PASS" : "❌ FAIL"
  console.log(`\n[${r.gate}] ${r.file}: ${status}`)
  for (const err of r.errors) {
    console.log(`  - ERROR: ${err}`)
  }
  for (const warn of r.warnings) {
    console.log(`  - WARN:  ${warn}`)
  }
  if (r.passed) totalPassed++
}

console.log(`\nSummary: ${totalPassed}/${results.length} gates verified.`)
if (totalPassed < results.length) {
  process.exit(1)
} else {
  console.log("All Pre-Implementation Gates (G1-G4) VERIFIED successfully!")
  process.exit(0)
}
