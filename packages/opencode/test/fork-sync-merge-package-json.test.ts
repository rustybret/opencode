import { describe, expect, test } from "bun:test"
import { mergePackageJson, mergeDict } from "../../../script/fork-sync-merge-package-json"

describe("fork-sync-merge-package-json", () => {
  test("accepts upstream dependency updates while preserving fork-pinned patched dependencies", () => {
    const base = {
      name: "@opencode-ai/core",
      version: "1.18.29",
      dependencies: {
        "@ai-sdk/gateway": "3.0.104",
        "@ai-sdk/google": "3.0.73",
        "@ai-sdk/provider": "3.0.8",
      },
    }

    const ours = {
      name: "@opencode-ai/core",
      version: "1.18.29",
      dependencies: {
        "@ai-sdk/gateway": "3.0.104",
        "@ai-sdk/google": "3.0.104", // fork patch
        "@ai-sdk/provider": "3.0.8",
      },
    }

    const theirs = {
      name: "@opencode-ai/core",
      version: "1.18.30",
      dependencies: {
        "@ai-sdk/gateway": "3.0.191", // upstream bump
        "@ai-sdk/google": "3.0.73",
        "@ai-sdk/provider": "3.0.16", // upstream bump
      },
    }

    const rootPatchedDeps = {
      "@ai-sdk/google@3.0.104": "patches/@ai-sdk%2Fgoogle@3.0.104.patch",
    }

    const merged = mergePackageJson(base, ours, theirs, rootPatchedDeps)

    expect(merged.version).toBe("1.18.30")
    expect(merged.dependencies["@ai-sdk/gateway"]).toBe("3.0.191") // took upstream bump
    expect(merged.dependencies["@ai-sdk/provider"]).toBe("3.0.16") // took upstream bump
    expect(merged.dependencies["@ai-sdk/google"]).toBe("3.0.104") // preserved fork patch
  })

  test("preserves fork added workspace dependencies", () => {
    const base = {
      name: "opencode",
      dependencies: {
        "@ai-sdk/openai": "3.0.88",
      },
    }

    const ours = {
      name: "opencode",
      dependencies: {
        "@ai-sdk/openai": "3.0.88",
        "@ucs/contracts": "workspace:*",
        "@ucs/external-app-unity": "workspace:*",
      },
    }

    const theirs = {
      name: "opencode",
      dependencies: {
        "@ai-sdk/openai": "3.0.88",
        "@ai-sdk/togetherai": "2.0.41",
      },
    }

    const merged = mergePackageJson(base, ours, theirs)

    expect(merged.dependencies["@ucs/contracts"]).toBe("workspace:*")
    expect(merged.dependencies["@ucs/external-app-unity"]).toBe("workspace:*")
    expect(merged.dependencies["@ai-sdk/togetherai"]).toBe("2.0.41")
  })

  test("preserves fork custom scripts and options", () => {
    const base = {
      name: "@opencode-ai/core",
      scripts: {
        test: "bun test --only-failures",
        build: "bun build",
      },
    }

    const ours = {
      name: "@opencode-ai/core",
      scripts: {
        test: "bun test --timeout 30000 --only-failures",
        build: "bun build",
        "custom:fork": "bun run fork.ts",
      },
    }

    const theirs = {
      name: "@opencode-ai/core",
      scripts: {
        test: "bun test --only-failures",
        build: "bun build --target node",
      },
    }

    const merged = mergePackageJson(base, ours, theirs)

    expect(merged.scripts["test"]).toBe("bun test --timeout 30000 --only-failures")
    expect(merged.scripts["build"]).toBe("bun build --target node")
    expect(merged.scripts["custom:fork"]).toBe("bun run fork.ts")
  })

  test("handles patchedDependencies update cleanly", () => {
    const base = {
      patchedDependencies: {
        "@ai-sdk/google@3.0.73": "patches/@ai-sdk%2Fgoogle@3.0.73.patch",
        "pacote@21.5.0": "patches/pacote@21.5.0.patch",
      },
    }

    const ours = {
      patchedDependencies: {
        "@ai-sdk/google@3.0.104": "patches/@ai-sdk%2Fgoogle@3.0.104.patch",
        "pacote@21.5.0": "patches/pacote@21.5.0.patch",
      },
    }

    const theirs = {
      patchedDependencies: {
        "@ai-sdk/google@3.0.73": "patches/@ai-sdk%2Fgoogle@3.0.73.patch",
        "pacote@21.5.0": "patches/pacote@21.5.0.patch",
        "@ai-sdk/mistral@3.0.51": "patches/@ai-sdk%2Fmistral@3.0.51.patch",
      },
    }

    const merged = mergePackageJson(base, ours, theirs)

    expect(merged.patchedDependencies["@ai-sdk/google@3.0.104"]).toBe("patches/@ai-sdk%2Fgoogle@3.0.104.patch")
    expect(merged.patchedDependencies["@ai-sdk/google@3.0.73"]).toBeUndefined()
    expect(merged.patchedDependencies["@ai-sdk/mistral@3.0.51"]).toBe("patches/@ai-sdk%2Fmistral@3.0.51.patch")
  })
})
