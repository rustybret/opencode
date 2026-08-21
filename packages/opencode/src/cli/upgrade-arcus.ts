import { homedir } from "os"
import { join } from "path"
import { existsSync, renameSync, unlinkSync, chmodSync, readdirSync, lstatSync, copyFileSync, mkdirSync, rmSync } from "fs"
import { spawnSync } from "child_process"
import { createHash } from "crypto"
import { $ } from "bun"

export interface ArcusManifest {
  name?: string
  version: string
  daemon?: {
    target_matrix?: {
      [target: string]: {
        binary_name?: string
        asset?: {
          filename?: string
          url: string
          sha256?: string
        }
      }
    }
  }
}

export interface BlessedFleetManifest {
  fleet_version?: string
  host?: {
    opencode?: {
      blessed_version?: string
      manifest?: string
    }
  }
}

function sha256Buffer(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex")
}

/**
 * Safe versioned binary installation and replacement for OpenCode via Arcus.
 *
 * Integrates with:
 * 1. Arcus Blessed Fleet manifest (`arcus-blessed-plugins.json`)
 * 2. Versioned Arcus manifests (`manifests/opencode/v<version>.json`)
 * 3. Canonical 5 platform target keys (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `win32-x64`)
 * 4. Pre-activation smoke tests (--version + debug config)
 * 5. Atomic replacement into ~/.opencode/bin/opencode
 */
export async function upgradeFromArcus(target?: string): Promise<boolean> {
  const home = homedir()
  if (!home) return false

  const systemPlatform = process.platform === "win32" ? "win32" : process.platform === "darwin" ? "darwin" : "linux"
  const arch = process.arch === "arm64" ? "arm64" : "x64"
  const canonicalTargetKey = `${systemPlatform}-${arch}`
  const binaryName = systemPlatform === "win32" ? "opencode.exe" : "opencode"

  // 1. Locate Arcus repository (submodules/arcus, ../arcus, or ~/.config/opencode/arcus)
  const candidateArcusPaths = [
    join(home, "submodules/arcus"),
    join(home, ".config/opencode/arcus"),
    join(process.cwd(), "submodules/arcus"),
    join(process.cwd(), "../arcus"),
  ]

  let arcusDir = ""
  for (const p of candidateArcusPaths) {
    if (existsSync(join(p, "manifests"))) {
      arcusDir = p
      break
    }
  }

  let manifest: ArcusManifest | null = null
  let versionTag = target

  if (arcusDir) {
    // Check blessed fleet manifest first if no specific target requested
    if (!versionTag) {
      const blessedPath = join(arcusDir, "arcus-blessed-plugins.json")
      if (existsSync(blessedPath)) {
        try {
          const blessedDoc: BlessedFleetManifest = await Bun.file(blessedPath).json()
          const blessedHost = blessedDoc.host?.opencode
          if (blessedHost?.blessed_version) {
            versionTag = blessedHost.blessed_version
          }
          if (blessedHost?.manifest && existsSync(join(arcusDir, blessedHost.manifest))) {
            manifest = await Bun.file(join(arcusDir, blessedHost.manifest)).json()
          }
        } catch {}
      }
    }

    // Try versioned manifest
    if (!manifest && versionTag) {
      const manifestFile = join(arcusDir, "manifests/opencode", `v${versionTag}.json`)
      if (existsSync(manifestFile)) {
        try {
          manifest = await Bun.file(manifestFile).json()
        } catch {}
      }
    }
  }

  // 2. Resolve asset URL & checksum from target matrix
  const matrix = manifest?.daemon?.target_matrix
  const targetEntry =
    matrix?.[canonicalTargetKey] ??
    matrix?.[`opencode-${canonicalTargetKey}`] ??
    matrix?.[`opencode-${systemPlatform === "win32" ? "windows" : systemPlatform}-${arch}`]

  const asset = targetEntry?.asset
  const downloadUrl =
    asset?.url ??
    (versionTag
      ? `https://github.com/rustybret/opencode/releases/download/v${versionTag}/opencode-${canonicalTargetKey}.${systemPlatform === "win32" ? "zip" : "tar.gz"}`
      : null)

  if (!downloadUrl) return false

  const binDir = join(home, ".opencode/bin")
  const versionsDir = join(home, ".opencode/versions")
  const destBin = join(binDir, binaryName)
  const versionedBin = join(versionsDir, `opencode-${versionTag ?? "latest"}`)
  const tmpDir = join(binDir, `stage-${Date.now()}-${process.pid}`)
  const tmpBin = join(tmpDir, binaryName)

  try {
    mkdirSync(binDir, { recursive: true })
    mkdirSync(versionsDir, { recursive: true })
    mkdirSync(tmpDir, { recursive: true })

    // 3. Download asset
    const res = await fetch(downloadUrl)
    if (!res.ok) {
      rmSync(tmpDir, { recursive: true, force: true })
      return false
    }

    const buffer = await res.arrayBuffer()

    // Verify SHA256 if declared in manifest
    if (asset?.sha256 && !asset.sha256.toUpperCase().includes("PENDING")) {
      const actualHash = sha256Buffer(buffer)
      if (actualHash.toLowerCase() !== asset.sha256.toLowerCase()) {
        console.error(`Arcus binary SHA256 mismatch (expected ${asset.sha256}, got ${actualHash})`)
        rmSync(tmpDir, { recursive: true, force: true })
        return false
      }
    }

    // 4. Extract archive
    const isZip = downloadUrl.endsWith(".zip") || asset?.filename?.endsWith(".zip")
    const isTar =
      downloadUrl.endsWith(".tar.gz") ||
      downloadUrl.endsWith(".tgz") ||
      asset?.filename?.endsWith(".tar.gz") ||
      asset?.filename?.endsWith(".tgz")

    if (isZip || isTar) {
      const archivePath = join(tmpDir, isZip ? "package.zip" : "package.tar.gz")
      await Bun.write(archivePath, buffer)

      if (isZip) {
        await $`unzip -q -o ${archivePath} -d ${tmpDir}`.quiet()
      } else {
        await $`tar -xzf ${archivePath} -C ${tmpDir}`.quiet()
      }
      unlinkSync(archivePath)
    } else {
      // Raw binary
      await Bun.write(tmpBin, buffer)
    }

    if (!existsSync(tmpBin)) {
      console.error(`Arcus binary ${binaryName} not found after extract in ${tmpDir}`)
      rmSync(tmpDir, { recursive: true, force: true })
      return false
    }

    chmodSync(tmpBin, 0o755)

    // 5. Pre-activation Smoke Verification: Test candidate binary before promoting
    const versionCheck = spawnSync(tmpBin, ["--version"], { encoding: "utf8" })
    if (versionCheck.status !== 0) {
      console.error("Arcus binary smoke test failed (--version check):", versionCheck.stderr)
      rmSync(tmpDir, { recursive: true, force: true })
      return false
    }

    const configCheck = spawnSync(tmpBin, ["debug", "config"], {
      encoding: "utf8",
      env: { ...process.env },
    })
    if (configCheck.status !== 0) {
      console.error("Arcus binary smoke test failed (debug config check):", configCheck.stderr)
      rmSync(tmpDir, { recursive: true, force: true })
      return false
    }

    // 6. Save to versioned store
    copyFileSync(tmpBin, versionedBin)
    chmodSync(versionedBin, 0o755)

    // 7. Atomic Replacement: rename candidate binary over active binary
    renameSync(tmpBin, destBin)
    rmSync(tmpDir, { recursive: true, force: true })

    // 8. Prune old versions (keep top 3 versions for safe rollback)
    pruneTrailingVersions(versionsDir, 3)

    return true
  } catch (error) {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
    return false
  }
}

/**
 * Retains the top N newest versions in ~/.opencode/versions and prunes older ones.
 */
function pruneTrailingVersions(versionsDir: string, retainCount = 3) {
  try {
    if (!existsSync(versionsDir)) return
    const entries = readdirSync(versionsDir)
      .filter((name) => name.startsWith("opencode-"))
      .map((name) => {
        const fullPath = join(versionsDir, name)
        const stat = lstatSync(fullPath)
        return { name, path: fullPath, mtime: stat.mtimeMs }
      })
      .sort((a, b) => b.mtime - a.mtime)

    const toDelete = entries.slice(retainCount)
    for (const item of toDelete) {
      try {
        unlinkSync(item.path)
      } catch {}
    }
  } catch {}
}
