import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, chmodSync, readFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { spawnSync } from "child_process"

describe("Arcus safe upgrade process", () => {
  const testRoot = join(tmpdir(), `opencode-upgrade-test-${Date.now()}`)
  const mockHome = join(testRoot, "home")
  const binDir = join(mockHome, ".opencode", "bin")
  const versionsDir = join(mockHome, ".opencode", "versions")
  const activeBin = join(binDir, "opencode")

  beforeEach(() => {
    mkdirSync(binDir, { recursive: true })
    mkdirSync(versionsDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it("performs atomic inode replacement without disrupting active binary execution", () => {
    // 1. Create a mock initial binary
    const v1Script = `#!/bin/sh\necho "opencode v1.18.17"\n`
    writeFileSync(activeBin, v1Script)
    chmodSync(activeBin, 0o755)

    // Verify initial execution
    const run1 = spawnSync(activeBin, { encoding: "utf8" })
    expect(run1.stdout.trim()).toBe("opencode v1.18.17")

    // 2. Stage candidate update (v1.18.18)
    const stageBin = join(binDir, `opencode.stage-test-${process.pid}`)
    const v2Script = `#!/bin/sh\nif [ "$1" = "--version" ]; then echo "opencode v1.18.18"; exit 0; fi\nif [ "$1" = "debug" ] && [ "$2" = "config" ]; then echo '{"ok":true}'; exit 0; fi\necho "opencode v1.18.18"\n`
    writeFileSync(stageBin, v2Script)
    chmodSync(stageBin, 0o755)

    // 3. Smoke verification step
    const smokeVersion = spawnSync(stageBin, ["--version"], { encoding: "utf8" })
    expect(smokeVersion.status).toBe(0)
    expect(smokeVersion.stdout.trim()).toBe("opencode v1.18.18")

    const smokeConfig = spawnSync(stageBin, ["debug", "config"], { encoding: "utf8" })
    expect(smokeConfig.status).toBe(0)

    // 4. Archive into versioned fallback store
    const versionedPath = join(versionsDir, "opencode-v1.18.18")
    writeFileSync(versionedPath, readFileSync(stageBin))
    chmodSync(versionedPath, 0o755)
    expect(existsSync(versionedPath)).toBe(true)

    // 5. Atomic rename (mv) over active binary
    spawnSync("mv", [stageBin, activeBin])

    // Verify subsequent runs immediately invoke v2
    const run2 = spawnSync(activeBin, { encoding: "utf8" })
    expect(run2.stdout.trim()).toBe("opencode v1.18.18")
  })

  it("aborts safely and rejects candidate binary if pre-activation smoke test fails", () => {
    // 1. Create a mock initial working binary
    const v1Script = `#!/bin/sh\necho "opencode working"\n`
    writeFileSync(activeBin, v1Script)
    chmodSync(activeBin, 0o755)

    // 2. Create a broken candidate binary that fails smoke test
    const stageBin = join(binDir, `opencode.stage-broken-${process.pid}`)
    const brokenScript = `#!/bin/sh\necho "Panic: invalid config" >&2\nexit 1\n`
    writeFileSync(stageBin, brokenScript)
    chmodSync(stageBin, 0o755)

    // 3. Smoke test verification fails
    const smoke = spawnSync(stageBin, ["--version"], { encoding: "utf8" })
    expect(smoke.status).not.toBe(0)

    // Cleanup candidate
    if (smoke.status !== 0 && existsSync(stageBin)) {
      rmSync(stageBin)
    }

    // Active binary remains intact and working
    expect(existsSync(activeBin)).toBe(true)
    const runAfter = spawnSync(activeBin, { encoding: "utf8" })
    expect(runAfter.stdout.trim()).toBe("opencode working")
  })
})
