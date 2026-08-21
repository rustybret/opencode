#!/usr/bin/env bun
/**
 * Package OpenCode multi-architecture binary release artifacts and manifest for Arcus distribution.
 *
 * Produces:
 *   1. dist-arcus/opencode-<target>.tar.gz (or .zip for win32-x64)
 *   2. dist-arcus/arcus-manifest.json conforming to manifests/schema.json in rustybret/arcus
 *      populating daemon.target_matrix for the 5 canonical platform keys:
 *      darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64
 *
 * Requirements:
 *   - Archives are rooted directly at the binary (no wrapper directory).
 *   - Binaries are chmod 755 before archiving.
 *   - Self-check verifies binary presence at archive root.
 *   - Version adheres to CalVer / SemVer with +ucs.N convention.
 *
 * Usage:
 *   bun run script/package-arcus.ts              # packages all built targets found in packages/opencode/dist
 *   bun run script/package-arcus.ts --build      # runs build.ts for all platforms first, then packages
 */

import { createHash } from "crypto"
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import { $ } from "bun"

const ROOT = resolve(import.meta.dir, "..")
const OPENCODE_PKG_JSON = join(ROOT, "packages", "opencode", "package.json")
const DIST_DIR = join(ROOT, "packages", "opencode", "dist")
const OUTDIR = join(ROOT, "dist-arcus")

interface TargetSpec {
  distDirName: string
  targetTriple: string
  binaryName: string
  isWindows: boolean
}

// 5 canonical platform keys required by arcus-pull.sh and Arcus manifests
const CANONICAL_TARGETS: Record<string, TargetSpec> = {
  "darwin-arm64": {
    distDirName: "opencode-darwin-arm64",
    targetTriple: "aarch64-apple-darwin",
    binaryName: "opencode",
    isWindows: false,
  },
  "darwin-x64": {
    distDirName: "opencode-darwin-x64",
    targetTriple: "x86_64-apple-darwin",
    binaryName: "opencode",
    isWindows: false,
  },
  "linux-x64": {
    distDirName: "opencode-linux-x64",
    targetTriple: "x86_64-unknown-linux-gnu",
    binaryName: "opencode",
    isWindows: false,
  },
  "linux-arm64": {
    distDirName: "opencode-linux-arm64",
    targetTriple: "aarch64-unknown-linux-gnu",
    binaryName: "opencode",
    isWindows: false,
  },
  "win32-x64": {
    distDirName: "opencode-windows-x64",
    targetTriple: "x86_64-pc-windows-msvc",
    binaryName: "opencode.exe",
    isWindows: true,
  },
}

function sha256File(path: string): string {
  const data = readFileSync(path)
  return createHash("sha256").update(data).digest("hex")
}

async function verifyArchiveRoot(archivePath: string, binaryName: string, isWindows: boolean): Promise<void> {
  let output: string
  if (isWindows) {
    output = await $`unzip -l ${archivePath}`.text()
  } else {
    output = await $`tar -tzf ${archivePath}`.text()
  }

  const lines = output
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  if (isWindows) {
    const hasBinary = lines.some((l) => l.endsWith(` ${binaryName}`) || l.endsWith(`\t${binaryName}`))
    if (!hasBinary) {
      throw new Error(`Self-check failed: ${archivePath} does not contain ${binaryName} at archive root:\n${output}`)
    }
  } else {
    const hasBinary = lines.includes(binaryName) || lines.includes(`./${binaryName}`)
    if (!hasBinary || lines.some((l) => l === "bin/" || l.startsWith("bin/"))) {
      throw new Error(
        `Self-check failed: ${archivePath} must contain ${binaryName} at archive root (found: ${lines.join(", ")})`,
      )
    }
  }
}

async function main() {
  const args = process.argv.slice(2)
  const shouldBuild = args.includes("--build")

  const pkg = JSON.parse(readFileSync(OPENCODE_PKG_JSON, "utf8"))
  const version = pkg.version ?? "1.18.21+ucs.1"
  const tag = `v${version}`

  console.log(`=== Arcus Multi-Arch Binary Packaging: opencode ${version} ===\n`)

  if (shouldBuild) {
    console.log("-> Building opencode standalone binaries for all platforms...")
    await $`bun run ./packages/opencode/script/build.ts`.cwd(ROOT)
  }

  if (!existsSync(DIST_DIR)) {
    throw new Error(`Dist directory not found: ${DIST_DIR}. Run with --build or build packages/opencode first.`)
  }

  // Setup clean output directory
  rmSync(OUTDIR, { recursive: true, force: true })
  mkdirSync(OUTDIR, { recursive: true })

  const targetMatrix: Record<string, any> = {}

  for (const [platformKey, spec] of Object.entries(CANONICAL_TARGETS)) {
    const targetDir = join(DIST_DIR, spec.distDirName)
    const binDir = join(targetDir, "bin")
    const binPath = join(binDir, spec.binaryName)

    if (!existsSync(binPath)) {
      throw new Error(`Required binary not found for target '${platformKey}' at ${binPath}. Build all targets first.`)
    }

    // Ensure executable permissions before archiving
    if (!spec.isWindows) {
      chmodSync(binPath, 0o755)
    }

    const archiveExt = spec.isWindows ? "zip" : "tar.gz"
    const archiveName = `opencode-${platformKey}.${archiveExt}`
    const archivePath = join(OUTDIR, archiveName)

    console.log(`  -> Archiving ${platformKey} (${spec.distDirName}/bin/${spec.binaryName}) -> ${archiveName}...`)

    if (spec.isWindows) {
      // Create zip with junk-paths (-j) so binary sits directly at root
      await $`zip -q -j ${archivePath} ${binPath}`.cwd(ROOT)
    } else {
      // Create tar directly rooted at the binary
      await $`tar -czf ${archivePath} -C ${binDir} ${spec.binaryName}`.cwd(ROOT)
    }

    // Run self-check on archive contents
    await verifyArchiveRoot(archivePath, spec.binaryName, spec.isWindows)

    const checksum = sha256File(archivePath)
    const checksumPath = `${archivePath}.sha256`
    writeFileSync(checksumPath, `${checksum}  ${archiveName}\n`)

    const releaseUrl = `https://github.com/rustybret/opencode/releases/download/${tag}/${archiveName}`

    targetMatrix[platformKey] = {
      target_triple: spec.targetTriple,
      binary_name: spec.binaryName,
      asset: {
        filename: archiveName,
        url: releaseUrl,
        sha256: checksum,
      },
    }

    console.log(`     Target: ${platformKey} (${spec.targetTriple})`)
    console.log(`     Binary: ${spec.binaryName} (at archive root)`)
    console.log(`     SHA256: ${checksum}\n`)
  }

  const manifest = {
    $schema: "https://raw.githubusercontent.com/rustybret/arcus/main/manifests/schema.json",
    name: "opencode",
    version: version,
    description: "AI-powered development tool (UCS native standalone binary)",
    harness: "opencode",
    daemon: {
      name: "opencode",
      service_id: "opencode-server",
      protocol_version: 1,
      target_matrix: targetMatrix,
    },
  }

  const manifestPath = join(OUTDIR, "arcus-manifest.json")
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n")

  console.log(`[OK] All 5 canonical targets packaged and verified at ${OUTDIR}`)
  console.log(`  Manifest: ${manifestPath}`)
  console.log(`  Tag:      ${tag}`)
  console.log(`\nNext release step:`)
  console.log(`  bash script/publish-arcus-artifact.sh`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
