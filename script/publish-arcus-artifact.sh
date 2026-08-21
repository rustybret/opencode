#!/usr/bin/env bash
# Arcus Release Publish Script for OpenCode Standalone Binaries
#
# Packages OpenCode native binary release artifacts, uploads them to GitHub Releases
# on rustybret/opencode, updates dist-arcus/arcus-manifest.json, and syncs the
# manifest to the local Arcus repository.
#
# Usage:
#   bash script/publish-arcus-artifact.sh
#   GH_TOKEN=<pat> bash script/publish-arcus-artifact.sh
#
# Environment:
#   VERSION:          OpenCode version (default: read from packages/opencode/package.json)
#   REPO:             GitHub repository for release assets (default: rustybret/opencode)
#   TAG:              Release tag name (default: v${VERSION}-fork)
#   ARCUS_REPO_PATH:  Path to arcus repository (default: ../arcus or submodules/arcus if present)

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
OPENCODE_PKG="$REPO_ROOT/packages/opencode/package.json"

VERSION="${VERSION:-$(node -e "console.log(require('$OPENCODE_PKG').version)")}"
REPO="${REPO:-rustybret/opencode}"
TAG="${TAG:-v${VERSION}-fork}"
DIST_DIR="$REPO_ROOT/dist-arcus"
MANIFEST_FILE="$DIST_DIR/arcus-manifest.json"

echo "=== Arcus Publish: opencode v${VERSION} ==="

# Step 1: Package binary artifacts and generate staging manifest
echo "[publish] Running package-arcus.ts..."
bun run "$SCRIPT_DIR/package-arcus.ts"

if [[ ! -f "$MANIFEST_FILE" ]]; then
  echo "ERROR: Manifest file not generated at $MANIFEST_FILE" >&2
  exit 1
fi

# Step 2: Discover packaged archives
ARCHIVES=()
for f in "$DIST_DIR"/*.tar.gz "$DIST_DIR"/*.zip; do
  [[ -f "$f" ]] && ARCHIVES+=("$f")
done

if [[ ${#ARCHIVES[@]} -eq 0 ]]; then
  echo "ERROR: No archives found in $DIST_DIR" >&2
  exit 1
fi

echo "[publish] Found ${#ARCHIVES[@]} archive(s) to upload:"
for a in "${ARCHIVES[@]}"; do
  echo "  - $(basename "$a")"
done

# Step 3: Upload to GitHub Release via gh CLI if available
if command -v gh >/dev/null 2>&1; then
  echo "[publish] Uploading release assets to $REPO ($TAG)..."
  if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
    gh release upload "$TAG" "${ARCHIVES[@]}" --clobber --repo "$REPO"
    echo "[publish] Uploaded asset(s) to existing release $TAG."
  else
    echo "[publish] Creating release $TAG on $REPO..."
    gh release create "$TAG" "${ARCHIVES[@]}" --repo "$REPO" --title "v${VERSION}-fork" --notes "Arcus release v${VERSION} of OpenCode standalone binary"
    echo "[publish] Created release $TAG and uploaded asset(s)."
  fi
else
  echo "[publish] Note: gh CLI not available; skipping GitHub Release upload."
fi

# Step 4: Sync manifest to local Arcus repository
ARCUS_DIR=""
if [[ -n "${ARCUS_REPO_PATH:-}" && -d "$ARCUS_REPO_PATH" ]]; then
  ARCUS_DIR="$ARCUS_REPO_PATH"
elif [[ -d "$REPO_ROOT/../arcus/manifests" ]]; then
  ARCUS_DIR="$REPO_ROOT/../arcus"
elif [[ -d "$REPO_ROOT/submodules/arcus/manifests" ]]; then
  ARCUS_DIR="$REPO_ROOT/submodules/arcus"
fi

if [[ -n "$ARCUS_DIR" && -d "$ARCUS_DIR/manifests" ]]; then
  mkdir -p "$ARCUS_DIR/manifests/opencode"
  TARGET_MANIFEST="$ARCUS_DIR/manifests/opencode/v${VERSION}.json"
  LATEST_MANIFEST="$ARCUS_DIR/manifests/opencode/latest.json"
  
  echo "[publish] Syncing manifest to Arcus repository: $TARGET_MANIFEST"
  cp "$MANIFEST_FILE" "$TARGET_MANIFEST"
  cp "$MANIFEST_FILE" "$LATEST_MANIFEST"
  echo "[publish] Synced manifest to $TARGET_MANIFEST and $LATEST_MANIFEST."
fi

echo ""
echo "=== Arcus Publish Complete ==="
echo "  Manifest: $MANIFEST_FILE"
echo "  Target:   $TAG on $REPO"
