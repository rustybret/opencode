#!/usr/bin/env bun

/**
 * Deterministic package.json 3-way conflict resolver for fork-sync.
 *
 * During fork-sync, git's line-by-line textual merge can conflict when upstream
 * updates dependencies adjacent to fork-specific dependencies or scripts (such as
 * upstream bumping @ai-sdk/gateway while the fork holds @ai-sdk/google@3.0.104,
 * or adding fork workspace dependencies like @ucs/contracts).
 *
 * This resolver performs a semantic 3-way JSON merge on package.json:
 *   - Upstream owns the version number (mirroring upstream).
 *   - Upstream dependency updates (bumps, additions, removals) are preserved.
 *   - Fork-specific dependencies (e.g. @ucs/* workspaces, local overrides) are preserved.
 *   - Dependencies backed by root package.json patchedDependencies (e.g. @ai-sdk/google@3.0.104)
 *     are protected from being silently overwritten by unpatched upstream versions.
 *   - Fork custom scripts (e.g. fork-sync, build:single, custom test flags) are preserved.
 *   - Workspaces and patchedDependencies are merged as a union of requirements.
 *
 * Usage:
 *   bun run script/fork-sync-merge-package-json.ts <path...>
 */

import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve, relative, join } from "node:path"

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim()
}

function tryGit(args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] })
  } catch {
    return null
  }
}

function parseJson(str: string | null): any {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

export function mergeDict(
  base: Record<string, any> = {},
  ours: Record<string, any> = {},
  theirs: Record<string, any> = {},
  conflictResolver?: (key: string, baseVal: any, ourVal: any, theirVal: any) => any,
): Record<string, any> {
  const orderedKeys = Array.from(
    new Set([...Object.keys(theirs || {}), ...Object.keys(ours || {}), ...Object.keys(base || {})]),
  )

  const result: Record<string, any> = {}

  for (const key of orderedKeys) {
    const inBase = base != null && key in base
    const inOurs = ours != null && key in ours
    const inTheirs = theirs != null && key in theirs

    const baseVal = inBase ? base[key] : undefined
    const ourVal = inOurs ? ours[key] : undefined
    const theirVal = inTheirs ? theirs[key] : undefined

    if (inTheirs && !inBase) {
      if (!inOurs) {
        // Added by upstream
        result[key] = theirVal
      } else {
        // Added by both
        if (ourVal === theirVal) {
          result[key] = ourVal
        } else if (conflictResolver) {
          result[key] = conflictResolver(key, baseVal, ourVal, theirVal)
        } else {
          result[key] = theirVal
        }
      }
    } else if (inOurs && !inBase) {
      // Added by fork (e.g. @ucs/contracts, fork scripts)
      if (!inTheirs) {
        result[key] = ourVal
      }
    } else if (inBase && !inTheirs) {
      // Removed by upstream
      if (inOurs && ourVal !== baseVal) {
        // Fork modified it while upstream deleted it -> keep fork customization
        result[key] = ourVal
      }
      // Otherwise deleted by upstream
    } else if (inBase && !inOurs) {
      // Removed by fork
      if (inTheirs && theirVal !== baseVal) {
        // Upstream modified it -> take upstream
        result[key] = theirVal
      }
      // Otherwise deleted by fork
    } else {
      // Key exists in both ours and theirs
      if (ourVal === theirVal) {
        result[key] = ourVal
      } else if (ourVal === baseVal && theirVal !== baseVal) {
        // Upstream updated it, fork unchanged -> take upstream update
        result[key] = theirVal
      } else if (theirVal === baseVal && ourVal !== baseVal) {
        // Fork updated it, upstream unchanged -> keep fork update
        result[key] = ourVal
      } else {
        // Both modified it
        if (conflictResolver) {
          result[key] = conflictResolver(key, baseVal, ourVal, theirVal)
        } else {
          result[key] = theirVal
        }
      }
    }
  }

  return result
}

function dependencyConflictResolver(
  key: string,
  _baseVal: any,
  ourVal: any,
  theirVal: any,
  patchedDeps: Record<string, string> = {},
): any {
  // If the dependency version in ours is backed by a root package.json patch, preserve ours
  const patchKey = `${key}@${ourVal}`
  if (patchKey in patchedDeps) {
    return ourVal
  }
  // If ours is a local workspace dependency, preserve ours
  if (typeof ourVal === "string" && ourVal.startsWith("workspace:")) {
    return ourVal
  }
  // Otherwise take upstream's updated package version
  return theirVal ?? ourVal
}

function scriptConflictResolver(_key: string, _baseVal: any, ourVal: any, theirVal: any): any {
  // Preserve custom timeout flags in fork scripts
  if (typeof ourVal === "string" && typeof theirVal === "string") {
    if (ourVal.includes("--timeout") && !theirVal.includes("--timeout")) {
      return ourVal
    }
  }
  return ourVal ?? theirVal
}

function mergePatchedDependencies(
  _base: Record<string, string> = {},
  ours: Record<string, string> = {},
  theirs: Record<string, string> = {},
): Record<string, string> {
  const result: Record<string, string> = { ...theirs }
  for (const [key, patchPath] of Object.entries(ours || {})) {
    result[key] = patchPath
  }

  // Remove stale upstream patches if fork bumped to a newer patched version
  // e.g. if ours has @ai-sdk/google@3.0.104, remove stale @ai-sdk/google@3.0.73
  const ourPackages = new Set(Object.keys(ours || {}).map((k) => k.split("@").slice(0, -1).join("@")))
  for (const pkgName of ourPackages) {
    const ourKeys = Object.keys(ours || {}).filter((k) => k.startsWith(`${pkgName}@`))
    if (ourKeys.length > 0) {
      for (const k of Object.keys(result)) {
        if (k.startsWith(`${pkgName}@`) && !ourKeys.includes(k)) {
          delete result[k]
        }
      }
    }
  }

  return result
}

function mergeWorkspaces(base: any, ours: any, theirs: any): any {
  if (Array.isArray(ours) || Array.isArray(theirs)) {
    const ourList = Array.isArray(ours) ? ours : (ours?.packages ?? [])
    const theirList = Array.isArray(theirs) ? theirs : (theirs?.packages ?? [])
    return Array.from(new Set([...theirList, ...ourList]))
  }
  if (typeof ours === "object" || typeof theirs === "object") {
    return {
      ...theirs,
      ...ours,
      packages: Array.from(new Set([...(theirs?.packages ?? []), ...(ours?.packages ?? [])])),
    }
  }
  return theirs ?? ours ?? base
}

export function mergePackageJson(base: any, ours: any, theirs: any, rootPatchedDeps: Record<string, string> = {}): any {
  if (!ours && !theirs) return base
  if (!ours) return theirs
  if (!theirs) return ours

  const result: any = { ...theirs }

  // 1. Version: upstream owns SemVer base version
  result.version = theirs.version ?? ours.version

  // 2. Name & package identity: keep ours if fork explicitly customized it
  if (ours.name && base?.name && ours.name !== base.name) {
    result.name = ours.name
  }

  // 3. Scripts: 3-way merge preserving fork scripts and flags
  if (theirs.scripts || ours.scripts || base?.scripts) {
    result.scripts = mergeDict(base?.scripts, ours.scripts, theirs.scripts, scriptConflictResolver)
  }

  // 4. Dependencies
  if (theirs.dependencies || ours.dependencies || base?.dependencies) {
    result.dependencies = mergeDict(base?.dependencies, ours.dependencies, theirs.dependencies, (k, b, o, t) =>
      dependencyConflictResolver(k, b, o, t, rootPatchedDeps),
    )
  }

  // 5. DevDependencies
  if (theirs.devDependencies || ours.devDependencies || base?.devDependencies) {
    result.devDependencies = mergeDict(
      base?.devDependencies,
      ours.devDependencies,
      theirs.devDependencies,
      (k, b, o, t) => dependencyConflictResolver(k, b, o, t, rootPatchedDeps),
    )
  }

  // 6. PeerDependencies
  if (theirs.peerDependencies || ours.peerDependencies || base?.peerDependencies) {
    result.peerDependencies = mergeDict(
      base?.peerDependencies,
      ours.peerDependencies,
      theirs.peerDependencies,
      (k, b, o, t) => dependencyConflictResolver(k, b, o, t, rootPatchedDeps),
    )
  }

  // 7. PatchedDependencies
  if (theirs.patchedDependencies || ours.patchedDependencies || base?.patchedDependencies) {
    result.patchedDependencies = mergePatchedDependencies(
      base?.patchedDependencies,
      ours.patchedDependencies,
      theirs.patchedDependencies,
    )
  }

  // 8. Workspaces
  if (theirs.workspaces || ours.workspaces || base?.workspaces) {
    result.workspaces = mergeWorkspaces(base?.workspaces, ours.workspaces, theirs.workspaces)
  }

  // 9. Overrides & resolutions
  if (theirs.overrides || ours.overrides || base?.overrides) {
    result.overrides = mergeDict(base?.overrides, ours.overrides, theirs.overrides)
  }
  if (theirs.resolutions || ours.resolutions || base?.resolutions) {
    result.resolutions = mergeDict(base?.resolutions, ours.resolutions, theirs.resolutions)
  }

  return result
}

function resolveFile(filePath: string): boolean {
  const root = git(["rev-parse", "--show-toplevel"])
  const relPath = relative(root, resolve(process.cwd(), filePath)).replace(/\\/g, "/")
  const fullPath = resolve(root, relPath)

  // Retrieve root patchedDependencies to inform dependency resolution
  let rootPatchedDeps: Record<string, string> = {}
  try {
    const rootPkg = parseJson(
      tryGit([":2:package.json"]) ??
        tryGit(["show", `HEAD:package.json`]) ??
        readFileSync(join(root, "package.json"), "utf-8"),
    )
    if (rootPkg?.patchedDependencies) {
      rootPatchedDeps = rootPkg.patchedDependencies
    }
  } catch {
    // Ignore if root package.json not yet readable
  }

  // Read git stages
  let base = parseJson(tryGit(["show", `:1:${relPath}`]))
  let ours = parseJson(tryGit(["show", `:2:${relPath}`]))
  let theirs = parseJson(tryGit(["show", `:3:${relPath}`]))

  // If index stages are not available, try reading from refs
  if (!ours || !theirs) {
    const mergeHead = tryGit(["rev-parse", "-q", "--verify", "MERGE_HEAD"])
    const targetBranch = mergeHead ? "MERGE_HEAD" : "opencode-mirror"
    const mergeBase = tryGit(["merge-base", "HEAD", targetBranch])

    if (mergeBase) {
      base = base ?? parseJson(tryGit(["show", `${mergeBase.trim()}:${relPath}`]))
    }
    ours = ours ?? parseJson(tryGit(["show", `HEAD:${relPath}`]))
    theirs = theirs ?? parseJson(tryGit(["show", `${targetBranch}:${relPath}`]))
  }

  if (!ours || !theirs) {
    console.error(`fork-sync: unable to retrieve ours/theirs versions for ${relPath}`)
    return false
  }

  const merged = mergePackageJson(base, ours, theirs, rootPatchedDeps)
  writeFileSync(fullPath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8")
  console.log(`  fork-sync: successfully merged ${relPath}`)
  return true
}

// CLI entrypoint
if (import.meta.main) {
  const paths = process.argv.slice(2)
  if (paths.length === 0) {
    console.error("Usage: bun run script/fork-sync-merge-package-json.ts <path...>")
    process.exit(2)
  }

  let success = true
  for (const p of paths) {
    if (!resolveFile(p)) {
      success = false
    }
  }

  process.exit(success ? 0 : 1)
}
