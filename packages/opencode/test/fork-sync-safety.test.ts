import { afterEach, expect, test } from "bun:test"
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fixture } from "./fork-sync-safety-fixture"

afterEach(cleanup)

test("syncs only v1 by default, resolves actual keep-deleted conflict, and preserves fork/origin", () => {
  // Given distinct v1/dev histories and a fork deletion conflicting with v1.
  const f = fixture()
  const origin = f.git("ls-remote", "origin")
  // When the actual script runs with defaults.
  const result = f.sync()
  // Then mirror tracks v1, the fork survives a merge, and NO_PUSH preserves origin.
  expect(result.exitCode, result.stderr.toString()).toBe(0)
  expect(f.git("rev-parse", "opencode-mirror")).toBe(f.tip)
  expect(f.git("merge-base", "HEAD", f.fork)).toBe(f.fork)
  expect(f.git("merge-base", "HEAD", f.tip)).toBe(f.tip)
  expect(f.git("merge-base", "HEAD", f.dev)).not.toBe(f.dev)
  expect(f.git("rev-list", "--parents", "-1", "HEAD").split(" ")).toHaveLength(3)
  expect(existsSync(join(f.repo, "SECURITY.md"))).toBe(false)
  expect(f.git("ls-remote", "origin")).toBe(origin)
  expect(f.git("symbolic-ref", "--short", "HEAD")).toBe("fork/local")
})

for (const args of [["upstream", "dev"], ["upstream", "v2"], ["origin", "v1"], ["upstream", "v1", "extra"]]) {
  test(`rejects disallowed arguments ${args.join(" ")} before mutations`, () => {
    const f = fixture()
    const before = f.state()
    const result = f.sync(args)
    expect(result.exitCode).not.toBe(0)
    expect(f.state()).toEqual(before)
  })
}

for (const branch of ["dev", "opencode-mirror", "detached", "unborn"]) {
  test(`rejects ${branch} HEAD before mutations`, () => {
    const f = fixture()
    if (branch === "detached") f.git("checkout", "--detach")
    else if (branch === "unborn") f.git("symbolic-ref", "HEAD", "refs/heads/unborn")
    else f.git("checkout", branch)
    const before = f.state()
    const result = f.sync()
    expect(result.exitCode).not.toBe(0)
    expect(f.state()).toEqual(before)
  })
}

for (const marker of ["rebase-merge", "rebase-apply", "sequencer", "REBASE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG", "MERGE_HEAD"]) {
  test(`preserves existing ${marker} operation before fetch or installer`, () => {
    const f = fixture()
    const path = f.git("rev-parse", "--git-path", marker)
    const absolute = join(f.repo, path)
    if (["rebase-merge", "rebase-apply", "sequencer"].includes(marker)) mkdirSync(absolute)
    else writeFileSync(absolute, `${f.base}\n`)
    const before = f.state()
    const result = f.sync()
    expect(result.exitCode).not.toBe(0)
    expect(f.state()).toEqual(before)
    expect(existsSync(absolute)).toBe(true)
  })
}

test("rejects local branch override before mutations", () => {
  const f = fixture()
  const before = f.state()
  expect(f.sync([], { env: { FORK_SYNC_LOCAL_BRANCH: "dev" } }).exitCode).not.toBe(0)
  expect(f.state()).toEqual(before)
})

test("rejects dirty tree before mutations", () => {
  const f = fixture()
  writeFileSync(join(f.repo, "fork-only"), "dirty\n")
  const before = f.state()
  expect(f.sync().exitCode).not.toBe(0)
  expect(f.state()).toEqual(before)
})

test("rejects polluted mirror before mutations", () => {
  const f = fixture()
  f.git("branch", "-f", "opencode-mirror", f.fork)
  const before = f.state()
  expect(f.sync().exitCode).not.toBe(0)
  expect(f.state()).toEqual(before)
})

test("refuses mirror checked out in linked worktree without changing its files or refs", () => {
  const f = fixture()
  const linked = join(f.repo, "linked")
  f.git("worktree", "add", linked, "opencode-mirror")
  const before = f.state()
  const content = readFileSync(join(linked, "SECURITY.md"), "utf8")
  expect(f.sync().exitCode).not.toBe(0)
  expect(f.state()).toEqual(before)
  expect(readFileSync(join(linked, "SECURITY.md"), "utf8")).toBe(content)
})

test("resolves ROOT when invoked from another repository", () => {
  const f = fixture()
  const other = fixture()
  const before = other.state()
  const result = f.sync([], { cwd: other.repo })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
  expect(f.git("rev-parse", "opencode-mirror")).toBe(f.tip)
  expect(other.state()).toEqual(before)
})

test("is idempotent on repeated successful sync", () => {
  const f = fixture()
  expect(f.sync(["upstream", "v1"]).exitCode).toBe(0)
  const before = f.git("show-ref")
  expect(f.sync().exitCode).toBe(0)
  expect(f.git("show-ref")).toBe(before)
})

for (const remote of ["upstream", "origin"]) {
  test(`reports ${remote} fetch failure instead of success`, () => {
    const f = fixture()
    f.git("remote", "set-url", remote, join(f.dir, "missing.git"))
    const before = f.git("rev-parse", "HEAD", "opencode-mirror")
    expect(f.sync().exitCode).not.toBe(0)
    expect(f.git("rev-parse", "HEAD", "opencode-mirror")).toBe(before)
  })
}

test("rejects a fetched upstream rewind before advancing mirror or fork", () => {
  const f = fixture()
  f.git("fetch", "upstream", "v1:refs/remotes/upstream/v1")
  f.git("branch", "-f", "opencode-mirror", f.tip)
  f.git("push", "--no-verify", "upstream", `${f.base}:refs/heads/rewound`)
  f.git("--git-dir", join(f.dir, "upstream.git"), "update-ref", "refs/heads/v1", f.base)
  const before = f.git("rev-parse", "HEAD", "opencode-mirror")
  expect(f.sync(["upstream", "v1"]).exitCode).not.toBe(0)
  expect(f.git("rev-parse", "HEAD", "opencode-mirror")).toBe(before)
})

test("preserves commits ahead on origin/fork/local", () => {
  const f = fixture()
  const ahead = f.commit("origin-only", "origin customization\n")
  f.git("push", "--no-verify", "origin", "fork/local")
  f.git("checkout", "--detach", f.fork)
  f.git("branch", "-f", "fork/local", f.fork)
  f.git("checkout", "fork/local")
  expect(f.sync().exitCode).toBe(0)
  expect(f.git("merge-base", "HEAD", ahead)).toBe(ahead)
})

test("preserves a real unresolved merge including index and MERGE_HEAD", () => {
  const f = fixture()
  expect(f.gitResult("merge", "--no-edit", f.tip).exitCode).not.toBe(0)
  const before = f.state()
  const merge = readFileSync(join(f.repo, ".git/MERGE_HEAD"), "utf8")
  expect(f.sync().exitCode).not.toBe(0)
  expect(f.state()).toEqual(before)
  expect(readFileSync(join(f.repo, ".git/MERGE_HEAD"), "utf8")).toBe(merge)
})

for (const fail of [true, false]) {
  test(`${fail ? "blocks" : "allows"} both pushes after verification ${fail ? "fails" : "passes"}`, () => {
    const f = fixture()
    const bin = join(f.dir, "bin")
    const calls = join(f.dir, "gates")
    mkdirSync(bin)
    writeFileSync(join(bin, "bun"), `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> '${calls}'\nexit ${fail ? 23 : 0}\n`)
    chmodSync(join(bin, "bun"), 0o755)
    const before = f.git("ls-remote", "origin")
    const result = f.sync([], { env: { PATH: `${bin}:${process.env.PATH}`, FORK_SYNC_SKIP_VERIFY: "0", FORK_SYNC_NO_PUSH: "0" } })
    expect(result.exitCode, result.stderr.toString()).toBe(fail ? 23 : 0)
    expect(readFileSync(calls, "utf8")).toContain("turbo typecheck")
    if (fail) expect(f.git("ls-remote", "origin")).toBe(before)
    else {
      expect(readFileSync(calls, "utf8")).toContain("test/fork-sync-safety.test.ts")
      expect(f.git("rev-parse", "origin/opencode-mirror")).toBe(f.tip)
      expect(f.git("rev-parse", "origin/fork/local")).toBe(f.git("rev-parse", "HEAD"))
    }
  })
}
