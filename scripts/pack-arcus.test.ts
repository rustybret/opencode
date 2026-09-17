import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"

describe("opencode arcus packaging & sync", () => {
  const repoRoot = resolve(__dirname, "..")

  it("defines Arcus v2, fork-sync, and packaging command scripts in package.json", () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"))
    expect(pkg.scripts["setup"]).toBe("bash setup.sh")
    expect(pkg.scripts["setup:arcus"]).toBe("bash script/setup-arcus.sh")
    expect(pkg.scripts["fork-sync"]).toBe("script/fork-sync.sh")
    expect(pkg.scripts["package:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["pack:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["publish:arcus"]).toBe("bash scripts/publish-arcus.sh")
    expect(pkg.scripts["validate:arcus"]).toBe("bash scripts/validate-arcus.sh")
    expect(pkg.scripts["sign:arcus"]).toBe("bash scripts/sign-arcus.sh")
    expect(pkg.scripts["migrate:arcus"]).toBe("bash scripts/migrate-arcus.sh")
    expect(pkg.scripts["arcus:pipeline"]).toBe("bash scripts/arcus-pipeline.sh")
  })

  it("ships executable scripts for Arcus v2 pipeline", () => {
    expect(existsSync(resolve(repoRoot, "scripts/pack-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/publish-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/validate-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/sign-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/migrate-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/arcus-pipeline.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "script/setup-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "setup.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, ".gitmodules"))).toBe(true)
    const gitmodules = readFileSync(resolve(repoRoot, ".gitmodules"), "utf-8")
    expect(gitmodules).toContain('submodule "submodules/arcus"')
  })

  it("produces a valid Arcus v2 release envelope and legacy v1 manifest", () => {
    const v1Path = resolve(repoRoot, "dist-arcus/arcus-manifest.json")
    if (existsSync(v1Path)) {
      const manifest = JSON.parse(readFileSync(v1Path, "utf-8"))
      expect(manifest.harness).toBe("opencode")
      expect(manifest.name).toBe("opencode")
      if (manifest.daemon) {
        expect(manifest.daemon.service_id).toBe("opencode-server")
      } else if (manifest.plugin) {
        expect(manifest.plugin.type).toBe("opencode-plugin")
      }
    }

    const v2Path = existsSync(resolve(repoRoot, "dist-arcus/releases/1.18.26-ucs-2.json"))
      ? resolve(repoRoot, "dist-arcus/releases/1.18.26-ucs-2.json")
      : existsSync(resolve(repoRoot, "dist-arcus/releases/1.18.26-1.json"))
        ? resolve(repoRoot, "dist-arcus/releases/1.18.26-1.json")
        : resolve(repoRoot, "dist-arcus/releases/1.18.26-ucs-1.json")
    if (existsSync(v2Path)) {
      const envelope = JSON.parse(readFileSync(v2Path, "utf-8"))
      expect(envelope.signed?.schema_version).toBe(2)
      expect(envelope.signed?.kind).toBe("release")
      expect(envelope.signed?.package_id).toBe("opencode")
      expect(envelope.signed?.version).toMatch(/^1\.18\.\d+$/)
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

  it("conforms to Arcus Archetype A publishing standards with declarative arcus.json", () => {
    const arcusJsonPath = resolve(repoRoot, "arcus.json")
    expect(existsSync(arcusJsonPath)).toBe(true)
    const arcusJson = JSON.parse(readFileSync(arcusJsonPath, "utf-8"))
    expect(arcusJson.package_id).toBe("opencode")
    expect(arcusJson.software_type).toBe("cli")
    expect(arcusJson.source_id).toBe("arcus")
    expect(arcusJson.channel).toBe("stable")
    expect(arcusJson.binary_name).toBe("opencode")
    expect(arcusJson.format).toBe("tar.zst")
  })

  it("enforces executable permissions across hydrated toolchain scripts", () => {
    for (const script of [
      "arcus-pipeline.sh",
      "migrate-arcus.sh",
      "pack-arcus.sh",
      "publish-arcus.sh",
      "sign-arcus.sh",
      "validate-arcus.sh",
    ]) {
      const scriptPath = resolve(repoRoot, "scripts", script)
      expect(existsSync(scriptPath)).toBe(true)
      const stat = statSync(scriptPath)
      expect(stat.mode & 0o111).toBeGreaterThan(0)
    }
  })
})
