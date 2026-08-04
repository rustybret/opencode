export async function upgradeFromOrw(target: string): Promise<boolean> {
  const home = process.env.HOME ?? ""
  if (!home) return false
  const arch = process.arch === "arm64" ? "arm64" : "x64"
  const distDir = `${home}/opencode-release-watch/.orw/repo/opencode-build/packages/opencode/dist/opencode-${process.platform}-${arch}`
  const pkgJson = `${distDir}/package.json`
  if (!(await Bun.file(pkgJson).exists())) return false
  const pkg = await Bun.file(pkgJson).json().catch(() => null)
  if (!pkg || pkg.version !== target) return false
  const orwBin = `${distDir}/bin/opencode`
  if (!(await Bun.file(orwBin).exists())) return false
  const tmp = `${home}/.opencode/bin/opencode.orw-tmp`
  const dest = `${home}/.opencode/bin/opencode`
  if (Bun.spawnSync(["cp", "-f", orwBin, tmp]).exitCode !== 0) return false
  if (Bun.spawnSync(["chmod", "755", tmp]).exitCode !== 0) { Bun.spawnSync(["rm", "-f", tmp]); return false }
  if (Bun.spawnSync(["mv", "-f", tmp, dest]).exitCode !== 0) { Bun.spawnSync(["rm", "-f", tmp]); return false }
  return true
}
