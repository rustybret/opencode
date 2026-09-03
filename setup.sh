#!/usr/bin/env bash
# =============================================================================
# setup.sh — OpenCode Repository Developer Setup
#
# Hydrates git submodules, configures sparse checkouts, and sets up dependencies.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

echo "=== Setting up OpenCode workspace ==="

# 1. Hydrate Arcus submodule and packaging script links
bash "${SCRIPT_DIR}/script/setup-arcus.sh"

# 2. Run dependency installation
if command -v bun >/dev/null 2>&1; then
  echo "--> Running bun install..."
  bun install
else
  echo "warning: bun is not installed or not on PATH" >&2
fi

echo "=== OpenCode workspace setup complete ==="
