export * as DurableEventManifest from "./durable-event-manifest.js"

import { Event } from "./event.js"
import { ExternalAppEvent } from "./external-app-event.js"
import { Worktree } from "./worktree.js"
import { SessionEvent } from "./session-event.js"

export const Durable = Event.durableMap([
  ...SessionEvent.DurableDefinitions,
  Worktree.Event.Resolved,
  ...ExternalAppEvent.DurableDefinitions,
])
