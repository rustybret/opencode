import { Schema } from "effect"

/**
 * Cross-project mailbox envelope schema.
 */
export const MailboxIntent = Schema.Literals(["question", "quick", "impl", "review", "work-loop", "plan"])
export type MailboxIntent = typeof MailboxIntent.Type

export const MailboxEnvelope = Schema.Struct({
  version: Schema.Literal(1),
  messageId: Schema.String,
  timestamp: Schema.Number,
  correlationId: Schema.String,
  inReplyToMessageId: Schema.NullOr(Schema.String),
  fromProject: Schema.String,
  toProject: Schema.String,
  fromProjectId: Schema.String,
  toProjectId: Schema.String,
  intent: MailboxIntent,
  category: Schema.optional(Schema.String),
  priority: Schema.Number,
  hopCount: Schema.Number,
  hopPath: Schema.Array(Schema.String),
  supersedes: Schema.NullOr(Schema.String),
})
export type MailboxEnvelope = typeof MailboxEnvelope.Type
