import { homedir } from "os"
import { join } from "path"
import { existsSync, renameSync, unlinkSync, chmodSync } from "fs"

export interface ArcusManifest {
  name?: string
  version: string
  daemon?: {
    target_matrix?: {
      [target: string]: {
        asset?: {
          url: string
          sha256?: string
        }
      }
    }
  }
}

/**
 * Atomic in-place upgrade of the OpenCode binary from Arcus package distribution.
 *
 * When an executable is actively running on Unix/macOS, attempting to overwrite
 * the binary directly can fail or cause bus errors for running processes.
 * By downloading to a temporary sibling file and performing an atomic rename (mv/renameSync),
 * Unix file descriptor semantics preserve the inode for active instances while
 * directing new process invocations to the newly installed binary.
 */
export async function upgradeFromArcus(target?: string): Promise<boolean> {
  const home = homedir()
  if (!home) return false

  const platform = process.platform === "darwin" ? "darwin" : "linux"
  const arch = process.arch === "arm64" ? "arm64" : "x64"
  const targetKey = `opencode-${platform}-${arch}`

  // Check local arcus manifest path if present, or fetch from cloudhome/arcus release url
  const manifestPath = join(home, "submodules/arcus/manifests/opencode/latest.json")
  let manifest: ArcusManifest | null = null

  if (existsSync(manifestPath)) {
    try {
      manifest = await Bun.file(manifestPath).json()
    } catch {
      manifest = null
    }
  }

  const asset = manifest?.daemon?.target_matrix?.[targetKey]?.asset
  const downloadUrl =
    asset?.url ??
    (target
      ? `https://github.com/rustybret/opencode/releases/download/v${target}-fork/opencode-${platform}-${arch}`
      : null)

  if (!downloadUrl) return false

  const destBin = join(home, ".opencode/bin/opencode")
  const binDir = join(home, ".opencode/bin")
  const tmpBin = join(binDir, `opencode.update-${Date.now()}-${process.pid}`)

  try {
    const res = await fetch(downloadUrl)
    if (!res.ok) return false

    const buffer = await res.arrayBuffer()
    await Bun.write(tmpBin, buffer)
    chmodSync(tmpBin, 0o755)

    // Atomic replacement: rename tmp file over destination
    renameSync(tmpBin, destBin)
    return true
  } catch (error) {
    if (existsSync(tmpBin)) {
      try {
        unlinkSync(tmpBin)
      } catch {}
    }
    return false
  }
}
