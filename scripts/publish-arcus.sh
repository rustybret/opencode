#!/bin/sh
# =============================================================================
# publish-arcus.sh - dual-window publication for opencode
#
# During the v1/v2 dual window a release must land in BOTH shapes:
#   v1: <arcus>/manifests/opencode/v<version>.json
#   v2: <arcus>/manifests/v2/opencode/releases/<release_id>.json
#
# Both are validated before AND after staging; a failure on either half aborts
# the publication rather than leaving the window half-open.
#
# Asset upload uses the gh CLI and is publisher-side only. End users never need
# a GitHub credential: they install through the Authentik-gated Arcus gateway.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd -P)
OPENCODE_PKG_JSON="${REPO_ROOT}/packages/opencode/package.json"

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME='opencode'
PACKAGE_ID='opencode'
SOURCE_ID='arcus'
CHANNEL='stable'
GITHUB_REPO='rustybret/opencode'

OUTPUT_DIR="${REPO_ROOT}/dist-arcus"
VERSION=''
RELEASE_ID=''
TAG=''
DRY_RUN=0
REQUIRE_DUAL=0
SKIP_UPLOAD=0
ARCUS_DIR=''
V1_MANIFEST=''
V2_ENVELOPE=''

die() {
  printf 'publish-arcus: %s\n' "$*" >&2
  exit 1
}

warn() {
  printf 'publish-arcus: warning: %s\n' "$*" >&2
}

usage() {
  cat <<'USAGE'
Usage: sh scripts/publish-arcus.sh [options]

  --version X.Y.Z    Release version (default: packages/opencode/package.json).
  --release-id ID    v2 release identifier (default: <version>-ucs-1).
  --tag TAG          Git tag for the GitHub release (default: v<version>+ucs.1).
  --v1 PATH          Legacy v1 manifest to stage.
  --v2 PATH          Signed v2 envelope to stage.
  --arcus-dir DIR    Local arcus checkout to stage into.
  --output DIR       Packaging output directory (default: dist-arcus).
  --require-dual     Fail when the v1 half of the window is missing.
  --skip-upload      Stage manifests only; do not touch the GitHub release.
  --dry-run          Report every action without writing or uploading.
  -h, --help         Show this help.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --tag) need_value "$#" "$1"; TAG=$2; shift 2 ;;
    --tag=*) TAG=${1#*=}; shift ;;
    --v1) need_value "$#" "$1"; V1_MANIFEST=$2; shift 2 ;;
    --v1=*) V1_MANIFEST=${1#*=}; shift ;;
    --v2) need_value "$#" "$1"; V2_ENVELOPE=$2; shift 2 ;;
    --v2=*) V2_ENVELOPE=${1#*=}; shift ;;
    --arcus-dir) need_value "$#" "$1"; ARCUS_DIR=$2; shift 2 ;;
    --arcus-dir=*) ARCUS_DIR=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --require-dual) REQUIRE_DUAL=1; shift ;;
    --skip-upload) SKIP_UPLOAD=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
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
  die "arcus CLI not found (set ARCUS_BIN); publication is fail-closed"

if [ -z "$VERSION" ]; then
  if [ -f "$OPENCODE_PKG_JSON" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$OPENCODE_PKG_JSON" | head -n 1)
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1)
  fi
fi
[ -n "$VERSION" ] || die "--version is required (no package.json found)"
VERSION=${VERSION#v}
TAG=${TAG:-v${VERSION}+ucs.1}

if [ -z "$RELEASE_ID" ]; then
  RELEASE_ID="${VERSION}-ucs-1"
fi

[ -n "$V2_ENVELOPE" ] || V2_ENVELOPE="${OUTPUT_DIR}/releases/${RELEASE_ID}.json"
[ -f "$V2_ENVELOPE" ] ||
  die "signed v2 envelope ${V2_ENVELOPE} not found: run sign-arcus.sh (or pack-arcus.sh) first"

if [ -z "$V1_MANIFEST" ] && [ -f "${OUTPUT_DIR}/arcus-manifest.json" ]; then
  V1_MANIFEST="${OUTPUT_DIR}/arcus-manifest.json"
fi
if [ -z "$V1_MANIFEST" ] || [ ! -f "$V1_MANIFEST" ]; then
  if [ "$REQUIRE_DUAL" -eq 1 ]; then
    die "--require-dual: no v1 manifest to stage (looked at ${OUTPUT_DIR}/arcus-manifest.json)"
  fi
  warn "no v1 manifest found; staging the v2 half of the dual window only"
  V1_MANIFEST=''
fi

printf 'publish-arcus: validating release artifacts before staging\n'
"$ARCUS_BIN" manifest validate --with-envelope "$V2_ENVELOPE" ||
  die "v2 envelope failed strict validation: ${V2_ENVELOPE}"
if [ -n "$V1_MANIFEST" ]; then
  "$ARCUS_BIN" manifest validate "$V1_MANIFEST" ||
    die "v1 manifest failed validation: ${V1_MANIFEST}"
fi

if [ -z "$ARCUS_DIR" ]; then
  for candidate in \
    "${ARCUS_REPO_PATH:-}" \
    "${REPO_ROOT}/submodules/arcus" \
    "${REPO_ROOT}/../arcus"; do
    if [ -n "$candidate" ] && [ -d "${candidate}/manifests" ]; then
      ARCUS_DIR=$candidate
      break
    fi
  done
fi
[ -n "$ARCUS_DIR" ] ||
  die "no local arcus checkout found; pass --arcus-dir DIR or set ARCUS_REPO_PATH"

if [ "$SKIP_UPLOAD" -eq 1 ]; then
  printf 'publish-arcus: --skip-upload: staging manifests without touching the GitHub release\n'
elif command -v gh >/dev/null 2>&1; then
  if [ "$DRY_RUN" -eq 1 ]; then
    printf 'publish-arcus: DRY RUN would upload %s assets to %s %s\n' "$OUTPUT_DIR" "$GITHUB_REPO" "$TAG"
  else
    if ! gh release view "$TAG" --repo "$GITHUB_REPO" >/dev/null 2>&1; then
      gh release create "$TAG" --repo "$GITHUB_REPO" --title "$TAG" \
        --notes "Arcus release for ${PROJECT_NAME} ${TAG}" ||
        die "could not create GitHub release ${TAG}"
    fi
    for asset in "$OUTPUT_DIR"/*.tar.zst "$OUTPUT_DIR"/*.tar.gz "$OUTPUT_DIR"/*.zip "$OUTPUT_DIR"/*.pwr; do
      [ -f "$asset" ] || continue
      gh release upload "$TAG" "$asset" --clobber --repo "$GITHUB_REPO" ||
        die "asset upload failed: ${asset}"
    done
  fi
else
  warn "gh CLI not found; skipping publisher-side asset upload (end users never need a GitHub credential)"
fi

V2_DEST="${ARCUS_DIR}/manifests/v2/${PACKAGE_ID}/releases/${RELEASE_ID}.json"
V1_DEST="${ARCUS_DIR}/manifests/${PROJECT_NAME}/v${VERSION}+ucs.1.json"

if [ "$DRY_RUN" -eq 1 ]; then
  printf 'publish-arcus: DRY RUN would stage v2 -> %s\n' "$V2_DEST"
  if [ -n "$V1_MANIFEST" ]; then
    printf 'publish-arcus: DRY RUN would stage v1 -> %s\n' "$V1_DEST"
  fi
  exit 0
fi

mkdir -p "$(dirname "$V2_DEST")"
cp "$V2_ENVELOPE" "$V2_DEST"
printf 'publish-arcus: staged v2 -> %s\n' "$V2_DEST"

if [ -n "$V1_MANIFEST" ]; then
  mkdir -p "$(dirname "$V1_DEST")"
  cp "$V1_MANIFEST" "$V1_DEST"
  printf 'publish-arcus: staged v1 -> %s\n' "$V1_DEST"
fi

"$ARCUS_BIN" manifest validate --with-envelope "$V2_DEST" ||
  die "staged v2 envelope failed re-validation: ${V2_DEST}"
if [ -n "$V1_MANIFEST" ]; then
  "$ARCUS_BIN" manifest validate "$V1_DEST" ||
    die "staged v1 manifest failed re-validation: ${V1_DEST}"
fi

# Regenerate signed arcus-index.json on the Arcus hub repo
if [ -d "$ARCUS_DIR" ]; then
  printf 'publish-arcus: synchronizing arcus-index.json on Arcus repository...\n'
  ( cd "$ARCUS_DIR" && "$ARCUS_BIN" manifest sync-index --write ) ||
    warn "could not auto-sync arcus-index.json on ${ARCUS_DIR}"
fi

printf 'publish-arcus: dual-window publication complete for %s %s\n' "$PROJECT_NAME" "$VERSION"
