import { spawn as create } from "bun-pty"
import type { Exit, Opts, Proc } from "./pty"

export type { Disp, Exit, Opts, Proc } from "./pty"

export function spawn(file: string, args: string[], opts: Opts): Proc {
  const pty = create(file, args, opts)
  let exited: Exit | undefined
  const exitListeners = new Set<(event: Exit) => void>()
  pty.onExit((event) => {
    exited = event
    for (const listener of exitListeners) {
      listener(event)
    }
  })

  return {
    pid: pty.pid,
    onData(listener) {
      return pty.onData(listener)
    },
    onExit(listener) {
      if (exited) {
        queueMicrotask(() => listener(exited!))
        return { dispose: () => {} }
      }
      exitListeners.add(listener)
      return {
        dispose: () => {
          exitListeners.delete(listener)
        },
      }
    },
    write(data) {
      pty.write(data)
    },
    resize(cols, rows) {
      pty.resize(cols, rows)
    },
    kill(signal) {
      pty.kill(signal)
    },
  }
}
