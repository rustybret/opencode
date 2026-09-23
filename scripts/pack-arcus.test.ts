import { describe, expect, it } from "bun:test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"

describe("opencode arcus packaging & sync", () => {
  const repoRoot = resolve(__dirname, "..")

  it("defines Arcus v3, fork-sync, and packaging command scripts in package.json", () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"))
    expect(pkg.scripts["setup"]).toBe("bash setup.sh")
    expect(pkg.scripts["setup:arcus"]).toBe("bash packages/arcus/bootstrap.sh")
    expect(pkg.scripts["fork-sync"]).toBe("script/fork-sync.sh")
    expect(pkg.scripts["clean:arcus"]).toBe("rm -rf dist/ && mkdir -p dist")
    expect(pkg.scripts["package:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["pack:arcus"]).toBe("bash scripts/pack-arcus.sh")
    expect(pkg.scripts["publish:arcus"]).toBe("bash scripts/publish-arcus.sh")
    expect(pkg.scripts["validate:arcus"]).toBe("bash scripts/validate-arcus.sh")
    expect(pkg.scripts["sign:arcus"]).toBe("bash scripts/sign-arcus.sh")
    expect(pkg.scripts["arcus:pipeline"]).toBe("bash scripts/arcus-pipeline.sh")
  })

  it("ships executable scripts and consumer template for Arcus v3 pipeline", () => {
    expect(existsSync(resolve(repoRoot, "scripts/pack-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/publish-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/validate-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/sign-arcus.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/arcus-pipeline.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "packages/arcus/bootstrap.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "packages/arcus/arcus.json"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "setup.sh"))).toBe(true)
    expect(existsSync(resolve(repoRoot, "scripts/arcus-toolchain.json"))).toBe(true)
    const toolchain = JSON.parse(readFileSync(resolve(repoRoot, "scripts/arcus-toolchain.json"), "utf-8"))
    expect(toolchain.schema).toBe("arcus/publisher-toolchain@1")
    expect(toolchain.toolchain_version).toBe("0.4.0")

    // Asserts repository is decoupled from submodules/arcus git submodule
    const gitmodulesPath = resolve(repoRoot, ".gitmodules")
    if (existsSync(gitmodulesPath)) {
      const gitmodules = readFileSync(gitmodulesPath, "utf-8")
      expect(gitmodules).not.toContain('submodule "submodules/arcus"')
    }
  })

  it("produces a valid Arcus v3 release envelope and submission bundle in dist/<version>/<sequence>/opencode", () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, "packages/opencode/package.json"), "utf-8"))
    const version = pkg.version
    const distVersionDir = resolve(repoRoot, "dist", version)
    if (!existsSync(distVersionDir)) {
      return
    }

    const sequences = readdirSync(distVersionDir).filter((d) => /^\d+$/.test(d))
    if (sequences.length === 0) {
      return
    }

    const latestSeq = sequences.sort((a, b) => Number(b) - Number(a))[0]
    const bundleDir = resolve(distVersionDir, latestSeq, "opencode")
    expect(existsSync(bundleDir)).toBe(true)

    // Flat submission bundle files
    expect(existsSync(resolve(bundleDir, "release.json"))).toBe(true)
    expect(existsSync(resolve(bundleDir, "release.index-policy.json"))).toBe(true)
    expect(existsSync(resolve(bundleDir, "assets.sha256"))).toBe(true)
    expect(existsSync(resolve(bundleDir, "submission.json"))).toBe(true)
    expect(existsSync(resolve(bundleDir, "toolchain.json"))).toBe(true)
    expect(existsSync(resolve(bundleDir, "pack-report.json"))).toBe(true)

    const envelope = JSON.parse(readFileSync(resolve(bundleDir, "release.json"), "utf-8"))
    const signed = envelope.signed ?? envelope
    expect(signed.schema_version).toBe(3)
    expect(signed.kind).toBe("release")
    expect(signed.package_id).toBe("opencode")
    expect(signed.version).toBe(version)
    expect(signed.sequence).toBe(Number(latestSeq))
    expect(envelope.signatures?.length).toBeGreaterThanOrEqual(1)

    const targets = Object.keys(signed.targets || {})
    expect(targets.sort()).toEqual([
      "darwin-arm64",
      "darwin-x64",
      "linux-arm64",
      "linux-x64",
      "windows-x64",
    ])

    // Verify distinct digest triples for every target
    for (const target of targets) {
      const t = signed.targets[target]
      const archiveSha = t.artifact.archive_sha256 ?? t.artifact.sha256
      const contentSha = t.target_content_source?.sha256
      const treeSha = t.tree_signature?.sha256
      expect(archiveSha).toBeDefined()
      expect(contentSha).toBeDefined()
      expect(treeSha).toBeDefined()
      expect(archiveSha).not.toBe(contentSha)
      expect(archiveSha).not.toBe(treeSha)
      expect(contentSha).not.toBe(treeSha)
    }
  })

  it("conforms to Arcus standards with declarative arcus.json", () => {
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
