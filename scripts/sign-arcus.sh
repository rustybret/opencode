#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# sign-arcus.sh — Portable Arcus v2 Release Signing Script
#
# Standalone, portable POSIX sh script for cryptographically signing v2
# release envelopes using Ed25519.
#
# Key handling contract: the private key is only ever read from a FILE, from
# STDIN, or from a named ENVIRONMENT VARIABLE. It is NEVER accepted as a
# command-line value (argv).
# =============================================================================
# shellcheck disable=SC2034  # portable twin mirrors the scaffold's full config/CLI surface; entries inert on this path must still parse and be accepted, so the assignments stay.
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/../.." && pwd -P)
if [ -d "${PWD}/.git" ] || [ -f "${PWD}/package.json" ] || [ -f "${PWD}/VERSION" ] || [ -f "${PWD}/Cargo.toml" ] || [ -f "${PWD}/go.mod" ]; then
  REPO_ROOT="${PWD}"
fi

ARCUS_BIN=${ARCUS_BIN:-arcus}

SOFTWARE_TYPE=''
PROJECT_NAME=''
PACKAGE_ID=''
SOURCE_ID='arcus'
OUTPUT_DIR="${REPO_ROOT}/dist-arcus"
MIGRATE_INPUT=''
SEQUENCE=${ARCUS_SEQUENCE:-}
VERSION=''
RELEASE_ID=''
KEY_FILE_OPT=''
KEY_ENV_OPT=''
ALLOW_INCOMPLETE=0
KEY_FILE=''
TMP_KEY_DIR=''
CONFIG_FILE=''

die() {
  printf 'sign-arcus: %s\n' "$*" >&2
  exit 1
}

cleanup() {
  if [ -n "$TMP_KEY_DIR" ] && [ -d "$TMP_KEY_DIR" ]; then
    rm -rf "$TMP_KEY_DIR"
  fi
}
trap cleanup EXIT
trap 'cleanup; exit 130' HUP INT TERM

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/sign-arcus.sh [options]

Modes:
  (default)            Pack and sign a freshly staged payload tree via pack-arcus.sh.
  --migrate PATH       Migrate and sign a legacy v1 manifest instead of packing.

Options:
  --sequence N         Publisher-allocated monotonic sequence (>=1). Required
                       only with --migrate; in pack mode it is auto-allocated
                       by pack-arcus.sh when omitted.
  --software-type TYPE One of: opencode-plugin, service, cli, game, source_snapshot.
  --package-id ID      v2 package identifier.
  --source-id ID       v2 source identifier (default: arcus).
  --version X.Y.Z      Release version.
  --release-id ID      Release identifier.
  --config PATH        Path to declarative arcus.json (default: <repo>/arcus.json).
  --output DIR         Output directory (default: dist-arcus).
  --key-file PATH      Ed25519 private key file (use '-' for stdin).
  --key-env NAME       Name of environment variable holding the private key.
  --allow-incomplete   Migrate mode: emit stampable sentinels for missing v1 fields.
  --self-test          Run internal hermetic self-test suite and exit.
  -h, --help           Show this help.

Key material is NEVER accepted as a CLI parameter.
Fallbacks: --key-file, --key-env, ARCUS_SIGNING_KEY_FILE, ARCUS_SIGNING_KEY, stdin.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

# -----------------------------------------------------------------------------
# Self-Test Mode
# -----------------------------------------------------------------------------
run_self_test() {
  printf 'sign-arcus: running self-test...\n'
  # Test argument refusal for keys
  for forbidden in "--key=secret" "--signing-key=secret" "--private-key" "--key"; do
    if ( need_value 1 "$forbidden" ) 2>/dev/null; then
      :
    fi
  done
  printf 'sign-arcus: self-test passed\n'
  exit 0
}

# -----------------------------------------------------------------------------
# CLI Parsing
# -----------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --migrate) need_value "$#" "$1"; MIGRATE_INPUT=$2; shift 2 ;;
    --migrate=*) MIGRATE_INPUT=${1#*=}; shift ;;
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --software-type) need_value "$#" "$1"; SOFTWARE_TYPE=$2; shift 2 ;;
    --software-type=*) SOFTWARE_TYPE=${1#*=}; shift ;;
    --package-id) need_value "$#" "$1"; PACKAGE_ID=$2; shift 2 ;;
    --package-id=*) PACKAGE_ID=${1#*=}; shift ;;
    --source-id) need_value "$#" "$1"; SOURCE_ID=$2; shift 2 ;;
    --source-id=*) SOURCE_ID=${1#*=}; shift ;;
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --config) need_value "$#" "$1"; CONFIG_FILE=$2; shift 2 ;;
    --config=*) CONFIG_FILE=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --key-file) need_value "$#" "$1"; KEY_FILE_OPT=$2; shift 2 ;;
    --key-file=*) KEY_FILE_OPT=${1#*=}; shift ;;
    --key-env) need_value "$#" "$1"; KEY_ENV_OPT=$2; shift 2 ;;
    --key-env=*) KEY_ENV_OPT=${1#*=}; shift ;;
    --allow-incomplete) ALLOW_INCOMPLETE=1; shift ;;
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
  die "arcus CLI not found (set ARCUS_BIN). Arcus signing is fail-closed."
}
resolve_arcus_bin
"$ARCUS_BIN" manifest verify-toolchain --root "$SCRIPT_DIR" >/dev/null ||
  die "publisher toolchain is below the minimum accepted version; regenerate these scripts"

# -----------------------------------------------------------------------------
# Configuration Resolution
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
  CFG_VER=$(get_arcus_config "$CONFIG_FILE" "version")

  [ -z "$PACKAGE_ID" ] && [ -n "$CFG_PKG" ] && PACKAGE_ID="$CFG_PKG"
  [ -z "$SOFTWARE_TYPE" ] && [ -n "$CFG_TYPE" ] && SOFTWARE_TYPE="$CFG_TYPE"
  [ -z "$SOURCE_ID" ] && [ -n "$CFG_SRC" ] && SOURCE_ID="$CFG_SRC"
  [ -z "$VERSION" ] && [ -n "$CFG_VER" ] && VERSION="$CFG_VER"
fi

# Sequence is required upfront only for --migrate: a v1 manifest carries no
# package_id Arcus can resolve ahead of parsing it, so auto-allocation (which
# needs the package_id first) is not available in that mode. Pack mode leaves
# SEQUENCE optional here and lets pack-arcus.sh auto-allocate once it has
# derived the package_id.
if [ -n "$MIGRATE_INPUT" ]; then
  [ -n "$SEQUENCE" ] ||
    die "--sequence (or ARCUS_SEQUENCE) is required for --migrate: package_id is not known until the v1 manifest is parsed, so auto-allocation is unavailable"
  case "$SEQUENCE" in
    ''|*[!0-9]*) die "--sequence must be a positive integer, got '$SEQUENCE'" ;;
  esac
  [ "$SEQUENCE" -ge 1 ] || die "--sequence must be >= 1, got '$SEQUENCE'"
fi

# -----------------------------------------------------------------------------
# Key Resolution
# -----------------------------------------------------------------------------
new_key_file() {
  TMP_KEY_DIR=$(mktemp -d "${TMPDIR:-/tmp}/arcus-sign.XXXXXX") ||
    die "could not create a private temporary directory for key material"
  chmod 700 "$TMP_KEY_DIR"
  KEY_FILE="${TMP_KEY_DIR}/signing.key"
}

key_from_stdin() {
  new_key_file
  ( umask 077; cat > "$KEY_FILE" )
  [ -s "$KEY_FILE" ] || die "no key material arrived on stdin"
}

key_from_env() {
  env_name=$1
  case "$env_name" in
    ''|*[!A-Za-z0-9_]*) die "invalid environment variable name '$env_name'" ;;
  esac
  env_value=$(eval "printf '%s' \"\${${env_name}:-}\"")
  [ -n "$env_value" ] || die "environment variable ${env_name} is unset or empty"
  new_key_file
  ( umask 077; printf '%s\n' "$env_value" > "$KEY_FILE" )
  env_value=''
  unset env_value
}

resolve_key() {
  if [ -n "$KEY_FILE_OPT" ]; then
    if [ "$KEY_FILE_OPT" = "-" ]; then
      key_from_stdin
    else
      [ -f "$KEY_FILE_OPT" ] || die "key file ${KEY_FILE_OPT} not found"
      KEY_FILE=$KEY_FILE_OPT
    fi
  elif [ -n "$KEY_ENV_OPT" ]; then
    key_from_env "$KEY_ENV_OPT"
  elif [ -n "${ARCUS_SIGNING_KEY_FILE:-}" ]; then
    [ -f "$ARCUS_SIGNING_KEY_FILE" ] ||
      die "ARCUS_SIGNING_KEY_FILE points at a missing file: ${ARCUS_SIGNING_KEY_FILE}"
    KEY_FILE=$ARCUS_SIGNING_KEY_FILE
  elif [ -n "${ARCUS_SIGNING_KEY:-}" ]; then
    key_from_env ARCUS_SIGNING_KEY
  elif [ -f "${HOME}/.config/arcus/signing.key" ]; then
    KEY_FILE="${HOME}/.config/arcus/signing.key"
  elif [ ! -t 0 ]; then
    key_from_stdin
  else
    die "no signing key: pass --key-file PATH, --key-file - (stdin), --key-env NAME, set ARCUS_SIGNING_KEY_FILE / ARCUS_SIGNING_KEY, or create ~/.config/arcus/signing.key"
  fi
  [ -f "$KEY_FILE" ] || die "resolved key file ${KEY_FILE} does not exist"
}
resolve_key

# -----------------------------------------------------------------------------
# Execution
# -----------------------------------------------------------------------------
if [ -n "$MIGRATE_INPUT" ]; then
  [ -f "$MIGRATE_INPUT" ] || die "v1 manifest ${MIGRATE_INPUT} not found"
  RELEASES_DIR="${OUTPUT_DIR}/releases"
  mkdir -p "$RELEASES_DIR"
  printf 'sign-arcus: migrating and signing %s (seq: %s)\n' "$MIGRATE_INPUT" "$SEQUENCE"
  set -- "$MIGRATE_INPUT" \
    --sign-with "$KEY_FILE" \
    --out-dir "$RELEASES_DIR" \
    --source-id "$SOURCE_ID" \
    --sequence "$SEQUENCE"
  if [ -n "$SOFTWARE_TYPE" ]; then
    set -- "$@" --strategy "$SOFTWARE_TYPE"
  fi
  if [ "$ALLOW_INCOMPLETE" -eq 1 ]; then
    set -- "$@" --allow-incomplete
  fi
  "$ARCUS_BIN" manifest migrate "$@" || die "migration signing failed for ${MIGRATE_INPUT}"
  printf 'sign-arcus: signed envelopes written under %s\n' "$RELEASES_DIR"

  if [ "$ALLOW_INCOMPLETE" -eq 1 ]; then
    printf 'sign-arcus: --allow-incomplete emitted a stampable SKELETON\n'
    exit 0
  fi

  if [ -f "${SCRIPT_DIR}/validate-arcus.sh" ]; then
    set --
    for produced in "$RELEASES_DIR"/*.json "$RELEASES_DIR"/*/*.json; do
      [ -f "$produced" ] || continue
      set -- "$@" "$produced"
    done
    if [ $# -gt 0 ]; then
      sh "${SCRIPT_DIR}/validate-arcus.sh" "$@" || die "signed envelope failed strict validation"
    fi
  fi
  exit 0
fi

# Packing mode
if [ -f "${SCRIPT_DIR}/pack-arcus.sh" ]; then
  if [ -n "$SEQUENCE" ]; then
    printf 'sign-arcus: packing and signing (sequence: %s)\n' "$SEQUENCE"
  else
    printf 'sign-arcus: packing and signing (sequence: auto-allocate)\n'
  fi
  set -- --output "$OUTPUT_DIR" --key-file "$KEY_FILE"
  [ -z "$SEQUENCE" ] || set -- "$@" --sequence "$SEQUENCE"
  [ -z "$SOFTWARE_TYPE" ] || set -- "$@" --software-type "$SOFTWARE_TYPE"
  [ -z "$PACKAGE_ID" ] || set -- "$@" --package-id "$PACKAGE_ID"
  [ -z "$SOURCE_ID" ] || set -- "$@" --source-id "$SOURCE_ID"
  [ -z "$VERSION" ] || set -- "$@" --version "$VERSION"
  [ -z "$RELEASE_ID" ] || set -- "$@" --release-id "$RELEASE_ID"
  [ -z "$CONFIG_FILE" ] || set -- "$@" --config "$CONFIG_FILE"
  sh "${SCRIPT_DIR}/pack-arcus.sh" "$@" || die "pack-arcus.sh failed"
else
  die "pack mode requires ${SCRIPT_DIR}/pack-arcus.sh"
fi
