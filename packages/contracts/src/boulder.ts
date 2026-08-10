import { Schema } from "effect"

/**
 * Boulder state schema for task tracking, execution progress, and restart recovery.
 */
export const BoulderStepStatus = Schema.Literal("pending", "in_progress", "completed", "failed", "cancelled")
export type BoulderStepStatus = typeof BoulderStepStatus.Type

export const BoulderStep = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  status: BoulderStepStatus,
  description: Schema.optional(Schema.String),
  assignedAgent: Schema.optional(Schema.String),
  startedAt: Schema.optional(Schema.Number),
  completedAt: Schema.optional(Schema.Number),
  error: Schema.optional(Schema.String),
})
export type BoulderStep = typeof BoulderStep.Type

export const BoulderState = Schema.Struct({
  version: Schema.Literal(1),
  taskGoal: Schema.String,
  currentStepId: Schema.optional(Schema.String),
  steps: Schema.Array(BoulderStep),
  updatedAt: Schema.Number,
})
export type BoulderState = typeof BoulderState.Type
