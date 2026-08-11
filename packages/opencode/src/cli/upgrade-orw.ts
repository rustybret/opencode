export async function upgradeFromOrw(target: string): Promise<boolean> {
  const home = process.env.HOME ?? ""
  if (!home) return false
  const platform = process.platform
  const arch = process.arch === "arm64" ? "arm64" : "x64"
  const distDir = `${home}/opencode-release-watch/.orw/repo/opencode-build/packages/opencode/dist/opencode-${platform}-${arch}`
  const pkgJson = `${distDir}/package.json`
  const pkg = (await Bun.file(pkgJson).exists())
    ? await Bun.file(pkgJson)
        .json()
        .catch(() => null)
    : null
  const orwBin = `${distDir}/bin/opencode`
  const hasLocalOrwBuild = pkg?.version === target && (await Bun.file(orwBin).exists())
  if (!hasLocalOrwBuild) {
    try {
      const releaseUrl = `https://github.com/rustybret/opencode/releases/download/v${target}-fork/opencode-${platform}-${arch}`
      const response = await fetch(releaseUrl)
      if (!response.ok) return false
      if (Bun.spawnSync(["mkdir", "-p", `${distDir}/bin`]).exitCode !== 0) return false
      await Bun.write(orwBin, await response.arrayBuffer())
      if (Bun.spawnSync(["chmod", "755", orwBin]).exitCode !== 0) return false
      console.log(`Downloaded fork build v${target} from GitHub Releases`)
    } catch (error) {
      if (error instanceof Error) return false
      throw error
    }
  }
  const tmp = `${home}/.opencode/bin/opencode.orw-tmp`
  const dest = `${home}/.opencode/bin/opencode`
  if (Bun.spawnSync(["cp", "-f", orwBin, tmp]).exitCode !== 0) return false
  if (Bun.spawnSync(["chmod", "755", tmp]).exitCode !== 0) {
    Bun.spawnSync(["rm", "-f", tmp])
    return false
  }
  if (Bun.spawnSync(["mv", "-f", tmp, dest]).exitCode !== 0) {
    Bun.spawnSync(["rm", "-f", tmp])
    return false
  }
  return true
}
