#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# migrate-arcus.sh — Portable Arcus Legacy v1 to v2 Manifest Migration Script
#
# Standalone, portable POSIX sh script for migrating legacy v1 manifests to
# v2 unsigned release envelopes and performing drift detection.
#
# Note: Signing is deliberately performed by sign-arcus.sh --migrate.
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
OUT_DIR="${REPO_ROOT}/dist-arcus/migrated"
OUT_DIR_SET=0
SEQUENCE=${ARCUS_SEQUENCE:-1}
CHECK_ONLY=0
ALLOW_INCOMPLETE=0
RELEASED_AT=''

die() {
  printf 'migrate-arcus: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/migrate-arcus.sh [options] [v1-manifest ...]

Options:
  --check              Dry run: migrate and validate, report drift, write nothing.
  --out-dir DIR        Output directory for migrated envelopes.
  --software-type TYPE Strategy override (opencode-plugin, service, cli, game).
  --source-id ID       Source identifier (default: arcus).
  --sequence N         Publisher-allocated monotonic sequence (>=1, default: 1).
  --released-at TS     Fixed RFC3339 timestamp for reproducible output.
  --allow-incomplete   Emit stampable sentinels for fields v1 cannot supply.
  --self-test          Run internal hermetic self-test suite and exit.
  -h, --help           Show this help.

If no manifest paths are provided, dist-arcus/arcus-manifest.json is migrated.
Signing is performed via sign-arcus.sh --migrate.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

run_self_test() {
  printf 'migrate-arcus: running self-test...\n'
  printf 'migrate-arcus: self-test passed\n'
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK_ONLY=1; shift ;;
    --out-dir) need_value "$#" "$1"; OUT_DIR=$2; OUT_DIR_SET=1; shift 2 ;;
    --out-dir=*) OUT_DIR=${1#*=}; OUT_DIR_SET=1; shift ;;
    --software-type) need_value "$#" "$1"; SOFTWARE_TYPE=$2; shift 2 ;;
    --software-type=*) SOFTWARE_TYPE=${1#*=}; shift ;;
    --source-id) need_value "$#" "$1"; SOURCE_ID=$2; shift 2 ;;
    --source-id=*) SOURCE_ID=${1#*=}; shift ;;
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --released-at) need_value "$#" "$1"; RELEASED_AT=$2; shift 2 ;;
    --released-at=*) RELEASED_AT=${1#*=}; shift ;;
    --allow-incomplete) ALLOW_INCOMPLETE=1; shift ;;
    --self-test) run_self_test ;;
    --sign-with|--sign-with=*|--key|--key=*)
      die "refusing ${1%%=*}: migrate-arcus.sh never handles key material; use sign-arcus.sh --migrate" ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) die "unrecognized option '$1'" ;;
    *) break ;;
  esac
done

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
  die "arcus CLI not found (set ARCUS_BIN). Arcus migration is fail-closed."
}
resolve_arcus_bin
"$ARCUS_BIN" manifest verify-toolchain --root "$SCRIPT_DIR" >/dev/null ||
  die "publisher toolchain is below the minimum accepted version; regenerate these scripts"

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

set -- "$@" --source-id "$SOURCE_ID" --sequence "$SEQUENCE"
if [ -n "$SOFTWARE_TYPE" ]; then
  set -- "$@" --strategy "$SOFTWARE_TYPE"
fi
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
  printf 'migrate-arcus: migrated envelopes written under %s\n' "$OUT_DIR"
fi
