#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# pack-arcus.sh — Portable Arcus Packaging Script
#
# Standalone, portable POSIX sh script for packaging any software type:
#   - opencode-plugin
#   - service
#   - cli
#   - game
#   - source_snapshot
#
# Emits <output>/releases/<release_id>.json as a signed v3 envelope by default,
# with an explicit --schema-version 2 compatibility escape hatch, plus
# three DISTINCT digests: artifact.archive_sha256, target_content_source.sha256,
# and tree_signature.sha256.
# =============================================================================
# shellcheck disable=SC2034  # portable twin mirrors the scaffold's full config/CLI surface; entries inert on this path must still parse and be accepted, so the assignments stay.
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/../.." && pwd -P)
# If invoked inside a consuming repository, use current working directory or git root
if [ -d "${PWD}/.git" ] || [ -f "${PWD}/package.json" ] || [ -f "${PWD}/VERSION" ] || [ -f "${PWD}/Cargo.toml" ] || [ -f "${PWD}/go.mod" ]; then
  REPO_ROOT="${PWD}"
fi

ARCUS_BIN=${ARCUS_BIN:-arcus}

SOFTWARE_TYPE=''
PROJECT_NAME=''
PACKAGE_ID=''
SOURCE_ID='arcus'
CHANNEL='stable'
SCHEMA_VERSION='3'
VERSION=''
RELEASE_ID=''
SEQUENCE=${ARCUS_SEQUENCE:-}
GATEWAY_URL=''
OFFLINE=0
SEQUENCE_SOURCE=''
OBSERVED_MAX_SEQUENCE=0
ARCHIVE_FORMAT=''
SOURCE_TREE=''
OUTPUT_DIR="${REPO_ROOT}/dist-arcus"
PAYLOAD_DIR=''
TARGET_ID=''
TARGET_INPUTS_FILE=''
KEY_FILE_OPT=''
KEY_ENV_OPT=''
SKIP_BUILD=0
SKIP_VALIDATE=0
BINARY_NAME=''
SERVICE_ID=''
PLUGIN_PKG_NAME=''
SNAPSHOT_PATHS=''
GITHUB_REPO=''
ARCUS_DIR=''
CONFIG_FILE=''
ACTION_EXECUTABLE=''
INSTALL_ONLY=''

cleanup_pack() {
  if [ -n "${TARGET_INPUTS_FILE:-}" ] && [ -f "${TARGET_INPUTS_FILE}" ]; then
    rm -f "${TARGET_INPUTS_FILE}"
  fi
}
trap cleanup_pack EXIT INT TERM

die() {
  printf 'pack-arcus: %s\n' "$*" >&2
  exit 1
}

warn() {
  printf 'pack-arcus: warning: %s\n' "$*" >&2
}

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/pack-arcus.sh [options]

Core Options:
  --sequence N          Publisher-allocated monotonic sequence (>=1). Optional:
                        when omitted (and ARCUS_SEQUENCE is unset), it is
                        auto-allocated as max(existing sequence)+1 against the
                        local Arcus checkout (manifests/v2/<package-id>/releases/).
  --software-type TYPE  One of: opencode-plugin, service, cli, game, source_snapshot.
                        (Auto-detected if omitted from project structure).
  --package-id ID       v2 package identifier (default: derived from project name).
  --source-id ID        v2 source identifier (default: arcus).
  --version X.Y.Z       Release semver (default: read from VERSION/package.json/etc).
  --release-id ID       Release identifier (default: <package-id>-<version>).
  --channel NAME        Distribution channel (default: stable).
  --config PATH         Path to declarative arcus.json (default: <repo>/arcus.json).
  --schema-version N    Release schema: 3 (default) or 2 for explicit compatibility.
  --output DIR          Output directory (default: dist-arcus).
  --format FMT          Archive format: tar.zst, tar.gz, or zip.

Payload & Staging:
  --source-tree DIR     Build tree or directory staged into the payload.
  --payload DIR         Pre-staged payload directory (skips staging step).
  --target-input T=DIR  Multi-target payload as <target-id>=<dir> (repeatable).
  --target ID           Target architecture for single-input payload (default: linux-x64).
  --binary-name NAME    Executable binary name (for service/cli).
  --service-id ID       System service/daemon identifier (for service).
  --plugin-pkg NAME     NPM/plugin package name (for opencode-plugin).
  --snapshot-paths LIST Space-separated subdirectories (for source_snapshot).
  --action-executable P User-launchable executable path inside the payload.
  --install-only        Emit no user-launchable action.
  --skip-build          Do not run project build step.
  --skip-validate       Do not run validate-arcus.sh on emitted envelope.

Signing Options (Key material is NEVER accepted as argv):
  --key-file PATH       Ed25519 private key file (use '-' for stdin).
  --key-env NAME        Name of environment variable holding the private key.

Testing & Help:
  --self-test           Run internal hermetic self-test suite and exit.
  -h, --help            Show this help.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

# -----------------------------------------------------------------------------
# Self-Test Mode
# -----------------------------------------------------------------------------
run_self_test() {
  printf 'pack-arcus: running self-test...\n'
  # Test argument safety
  if ( need_value 1 "--sequence" ) 2>/dev/null; then
    die "self-test failed: need_value did not fail on missing arg"
  fi
  printf 'pack-arcus: self-test passed\n'
  exit 0
}

# -----------------------------------------------------------------------------
# CLI Parsing
# -----------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --software-type) need_value "$#" "$1"; SOFTWARE_TYPE=$2; shift 2 ;;
    --software-type=*) SOFTWARE_TYPE=${1#*=}; shift ;;
    --package-id) need_value "$#" "$1"; PACKAGE_ID=$2; shift 2 ;;
    --package-id=*) PACKAGE_ID=${1#*=}; shift ;;
    --project-name) need_value "$#" "$1"; PROJECT_NAME=$2; shift 2 ;;
    --project-name=*) PROJECT_NAME=${1#*=}; shift ;;
    --source-id) need_value "$#" "$1"; SOURCE_ID=$2; shift 2 ;;
    --source-id=*) SOURCE_ID=${1#*=}; shift ;;
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --channel) need_value "$#" "$1"; CHANNEL=$2; shift 2 ;;
    --channel=*) CHANNEL=${1#*=}; shift ;;
    --config) need_value "$#" "$1"; CONFIG_FILE=$2; shift 2 ;;
    --config=*) CONFIG_FILE=${1#*=}; shift ;;
    --schema-version) need_value "$#" "$1"; SCHEMA_VERSION=$2; shift 2 ;;
    --schema-version=*) SCHEMA_VERSION=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --format) need_value "$#" "$1"; ARCHIVE_FORMAT=$2; shift 2 ;;
    --format=*) ARCHIVE_FORMAT=${1#*=}; shift ;;
    --source-tree) need_value "$#" "$1"; SOURCE_TREE=$2; shift 2 ;;
    --source-tree=*) SOURCE_TREE=${1#*=}; shift ;;
    --payload) need_value "$#" "$1"; PAYLOAD_DIR=$2; shift 2 ;;
    --payload=*) PAYLOAD_DIR=${1#*=}; shift ;;
    --target-input)
      need_value "$#" "$1"
      if [ -z "$TARGET_INPUTS_FILE" ]; then
        TARGET_INPUTS_FILE=$(mktemp 2>/dev/null || mktemp -t 'arcus-targets' 2>/dev/null || printf '/tmp/arcus-targets.%s\n' "$$")
        : > "$TARGET_INPUTS_FILE"
      fi
      printf '%s\n' "$2" >> "$TARGET_INPUTS_FILE"
      shift 2
      ;;
    --target-input=*)
      if [ -z "$TARGET_INPUTS_FILE" ]; then
        TARGET_INPUTS_FILE=$(mktemp 2>/dev/null || mktemp -t 'arcus-targets' 2>/dev/null || printf '/tmp/arcus-targets.%s\n' "$$")
        : > "$TARGET_INPUTS_FILE"
      fi
      printf '%s\n' "${1#*=}" >> "$TARGET_INPUTS_FILE"
      shift
      ;;
    --target) need_value "$#" "$1"; TARGET_ID=$2; shift 2 ;;
    --target=*) TARGET_ID=${1#*=}; shift ;;
    --binary-name) need_value "$#" "$1"; BINARY_NAME=$2; shift 2 ;;
    --binary-name=*) BINARY_NAME=${1#*=}; shift ;;
    --service-id) need_value "$#" "$1"; SERVICE_ID=$2; shift 2 ;;
    --service-id=*) SERVICE_ID=${1#*=}; shift ;;
    --plugin-pkg) need_value "$#" "$1"; PLUGIN_PKG_NAME=$2; shift 2 ;;
    --plugin-pkg=*) PLUGIN_PKG_NAME=${1#*=}; shift ;;
    --snapshot-paths) need_value "$#" "$1"; SNAPSHOT_PATHS=$2; shift 2 ;;
    --snapshot-paths=*) SNAPSHOT_PATHS=${1#*=}; shift ;;
    --action-executable) need_value "$#" "$1"; ACTION_EXECUTABLE=$2; shift 2 ;;
    --action-executable=*) ACTION_EXECUTABLE=${1#*=}; shift ;;
    --gateway) need_value "$#" "$1"; GATEWAY_URL=$2; shift 2 ;;
    --gateway=*) GATEWAY_URL=${1#*=}; shift ;;
    --offline) OFFLINE=1; shift ;;
    --install-only) INSTALL_ONLY=1; shift ;;
    --github-repo) need_value "$#" "$1"; GITHUB_REPO=$2; shift 2 ;;
    --github-repo=*) GITHUB_REPO=${1#*=}; shift ;;
    --key-file) need_value "$#" "$1"; KEY_FILE_OPT=$2; shift 2 ;;
    --key-file=*) KEY_FILE_OPT=${1#*=}; shift ;;
    --key-env) need_value "$#" "$1"; KEY_ENV_OPT=$2; shift 2 ;;
    --key-env=*) KEY_ENV_OPT=${1#*=}; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-validate) SKIP_VALIDATE=1; shift ;;
    --self-test) run_self_test ;;
    --key|--key=*|--signing-key|--signing-key=*|--private-key|--private-key=*)
      die "refusing ${1%%=*}: key material must never appear in argv; use --key-file PATH, --key-file - (stdin), or --key-env NAME" ;;
    -h|--help) usage; exit 0 ;;
    *) die "unrecognized argument '$1'" ;;
  esac
done

# -----------------------------------------------------------------------------
# Binary Resolution
# -----------------------------------------------------------------------------
resolve_arcus_bin() {
  if command -v "$ARCUS_BIN" >/dev/null 2>&1; then
    return 0
  fi
  for candidate in \
    "${REPO_ROOT}/bin/arcus" \
    "${HOME}/.local/bin/arcus" \
    "${HOME}/.arcus/bin/arcus" \
    "/usr/local/bin/arcus"; do
    if [ -x "$candidate" ]; then
      ARCUS_BIN="$candidate"
      return 0
    fi
  done
  die "arcus CLI not found (set ARCUS_BIN or place arcus in PATH). Arcus v2 packaging is fail-closed."
}
resolve_arcus_bin
"$ARCUS_BIN" manifest verify-toolchain --root "$SCRIPT_DIR" >/dev/null ||
  die "publisher toolchain is below the minimum accepted version; regenerate these scripts"

is_arcus_dir() {
  [ -n "${1:-}" ] && [ -f "${1}/arcus-index.json" ] && [ -d "${1}/manifests/v2" ]
}

# resolve_arcus_dir locates a local Arcus checkout (the manifests/v2/ tree that
# is the source of truth for sequence allocation). Self-hosted packaging of
# Arcus itself already sits inside that tree; consuming repositories look for
# a sibling checkout via ARCUS_REPO_PATH, a submodule, an adjacent directory,
# or the well-known local development path.
resolve_arcus_dir() {
  # An explicit ARCUS_REPO_PATH is authoritative: it wins outright, or fails
  # outright. It must be checked first to prevent local consuming directories
  # from shadowing the intended Arcus checkout.
  if [ -n "${ARCUS_REPO_PATH:-}" ]; then
    if is_arcus_dir "$ARCUS_REPO_PATH"; then
      ARCUS_DIR="$ARCUS_REPO_PATH"
      return 0
    fi
    die "ARCUS_REPO_PATH is set to '${ARCUS_REPO_PATH}', but it is not a valid Arcus checkout (missing arcus-index.json or manifests/v2/)"
  fi

  # Check if REPO_ROOT itself is the Arcus repository checkout
  if is_arcus_dir "$REPO_ROOT"; then
    ARCUS_DIR="$REPO_ROOT"
    return 0
  fi

  # Check standard candidate paths
  for candidate in \
    "${REPO_ROOT}/submodules/arcus" \
    "${REPO_ROOT}/../arcus"; do
    if is_arcus_dir "$candidate"; then
      ARCUS_DIR="$candidate"
      return 0
    fi
  done
  return 1
}

# -----------------------------------------------------------------------------
# Parameter Inference & Validation
# -----------------------------------------------------------------------------

get_arcus_config() {
  [ -f "$1" ] || return 0
  if command -v python3 >/dev/null 2>&1; then
    python3 -c "
import json, sys
try:
    with open(sys.argv[1], 'r') as f:
        d = json.load(f)
    val = d
    for k in sys.argv[2].split('.'):
        if isinstance(val, dict) and k in val:
            val = val[k]
        elif isinstance(val, list) and k.isdigit():
            val = val[int(k)]
        else:
            val = ''
            break
    if isinstance(val, str):
        print(val)
    elif isinstance(val, list):
        print(' '.join(str(x) for x in val))
    elif val is not None and not isinstance(val, dict):
        print(str(val))
except Exception:
    pass
" "$1" "$2" 2>/dev/null || true
  fi
}

if [ -z "$CONFIG_FILE" ] && [ -f "${REPO_ROOT}/arcus.json" ]; then
  CONFIG_FILE="${REPO_ROOT}/arcus.json"
fi

if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
  CFG_PKG=$(get_arcus_config "$CONFIG_FILE" "package_id")
  CFG_TYPE=$(get_arcus_config "$CONFIG_FILE" "software_type")
  CFG_SRC=$(get_arcus_config "$CONFIG_FILE" "source_id")
  CFG_CH=$(get_arcus_config "$CONFIG_FILE" "channel")
  CFG_VER=$(get_arcus_config "$CONFIG_FILE" "version")
  CFG_FMT=$(get_arcus_config "$CONFIG_FILE" "format")
  CFG_BIN=$(get_arcus_config "$CONFIG_FILE" "binary_name")
  CFG_SVC=$(get_arcus_config "$CONFIG_FILE" "service_id")
  CFG_PLUGIN_PKG=$(get_arcus_config "$CONFIG_FILE" "plugin.package_name")
  CFG_SNAPSHOT_PATHS=$(get_arcus_config "$CONFIG_FILE" "snapshot.paths")
  CFG_ACTION_EXECUTABLE=$(get_arcus_config "$CONFIG_FILE" "action_executable")
  CFG_INSTALL_ONLY=$(get_arcus_config "$CONFIG_FILE" "install_only")

  [ -z "$PACKAGE_ID" ] && [ -n "$CFG_PKG" ] && PACKAGE_ID="$CFG_PKG"
  [ -z "$SOFTWARE_TYPE" ] && [ -n "$CFG_TYPE" ] && SOFTWARE_TYPE="$CFG_TYPE"
  [ -z "$SOURCE_ID" ] && [ -n "$CFG_SRC" ] && SOURCE_ID="$CFG_SRC"
  [ -z "$CHANNEL" ] && [ -n "$CFG_CH" ] && CHANNEL="$CFG_CH"
  [ -z "$VERSION" ] && [ -n "$CFG_VER" ] && VERSION="$CFG_VER"
  [ -z "$ARCHIVE_FORMAT" ] && [ -n "$CFG_FMT" ] && ARCHIVE_FORMAT="$CFG_FMT"
  [ -z "$BINARY_NAME" ] && [ -n "$CFG_BIN" ] && BINARY_NAME="$CFG_BIN"
  [ -z "$SERVICE_ID" ] && [ -n "$CFG_SVC" ] && SERVICE_ID="$CFG_SVC"
  [ -z "$PLUGIN_PKG_NAME" ] && [ -n "$CFG_PLUGIN_PKG" ] && PLUGIN_PKG_NAME="$CFG_PLUGIN_PKG"
  [ -z "$SNAPSHOT_PATHS" ] && [ -n "$CFG_SNAPSHOT_PATHS" ] && SNAPSHOT_PATHS="$CFG_SNAPSHOT_PATHS"
  [ -z "$ACTION_EXECUTABLE" ] && [ -n "$CFG_ACTION_EXECUTABLE" ] && ACTION_EXECUTABLE="$CFG_ACTION_EXECUTABLE"
  if [ -z "$INSTALL_ONLY" ]; then
    case "$CFG_INSTALL_ONLY" in
      True|true|1) INSTALL_ONLY=1 ;;
      False|false|0) INSTALL_ONLY=0 ;;
    esac
  fi
fi

# Detect project name
if [ -z "$PROJECT_NAME" ]; then
  if [ -f "${REPO_ROOT}/packages/opencode/package.json" ]; then
    PROJECT_NAME=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/packages/opencode/package.json" | head -n 1 | sed 's|^@[^/]*/||')
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    PROJECT_NAME=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1 | sed 's|^@[^/]*/||')
  elif [ -f "${REPO_ROOT}/Cargo.toml" ]; then
    PROJECT_NAME=$(sed -n 's/^name[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/Cargo.toml" | head -n 1)
  else
    PROJECT_NAME=$(basename "$REPO_ROOT")
  fi
fi

# Detect package ID
if [ -z "$PACKAGE_ID" ]; then
  PACKAGE_ID=$(printf '%s' "$PROJECT_NAME" | tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz' | sed -e 's/[^a-z0-9]/-/g' -e 's/-\{2,\}/-/g' -e 's/^-*//' -e 's/-*$//')
fi

# Sequence resolution:
if [ -n "$SEQUENCE" ]; then
  if [ "$OFFLINE" -eq 0 ]; then
    die "explicit --sequence requires --offline to acknowledge it bypasses the gateway"
  fi
  SEQUENCE_SOURCE="explicit"
  OBSERVED_MAX_SEQUENCE=$((SEQUENCE - 1))
else
  if [ -z "$GATEWAY_URL" ]; then
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
      GATEWAY_URL=$(get_arcus_config "$CONFIG_FILE" "gateway")
    fi
  fi
  if [ -z "$GATEWAY_URL" ]; then
    GATEWAY_URL="${ARCUS_GATEWAY_URL:-}"
  fi

  if [ -n "$GATEWAY_URL" ]; then
    alloc_json=$("$ARCUS_BIN" manifest allocate-sequence --gateway "$GATEWAY_URL" --package-id "$PACKAGE_ID" --json) ||
      die "auto-allocating sequence for ${PACKAGE_ID} from gateway ${GATEWAY_URL} failed"
    SEQUENCE=$(printf '%s' "$alloc_json" | jq -r '.sequence')
    SEQUENCE_SOURCE=$(printf '%s' "$alloc_json" | jq -r '.source // "gateway"')
    OBSERVED_MAX_SEQUENCE=$(printf '%s' "$alloc_json" | jq -r '.observed_max_sequence // 0')
    printf 'pack-arcus: allocated sequence %s for %s from gateway %s (observed max: %s)\n' \
      "$SEQUENCE" "$PACKAGE_ID" "$GATEWAY_URL" "$OBSERVED_MAX_SEQUENCE"
  elif [ "$OFFLINE" -eq 1 ] || [ -n "${ARCUS_REPO_PATH:-}" ]; then
    if resolve_arcus_dir; then
      alloc_json=$("$ARCUS_BIN" manifest allocate-sequence --offline --root "$ARCUS_DIR" --package-id "$PACKAGE_ID" --json) ||
        die "auto-allocating sequence for ${PACKAGE_ID} from local root ${ARCUS_DIR} failed"
      SEQUENCE=$(printf '%s' "$alloc_json" | jq -r '.sequence')
      SEQUENCE_SOURCE="local"
      OBSERVED_MAX_SEQUENCE=$(printf '%s' "$alloc_json" | jq -r '.observed_max_sequence // 0')
      printf 'pack-arcus: auto-allocated sequence %s for %s (source: %s)\n' \
        "$SEQUENCE" "$PACKAGE_ID" "$ARCUS_DIR"
    else
      die "--offline requires either --sequence <N> or a local root containing manifests"
    fi
  else
    die "no sequence specified: pass --gateway <url>, configure gateway in arcus.json, or pass --offline --sequence <N>"
  fi
fi

export SEQUENCE
export SEQUENCE_SOURCE
export OBSERVED_MAX_SEQUENCE
case "$SEQUENCE" in
  ''|*[!0-9]*) die "--sequence must be a positive integer, got '$SEQUENCE'" ;;
esac
[ "$SEQUENCE" -ge 1 ] || die "--sequence must be >= 1, got '$SEQUENCE'"
case "$SCHEMA_VERSION" in
  2|3) ;;
  *) die "--schema-version must be 2 or 3, got '$SCHEMA_VERSION'" ;;
esac

# Detect software type if unset
if [ -z "$SOFTWARE_TYPE" ]; then
  if [ -d "${REPO_ROOT}/Assets" ] && [ -d "${REPO_ROOT}/ProjectSettings" ]; then
    SOFTWARE_TYPE="game"
  elif [ -d "${REPO_ROOT}/packages/opencode" ] || [ -f "${REPO_ROOT}/package.json" ]; then
    SOFTWARE_TYPE="opencode-plugin"
  elif [ -f "${REPO_ROOT}/Cargo.toml" ] || [ -f "${REPO_ROOT}/go.mod" ]; then
    SOFTWARE_TYPE="service"
  else
    SOFTWARE_TYPE="source_snapshot"
  fi
fi

# Format default per software type
if [ -z "$ARCHIVE_FORMAT" ]; then
  case "$SOFTWARE_TYPE" in
    game) ARCHIVE_FORMAT="zip" ;;
    *) ARCHIVE_FORMAT="tar.zst" ;;
  esac
fi

# Detect version
if [ -z "$VERSION" ]; then
  if [ -f "${REPO_ROOT}/VERSION" ]; then
    VERSION=$(tr -d ' \t\r\n' < "${REPO_ROOT}/VERSION")
  elif [ -f "${REPO_ROOT}/packages/opencode/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/packages/opencode/package.json" | head -n 1)
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1)
  elif [ -f "${REPO_ROOT}/Cargo.toml" ]; then
    VERSION=$(sed -n 's/^version[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/Cargo.toml" | head -n 1)
  else
    VERSION="0.1.0"
  fi
fi
VERSION=${VERSION#v}

# Derive release ID
if [ -z "$RELEASE_ID" ]; then
  RELEASE_ID=$(printf '%s-%s' "$PACKAGE_ID" "$VERSION" | tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz' | sed -e 's/[^a-z0-9._-]/-/g' -e 's/^[._-]*//' -e 's/[._-]*$//')
fi

# -----------------------------------------------------------------------------
# Payload Staging
# -----------------------------------------------------------------------------
mkdir -p "$OUTPUT_DIR"
# Purge stale artifact archives for this package to prevent version cross-contamination
rm -f "${OUTPUT_DIR}/${PACKAGE_ID}"-*.tar.zst \
      "${OUTPUT_DIR}/${PACKAGE_ID}"-*.tar.gz \
      "${OUTPUT_DIR}/${PACKAGE_ID}"-*.tgz \
      "${OUTPUT_DIR}/${PACKAGE_ID}"-*.zip \
      "${OUTPUT_DIR}/${PACKAGE_ID}"-*.pwr \
      2>/dev/null || true
if [ -z "$PAYLOAD_DIR" ] && { [ -z "$TARGET_INPUTS_FILE" ] || [ ! -s "$TARGET_INPUTS_FILE" ]; }; then
  PAYLOAD_DIR="${OUTPUT_DIR}/payload"
  rm -rf "$PAYLOAD_DIR"
  mkdir -p "$PAYLOAD_DIR"

  case "$SOFTWARE_TYPE" in
    opencode-plugin)
      PLUGIN_SRC="${REPO_ROOT}/packages/opencode"
      [ -d "$PLUGIN_SRC" ] || PLUGIN_SRC="${REPO_ROOT}"
      if [ -f "${PLUGIN_SRC}/package.json" ]; then
        if [ "$SKIP_BUILD" -eq 0 ]; then
          if [ -f "${REPO_ROOT}/package.json" ] && grep -q '"build"' "${REPO_ROOT}/package.json" 2>/dev/null; then
            ( cd "$REPO_ROOT" && ( bun run build 2>/dev/null || npm run build 2>/dev/null || true ) )
          elif grep -q '"build"' "${PLUGIN_SRC}/package.json" 2>/dev/null; then
            ( cd "$PLUGIN_SRC" && ( bun run build 2>/dev/null || npm run build 2>/dev/null || true ) )
          fi
        fi
        if [ -d "${PLUGIN_SRC}/dist" ]; then
          mkdir -p "${PAYLOAD_DIR}/dist"
          cp -R "${PLUGIN_SRC}/dist/." "${PAYLOAD_DIR}/dist/"
        fi
        for f in tui.tsx sidebar-state.ts tui-preferences.ts logger.ts; do
          if [ -f "${PLUGIN_SRC}/src/$f" ]; then
            mkdir -p "${PAYLOAD_DIR}/src"
            cp "${PLUGIN_SRC}/src/$f" "${PAYLOAD_DIR}/src/"
          fi
        done
        for d in tui tui-compiled core util rpc; do
          if [ -d "${PLUGIN_SRC}/src/$d" ]; then
            mkdir -p "${PAYLOAD_DIR}/src/$d"
            cp -R "${PLUGIN_SRC}/src/$d/." "${PAYLOAD_DIR}/src/$d/"
          fi
        done
        cp "${PLUGIN_SRC}/package.json" "${PAYLOAD_DIR}/package.json"
        [ -f "${REPO_ROOT}/README.md" ] && cp "${REPO_ROOT}/README.md" "${PAYLOAD_DIR}/README.md"
        [ -f "${REPO_ROOT}/LICENSE" ] && cp "${REPO_ROOT}/LICENSE" "${PAYLOAD_DIR}/LICENSE"
        if command -v npm >/dev/null 2>&1; then
          cd "$PLUGIN_SRC"
          TARBALL=$(npm pack --pack-destination="$OUTPUT_DIR" 2>/dev/null | tail -n 1)
          cd "$REPO_ROOT"
          V1_SHA256="0000000000000000000000000000000000000000000000000000000000000000"
          if [ -f "${OUTPUT_DIR}/${TARBALL}" ]; then
            V1_SHA256=$(shasum -a 256 "${OUTPUT_DIR}/${TARBALL}" | awk '{print $1}')
          fi
          cat <<EOF > "${OUTPUT_DIR}/arcus-manifest.json"
{
  "\$schema": "file://~/.config/arcus/manifests/schema.json",
  "name": "${PROJECT_NAME}",
  "version": "${VERSION}",
  "description": "Arcus package for ${PROJECT_NAME}",
  "harness": "opencode",
  "plugin": {
    "type": "opencode-plugin",
    "name": "${PLUGIN_PKG_NAME:-@cortexkit/${PROJECT_NAME}}",
    "version": "${VERSION}",
    "hydrate": false,
    "asset": {
      "filename": "${TARBALL}",
      "url": "https://arcus-auth.rustybret.com/v1/artifacts/${PACKAGE_ID:-${PROJECT_NAME}}/${VERSION}/linux-x64/${TARBALL}",
      "sha256": "${V1_SHA256}",
      "strip_components": 1
    },
    "entrypoints": {
      "server": "dist/index.js",
      "tui": "src/tui/entry.mjs",
      "tui_compiled": "src/tui-compiled/tui.tsx"
    }
  }
}
EOF
        fi
      fi
      ;;
    service|cli)
      BIN_NAME="${BINARY_NAME:-${PACKAGE_ID:-${PROJECT_NAME}}}"
      # Look for built binaries in target/ or bin/
      FOUND=0
      for candidate in \
        "${REPO_ROOT}/target/release/${BIN_NAME}" \
        "${REPO_ROOT}/bin/${BIN_NAME}" \
        "${REPO_ROOT}/${BIN_NAME}"; do
        if [ -f "$candidate" ]; then
          cp "$candidate" "${PAYLOAD_DIR}/"
          chmod 755 "${PAYLOAD_DIR}/$(basename "$candidate")"
          FOUND=1
          break
        fi
      done
      if [ "$FOUND" -eq 0 ]; then
        # Create staging placeholder if build was skipped
        touch "${PAYLOAD_DIR}/${BIN_NAME}"
        chmod 755 "${PAYLOAD_DIR}/${BIN_NAME}"
      fi
      ;;
    game)
      # Unity staging
      BUILD_DIR="${REPO_ROOT}/Builds"
      if [ -d "$BUILD_DIR" ]; then
        cp -R "${BUILD_DIR}"/* "$PAYLOAD_DIR/"
      else
        touch "${PAYLOAD_DIR}/${PROJECT_NAME}.exe"
      fi
      ;;
    source_snapshot)
      PATHS="${SNAPSHOT_PATHS:-packages skills docs}"
      for p in $PATHS; do
        if [ -d "${REPO_ROOT}/${p}" ]; then
          mkdir -p "${PAYLOAD_DIR}/${p}"
          cp -R "${REPO_ROOT}/${p}"/* "${PAYLOAD_DIR}/${p}/" 2>/dev/null || true
        fi
      done
      ;;
  esac
fi

if [ -n "$TARGET_INPUTS_FILE" ] && [ -s "$TARGET_INPUTS_FILE" ]; then
  while IFS= read -r ti || [ -n "$ti" ]; do
    [ -n "$ti" ] || continue
    tdir="${ti#*=}"
    [ -d "$tdir" ] || die "target payload directory does not exist: ${tdir} (declared in --target-input ${ti})"
  done < "$TARGET_INPUTS_FILE"
else
  [ -d "$PAYLOAD_DIR" ] || die "payload directory ${PAYLOAD_DIR} does not exist"
fi

# -----------------------------------------------------------------------------
# Pack Execution
# -----------------------------------------------------------------------------
run_pack() {
  if [ -n "$KEY_FILE_OPT" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "$KEY_FILE_OPT"
  elif [ -n "$KEY_ENV_OPT" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-env "$KEY_ENV_OPT"
  elif [ -n "${ARCUS_SIGNING_KEY_FILE:-}" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "$ARCUS_SIGNING_KEY_FILE"
  elif [ -n "${ARCUS_SIGNING_KEY:-}" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-env ARCUS_SIGNING_KEY
  elif [ -f "${HOME}/.config/arcus/signing.key" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "${HOME}/.config/arcus/signing.key"
  elif [ ! -t 0 ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file -
  else
    die "no signing key: pass --key-file PATH, --key-file - (stdin), --key-env NAME, set ARCUS_SIGNING_KEY_FILE / ARCUS_SIGNING_KEY, or create ~/.config/arcus/signing.key"
  fi
}

run_migrate_v3() {
  if [ -n "$KEY_FILE_OPT" ]; then
    "$ARCUS_BIN" manifest migrate --to 3 "$@" --key-file "$KEY_FILE_OPT"
  elif [ -n "$KEY_ENV_OPT" ]; then
    "$ARCUS_BIN" manifest migrate --to 3 "$@" --key-env "$KEY_ENV_OPT"
  elif [ -n "${ARCUS_SIGNING_KEY_FILE:-}" ]; then
    "$ARCUS_BIN" manifest migrate --to 3 "$@" --key-file "$ARCUS_SIGNING_KEY_FILE"
  elif [ -n "${ARCUS_SIGNING_KEY:-}" ]; then
    "$ARCUS_BIN" manifest migrate --to 3 "$@" --key-env ARCUS_SIGNING_KEY
  elif [ -f "${HOME}/.config/arcus/signing.key" ]; then
    "$ARCUS_BIN" manifest migrate --to 3 "$@" --key-file "${HOME}/.config/arcus/signing.key"
  else
    die "--schema-version 3 requires a reusable signing key via --key-file, --key-env, ARCUS_SIGNING_KEY_FILE, ARCUS_SIGNING_KEY, or ~/.config/arcus/signing.key"
  fi
}

REPORT="${OUTPUT_DIR}/pack-report.json"

printf 'pack-arcus: packing %s %s (release: %s, seq: %s, type: %s)\n' \
  "$PACKAGE_ID" "$VERSION" "$RELEASE_ID" "$SEQUENCE" "$SOFTWARE_TYPE"

set -- \
  --output "$OUTPUT_DIR" \
  --source-id "$SOURCE_ID" \
  --package-id "$PACKAGE_ID" \
  --release-id "$RELEASE_ID" \
  --version "$VERSION" \
  --sequence "$SEQUENCE" \
  --channel "$CHANNEL" \
  --format "$ARCHIVE_FORMAT"

if [ -n "$TARGET_INPUTS_FILE" ] && [ -s "$TARGET_INPUTS_FILE" ]; then
  while IFS= read -r ti || [ -n "$ti" ]; do
    [ -n "$ti" ] || continue
    set -- "$@" --target-input "$ti"
  done < "$TARGET_INPUTS_FILE"
elif [ "$SOFTWARE_TYPE" = "opencode-plugin" ]; then
  for target in darwin-arm64 darwin-x64 linux-arm64 linux-x64 windows-x64; do
    set -- "$@" --target-input "${target}=${PAYLOAD_DIR}"
  done
else
  set -- "$@" --input "$PAYLOAD_DIR"
  if [ -n "$TARGET_ID" ]; then
    set -- "$@" --target "$TARGET_ID"
  fi
fi

case "$SOFTWARE_TYPE" in
  opencode-plugin)
    set -- "$@" --strategy opencode-plugin
    if [ -n "$ACTION_EXECUTABLE" ]; then
      set -- "$@" --action-executable "$ACTION_EXECUTABLE"
    else
      set -- "$@" --install-only
    fi
    ;;
  cli)
    BIN_NAME="${BINARY_NAME:-${PACKAGE_ID:-${PROJECT_NAME}}}"
    [ -n "$ACTION_EXECUTABLE" ] && BIN_NAME="$ACTION_EXECUTABLE"
    set -- "$@" --strategy cli --action-executable "$BIN_NAME" --action-type executable
    ;;
  service)
    BIN_NAME="${BINARY_NAME:-${PACKAGE_ID:-${PROJECT_NAME}}}"
    [ -n "$ACTION_EXECUTABLE" ] && BIN_NAME="$ACTION_EXECUTABLE"
    set -- "$@" --strategy service --action-executable "$BIN_NAME" --action-type executable
    ;;
  game)
    set -- "$@" --strategy game
    ;;
  source_snapshot)
    set -- "$@" --strategy source_snapshot --install-only
    ;;
esac

if [ "$INSTALL_ONLY" = 1 ]; then
  set -- "$@" --install-only
fi

run_pack "$@" > "$REPORT" 2>&1 || {
  cat "$REPORT" >&2
  die "arcus pack failed"
}

json_field() {
  sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$REPORT" | head -n 1
}

ARCHIVE_SHA=$(json_field archive_sha256)
CONTENT_SHA=$(json_field content_source_sha256)
TREE_SIG_SHA=$(json_field tree_signature_sha256)
ENVELOPE_PATH=$(json_field envelope_path)

[ -n "$ARCHIVE_SHA" ] || die "pack report carried no archive_sha256"
[ -n "$CONTENT_SHA" ] || die "pack report carried no content_source_sha256"
[ -n "$TREE_SIG_SHA" ] || die "pack report carried no tree_signature_sha256"
[ -n "$ENVELOPE_PATH" ] || die "pack report carried no envelope_path"

if [ "$SCHEMA_VERSION" = 3 ]; then
  run_migrate_v3 --in "$ENVELOPE_PATH" --out "$ENVELOPE_PATH" \
    --source-id "$SOURCE_ID" --sequence "$SEQUENCE" > "${REPORT}.migrate" 2>&1 || {
      cat "${REPORT}.migrate" >&2
      die "migrating the emitted envelope to schema v3 failed"
    }
fi

if [ "$ARCHIVE_SHA" = "$CONTENT_SHA" ] ||
   [ "$ARCHIVE_SHA" = "$TREE_SIG_SHA" ] ||
   [ "$CONTENT_SHA" = "$TREE_SIG_SHA" ]; then
  die "digest collision: artifact, target_content_source, and tree_signature must be distinct objects"
fi

if [ "$SKIP_VALIDATE" -eq 0 ] && [ -f "${SCRIPT_DIR}/validate-arcus.sh" ]; then
  sh "${SCRIPT_DIR}/validate-arcus.sh" "$ENVELOPE_PATH" ||
    die "emitted envelope failed strict validation: ${ENVELOPE_PATH}"
fi

printf 'pack-arcus: envelope   %s\n' "$ENVELOPE_PATH"
printf 'pack-arcus: archive    %s\n' "$ARCHIVE_SHA"
printf 'pack-arcus: content    %s\n' "$CONTENT_SHA"
printf 'pack-arcus: treesig    %s\n' "$TREE_SIG_SHA"
printf 'pack-arcus: report     %s\n' "$REPORT"
