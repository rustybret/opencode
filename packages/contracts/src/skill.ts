import { Schema } from "effect"

/**
 * Skill manifest provenance and verification metadata.
 */
export const SkillFileChecksum = Schema.Struct({
  path: Schema.String,
  sha256: Schema.String,
})
export type SkillFileChecksum = typeof SkillFileChecksum.Type

export const SkillManifestProvenance = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
  sourceRepo: Schema.String,
  sourceRev: Schema.String,
  checksums: Schema.Array(SkillFileChecksum),
  installedAt: Schema.Number,
})
export type SkillManifestProvenance = typeof SkillManifestProvenance.Type
