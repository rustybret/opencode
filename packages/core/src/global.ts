import path from "path"
import fs from "fs/promises"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import os from "os"
import { Context, Effect, Layer } from "effect"
import { Flock } from "./util/flock"
import { Flag } from "./flag/flag"
import { makeGlobalNode } from "./effect/app-node"

const app = "opencode"

let customConfig: string | undefined
let customData: string | undefined
let customCache: string | undefined
let customState: string | undefined

const paths = {
  get home() {
    return process.env.OPENCODE_TEST_HOME ?? os.homedir()
  },
  get data() {
    if (customData) return customData
    if (process.env.XDG_DATA_HOME) return path.join(process.env.XDG_DATA_HOME, app)
    if (process.env.OPENCODE_TEST_HOME) return path.join(process.env.OPENCODE_TEST_HOME, ".local", "share", app)
    return path.join(xdgData!, app)
  },
  set data(v: string) {
    customData = v
  },
  get bin() {
    return path.join(this.cache, "bin")
  },
  get log() {
    return path.join(this.data, "log")
  },
  get repos() {
    return path.join(this.data, "repos")
  },
  get cache() {
    if (customCache) return customCache
    if (process.env.XDG_CACHE_HOME) return path.join(process.env.XDG_CACHE_HOME, app)
    if (process.env.OPENCODE_TEST_HOME) return path.join(process.env.OPENCODE_TEST_HOME, ".cache", app)
    return path.join(xdgCache!, app)
  },
  set cache(v: string) {
    customCache = v
  },
  get config() {
    if (customConfig) return customConfig
    if (process.env.XDG_CONFIG_HOME) return path.join(process.env.XDG_CONFIG_HOME, app)
    if (process.env.OPENCODE_TEST_HOME) return path.join(process.env.OPENCODE_TEST_HOME, ".config", app)
    return path.join(xdgConfig!, app)
  },
  set config(v: string) {
    customConfig = v
  },
  get state() {
    if (customState) return customState
    if (process.env.XDG_STATE_HOME) return path.join(process.env.XDG_STATE_HOME, app)
    if (process.env.OPENCODE_TEST_HOME) return path.join(process.env.OPENCODE_TEST_HOME, ".local", "state", app)
    return path.join(xdgState!, app)
  },
  set state(v: string) {
    customState = v
  },
  get tmp() {
    return path.join(os.tmpdir(), app)
  },
}

export const Path = paths

Flock.setGlobal({ state: Path.state })

await Promise.all([
  fs.mkdir(Path.data, { recursive: true }),
  fs.mkdir(Path.config, { recursive: true }),
  fs.mkdir(Path.state, { recursive: true }),
  fs.mkdir(Path.tmp, { recursive: true }),
  fs.mkdir(Path.log, { recursive: true }),
  fs.mkdir(Path.bin, { recursive: true }),
  fs.mkdir(Path.repos, { recursive: true }),
])

export class Service extends Context.Service<Service, Interface>()("@opencode/Global") {}

export interface Interface {
  readonly home: string
  readonly data: string
  readonly cache: string
  readonly config: string
  readonly state: string
  readonly tmp: string
  readonly bin: string
  readonly log: string
  readonly repos: string
}

export function make(input: Partial<Interface> = {}): Interface {
  return {
    home: Path.home,
    data: Path.data,
    cache: Path.cache,
    config: Flag.OPENCODE_CONFIG_DIR ?? Path.config,
    state: Path.state,
    tmp: Path.tmp,
    bin: Path.bin,
    log: Path.log,
    repos: Path.repos,
    ...input,
  }
}

const layer = Layer.effect(
  Service,
  Effect.sync(() => Service.of(make())),
)

export const node = makeGlobalNode({ service: Service, layer: layer, deps: [] })

export const layerWith = (input: Partial<Interface>) =>
  Layer.effect(
    Service,
    Effect.sync(() => Service.of(make(input))),
  )

export * as Global from "./global"
