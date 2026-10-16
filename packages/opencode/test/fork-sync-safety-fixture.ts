import { expect } from "bun:test"
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dir, "../../..")
const fixtures: string[] = []

export function fixture() {
  mkdirSync(join(root, ".tmp"), { recursive: true })
  const dir = mkdtempSync(join(root, ".tmp/fork-sync-safety-"))
  fixtures.push(dir)
  const repo = join(dir, "repo")
  mkdirSync(repo)
  const env = {
    ...process.env,
    GIT_MASTER: "1",
    GIT_CONFIG_GLOBAL: join(dir, "global"),
    GIT_CONFIG_SYSTEM: join(dir, "system"),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "commit.gpgsign",
    GIT_CONFIG_VALUE_0: "false",
    GIT_CONFIG_KEY_1: "protocol.file.allow",
    GIT_CONFIG_VALUE_1: "always",
    GIT_AUTHOR_NAME: "Fixture",
    GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "Fixture",
    GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    GIT_TERMINAL_PROMPT: "0",
    FORK_SYNC_NO_PUSH: "1",
    FORK_SYNC_SKIP_VERIFY: "1",
  }
  writeFileSync(env.GIT_CONFIG_GLOBAL, "")
  writeFileSync(env.GIT_CONFIG_SYSTEM, "")
  function gitResult(...args: string[]) {
    return Bun.spawnSync(["git", ...args], { cwd: repo, env })
  }
  function git(...args: string[]) {
    const result = gitResult(...args)
    expect(result.exitCode, result.stderr.toString()).toBe(0)
    return result.stdout.toString().trim()
  }
  function commit(file: string, content: string) {
    writeFileSync(join(repo, file), content)
    git("add", "--", file)
    git("commit", "--no-verify", "-m", file)
    return git("rev-parse", "HEAD")
  }
  git("init", "-b", "v1")
  mkdirSync(join(repo, "script"))
  for (const file of ["fork-sync.sh", "fork-sync-exclusions", "fork-sync-merge-package-json.ts", "fork-git-guards.sh"]) {
    if (existsSync(join(root, "script", file))) copyFileSync(join(root, "script", file), join(repo, "script", file))
  }
  writeFileSync(join(repo, ".gitignore"), "linked/\n")
  writeFileSync(join(repo, "SECURITY.md"), "base\n")
  git("add", ".")
  git("commit", "--no-verify", "-m", "base")
  const base = git("rev-parse", "HEAD")
  git("init", "--bare", join(dir, "upstream.git"))
  git("init", "--bare", join(dir, "origin.git"))
  git("remote", "add", "upstream", join(dir, "upstream.git"))
  git("remote", "add", "origin", join(dir, "origin.git"))
  git("push", "--no-verify", "upstream", "v1")
  git("checkout", "-b", "dev")
  const dev = commit("dev-version", "2.0.0\n")
  git("push", "--no-verify", "upstream", "dev")
  git("checkout", "-b", "opencode-mirror", base)
  git("checkout", "-b", "fork/local")
  git("rm", "SECURITY.md")
  const fork = commit("fork-only", "customization\n")
  git("push", "--no-verify", "origin", "opencode-mirror", "fork/local")
  git("fetch", "upstream")
  git("checkout", "v1")
  commit("SECURITY.md", "upstream modification\n")
  const tip = commit("v1-version", "1.19.2\n")
  git("push", "--no-verify", "upstream", "v1")
  git("checkout", "fork/local")
  function sync(args: string[] = [], options: { cwd?: string; env?: Record<string, string> } = {}) {
    const result = Bun.spawnSync(["bash", join(repo, "script/fork-sync.sh"), ...args], {
      cwd: options.cwd ?? repo,
      env: { ...env, ...options.env },
      timeout: 20_000,
    })
    if (process.env.FORK_SYNC_SAFETY_EVIDENCE) {
      appendFileSync(process.env.FORK_SYNC_SAFETY_EVIDENCE, `\nfixture=${dir} args=${args.join(" ")} exit=${result.exitCode}\n${result.stdout}\n${result.stderr}\n`)
    }
    return result
  }
  function state() {
    return {
      refs: git("show-ref"),
      head: readFileSync(join(repo, ".git/HEAD"), "utf8"),
      index: Bun.hash(readFileSync(join(repo, ".git/index"))).toString(),
      config: readFileSync(join(repo, ".git/config"), "utf8"),
      status: git("status", "--porcelain"),
      fetch: existsSync(join(repo, ".git/FETCH_HEAD")) ? readFileSync(join(repo, ".git/FETCH_HEAD"), "utf8") : "",
    }
  }
  return { dir, repo, git, gitResult, commit, sync, state, base, fork, tip, dev }
}

export function cleanup() {
  for (const dir of fixtures.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
    if (process.env.FORK_SYNC_SAFETY_EVIDENCE) appendFileSync(process.env.FORK_SYNC_SAFETY_EVIDENCE, `teardown=${dir} removed\n`)
  }
}
