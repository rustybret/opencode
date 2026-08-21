#!/usr/bin/env bun
/**
 * Package OpenCode binary release artifacts and manifest for Arcus distribution.
 *
 * Produces:
 *   1. dist-arcus/opencode-<platform>-<arch>.tar.gz (or .zip for win32)
 *   2. dist-arcus/arcus-manifest.json conforming to manifests/schema.json in rustybret/arcus
 *
 * Usage:
 *   bun run script/package-arcus.ts              # packages current host binary (single target)
 *   bun run script/package-arcus.ts --build      # runs build.ts --single first, then packages
 *   bun run script/package-arcus.ts --all        # packages all built targets found in packages/opencode/dist
 */

import { createHash } from "crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { $ } from "bun"

const ROOT = resolve(import.meta.dir, "..")
const OPENCODE_PKG_JSON = join(ROOT, "packages", "opencode", "package.json")
const DIST_DIR = join(ROOT, "packages", "opencode", "dist")
const OUTDIR = join(ROOT, "dist-arcus")

const TARGET_TRIPLES: Record<string, string> = {
  "opencode-darwin-arm64": "aarch64-apple-darwin",
  "opencode-darwin-x64": "x86_64-apple-darwin",
  "opencode-linux-arm64": "aarch64-unknown-linux-gnu",
  "opencode-linux-x64": "x86_64-unknown-linux-gnu",
  "opencode-windows-x64": "x86_64-pc-windows-msvc",
  "opencode-win32-x64": "x86_64-pc-windows-msvc",
}

function sha256File(path: string): string {
  const data = readFileSync(path)
  return createHash("sha256").update(data).digest("hex")
}

async function main() {
  const args = process.argv.slice(2)
  const shouldBuild = args.includes("--build")
  const allTargets = args.includes("--all")

  const pkg = JSON.parse(readFileSync(OPENCODE_PKG_JSON, "utf8"))
  const version = pkg.version ?? "1.0.0"

  console.log(`=== Arcus Binary Packaging: opencode v${version} ===\n`)

  if (shouldBuild) {
    console.log("-> Building opencode standalone binary...")
    const buildFlags = allTargets ? [] : ["--single"]
    await $`bun run ./packages/opencode/script/build.ts ${buildFlags}`.cwd(ROOT)
  }

  if (!existsSync(DIST_DIR)) {
    throw new Error(`Dist directory not found: ${DIST_DIR}. Run with --build or build packages/opencode first.`)
  }

  // Setup output directory
  rmSync(OUTDIR, { recursive: true, force: true })
  mkdirSync(OUTDIR, { recursive: true })

  // Find built targets
  const entries = readdirSync(DIST_DIR).filter((name) => {
    const fullPath = join(DIST_DIR, name)
    return statSync(fullPath).isDirectory() && name.startsWith("opencode-")
  })

  if (entries.length === 0) {
    throw new Error(`No built target directories found in ${DIST_DIR}`)
  }

  console.log(`Found ${entries.length} built target(s): ${entries.join(", ")}`)

  const targetMatrix: Record<string, any> = {}

  for (const targetName of entries) {
    const targetDir = join(DIST_DIR, targetName)
    const binName = targetName.includes("windows") || targetName.includes("win32") ? "opencode.exe" : "opencode"
    const binPath = join(targetDir, "bin", binName)

    if (!existsSync(binPath)) {
      console.warn(`  [skip] Binary not found at ${binPath}`)
      continue
    }

    const archiveName = `${targetName}.tar.gz`
    const archivePath = join(OUTDIR, archiveName)

    console.log(`  -> Compressing ${targetName} -> ${archiveName}...`)
    // Create tarball containing the bin directory
    await $`tar -czf ${archivePath} -C ${targetDir} bin`.cwd(ROOT)

    const checksum = sha256File(archivePath)
    const checksumPath = `${archivePath}.sha256`
    writeFileSync(checksumPath, `${checksum}  ${archiveName}\n`)

    const triple = TARGET_TRIPLES[targetName] ?? "unknown"
    const releaseUrl = `https://github.com/rustybret/opencode/releases/download/v${version}-fork/${archiveName}`

    targetMatrix[targetName] = {
      target_triple: triple,
      binary_name: binName,
      asset: {
        filename: archiveName,
        url: releaseUrl,
        sha256: checksum,
        strip_components: 1,
      },
    }

    console.log(`     SHA256: ${checksum}`)
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

  console.log(`\n[OK] Arcus release payload ready at ${OUTDIR}`)
  console.log(`  Manifest: ${manifestPath}`)
  console.log(`\nNext release step:`)
  console.log(`  gh release create v${version}-fork dist-arcus/*.tar.gz --title "v${version}-fork"`)
  console.log(`  cp dist-arcus/arcus-manifest.json submodules/arcus/manifests/opencode/v${version}.json`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
