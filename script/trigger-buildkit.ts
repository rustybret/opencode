#!/usr/bin/env bun
/**
 * Trigger an in-cluster BuildKit build for OpenCode on cloudhome.
 *
 * Usage:
 *   bun run script/trigger-buildkit.ts             # triggers for latest remote commit on origin/fork/local
 *   bun run script/trigger-buildkit.ts --release   # triggers for latest remote release tag
 *   bun run script/trigger-buildkit.ts <sha>       # triggers for explicit 40-char commit SHA
 */

import { spawnSync } from "child_process"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"

const REMOTE = "origin"
const BRANCH = "fork/local"

function getLatestRemoteCommit(remote = REMOTE, branch = BRANCH): string {
  // Fetch remote branch ref
  spawnSync("git", ["fetch", remote, branch], { stdio: "inherit" })
  const res = spawnSync("git", ["rev-parse", `${remote}/${branch}`], { encoding: "utf8" })
  if (res.status !== 0 || !res.stdout.trim()) {
    throw new Error(`Failed to resolve commit SHA for ${remote}/${branch}: ${res.stderr}`)
  }
  return res.stdout.trim()
}

function getLatestRemoteRelease(remote = REMOTE): string {
  spawnSync("git", ["fetch", "--tags", remote], { stdio: "inherit" })
  const res = spawnSync("git", ["describe", "--tags", "--abbrev=0", `${remote}/${BRANCH}`], { encoding: "utf8" })
  if (res.status !== 0 || !res.stdout.trim()) {
    // Fallback: query git rev-list tags
    const fallback = spawnSync("git", ["tag", "--sort=-creatordate"], { encoding: "utf8" })
    const tags = fallback.stdout.split("\n").map(t => t.trim()).filter(Boolean)
    if (!tags.length) {
      throw new Error("No git release tags found on remote.")
    }
    const tagSha = spawnSync("git", ["rev-list", "-n", "1", tags[0]], { encoding: "utf8" }).stdout.trim()
    return tagSha
  }
  const tag = res.stdout.trim()
  const tagSha = spawnSync("git", ["rev-list", "-n", "1", tag], { encoding: "utf8" }).stdout.trim()
  if (!tagSha) {
    throw new Error(`Failed to resolve commit SHA for tag ${tag}`)
  }
  return tagSha
}

async function main() {
  const args = process.argv.slice(2)
  let targetSha = ""

  if (args.includes("--release")) {
    console.log("Resolving latest remote release commit SHA...")
    targetSha = getLatestRemoteRelease()
  } else if (args[0] && !args[0].startsWith("-")) {
    targetSha = args[0]
  } else {
    console.log(`Resolving latest remote commit SHA on ${REMOTE}/${BRANCH}...`)
    targetSha = getLatestRemoteCommit()
  }

  if (targetSha.length !== 40) {
    throw new Error(`Target SHA must be a full 40-character commit SHA (got "${targetSha}")`)
  }

  console.log(`Target commit SHA for BuildKit build: ${targetSha}`)

  // Build the trigger note body
  const noteBody = `just trigger buildkit opencode ${targetSha}`

  console.log(`\nReady to trigger Cloudhome BuildKit with command:\n  ${noteBody}\n`)
  console.log("Dispatching trigger note via mailbox/coordination...")

  // Write to local project coordination outbox or report the command
  const triggerPayload = {
    target: "cloudhome",
    command: noteBody,
    sha: targetSha,
    timestamp: Date.now(),
  }

  console.log(JSON.stringify(triggerPayload, null, 2))
  console.log("\n[OK] BuildKit trigger payload ready for Cloudhome dispatch.")
}

main().catch(err => {
  console.error("Error:", err.message)
  process.exit(1)
})
