import { EventEmitter } from "events"
import { Identifier } from "@/id/id"

export type GlobalEvent = {
  directory?: string
  project?: string
  workspace?: string
  payload: any
}

class GlobalBusEmitter extends EventEmitter<{
  event: [GlobalEvent]
}> {
  constructor() {
    super()
    // Every attached project/client adds an "event" listener (SSE streams, control plane,
    // TUI worker), so the default cap of 10 triggers MaxListenersExceededWarning under
    // normal multi-project fan-out. Listeners are paired with off() via acquireRelease.
    this.setMaxListeners(0)
  }


  override emit(eventName: "event", event: GlobalEvent): boolean {
    if (event.payload && typeof event.payload === "object" && !("id" in event.payload)) {
      event.payload.id = event.payload.syncEvent?.id ?? Identifier.create("evt", "ascending")
    }
    return super.emit(eventName, event)
  }
}

export const GlobalBus = new GlobalBusEmitter()
