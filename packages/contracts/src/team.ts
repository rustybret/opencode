import { Schema } from "effect"

/**
 * Team Mode storage layout and metadata specifications (~/.omo/teams/{name}/).
 */
export const TeamMemberRole = Schema.Literals(["lead", "worker", "critic", "researcher", "specialist"])
export type TeamMemberRole = typeof TeamMemberRole.Type

export const TeamMember = Schema.Struct({
  name: Schema.String,
  role: TeamMemberRole,
  category: Schema.String,
  prompt: Schema.String,
  skills: Schema.Array(Schema.String),
})
export type TeamMember = typeof TeamMember.Type

export const TeamSpec = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  leadSessionId: Schema.optional(Schema.String),
  members: Schema.Array(TeamMember),
})
export type TeamSpec = typeof TeamSpec.Type

export interface TeamStorageLayout {
  readonly configPath: string
  readonly statePath: string
  readonly mailboxDir: string
  readonly tasklistPath: string
  readonly worktreesDir: string
}
