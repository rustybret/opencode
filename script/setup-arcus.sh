#!/usr/bin/env bash
# =============================================================================
# setup-arcus.sh — Idempotent Arcus Submodule & Skill Script Hydration
#
# Hydrates the Arcus submodule (with selective sparse-checkout of skills/scripts)
# and ensures scripts/ contains live symlinks to the upstream Arcus scripts.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

ARCUS_SUBMODULE="${REPO_ROOT}/submodules/arcus"
SCRIPTS_DIR="${REPO_ROOT}/scripts"

echo "== [Arcus Setup] Hydrating Arcus submodule & script links =="

# 1. Initialize & update submodule if not present
if [ ! -d "${ARCUS_SUBMODULE}/.git" ] && [ ! -f "${ARCUS_SUBMODULE}/.git" ]; then
  echo "--> Initializing submodules/arcus submodule..."
  git -C "${REPO_ROOT}" submodule update --init --depth 1 submodules/arcus || {
    echo "warning: git submodule update failed (working in offline/isolated environment?)" >&2
  }
fi

# 2. Configure sparse-checkout for skills/scripts if submodule checkout exists
if [ -d "${ARCUS_SUBMODULE}/.git" ] || [ -f "${ARCUS_SUBMODULE}/.git" ]; then
  echo "--> Configuring sparse-checkout on submodules/arcus for skills/scripts..."
  git -C "${ARCUS_SUBMODULE}" sparse-checkout init --cone --quiet 2>/dev/null || true
  git -C "${ARCUS_SUBMODULE}" sparse-checkout set skills/scripts --quiet 2>/dev/null || true
  git -C "${ARCUS_SUBMODULE}" checkout --quiet 2>/dev/null || true
fi

# 3. Ensure scripts/ symlinks point to submodules/arcus/skills/scripts
mkdir -p "${SCRIPTS_DIR}"

SCRIPT_FILES=(
  "pack-arcus.sh"
  "sign-arcus.sh"
  "validate-arcus.sh"
  "publish-arcus.sh"
  "migrate-arcus.sh"
  "arcus-pipeline.sh"
)

for script in "${SCRIPT_FILES[@]}"; do
  target_rel="../submodules/arcus/skills/scripts/${script}"
  dest="${SCRIPTS_DIR}/${script}"

  if [ -L "${dest}" ]; then
    current_target="$(readlink "${dest}")"
    if [ "${current_target}" != "${target_rel}" ]; then
      echo "--> Updating symlink: scripts/${script} -> ${target_rel}"
      ln -sf "${target_rel}" "${dest}"
    fi
  elif [ -f "${dest}" ]; then
    echo "--> Replacing static script with symlink: scripts/${script} -> ${target_rel}"
    ln -sf "${target_rel}" "${dest}"
  else
    echo "--> Creating symlink: scripts/${script} -> ${target_rel}"
    ln -sf "${target_rel}" "${dest}"
  fi
done

# 4. Verify hydration status
MISSING=0
for script in "${SCRIPT_FILES[@]}"; do
  dest="${SCRIPTS_DIR}/${script}"
  if [ ! -e "${dest}" ]; then
    echo "warning: scripts/${script} symlink target is missing on disk" >&2
    MISSING=1
  else
    chmod +x "${dest}" 2>/dev/null || true
  fi
done

if [ "${MISSING}" -eq 0 ]; then
  echo "== [Arcus Setup] All Arcus companion scripts hydrated & verified successfully =="
else
  echo "== [Arcus Setup] Warning: some submodule script targets could not be resolved =="
fi
