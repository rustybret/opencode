import { Schema } from "effect"

/**
 * Stable V1 OpenCode Plugin ABI contract definition.
 */
export interface PluginInput {
  readonly client: unknown
  readonly project: unknown
  readonly directory: string
  readonly workdir?: string
}

export interface PluginHooks {
  readonly event?: (event: unknown) => Promise<void>
  readonly tool?: Record<string, unknown>
  readonly config?: (config: unknown) => Promise<unknown>
  readonly dispose?: () => Promise<void>
}

export type PluginFn = (input: PluginInput, options?: Record<string, unknown>) => Promise<PluginHooks>

export const PluginMetadata = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  version: Schema.String,
  phase: Schema.optional(Schema.String),
})
export type PluginMetadata = typeof PluginMetadata.Type
