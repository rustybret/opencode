import { Schema } from "effect"

/**
 * UcsExternalApp 6 Core Contract Verbs and state requirements.
 */
export const UcsExternalAppVerb = Schema.Literals(["connect",
  "status",
  "capabilities",
  "checkpoint",
  "blocked-on-human",
  "stream-progress",])
export type UcsExternalAppVerb = typeof UcsExternalAppVerb.Type

export const UcsExternalAppState = Schema.Literals(["disconnected",
  "connecting",
  "connected",
  "blocked-on-human",
  "busy-streaming",
  "error",])
export type UcsExternalAppState = typeof UcsExternalAppState.Type

export interface UcsExternalAppAdapter {
  readonly appId: string
  readonly name: string
  readonly connect: (params?: Record<string, unknown>) => Promise<{ connected: boolean; state: unknown }>
  readonly status: () => Promise<{ state: UcsExternalAppState; activeMode?: string; context?: unknown }>
  readonly capabilities: () => Promise<{ actions: string[]; tools: string[]; events: string[] }>
  readonly checkpoint: (label: string) => Promise<{ checkpointId: string; created: boolean }>
  readonly blockedOnHuman: (reason: string) => Promise<void>
  readonly streamProgress: (onProgress: (event: { progress: number; message: string }) => void) => () => void
}
