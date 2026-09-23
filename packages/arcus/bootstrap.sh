#!/bin/sh
set -eu

# Resolve project repository root (directory containing packages/arcus)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -d "${SCRIPT_DIR}/../../packages/arcus" ]; then
  REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
elif [ -d "${SCRIPT_DIR}/packages/arcus" ]; then
  REPO_ROOT="${SCRIPT_DIR}"
else
  REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
fi

cd "${REPO_ROOT}"

# 1. Check for arcus CLI on PATH
if ! command -v arcus >/dev/null 2>&1; then
  echo "Error: arcus CLI not found on PATH." >&2
  echo "Please install Arcus via: curl -sSf https://arcus-auth.rustybret.com/install.sh | sh" >&2
  exit 1
fi

# 2. Install / update the arcus-publisher package
echo "==> Ensuring arcus-publisher toolchain is installed..."
arcus install arcus-publisher >/dev/null 2>&1 || true

# 3. Determine install root
INSTALL_ROOT=""
if [ -n "${ARCUS_INSTALL_ROOT:-}" ]; then
  INSTALL_ROOT="${ARCUS_INSTALL_ROOT}"
fi

if [ -z "${INSTALL_ROOT}" ] && command -v jq >/dev/null 2>&1; then
  INSTALL_ROOT=$(arcus doctor --json 2>/dev/null | jq -r '(.probes[]? | select(.id=="host-runtime") | .details) // empty' | sed -n 's/.*install directory ready (\([^)]*\)).*/\1/p' || true)
fi

if [ -z "${INSTALL_ROOT}" ]; then
  case "$(uname -s)" in
    Darwin)
      INSTALL_ROOT="${HOME}/Applications/Arcus"
      if [ ! -d "${INSTALL_ROOT}" ] && [ -d "${HOME}/Library/Application Support/Arcus/games" ]; then
        INSTALL_ROOT="${HOME}/Library/Application Support/Arcus/games"
      fi
      ;;
    *)
      INSTALL_ROOT="${HOME}/.local/share/arcus/packages"
      if [ ! -d "${INSTALL_ROOT}" ] && [ -d "${HOME}/.local/share/arcus/games" ]; then
        INSTALL_ROOT="${HOME}/.local/share/arcus/games"
      fi
      ;;
  esac
fi

PUBLISHER_DIR="${INSTALL_ROOT}/arcus-publisher"
RECEIPT="${PUBLISHER_DIR}/.arcus/receipt.json"
if [ -f "${RECEIPT}" ] && command -v jq >/dev/null 2>&1; then
  MANAGED_PATH=$(jq -r ".managed_tree_path // empty" "${RECEIPT}")
  if [ -n "${MANAGED_PATH}" ] && [ -d "${PUBLISHER_DIR}/${MANAGED_PATH}" ]; then
    PUBLISHER_DIR="${PUBLISHER_DIR}/${MANAGED_PATH}"
  fi
fi

# 4. Create toolchain symlink under packages/arcus
mkdir -p "${REPO_ROOT}/packages/arcus"
ln -sfn "${PUBLISHER_DIR}" "${REPO_ROOT}/packages/arcus/toolchain"

# 5. Create skill symlink under .opencode/skills
mkdir -p "${REPO_ROOT}/.opencode/skills"
ln -sfn "../../packages/arcus/toolchain/skill" "${REPO_ROOT}/.opencode/skills/arcus-publisher"

echo "==> Symlinks created:"
echo "    packages/arcus/toolchain -> ${PUBLISHER_DIR}"
echo "    .opencode/skills/arcus-publisher -> ../../packages/arcus/toolchain/skill"

# 6. Validate installed toolchain if available
if [ -d "${REPO_ROOT}/packages/arcus/toolchain/scripts" ]; then
  arcus manifest verify-toolchain --root "${REPO_ROOT}/packages/arcus/toolchain/scripts"
fi

echo "==> Arcus publisher bootstrap complete."
