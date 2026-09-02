#!/bin/sh
# =============================================================================
# sign-arcus.sh - produce a SIGNED Arcus v2 release envelope for opencode
#
# Two modes:
#   (default)            sign a freshly packed payload tree via pack-arcus.sh
#   --migrate <v1.json>  sign a v2 envelope migrated from a legacy v1 manifest
#
# Key handling contract: the private key is only ever read from a FILE, from
# STDIN, or from a named ENVIRONMENT VARIABLE. It is never accepted as a
# command-line value, so it never lands in argv, /proc, shell history, or a CI
# command log. Material taken from stdin or the environment is materialized
# into a 0600 file inside a private temp directory that is removed on exit.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd -P)

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME='opencode'
PACKAGE_ID='opencode'
SOURCE_ID='arcus'
SOFTWARE_TYPE='service'

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
Usage: sh scripts/sign-arcus.sh [options]

  --migrate PATH       Migrate and sign a legacy v1 manifest instead of packing.
  --sequence N         Publisher-allocated monotonic sequence (>=1). Required.
  --version X.Y.Z      Release version (pack mode).
  --release-id ID      Release identifier (pack mode).
  --output DIR         Output directory (default: dist-arcus).
  --key-file PATH      Ed25519 private key file. Use '-' to read stdin.
  --key-env NAME       Name of an environment variable holding the key.
  --allow-incomplete   Migrate mode: emit stampable sentinels for fields v1
                       cannot supply instead of failing closed.
  -h, --help           Show this help.

The key is NEVER passed as a command-line value; --key/--signing-key are
refused. Fallbacks, in order: --key-file, --key-env, ARCUS_SIGNING_KEY_FILE,
ARCUS_SIGNING_KEY, then stdin when it is not a terminal.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --migrate) need_value "$#" "$1"; MIGRATE_INPUT=$2; shift 2 ;;
    --migrate=*) MIGRATE_INPUT=${1#*=}; shift ;;
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --key-file) need_value "$#" "$1"; KEY_FILE_OPT=$2; shift 2 ;;
    --key-file=*) KEY_FILE_OPT=${1#*=}; shift ;;
    --key-env) need_value "$#" "$1"; KEY_ENV_OPT=$2; shift 2 ;;
    --key-env=*) KEY_ENV_OPT=${1#*=}; shift ;;
    --allow-incomplete) ALLOW_INCOMPLETE=1; shift ;;
    --key|--key=*|--signing-key|--signing-key=*|--private-key|--private-key=*)
      die "refusing ${1%%=*}: key material must never appear in argv; use --key-file PATH, --key-file - (stdin), or --key-env NAME" ;;
    -h|--help) usage; exit 0 ;;
    *) die "unrecognized argument '$1'" ;;
  esac
done

if ! command -v "$ARCUS_BIN" >/dev/null 2>&1; then
  for candidate in \
    "${HOME}/.local/bin/arcus" \
    "${HOME}/.arcus/bin/arcus" \
    "/usr/local/bin/arcus" \
    "${REPO_ROOT}/../arcus/bin/arcus"; do
    if [ -x "$candidate" ]; then
      ARCUS_BIN="$candidate"
      break
    fi
  done
fi
command -v "$ARCUS_BIN" >/dev/null 2>&1 ||
  die "arcus CLI not found (set ARCUS_BIN); signing is fail-closed"

[ -n "$SEQUENCE" ] ||
  die "--sequence (or ARCUS_SEQUENCE) is required: the publisher allocates the monotonic v2 sequence"
case "$SEQUENCE" in
  ''|*[!0-9]*) die "--sequence must be a positive integer, got '$SEQUENCE'" ;;
esac
[ "$SEQUENCE" -ge 1 ] || die "--sequence must be >= 1, got '$SEQUENCE'"

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

if [ -n "$MIGRATE_INPUT" ]; then
  [ -f "$MIGRATE_INPUT" ] || die "v1 manifest ${MIGRATE_INPUT} not found"
  RELEASES_DIR="${OUTPUT_DIR}/releases"
  mkdir -p "$RELEASES_DIR"
  printf 'sign-arcus: migrating and signing %s (sequence %s)\n' "$MIGRATE_INPUT" "$SEQUENCE"
  set -- "$MIGRATE_INPUT" \
    --sign-with "$KEY_FILE" \
    --out-dir "$RELEASES_DIR" \
    --source-id "$SOURCE_ID" \
    --sequence "$SEQUENCE" \
    --strategy "$SOFTWARE_TYPE"
  if [ "$ALLOW_INCOMPLETE" -eq 1 ]; then
    set -- "$@" --allow-incomplete
  fi
  "$ARCUS_BIN" manifest migrate "$@" || die "migration signing failed for ${MIGRATE_INPUT}"
  printf 'sign-arcus: signed envelopes written under %s\n' "$RELEASES_DIR"

  if [ "$ALLOW_INCOMPLETE" -eq 1 ]; then
    printf 'sign-arcus: --allow-incomplete emitted a stampable SKELETON\n'
    printf 'sign-arcus: stamp the sentinel digests, then re-sign before publishing\n'
    exit 0
  fi

  if [ -f "${SCRIPT_DIR}/validate-arcus.sh" ]; then
    set --
    for produced in "$RELEASES_DIR"/*.json "$RELEASES_DIR"/*/*.json; do
      [ -f "$produced" ] || continue
      set -- "$@" "$produced"
    done
    [ $# -gt 0 ] || die "migration reported success but wrote no envelope under ${RELEASES_DIR}"
    sh "${SCRIPT_DIR}/validate-arcus.sh" "$@" ||
      die "signed envelope failed strict validation"
  fi
  exit 0
fi

[ -f "${SCRIPT_DIR}/pack-arcus.sh" ] ||
  die "pack mode needs ${SCRIPT_DIR}/pack-arcus.sh (use --migrate for a v1 manifest)"

printf 'sign-arcus: packing and signing %s (sequence %s)\n' "$PACKAGE_ID" "$SEQUENCE"
set -- --sequence "$SEQUENCE" --output "$OUTPUT_DIR" --key-file "$KEY_FILE"
if [ -n "$VERSION" ]; then
  set -- "$@" --version "$VERSION"
fi
if [ -n "$RELEASE_ID" ]; then
  set -- "$@" --release-id "$RELEASE_ID"
fi
sh "${SCRIPT_DIR}/pack-arcus.sh" "$@" || die "pack-arcus.sh failed"
