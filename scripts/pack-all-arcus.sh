#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# pack-all-arcus.sh — Master Arcus Packaging Catch-All for OpenCode Suite
#
# Packages suite components under the unified hierarchy:
#   dist/<version>/<sequence>/<package_id>/
#
# Components:
#   1. opencode          - Standalone native binary CLI (all 5 canonical platforms)
#   2. opencode-desktop  - Electron desktop application (--include-desktop)
# =============================================================================
set -eu

SCRIPT_DIR="$(CDPATH="" cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH="" cd -- "${SCRIPT_DIR}/.." && pwd)"

VERSION=""
SEQUENCE="${ARCUS_SEQUENCE:-}"
INCLUDE_DESKTOP=0
SKIP_BUILD=0
NO_CLEAN=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --sequence) SEQUENCE="$2"; shift 2 ;;
    --include-desktop) INCLUDE_DESKTOP=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --no-clean) NO_CLEAN=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: $0 [options]
  --version X.Y.Z      Override release version
  --sequence N         Release sequence
  --include-desktop    Also pack opencode-desktop application
  --skip-build         Skip compilation steps
  --no-clean           Do not purge target output directories
EOF
      exit 0
      ;;
    *)
      printf 'pack-all-arcus: error: unknown option: %s\n' "$1" >&2
      exit 1
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION=$(node -e 'console.log(require("./packages/opencode/package.json").version)')
fi
VERSION="${VERSION#v}"

printf "=====================================================================\n"
printf "pack-all-arcus: OpenCode Arcus Packaging Suite\n"
printf "  version:          %s\n" "$VERSION"
printf "  include desktop:  %s\n" "$INCLUDE_DESKTOP"
printf "  output root:      dist/%s/<sequence>/<package_id>/\n" "$VERSION"
printf "=====================================================================\n"

# 1. Pack primary CLI
CLI_ARGS="--version $VERSION"
[ -n "$SEQUENCE" ] && CLI_ARGS="$CLI_ARGS --sequence $SEQUENCE"
[ "$SKIP_BUILD" -eq 1 ] && CLI_ARGS="$CLI_ARGS --skip-build"
[ "$NO_CLEAN" -eq 1 ] && CLI_ARGS="$CLI_ARGS --no-clean"

sh "${REPO_ROOT}/scripts/pack-arcus.sh" $CLI_ARGS

# 2. Pack Desktop if requested
if [ "$INCLUDE_DESKTOP" -eq 1 ]; then
  DESKTOP_ARGS="--version $VERSION"
  [ -n "$SEQUENCE" ] && DESKTOP_ARGS="$DESKTOP_ARGS --sequence $SEQUENCE"
  [ "$SKIP_BUILD" -eq 1 ] && DESKTOP_ARGS="$DESKTOP_ARGS --skip-build"
  [ "$NO_CLEAN" -eq 1 ] && DESKTOP_ARGS="$DESKTOP_ARGS --no-clean"

  sh "${REPO_ROOT}/scripts/pack-desktop-arcus.sh" $DESKTOP_ARGS
fi

printf "\n=====================================================================\n"
printf "pack-all-arcus: OpenCode packaging pass complete!\n"
printf "=====================================================================\n"
