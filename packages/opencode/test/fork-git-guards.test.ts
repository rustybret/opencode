import { afterEach, beforeEach, expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fixture, hooks, script, type Fixture } from "./fork-git-guards.fixture"

let f: Fixture
beforeEach(() => { f = fixture() })
afterEach(() => { f.cleanup() })

test("installs idempotently with pinned local policy and no ref changes", () => {
  // Given stale pull and IDE settings and Husky's normal hooksPath.
  f.git(["config", "core.hooksPath", ".husky/_"])
  f.git(["config", "pull.rebase", "true"])
  f.git(["config", "branch.opencode-mirror.vscode-merge-base", "upstream/dev"])
  // When installing twice, including the default command.
  f.install()
  const result = f.run(f.repo, ["bash", script])
  expect(result.code, result.err).toBe(0)
  // Then all native hooks and the exact policy are present, without moving refs.
  expect(f.run(f.repo, ["bash", script, "verify"]).code).toBe(0)
  const policy = {
    "branch.opencode-mirror.remote": "upstream",
    "branch.opencode-mirror.merge": "refs/heads/v1",
    "branch.opencode-mirror.rebase": "false",
    "branch.opencode-mirror.mergeOptions": "--ff-only",
    "branch.opencode-mirror.vscode-merge-base": "upstream/v1",
    "branch.fork/local.rebase": "false",
    "branch.fork/local.vscode-merge-base": "origin/fork/local",
    "alias.sync-upstream": "!script/fork-sync.sh",
  }
  for (const [key, value] of Object.entries(policy)) expect(f.git(["config", "--local", "--get", key])).toBe(value)
  expect(f.run(f.repo, ["git", "config", "--get", "core.hooksPath"]).code).toBe(1)
  expect(f.git(["rev-parse", "opencode-mirror"])).toBe(f.base)
  expect(f.git(["rev-parse", "fork/local"])).toBe(f.fork)
  for (const hook of hooks) expect(existsSync(path.join(f.repo, ".git/hooks", hook))).toBe(true)
  f.git(["config", "branch.opencode-mirror.merge", "refs/heads/dev"])
  expect(f.run(f.repo, ["bash", script, "verify"]).code).not.toBe(0)
})

test("chains Husky after guards and permits fork commits", () => {
  // Given a current-worktree delegate that consumes args and stdin.
  f.hook("pre-commit", '[ "$HUSKY" = 0 ] || echo ran > husky-ran')
  f.hook("pre-push", 'printf "%s\\n" "$*" > husky-args; cat > husky-input')
  f.install()
  f.env.HUSKY = "1"
  // When normal Git and hook invocations run.
  f.git(["commit", "--allow-empty", "-m", "allowed"])
  const push = f.run(f.repo, ["bash", script, "hook", "pre-push", "origin", "local"], "payload\n")
  // Then the delegate executes with intact arguments and input.
  expect(push.code, push.err).toBe(0)
  expect(readFileSync(path.join(f.repo, "husky-ran"), "utf8").trim()).toBe("ran")
  expect(readFileSync(path.join(f.repo, "husky-args"), "utf8").trim()).toBe("origin local")
  expect(readFileSync(path.join(f.repo, "husky-input"), "utf8")).toBe("payload\n")
})

for (const operation of ["commit", "update", "delete", "rewind", "missing"] as const) {
  test(`blocks mirror ${operation} with HUSKY=0 and leaves ref unchanged`, () => {
    // Given native guards and a protected branch.
    f.install()
    if (operation === "rewind") {
      f.git(["fetch", "upstream"])
      f.git(["update-ref", "refs/heads/opencode-mirror", f.next])
    }
    if (operation === "missing") f.git(["update-ref", "-d", "refs/remotes/upstream/v1"])
    const before = f.git(["rev-parse", "opencode-mirror"])
    if (operation === "commit") f.git(["checkout", "opencode-mirror"])
    // When a prohibited mutation is attempted through real Git.
    const args = operation === "commit" ? ["commit", "--allow-empty", "-m", "forbidden"]
      : operation === "delete" ? ["update-ref", "-d", "refs/heads/opencode-mirror"]
      : ["update-ref", "refs/heads/opencode-mirror", operation === "rewind" ? f.base : f.fork]
    const result = f.run(f.repo, ["git", ...args])
    // Then Git vetoes it and retains the exact branch tip.
    expect(result.code, result.err).not.toBe(0)
    expect(result.err).toContain("fork-git-guards:")
    expect(f.git(["rev-parse", "opencode-mirror"])).toBe(before)
  })
}

test("permits upstream fast-forward including fetch updating both refs in one transaction", () => {
  // Given upstream/v1 still points at base locally.
  f.install()
  // When direct local fetch atomically updates tracking and mirror tips.
  f.git(["fetch", "--atomic", "upstream", "refs/heads/v1:refs/heads/opencode-mirror", "+refs/heads/v1:refs/remotes/upstream/v1"])
  // Then both tips are the new upstream commit.
  expect(f.git(["rev-parse", "opencode-mirror"])).toBe(f.next)
  expect(f.git(["rev-parse", "upstream/v1"])).toBe(f.next)
})

for (const branch of ["fork/local", "opencode-mirror"]) {
  for (const explicit of [false, true]) {
    test(`rejects rebase of ${branch} before detach (explicit=${explicit})`, () => {
      // Given a divergent upstream and either the target or another branch checked out.
      f.install()
      f.git(["fetch", "upstream"])
      f.git(["checkout", ...(explicit ? ["-b", "feature"] : [branch])])
      const head = f.git(["symbolic-ref", "HEAD"])
      const before = f.git(["rev-parse", branch])
      // When an actual rebase would otherwise start.
      const result = f.run(f.repo, ["git", "rebase", "--force-rebase", "upstream/v1", ...(explicit ? [branch] : [])])
      // Then it fails before changing HEAD or creating rebase state.
      expect(result.code, result.err).not.toBe(0)
      expect(result.err).toContain("fork-git-guards:")
      expect(f.git(["symbolic-ref", "HEAD"])).toBe(head)
      expect(f.git(["rev-parse", branch])).toBe(before)
      for (const name of ["rebase-merge", "rebase-apply"]) expect(existsSync(path.join(f.repo, ".git", name))).toBe(false)
    })
  }
}

test("protects a linked mirror worktree with no fork source files", () => {
  // Given an installed common dispatcher and a source-free mirror worktree.
  f.install()
  const wt = path.join(f.dir, "mirror worktree")
  f.git(["worktree", "add", wt, "opencode-mirror"])
  expect(existsSync(path.join(wt, "script/fork-git-guards.sh"))).toBe(false)
  expect(existsSync(path.join(wt, ".husky"))).toBe(false)
  // When installing/verifying from the linked worktree and attempting a commit.
  f.install(wt)
  expect(f.run(wt, ["bash", script, "verify"]).code).toBe(0)
  const result = f.run(wt, ["git", "commit", "--allow-empty", "-m", "forbidden"])
  // Then native common-dir hooks still veto the mirror mutation.
  expect(result.code, result.err).not.toBe(0)
  expect(result.err).toContain("fork-git-guards:")
  expect(f.git(["rev-parse", "opencode-mirror"])).toBe(f.base)
})
