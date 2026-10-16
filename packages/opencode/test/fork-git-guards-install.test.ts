import { afterEach, beforeEach, expect, test } from "bun:test"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fixture, script, type Fixture } from "./fork-git-guards.fixture"

let f: Fixture
beforeEach(() => { f = fixture() })
afterEach(() => { f.cleanup() })

for (const foreign of ["path", "hook", "guard", "symlink-path", "masked-global-path"]) {
  test(`preserves foreign ${foreign} without partial config or hook installation`, () => {
    // Given an unowned hook or hooksPath and stale local policy.
    const hook = path.join(f.repo, ".git/hooks/pre-commit")
    if (foreign === "path") f.git(["config", "core.hooksPath", "custom-hooks"])
    if (foreign === "symlink-path") f.git(["config", "core.hooksPath", ".git/other-hooks"])
    if (foreign === "hook") writeFileSync(hook, "#!/bin/sh\nexit 23\n")
    if (foreign === "guard") writeFileSync(path.join(f.repo, ".git/hooks/fork-git-guards.sh"), "foreign guard\n")
    if (foreign === "masked-global-path") {
      f.env.GIT_CONFIG_GLOBAL = path.join(f.dir, "global-config")
      writeFileSync(f.env.GIT_CONFIG_GLOBAL, "[core]\n\thooksPath = foreign-hooks\n")
      f.git(["config", "core.hooksPath", ".husky/_"])
    }
    f.git(["config", "branch.opencode-mirror.rebase", "true"])
    const config = readFileSync(path.join(f.repo, ".git/config"), "utf8")
    // When installer preflight finds a foreign owner.
    const result = f.run(f.repo, ["bash", script, "install"])
    // Then no config or partial native dispatchers are written.
    expect(result.code, result.err).not.toBe(0)
    expect(readFileSync(path.join(f.repo, ".git/config"), "utf8")).toBe(config)
    expect(existsSync(path.join(f.repo, ".git/hooks/reference-transaction"))).toBe(false)
    if (foreign === "hook") expect(readFileSync(hook, "utf8")).toBe("#!/bin/sh\nexit 23\n")
    if (foreign === "masked-global-path") expect(readFileSync(f.env.GIT_CONFIG_GLOBAL, "utf8")).toBe("[core]\n\thooksPath = foreign-hooks\n")
  })
}

test("only vetoes prepared transactions and only the mirror ref", () => {
  // Given installed guards with a non-upstream fork commit available.
  f.install()
  const row = `${f.base} ${f.fork} refs/heads/opencode-mirror\n`
  // When Git reports non-vetoable phases or modifies a different branch.
  for (const phase of ["committed", "aborted"]) {
    expect(f.run(f.repo, ["bash", script, "hook", "reference-transaction", phase], row).code).toBe(0)
  }
  f.git(["update-ref", "refs/heads/feature", f.fork])
  // Then unrelated refs remain mutable.
  expect(f.git(["rev-parse", "feature"])).toBe(f.fork)
})

test("uses the actual old mirror tip when transaction old value is zero", () => {
  // Given a mirror advanced to upstream/v1 and an older reachable commit.
  f.install()
  f.git(["fetch", "upstream"])
  f.git(["update-ref", "refs/heads/opencode-mirror", f.next])
  // When a transaction attempts an unconditional rewind (old oid is zeros).
  const result = f.run(f.repo, ["git", "update-ref", "--stdin"], `start\nupdate refs/heads/opencode-mirror ${f.base}\nprepare\ncommit\n`)
  // Then fallback to the actual ref prevents bypassing the FF requirement.
  expect(result.code, result.err).not.toBe(0)
  expect(f.git(["rev-parse", "opencode-mirror"])).toBe(f.next)
})

test("retains reference-transaction stdin for the Husky delegate", () => {
  // Given a reference hook consuming the full original transaction input.
  f.hook("reference-transaction", 'cat > "transaction-$1"')
  f.install()
  f.env.HUSKY = "1"
  // When a permitted prepared transaction runs through the public hook entry.
  const row = `${f.base} ${f.base} refs/heads/opencode-mirror\n`
  const result = f.run(f.repo, ["bash", script, "hook", "reference-transaction", "prepared"], row)
  // Then policy reads do not consume the delegate's input.
  expect(result.code, result.err).toBe(0)
  expect(readFileSync(path.join(f.repo, "transaction-prepared"), "utf8")).toBe(row)
})

test("rejects mirror commits before invoking Husky", () => {
  // Given a mirror checkout with a delegate that would leave a receipt.
  f.hook("pre-commit", "echo ran > delegated")
  f.install()
  f.git(["checkout", "opencode-mirror"])
  f.env.HUSKY = "1"
  // When a direct mirror commit is attempted.
  const result = f.run(f.repo, ["git", "commit", "--allow-empty", "-m", "forbidden"])
  // Then the guard vetoes before the delegate runs.
  expect(result.code, result.err).not.toBe(0)
  expect(existsSync(path.join(f.repo, "delegated"))).toBe(false)
  expect(f.git(["rev-parse", "opencode-mirror"])).toBe(f.base)
})

test("HUSKY=0 skips delegation but not native checks", () => {
  // Given an installed guard with a delegate that always fails.
  f.hook("pre-commit", "exit 42")
  f.install()
  // When Husky is disabled for an otherwise permitted fork commit.
  const result = f.run(f.repo, ["git", "commit", "--allow-empty", "-m", "allowed"])
  // Then the Husky-only failure cannot stop the commit.
  expect(result.code, result.err).toBe(0)
  expect(f.git(["rev-parse", "HEAD"])).not.toBe(f.fork)
})
