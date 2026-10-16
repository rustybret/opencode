import { expect } from "bun:test"
import { appendFileSync, chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"

export const root = path.resolve(import.meta.dir, "../../..")
export const script = path.join(root, "script/fork-git-guards.sh")
export const hooks = [
  "pre-commit", "pre-merge-commit", "prepare-commit-msg", "commit-msg", "post-commit",
  "applypatch-msg", "pre-applypatch", "post-applypatch", "pre-rebase", "post-rewrite",
  "post-checkout", "post-merge", "pre-push", "pre-auto-gc", "reference-transaction",
] as const

export function fixture() {
  mkdirSync(path.join(root, ".tmp"), { recursive: true })
  const dir = mkdtempSync(path.join(root, ".tmp/fork-git-guards-"))
  const repo = path.join(dir, "clone")
  const seed = path.join(dir, "seed")
  const bare = path.join(dir, "upstream.git")
  const env = {
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    HOME: dir,
    XDG_CONFIG_HOME: path.join(dir, "xdg"),
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_MASTER: "1",
    GIT_AUTHOR_NAME: "Guard Test",
    GIT_AUTHOR_EMAIL: "guard@example.invalid",
    GIT_COMMITTER_NAME: "Guard Test",
    GIT_COMMITTER_EMAIL: "guard@example.invalid",
    GIT_CONFIG_COUNT: "2",
    GIT_CONFIG_KEY_0: "commit.gpgsign",
    GIT_CONFIG_VALUE_0: "false",
    GIT_CONFIG_KEY_1: "tag.gpgsign",
    GIT_CONFIG_VALUE_1: "false",
    GIT_TERMINAL_PROMPT: "0",
    GIT_SEQUENCE_EDITOR: "true",
    HUSKY: "0",
  }
  function run(cwd: string, args: string[], input?: string) {
    const result = Bun.spawnSync(args, { cwd, env, stdin: input === undefined ? "ignore" : Buffer.from(input) })
    const output = { code: result.exitCode, out: result.stdout.toString().trim(), err: result.stderr.toString().trim() }
    if (process.env.FORK_GUARD_LOG) {
      appendFileSync(process.env.FORK_GUARD_LOG, `${cwd}: ${args[0] === "git" ? "GIT_MASTER=1 " : ""}${args.join(" ")}\n${input ?? ""}\nexit=${output.code}\n${output.out}\n${output.err}\n`)
    }
    return output
  }
  function git(args: string[], cwd = repo) {
    const result = run(cwd, ["git", ...args])
    expect(result.code, result.err).toBe(0)
    return result.out
  }
  mkdirSync(seed)
  git(["init", "--bare", bare], dir)
  git(["init", "-b", "v1"], seed)
  git(["commit", "--allow-empty", "-m", "base"], seed)
  const base = git(["rev-parse", "HEAD"], seed)
  git(["remote", "add", "origin", bare], seed)
  git(["push", "origin", "v1"], seed)
  git(["clone", "-b", "v1", bare, repo], dir)
  git(["remote", "add", "upstream", bare])
  git(["fetch", "upstream"])
  git(["branch", "opencode-mirror", base])
  git(["checkout", "-b", "fork/local"])
  git(["commit", "--allow-empty", "-m", "fork"])
  const fork = git(["rev-parse", "HEAD"])
  git(["commit", "--allow-empty", "-m", "next"], seed)
  const next = git(["rev-parse", "HEAD"], seed)
  git(["push", "origin", "v1"], seed)
  function install(cwd = repo) {
    const result = run(cwd, ["bash", script, "install"])
    expect(result.code, result.err).toBe(0)
  }
  return {
    dir, repo, seed, bare, base, fork, next, env, run, git, install,
    hook(name: string, body: string) {
      const file = path.join(repo, ".husky/_", name)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, `#!/bin/sh\n${body}\n`)
      chmodSync(file, 0o755)
    },
    cleanup() {
      rmSync(dir, { recursive: true, force: true })
      console.log(`TEARDOWN removed ${dir}`)
    },
  }
}

export type Fixture = ReturnType<typeof fixture>
