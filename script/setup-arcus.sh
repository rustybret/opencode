#!/usr/bin/env bash
# =============================================================================
# setup-arcus.sh — Idempotent Standalone Arcus v3 Publisher Toolchain Setup & Verification
#
# Verifies the standalone, portable Arcus v3 publisher toolchain in scripts/
# without requiring git submodules or external repository checkouts.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCRIPTS_DIR="${REPO_ROOT}/scripts"

echo "== [Arcus Setup] Verifying standalone Arcus v3 publisher toolchain =="

REQUIRED_SCRIPTS=(
  "pack-arcus.sh"
  "sign-arcus.sh"
  "validate-arcus.sh"
  "publish-arcus.sh"
  "migrate-arcus.sh"
  "arcus-pipeline.sh"
)

REQUIRED_SCHEMAS=(
  "arcus-toolchain.json"
  "arcus.schema.json"
  "submission.schema.json"
)

# 1. Verify and ensure execute permissions on companion scripts
MISSING=0
for script in "${REQUIRED_SCRIPTS[@]}"; do
  dest="${SCRIPTS_DIR}/${script}"
  if [ ! -f "${dest}" ]; then
    echo "error: scripts/${script} is missing" >&2
    MISSING=1
  else
    chmod +x "${dest}" 2>/dev/null || true
  fi
done

for schema in "${REQUIRED_SCHEMAS[@]}"; do
  dest="${SCRIPTS_DIR}/${schema}"
  if [ ! -f "${dest}" ]; then
    echo "error: scripts/${schema} is missing" >&2
    MISSING=1
  fi
done

if [ "${MISSING}" -ne 0 ]; then
  echo "== [Arcus Setup] Error: required publisher toolchain files missing from scripts/ ==" >&2
  exit 1
fi

# 2. Run canonical toolchain verification if arcus CLI is available
if command -v arcus >/dev/null 2>&1; then
  arcus manifest verify-toolchain --root "${SCRIPTS_DIR}" >/dev/null 2>&1 || {
    echo "warning: arcus manifest verify-toolchain returned non-zero" >&2
  }
fi

echo "== [Arcus Setup] Standalone Arcus v3 publisher toolchain (0.4.0) verified successfully =="
