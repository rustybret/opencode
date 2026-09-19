# Arcus v2 Portable Script Bundle

Standalone, portable POSIX `sh` lifecycle scripts enabling any agent project or CI pipeline to build, pack, sign, strictly validate, publish, and migrate software for the **Arcus v2 Distribution Standard** without needing the full Arcus repository checked out.

## Supported Software Types

The bundle handles all 5 canonical Arcus v2 software types:
1. `opencode-plugin`: OpenCode runtime plugins (staged from `packages/opencode/` or root).
2. `service`: Background daemons and multi-binary system services (`strategy: "service"`).
3. `cli`: Command-line interface binaries (`strategy: "cli"`).
4. `game`: Unity standalone player games (`strategy: "game"`, `.zip` bundles).
5. `source_snapshot`: Source code and assets snapshots (`strategy: "source_snapshot"`).

---

## Script Inventory

| Script | Purpose |
|---|---|
| **`arcus-pipeline.sh`** | Unified dispatcher for all lifecycle operations (`pack`, `sign`, `validate`, `publish`, `migrate`, `all`, `self-test`). |
| **`pack-arcus.sh`** | Stages payloads, drives `arcus pack`, and computes/enforces the **distinct digest triple** (`archive_sha256 != content_source_sha256 != tree_signature_sha256`). |
| **`sign-arcus.sh`** | Cryptographically signs release envelopes with Ed25519. Strictly isolates key material (refuses argv; accepts file, stdin, or named env var). |
| **`validate-arcus.sh`** | Strict, fail-closed validation gate. Verifies envelope signatures, target matrix conformance, path classes, and rejects placeholder digests. |
| **`publish-arcus.sh`** | Dual-window release staging, GitHub Release asset uploading (via `gh`), and manifest synchronization. |
| **`migrate-arcus.sh`** | One-shot conversion of legacy v1 manifests (`arcus-manifest.json`) into v2 signed release skeletons with drift detection. |

---

## Prerequisites & Binary Discovery

The scripts automatically discover the `arcus` CLI binary in the following priority:
1. `ARCUS_BIN` environment variable (if set).
2. `arcus` executable on `$PATH`.
3. Candidate local paths: `./bin/arcus`, `~/.local/bin/arcus`, `~/.arcus/bin/arcus`, `/usr/local/bin/arcus`.

---

## Quick Start & Usage Examples

### 1. End-to-End Release (Pack, Sign, Validate)
```bash arcus-audit
# Provide signing key via environment variable name (recommended)
export ARCUS_SIGNING_KEY="$(cat /path/to/ed25519.key)"

sh skills/scripts/arcus-pipeline.sh all \
  --sequence 1 \
  --software-type opencode-plugin \
  --package-id my-plugin \
  --version 1.0.0 \
  --key-env ARCUS_SIGNING_KEY
```

### 2. Packaging a Background Service
```bash arcus-audit
sh skills/scripts/pack-arcus.sh \
  --sequence 5 \
  --software-type service \
  --package-id lore \
  --binary-name lore-daemon \
  --version 0.1.2 \
  --key-file /secrets/arcus-ed25519.key
```

### 3. Strict Manifest Validation
```bash arcus-audit
# Validates all envelopes under dist-arcus/releases/
sh skills/scripts/validate-arcus.sh

# Or validate a specific envelope
sh skills/scripts/validate-arcus.sh dist-arcus/releases/my-plugin-1.0.0.json
```

### 4. Migrating a Legacy v1 Manifest
```bash arcus-audit
# Generate migrated v2 skeleton and sign
sh skills/scripts/sign-arcus.sh \
  --migrate manifests/my-project/v0.5.0.json \
  --sequence 1 \
  --key-env ARCUS_SIGNING_KEY
```

### 5. Hermetic Self-Test
```bash arcus-audit
sh skills/scripts/arcus-pipeline.sh self-test
```
