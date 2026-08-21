#!/usr/bin/env bun
/**
 * Package OpenCode multi-architecture binary release artifacts and manifest for Arcus distribution.
 *
 * Produces:
 *   1. dist-arcus/opencode-<target>.tar.gz (or .zip for win32/windows)
 *   2. dist-arcus/arcus-manifest.json conforming to manifests/schema.json in rustybret/arcus
 *      populating daemon.target_matrix for darwin-arm64, darwin-x64, linux-x64, linux-arm64, win32-x64
 *
 * Usage:
 *   bun run script/package-arcus.ts              # packages all built targets found in packages/opencode/dist
 *   bun run script/package-arcus.ts --build      # runs build.ts for all platforms first, then packages
 *   bun run script/package-arcus.ts --single     # packages only current platform target
 */

import { createHash } from "crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs"
import { join, resolve } from "path"
import { $ } from "bun"

const ROOT = resolve(import.meta.dir, "..")
const OPENCODE_PKG_JSON = join(ROOT, "packages", "opencode", "package.json")
const DIST_DIR = join(ROOT, "packages", "opencode", "dist")
const OUTDIR = join(ROOT, "dist-arcus")

// Map from dist folder name to standard Arcus target matrix keys & Rust target triples
const TARGET_MAP: Record<string, { matrixKey: string; triple: string; isWindows: boolean }> = {
  "opencode-darwin-arm64": { matrixKey: "darwin-arm64", triple: "aarch64-apple-darwin", isWindows: false },
  "opencode-darwin-x64": { matrixKey: "darwin-x64", triple: "x86_64-apple-darwin", isWindows: false },
  "opencode-linux-arm64": { matrixKey: "linux-arm64", triple: "aarch64-unknown-linux-gnu", isWindows: false },
  "opencode-linux-x64": { matrixKey: "linux-x64", triple: "x86_64-unknown-linux-gnu", isWindows: false },
  "opencode-windows-x64": { matrixKey: "win32-x64", triple: "x86_64-pc-windows-msvc", isWindows: true },
  "opencode-windows-arm64": { matrixKey: "win32-arm64", triple: "aarch64-pc-windows-msvc", isWindows: true },
}

function sha256File(path: string): string {
  const data = readFileSync(path)
  return createHash("sha256").update(data).digest("hex")
}

async function main() {
  const args = process.argv.slice(2)
  const shouldBuild = args.includes("--build")
  const singleTarget = args.includes("--single")

  const pkg = JSON.parse(readFileSync(OPENCODE_PKG_JSON, "utf8"))
  const version = pkg.version ?? "1.0.0"

  console.log(`=== Arcus Multi-Arch Binary Packaging: opencode v${version} ===\n`)

  if (shouldBuild) {
    console.log("-> Building opencode standalone binaries...")
    const buildFlags = singleTarget ? ["--single"] : []
    await $`bun run ./packages/opencode/script/build.ts ${buildFlags}`.cwd(ROOT)
  }

  if (!existsSync(DIST_DIR)) {
    throw new Error(`Dist directory not found: ${DIST_DIR}. Run with --build or build packages/opencode first.`)
  }

  // Setup output directory
  rmSync(OUTDIR, { recursive: true, force: true })
  mkdirSync(OUTDIR, { recursive: true })

  // Find built targets matching standard primary targets
  const entries = readdirSync(DIST_DIR).filter((name) => {
    const fullPath = join(DIST_DIR, name)
    return statSync(fullPath).isDirectory() && TARGET_MAP[name] !== undefined
  })

  if (entries.length === 0) {
    throw new Error(`No primary target directories found in ${DIST_DIR}`)
  }

  console.log(`Packaging ${entries.length} primary platform target(s): ${entries.join(", ")}\n`)

  const targetMatrix: Record<string, any> = {}

  for (const targetName of entries) {
    const targetDir = join(DIST_DIR, targetName)
    const targetMeta = TARGET_MAP[targetName]!
    const binName = targetMeta.isWindows ? "opencode.exe" : "opencode"
    const binPath = join(targetDir, "bin", binName)

    if (!existsSync(binPath)) {
      console.warn(`  [skip] Binary not found at ${binPath}`)
      continue
    }

    const archiveExt = targetMeta.isWindows ? "zip" : "tar.gz"
    const archiveName = `${targetName}.${archiveExt}`
    const archivePath = join(OUTDIR, archiveName)

    console.log(`  -> Compressing ${targetName} -> ${archiveName}...`)
    if (targetMeta.isWindows) {
      await $`zip -q -r ${archivePath} bin`.cwd(targetDir)
    } else {
      await $`tar -czf ${archivePath} -C ${targetDir} bin`.cwd(ROOT)
    }

    const checksum = sha256File(archivePath)
    const checksumPath = `${archivePath}.sha256`
    writeFileSync(checksumPath, `${checksum}  ${archiveName}\n`)

    const releaseUrl = `https://github.com/rustybret/opencode/releases/download/v${version}-fork/${archiveName}`

    const assetEntry = {
      target_triple: targetMeta.triple,
      binary_name: binName,
      asset: {
        filename: archiveName,
        url: releaseUrl,
        sha256: checksum,
        strip_components: 1,
      },
    }

    // Populate both the canonical Arcus key ("linux-x64", "win32-x64", "darwin-arm64")
    // and the directory key ("opencode-linux-x64", etc.) for maximum compatibility.
    targetMatrix[targetMeta.matrixKey] = assetEntry
    if (targetMeta.matrixKey !== targetName) {
      targetMatrix[targetName] = assetEntry
    }

    console.log(`     Target: ${targetMeta.matrixKey} (${targetMeta.triple})`)
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

  console.log(`[OK] Arcus multi-arch release payload ready at ${OUTDIR}`)
  console.log(`  Manifest: ${manifestPath}`)
  console.log(`  Included targets: ${Object.keys(targetMatrix).join(", ")}`)
  console.log(`\nNext release step:`)
  console.log(`  bash script/publish-arcus-artifact.sh`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
