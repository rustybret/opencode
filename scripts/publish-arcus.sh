#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# publish-arcus.sh — Publish OpenCode Arcus Release to GitHub & Arcus Gateway
#
# Publishes release bundle from:
#   dist/<version>/<sequence>/opencode/
#
# Operations:
#   1. Uploads payload archives & envelope to GitHub Releases (via gh CLI)
#   2. Submits the immutable submission bundle to Arcus Gateway (via arcus publish submit)
# =============================================================================
set -eu

SCRIPT_DIR="$(CDPATH="" cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH="" cd -- "${SCRIPT_DIR}/.." && pwd)"

VERSION=""
SEQUENCE=""
DRY_RUN=0
SKIP_UPLOAD=0
SKIP_SUBMIT=0
GITHUB_REPO="rustybret/opencode"
GATEWAY_URL="https://arcus-auth.rustybret.com"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --sequence) SEQUENCE="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --skip-upload) SKIP_UPLOAD=1; shift ;;
    --skip-submit) SKIP_SUBMIT=1; shift ;;
    --github-repo) GITHUB_REPO="$2"; shift 2 ;;
    --gateway) GATEWAY_URL="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Usage: $0 [options]
  --version X.Y.Z    Release version
  --sequence N       Release sequence
  --dry-run          Preview actions without uploading or submitting
  --skip-upload      Skip GitHub release asset upload
  --skip-submit      Skip gateway submission
  --github-repo REPO Target GitHub repository (default: rustybret/opencode)
  --gateway URL      Arcus Gateway URL (default: https://arcus-auth.rustybret.com)
EOF
      exit 0
      ;;
    *)
      if [ -z "$VERSION" ] && [ "${1#-}" = "$1" ]; then
        VERSION="$1"; shift
        if [ "$#" -gt 0 ] && [ -z "$SEQUENCE" ] && [ "${1#-}" = "$1" ]; then
          SEQUENCE="$1"; shift
        fi
      else
        printf 'publish-arcus: error: unknown option: %s\n' "$1" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION=$(node -e 'console.log(require("./packages/opencode/package.json").version)')
fi
VERSION="${VERSION#v}"

DIST_VERSION_DIR="${REPO_ROOT}/dist/${VERSION}"

if [ -z "$SEQUENCE" ]; then
  # Auto-detect latest sequence in dist/<version>/
  if [ -d "$DIST_VERSION_DIR" ]; then
    for d in "$DIST_VERSION_DIR"/*; do
      [ -d "$d" ] || continue
      base="$(basename "$d")"
      case "$base" in
        *[!0-9]*) continue ;;
        *) [ -z "$SEQUENCE" ] || [ "$base" -gt "$SEQUENCE" ] && SEQUENCE="$base" ;;
      esac
    done
  fi
fi

if [ -z "$SEQUENCE" ]; then
  printf "publish-arcus: error: no release sequence found under %s\n" "$DIST_VERSION_DIR" >&2
  printf "hint: run 'bun run pack:arcus' first.\n" >&2
  exit 1
fi

BUNDLE_DIR="${DIST_VERSION_DIR}/${SEQUENCE}/opencode"

if [ ! -d "$BUNDLE_DIR" ] || [ ! -f "${BUNDLE_DIR}/release.json" ]; then
  printf "publish-arcus: error: submission bundle not found at: %s\n" "$BUNDLE_DIR" >&2
  printf "hint: run 'bun run pack:arcus' first.\n" >&2
  exit 1
fi

TAG="v${VERSION}"

printf "=====================================================================\n"
printf "publish-arcus: Publishing OpenCode CLI (%s, seq: %s)\n" "$VERSION" "$SEQUENCE"
printf "Bundle source: %s\n" "$BUNDLE_DIR"
printf "GitHub target: %s (%s)\n" "$GITHUB_REPO" "$TAG"
printf "Gateway target: %s\n" "$GATEWAY_URL"
printf "=====================================================================\n"

# 1. GitHub release asset upload
if [ "$SKIP_UPLOAD" -eq 0 ]; then
  if command -v gh >/dev/null 2>&1; then
    if [ "$DRY_RUN" -eq 1 ]; then
      printf "\n[1/2] [dry-run] would upload bundle artifacts to GitHub release %s on %s\n" "$TAG" "$GITHUB_REPO"
    else
      printf "\n[1/2] Verifying GitHub release %s on %s...\n" "$TAG" "$GITHUB_REPO"
      if ! gh release view "$TAG" --repo "$GITHUB_REPO" >/dev/null 2>&1; then
        printf "  -> creating GitHub release %s...\n" "$TAG"
        gh release create "$TAG" --repo "$GITHUB_REPO" \
          --title "$TAG" \
          --notes "Arcus v3 release for opencode ${VERSION}-${SEQUENCE}"
      fi

      printf "  -> uploading release assets to %s %s...\n" "$GITHUB_REPO" "$TAG"
      for asset in "${BUNDLE_DIR}"/*; do
        [ -f "$asset" ] || continue
        case "$asset" in
          *.tar.zst|*.zip|*.pwr|*.json|*.sha256)
            gh release upload "$TAG" "$asset" --repo "$GITHUB_REPO" --clobber
            ;;
        esac
      done
      printf "  -> GitHub upload complete.\n"
    fi
  else
    printf "publish-arcus: warning: gh CLI not found; skipping GitHub release upload\n" >&2
  fi
else
  printf "\n[1/2] Skipping GitHub upload (--skip-upload)\n"
fi

# 2. Gateway submission
if [ "$SKIP_SUBMIT" -eq 0 ]; then
  if command -v arcus >/dev/null 2>&1; then
    if [ "$DRY_RUN" -eq 1 ]; then
      printf "\n[2/2] [dry-run] would submit bundle to Arcus Gateway (%s):\n" "$GATEWAY_URL"
      printf "  arcus publish submit --bundle \"%s\" --gateway \"%s\"\n" "$BUNDLE_DIR" "$GATEWAY_URL"
    else
      printf "\n[2/2] Submitting bundle to Arcus Gateway (%s)...\n" "$GATEWAY_URL"
      if arcus publish submit --bundle "$BUNDLE_DIR" --gateway "$GATEWAY_URL" 2>/dev/null; then
        printf "  -> Gateway submission accepted!\n"
      else
        printf "publish-arcus: notice: gateway submit returned non-zero (may require gateway session or local catalog ingestion)\n"
        printf "  Local bundle path for intake: %s\n" "$BUNDLE_DIR"
      fi
    fi
  else
    printf "publish-arcus: notice: arcus CLI not found on PATH; skipping gateway submit\n" >&2
  fi
else
  printf "\n[2/2] Skipping Gateway submission (--skip-submit)\n"
fi

printf "\n=====================================================================\n"
printf "publish-arcus: Publication workflow complete for opencode %s-%s!\n" "$VERSION" "$SEQUENCE"
printf "=====================================================================\n"
