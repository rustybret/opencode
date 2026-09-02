#!/bin/sh
# =============================================================================
# migrate-arcus.sh - migrate opencode legacy v1 manifests to v2
#
# This script performs UNSIGNED migration and drift detection only. Signing is
# deliberately not duplicated here: run sign-arcus.sh --migrate so key handling
# has exactly one implementation.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd -P)

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME='opencode'
PACKAGE_ID='opencode'
SOURCE_ID='arcus'
SOFTWARE_TYPE='service'

OUT_DIR="${REPO_ROOT}/dist-arcus/migrated"
OUT_DIR_SET=0
SEQUENCE=${ARCUS_SEQUENCE:-4}
CHECK_ONLY=0
ALLOW_INCOMPLETE=0
RELEASED_AT=''

die() {
  printf 'migrate-arcus: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: sh scripts/migrate-arcus.sh [options] [v1-manifest ...]

  --check              Dry run: migrate and validate, report drift, write nothing.
  --out-dir DIR        Output directory for migrated envelopes.
  --sequence N         Publisher-allocated monotonic sequence (>=1).
  --released-at TS     Fixed RFC3339 timestamp for reproducible output.
  --allow-incomplete   Emit stampable sentinels for fields v1 cannot supply.
  -h, --help           Show this help.

Options must precede manifest paths. With no paths, dist-arcus/arcus-manifest.json
is migrated. Signing is not performed here - use sign-arcus.sh --migrate.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --out-dir) need_value "$#" "$1"; OUT_DIR=$2; OUT_DIR_SET=1; shift 2 ;;
    --out-dir=*) OUT_DIR=${1#*=}; OUT_DIR_SET=1; shift ;;
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --released-at) need_value "$#" "$1"; RELEASED_AT=$2; shift 2 ;;
    --released-at=*) RELEASED_AT=${1#*=}; shift ;;
    --allow-incomplete) ALLOW_INCOMPLETE=1; shift ;;
    --sign-with|--sign-with=*|--key|--key=*)
      die "refusing ${1%%=*}: migrate-arcus.sh never handles key material; use sign-arcus.sh --migrate" ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) die "unrecognized option '$1'" ;;
    *) break ;;
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
  die "arcus CLI not found (set ARCUS_BIN); migration is fail-closed"

case "$SEQUENCE" in
  ''|*[!0-9]*) die "--sequence must be a positive integer, got '$SEQUENCE'" ;;
esac
[ "$SEQUENCE" -ge 1 ] || die "--sequence must be >= 1, got '$SEQUENCE'"

if [ $# -eq 0 ]; then
  DEFAULT_V1="${REPO_ROOT}/dist-arcus/arcus-manifest.json"
  [ -f "$DEFAULT_V1" ] ||
    die "no manifest paths given and ${DEFAULT_V1} does not exist"
  set -- "$DEFAULT_V1"
fi

for target in "$@"; do
  [ -f "$target" ] || die "v1 manifest ${target} not found"
done

set -- "$@" --source-id "$SOURCE_ID" --sequence "$SEQUENCE" --strategy "$SOFTWARE_TYPE"
if [ -n "$RELEASED_AT" ]; then
  set -- "$@" --released-at "$RELEASED_AT"
fi
if [ "$ALLOW_INCOMPLETE" -eq 1 ]; then
  set -- "$@" --allow-incomplete
fi
if [ "$CHECK_ONLY" -eq 1 ]; then
  set -- "$@" --check
  if [ "$OUT_DIR_SET" -eq 1 ]; then
    set -- "$@" --out-dir "$OUT_DIR"
  fi
else
  mkdir -p "$OUT_DIR"
  set -- "$@" --out-dir "$OUT_DIR"
fi

"$ARCUS_BIN" manifest migrate "$@" || die "migration failed"

if [ "$CHECK_ONLY" -eq 1 ]; then
  printf 'migrate-arcus: check complete, nothing written\n'
else
  printf 'migrate-arcus: unsigned envelopes written under %s\n' "$OUT_DIR"
  printf 'migrate-arcus: sign them with: sh %s/sign-arcus.sh --migrate <v1-manifest> --sequence %s\n' "$SCRIPT_DIR" "$SEQUENCE"
fi
