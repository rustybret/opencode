# Arcus v3 Packaging & Distribution Standard

Standalone, portable lifecycle scripts and consumer integration enabling OpenCode to build, package, sign, validate, and publish releases for the **Arcus v3 Distribution Standard**.

---

## 1. Directory Hierarchy Contract

All packaging and release outputs reside under a single, deterministic directory hierarchy rooted at `dist/`. No legacy `dist-*` directories are used.

```text
dist/
└── <version>/
    └── <sequence>/
        └── <package_id>/
            ├── releases/
            │   ├── <release_id>.json
            │   └── <release_id>.index-policy.json
            ├── release.json
            ├── release.index-policy.json
            ├── assets.sha256
            ├── submission.json
            ├── toolchain.json
            ├── pack-report.json
            ├── <pkg>-<version>-darwin-arm64.tar.zst (+ -content.zip, .pwr)
            ├── <pkg>-<version>-darwin-x64.tar.zst   (+ -content.zip, .pwr)
            ├── <pkg>-<version>-linux-arm64.tar.zst  (+ -content.zip, .pwr)
            ├── <pkg>-<version>-linux-x64.tar.zst    (+ -content.zip, .pwr)
            └── <pkg>-<version>-windows-x64.tar.zst  (+ -content.zip, .pwr)
```

The component directory `dist/<version>/<sequence>/<package_id>/` is formatted as a flat **immutable submission bundle** containing:
- `release.json`: Cryptographically signed Arcus v3 release envelope.
- `release.index-policy.json`: Channel routing sidecar policy (`{"channel": "stable"}`).
- `assets.sha256`: Sorted SHA-256 ledger of all archives.
- `submission.json`: Intake metadata descriptor (schema v1).
- `toolchain.json`: Provenance record (toolchain version $\ge$ 0.4.0).
- `pack-report.json`: Machine pack report.
- Multi-target archives and companion files (`.tar.zst`, `-content.zip`, `.pwr`).

---

## 2. Distributed Components

| Package ID | Software Type | Target Matrix | Description |
| --- | --- | --- | --- |
| `opencode` | `cli` | All 5 canonical platforms (`darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, `windows-x64`) | The primary standalone native binary CLI |

*Note: In Arcus `manifests/v3/`, OpenCode also tracks `omo-cli` and `omo-opencode-plugin` when co-distributed.*

---

## 3. Script Inventory & Roles

| Script | Purpose |
| --- | --- |
| `packages/arcus/bootstrap.sh` | Canonical Arcus consumer bootstrap; ensures `arcus-publisher` toolchain is installed and symlinked under `packages/arcus/toolchain`. |
| `scripts/pack-arcus.sh` | Orchestrates build checks, drives `arcus pack` via toolchain across all 5 targets, enforces distinct digest triples, and emits the submission bundle under `dist/<version>/<sequence>/opencode/`. |
| `scripts/publish-arcus.sh` | Uploads release assets to GitHub Releases (`v<version>`) and submits the bundle to the Arcus Gateway (`arcus publish submit`). |
| `scripts/validate-arcus.sh` | Validates signed release envelopes fail-closed against Arcus v3 schema. |
| `scripts/sign-arcus.sh` | Cryptographically signs release envelopes with Ed25519 publisher keys. |
| `scripts/arcus-pipeline.sh` | Upstream toolchain dispatcher (`pack`, `sign`, `validate`, `publish`, `all`, `self-test`). |

---

## 4. Arcus Publishing & Gateway Commands

### Gateway Submission

Submit an immutable release bundle directly to the Arcus gateway over authenticated HTTPS:

```bash
# Submit bundle to gateway
arcus publish submit --bundle dist/1.18.32/21/opencode --gateway https://arcus-auth.rustybret.com

# Query submission status & verification diagnostics
arcus publish status --submission-id <id> --gateway https://arcus-auth.rustybret.com
```

### Local Catalog Ingestion (Arcus Catalog Admin)

For catalog administrators running intake directly against the Arcus manifests repository:

```bash
sh /Volumes/Topper2TB/Git/arcus/scripts/arcus-accept-submission.sh dist/1.18.32/21/opencode --commit --push
```

---

## 5. Development & CI Workflow

1. **Bootstrap Toolchain**:
   ```bash
   bun run setup:arcus
   ```

2. **Build & Package**:
   ```bash
   bun run package:arcus
   ```

3. **Validate**:
   ```bash
   bun run validate:arcus
   ```

4. **Publish**:
   ```bash
   bun run publish:arcus
   ```
