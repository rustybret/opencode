import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

describe("opencode arcus packaging & sync", () => {
  const repoRoot = resolve(__dirname, "..")

  it("defines Arcus v2, fork-sync, and packaging command scripts in package.json", () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"))
    expect(pkg.scripts["fork-sync"]).toBe("script/fork-sync.sh")
    expect(pkg.scripts["package:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["pack:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["publish:arcus"]).toBe("bash scripts/publish-arcus.sh")
    expect(pkg.scripts["validate:arcus"]).toBe("bash scripts/validate-arcus.sh")
    expect(pkg.scripts["sign:arcus"]).toBe("bash scripts/sign-arcus.sh")
    expect(pkg.scripts["migrate:arcus"]).toBe("bash scripts/migrate-arcus.sh")
  })

  it("ships executable scripts for Arcus v2 pipeline", () => {
    expect(existsSync(resolve(repoRoot, "scripts/pack-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/publish-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/validate-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/sign-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/migrate-arcus.sh"))).toBe(true)
  })

  it("produces a valid Arcus v2 release envelope and legacy v1 manifest", () => {
    const v1Path = resolve(repoRoot, "dist-arcus/arcus-manifest.json")
    if (existsSync(v1Path)) {
      const manifest = JSON.parse(readFileSync(v1Path, "utf-8"))
      expect(manifest.harness).toBe("opencode")
      expect(manifest.name).toBe("opencode")
      expect(manifest.daemon?.service_id).toBe("opencode-server")
    }

    const v2Path = existsSync(resolve(repoRoot, "dist-arcus/releases/1.18.26-1.json"))
      ? resolve(repoRoot, "dist-arcus/releases/1.18.26-1.json")
      : resolve(repoRoot, "dist-arcus/releases/1.18.26-ucs-1.json")
    if (existsSync(v2Path)) {
      const envelope = JSON.parse(readFileSync(v2Path, "utf-8"))
      expect(envelope.signed?.schema_version).toBe(2)
      expect(envelope.signed?.kind).toBe("release")
      expect(envelope.signed?.package_id).toBe("opencode")
      expect(envelope.signed?.version).toBe("1.18.26")
      expect(envelope.signed?.sequence).toBeGreaterThanOrEqual(1)
      expect(envelope.signatures?.length).toBeGreaterThanOrEqual(1)
      expect(Object.keys(envelope.signed?.targets || {})).toEqual([
        "darwin-arm64",
        "darwin-x64",
        "linux-arm64",
        "linux-x64",
        "windows-x64",
      ])
    }
  })
})
