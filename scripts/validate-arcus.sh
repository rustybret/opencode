#!/bin/sh
# =============================================================================
# validate-arcus.sh - strict, fail-closed Arcus v2 validation for opencode
#
# Exits 0 only when every target validates. Any failure - unreadable file,
# schema violation, missing or malformed signature, absent arcus CLI - exits 1.
# Placeholder digests are refused outright: there is no permissive mode.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd -P)

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME='opencode'
PACKAGE_ID='opencode'

BODY_ONLY=0

die() {
  printf 'validate-arcus: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: sh scripts/validate-arcus.sh [options] [manifest ...]

  --body-only   Validate the unsigned document body instead of the envelope.
  -h, --help    Show this help.

Options must precede manifest paths. With no paths, every
dist-arcus/releases/*.json envelope is validated.

Exit status: 0 = all targets valid, 1 = at least one target invalid.
USAGE
}

while [ $# -gt 0 ]; do
  case "$1" in
    --body-only) BODY_ONLY=1; shift ;;
    --allow-placeholders)
      die "refusing --allow-placeholders: v2 validation is strict and fail-closed" ;;
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
  die "arcus CLI not found (set ARCUS_BIN); validation is fail-closed and cannot be skipped"

if [ $# -eq 0 ]; then
  RELEASES_DIR="${REPO_ROOT}/dist-arcus/releases"
  [ -d "$RELEASES_DIR" ] ||
    die "no manifest paths given and ${RELEASES_DIR} does not exist"
  set --
  for candidate in "$RELEASES_DIR"/*.json "$RELEASES_DIR"/*/*.json; do
    [ -f "$candidate" ] || continue
    set -- "$@" "$candidate"
  done
  [ $# -gt 0 ] || die "no release envelopes found under ${RELEASES_DIR}"
fi

failures=0
for target in "$@"; do
  if [ ! -f "$target" ]; then
    printf 'validate-arcus: [FAIL] %s: not a readable file\n' "$target" >&2
    failures=$((failures + 1))
    continue
  fi
  if [ "$BODY_ONLY" -eq 1 ]; then
    if "$ARCUS_BIN" manifest validate "$target"; then
      printf 'validate-arcus: [PASS] %s (body)\n' "$target"
    else
      printf 'validate-arcus: [FAIL] %s (body)\n' "$target" >&2
      failures=$((failures + 1))
    fi
  else
    if "$ARCUS_BIN" manifest validate --with-envelope "$target"; then
      printf 'validate-arcus: [PASS] %s (envelope)\n' "$target"
    else
      printf 'validate-arcus: [FAIL] %s (envelope)\n' "$target" >&2
      failures=$((failures + 1))
    fi
  fi
done

if [ "$failures" -gt 0 ]; then
  printf 'validate-arcus: %s target(s) failed strict validation\n' "$failures" >&2
  exit 1
fi

printf 'validate-arcus: all targets valid\n'
