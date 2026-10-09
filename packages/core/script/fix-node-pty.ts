#!/usr/bin/env bun

import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dir = path.resolve(__dirname, "..")

if (process.platform !== "win32") {
  const root = path.join(dir, "node_modules", "node-pty", "prebuilds")
  const dirs = await fs.readdir(root, { withFileTypes: true }).catch(() => [])
  const files = dirs.filter((x) => x.isDirectory()).map((x) => path.join(root, x.name, "spawn-helper"))
  const result = await Promise.all(
    files.map(async (file) => {
      const stat = await fs.stat(file).catch(() => undefined)
      if (!stat) return
      if ((stat.mode & 0o111) === 0o111) return
      await fs.chmod(file, stat.mode | 0o755)
      return file
    }),
  )
  const fixed = result.filter(Boolean)
  if (fixed.length) {
    console.log(`fixed node-pty permissions for ${fixed.length} helper${fixed.length === 1 ? "" : "s"}`)
  }
}

const bunPtyTerminal = path.join(dir, "node_modules", "bun-pty", "src", "terminal.ts")
if (await fs.stat(bunPtyTerminal).catch(() => undefined)) {
  let content = await fs.readFile(bunPtyTerminal, "utf-8")
  if (!content.includes("this._exitEvent")) {
    content = content
      .replace(
        "private readonly _onExit = new EventEmitter<IExitEvent>();",
        "private readonly _onExit = new EventEmitter<IExitEvent>();\n\tprivate _exitEvent: IExitEvent | null = null;",
      )
      .replace(
        "get onExit() {\n\t\treturn this._onExit.event;\n\t}",
        "get onExit() {\n\t\treturn (listener: (e: IExitEvent) => void): IDisposable => {\n\t\t\tif (this._exitEvent) {\n\t\t\t\tconst ev = this._exitEvent;\n\t\t\t\tqueueMicrotask(() => listener(ev));\n\t\t\t\treturn { dispose: () => {} };\n\t\t\t}\n\t\t\treturn this._onExit.event(listener);\n\t\t};\n\t}",
      )
      .replace(
        "this._onExit.fire({ exitCode });\n\t\t\t\tbreak;",
        "this._exitEvent = { exitCode };\n\t\t\t\tthis._onExit.fire(this._exitEvent);\n\t\t\t\tbreak;",
      )
      .replace(
        "} else if (n < 0) {\n\t\t\t\t// error - flush decoder before breaking\n\t\t\t\tconst remaining = this._decoder.decode();\n\t\t\t\tif (remaining) {\n\t\t\t\t\tthis._onData.fire(remaining);\n\t\t\t\t}\n\t\t\t\tbreak;",
        "} else if (n < 0) {\n\t\t\t\t// error or EOF - flush decoder before breaking\n\t\t\t\tconst remaining = this._decoder.decode();\n\t\t\t\tif (remaining) {\n\t\t\t\t\tthis._onData.fire(remaining);\n\t\t\t\t}\n\t\t\t\tconst exitCode = lib.symbols.bun_pty_get_exit_code(this.handle);\n\t\t\t\tthis._exitEvent = { exitCode: exitCode >= 0 ? exitCode : 0 };\n\t\t\t\tthis._onExit.fire(this._exitEvent);\n\t\t\t\tbreak;",
      )
      .replace(
        "this._onExit.fire({ exitCode: 0, signal });",
        "if (!this._exitEvent) {\n\t\t\tthis._exitEvent = { exitCode: 0, signal };\n\t\t\tthis._onExit.fire(this._exitEvent);\n\t\t}",
      )
    await fs.writeFile(bunPtyTerminal, content, "utf-8")
    console.log("patched bun-pty to retain exit events and handle EOF")
  }
}
