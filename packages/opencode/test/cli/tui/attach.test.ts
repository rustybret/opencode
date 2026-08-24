import { describe, expect, test } from "bun:test"
import { resolveAttachUrl, AttachCommand } from "@/cli/cmd/attach"

describe("tui attach", () => {
  test("loads the TUI integration lazily", async () => {
    const source = await Bun.file(new URL("../../../src/cli/cmd/attach.ts", import.meta.url)).text()

    expect(source).toContain('await import("../tui/layer")')
    expect(source).toMatch(/await import\(["']@\/plugin\/tui\/runtime["']\)/)
    expect(source).not.toContain('import("./app")')
  })

  test("AttachCommand defines optional url argument", () => {
    expect(AttachCommand.command).toBe("attach [url]")
  })

  describe("resolveAttachUrl", () => {
    test("resolves missing url to default http://127.0.0.1:4096", () => {
      expect(resolveAttachUrl()).toBe("http://127.0.0.1:4096")
      expect(resolveAttachUrl("")).toBe("http://127.0.0.1:4096")
      expect(resolveAttachUrl("   ")).toBe("http://127.0.0.1:4096")
    })

    test("resolves numeric port to default host with specified port", () => {
      expect(resolveAttachUrl("4097")).toBe("http://127.0.0.1:4097")
      expect(resolveAttachUrl("8080")).toBe("http://127.0.0.1:8080")
      expect(resolveAttachUrl("3000")).toBe("http://127.0.0.1:3000")
    })

    test("resolves domain without scheme or port to http://<domain>:4096", () => {
      expect(resolveAttachUrl("code.rustybret.com")).toBe("http://code.rustybret.com:4096")
      expect(resolveAttachUrl("localhost")).toBe("http://localhost:4096")
      expect(resolveAttachUrl("127.0.0.1")).toBe("http://127.0.0.1:4096")
    })

    test("resolves domain with port but missing scheme to http://<domain>:<port>", () => {
      expect(resolveAttachUrl("code.rustybret.com:8080")).toBe("http://code.rustybret.com:8080")
      expect(resolveAttachUrl("localhost:3000")).toBe("http://localhost:3000")
      expect(resolveAttachUrl("127.0.0.1:4097")).toBe("http://127.0.0.1:4097")
    })

    test("preserves existing scheme and adds default port if omitted", () => {
      expect(resolveAttachUrl("http://code.rustybret.com")).toBe("http://code.rustybret.com:4096")
      expect(resolveAttachUrl("http://code.rustybret.com:4097")).toBe("http://code.rustybret.com:4097")
      expect(resolveAttachUrl("https://code.rustybret.com")).toBe("https://code.rustybret.com:4096")
      expect(resolveAttachUrl("https://code.rustybret.com:8443")).toBe("https://code.rustybret.com:8443")
      expect(resolveAttachUrl("http://127.0.0.1:4097")).toBe("http://127.0.0.1:4097")
    })

    test("respects server config overrides for default hostname and port", () => {
      const config = {
        server: {
          hostname: "0.0.0.0",
          port: 5000,
        },
      }

      expect(resolveAttachUrl(undefined, config)).toBe("http://0.0.0.0:5000")
      expect(resolveAttachUrl("4097", config)).toBe("http://0.0.0.0:4097")
      expect(resolveAttachUrl("code.rustybret.com", config)).toBe("http://code.rustybret.com:5000")
      expect(resolveAttachUrl("code.rustybret.com:8080", config)).toBe("http://code.rustybret.com:8080")
    })
  })
})
