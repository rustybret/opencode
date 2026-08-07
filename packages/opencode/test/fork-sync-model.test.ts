import { describe, expect, test } from "bun:test"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

// Fork sync model audit — enforces the fast-forward-or-merge sync policy.
//
// The fork syncs upstream via script/fork-sync.sh (FF-or-merge, never rebase,
// never force-push). This audit is a code/config guard: it scans the
// executable surfaces (the sync script, the exclusion manifest, the doc
// command fences, and workflow directories) for history-rewriting commands or
// restored upstream workflows.

const REPO_ROOT = join(import.meta.dir, "../../..")
const SCRIPT = join(REPO_ROOT, "script/fork-sync.sh")
const EXCLUSIONS = join(REPO_ROOT, "script/fork-sync-exclusions")
const AGENTS_DOC = join(REPO_ROOT, "AGENTS.md")
const CONTRIBUTING_DOC = join(REPO_ROOT, "CONTRIBUTING.md")
const README_DOC = join(REPO_ROOT, "README.md")
const WORKFLOWS_DIR = join(REPO_ROOT, ".github/workflows")

// Command tokens that must never appear in executable sync surface.
const FORBIDDEN_TOKENS: Array<{ token: RegExp; why: string }> = [
  { token: /\bgit\s+rebase\b/, why: "rebase-based sync is banned (rewrites published history)" },
  { token: /\bgit\s+pull\b/, why: "git pull may rebase; use fetch + merge --ff-only" },
  { token: /--force-with-lease/, why: "force-push is banned on fork/local" },
  { token: /\bgit\s+push\b.*--force/, why: "force-push is banned on fork/local" },
  { token: /\breset\s+--hard\b/, why: "destructive reset is banned on pushed branches" },
]

function parseManifest(text: string): { keepDeleted: string[]; takeTheirs: string[] } {
  const keepDeleted: string[] = []
  const takeTheirs: string[] = []
  for (const rawLine of text.split("\n")) {
    const line = rawLine.split("#")[0]!.trim()
    if (line === "") continue
    if (line.startsWith("keep-deleted:")) keepDeleted.push(line.slice("keep-deleted:".length).trim())
    else if (line.startsWith("take-theirs:")) takeTheirs.push(line.slice("take-theirs:".length).trim())
  }
  return { keepDeleted, takeTheirs }
}

function codeFences(text: string): string[] {
  const fences: string[] = []
  let inFence = false
  let current = ""
  for (const line of text.split("\n")) {
    if (line.trimStart().startsWith("```")) {
      if (inFence) fences.push(current)
      inFence = !inFence
      current = ""
      continue
    }
    if (inFence) current += line + "\n"
  }
  return fences
}

describe("#given the fork sync model", () => {
  test("script/fork-sync.sh exists and never invokes banned commands", () => {
    expect(existsSync(SCRIPT)).toBe(true)
    const script = readFileSync(SCRIPT, "utf8")
    for (const { token, why } of FORBIDDEN_TOKENS) {
      const match = script.match(token)
      expect(match, `${token} found in ${SCRIPT} (${why})`).toBeNull()
    }
  })

  test("script/fork-sync.sh implements the ff-or-merge procedure", () => {
    const script = readFileSync(SCRIPT, "utf8")
    expect(script).toContain("merge --ff-only")
    expect(script).toContain("fork/local")
    expect(script).toContain("fork-sync-exclusions")
    expect(script).toContain("opencode-mirror")
  })

  test("maintenance doc code fences contain no banned commands", () => {
    for (const docPath of [AGENTS_DOC, CONTRIBUTING_DOC, README_DOC]) {
      if (!existsSync(docPath)) continue
      const docText = readFileSync(docPath, "utf8")
      const fences = codeFences(docText)
      for (const fence of fences) {
        for (const { token, why } of FORBIDDEN_TOKENS) {
          const match = fence.match(token)
          expect(match, `${token} found in code fence of ${docPath} (${why})`).toBeNull()
        }
      }
    }
  })

  test("no GitHub Actions workflows exist in .github/workflows/ (fork runs no GHA jobs)", () => {
    if (!existsSync(WORKFLOWS_DIR)) return
    const files = readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    expect(files).toEqual([])
  })

  test("exclusion manifest parses and covers all standing fork deletions", () => {
    expect(existsSync(EXCLUSIONS)).toBe(true)
    const { keepDeleted } = parseManifest(readFileSync(EXCLUSIONS, "utf8"))
    for (const glob of [
      ".github/CODEOWNERS",
      ".github/TEAM_MEMBERS",
      ".github/actions/*",
      ".github/publish-python-sdk.yml",
      ".github/pull_request_template.md",
      ".github/workflows/*",
      "SECURITY.md",
      "STATS.md",
    ]) {
      expect(keepDeleted, `missing keep-deleted glob: ${glob}`).toContain(glob)
    }
  })
})
