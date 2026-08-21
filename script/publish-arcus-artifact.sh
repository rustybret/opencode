#!/usr/bin/env bash
# Arcus Release Publish Script for OpenCode Multi-Arch Binaries
#
# Fail-Closed Publishing Pipeline:
#   1. Runs package-arcus.ts to create multi-arch archives & stage manifest.
#   2. Uploads all 5 canonical release assets to GitHub Release via gh CLI.
#   3. Downloads back the published assets and recomputes SHA256 hashes.
#   4. Stamps the verified downloaded hashes into dist-arcus/arcus-manifest.json.
#   5. Syncs the manifest to manifests/opencode/v<version>.json in rustybret/arcus.
#
# Usage:
#   bash script/publish-arcus-artifact.sh
#   GH_TOKEN=<pat> bash script/publish-arcus-artifact.sh
#
# Environment:
#   VERSION:          OpenCode version (default: read from packages/opencode/package.json)
#   REPO:             GitHub repository for release assets (default: rustybret/opencode)
#   TAG:              Release tag name (default: v${VERSION})
#   ARCUS_REPO_PATH:  Path to arcus repository (default: ../arcus or submodules/arcus if present)

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
OPENCODE_PKG="$REPO_ROOT/packages/opencode/package.json"

VERSION="${VERSION:-$(node -e "console.log(require('$OPENCODE_PKG').version)")}"
REPO="${REPO:-rustybret/opencode}"
TAG="${TAG:-v${VERSION}}"
DIST_DIR="$REPO_ROOT/dist-arcus"
MANIFEST_FILE="$DIST_DIR/arcus-manifest.json"

echo "=== Arcus Multi-Arch Publish: opencode ${VERSION} ==="

# Pre-flight: gh CLI is strictly required (fail-closed)
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required for publishing release assets. Fail-closed." >&2
  exit 1
fi

# Step 1: Package binary artifacts and generate staging manifest
echo "[publish] Running package-arcus.ts..."
bun run "$SCRIPT_DIR/package-arcus.ts"

if [[ ! -f "$MANIFEST_FILE" ]]; then
  echo "ERROR: Manifest file not generated at $MANIFEST_FILE" >&2
  exit 1
fi

# Step 2: Discover packaged archives
ARCHIVES=()
for f in "$DIST_DIR"/opencode-*.tar.gz "$DIST_DIR"/opencode-*.zip; do
  [[ -f "$f" ]] && ARCHIVES+=("$f")
done

if [[ ${#ARCHIVES[@]} -eq 0 ]]; then
  echo "ERROR: No archives found in $DIST_DIR" >&2
  exit 1
fi

echo "[publish] Discovered ${#ARCHIVES[@]} multi-arch archive(s):"
for a in "${ARCHIVES[@]}"; do
  echo "  - $(basename "$a")"
done

# Step 3: Upload to GitHub Release via gh CLI
echo "[publish] Uploading release assets to $REPO ($TAG)..."
if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  gh release upload "$TAG" "${ARCHIVES[@]}" --clobber --repo "$REPO"
  echo "[publish] Uploaded asset(s) to existing release $TAG."
else
  echo "[publish] Creating release $TAG on $REPO..."
  gh release create "$TAG" "${ARCHIVES[@]}" --repo "$REPO" --title "v${VERSION}" --notes "Arcus release v${VERSION} of OpenCode standalone multi-arch binaries"
  echo "[publish] Created release $TAG and uploaded asset(s)."
fi

# Step 4: Verification by Re-Download (Anti-Phantom / Download-Verification Gate)
echo "[publish] Re-downloading published assets from $REPO ($TAG) to verify hashes..."
VERIFY_DIR="$(mktemp -d -t opencode-verify-XXXXXX)"
trap 'rm -rf "$VERIFY_DIR"' EXIT

gh release download "$TAG" --repo "$REPO" --dir "$VERIFY_DIR" --clobber

DOWNLOADED_HASHES_JSON="{}"

for a in "${ARCHIVES[@]}"; do
  archive_name="$(basename "$a")"
  downloaded_file="$VERIFY_DIR/$archive_name"
  
  if [[ ! -f "$downloaded_file" ]]; then
    echo "ERROR: Re-download failed for $archive_name from release $TAG" >&2
    exit 1
  fi
  
  if command -v shasum >/dev/null 2>&1; then
    downloaded_hash="$(shasum -a 256 "$downloaded_file" | awk '{print $1}')"
  else
    downloaded_hash="$(sha256sum "$downloaded_file" | awk '{print $1}')"
  fi
  
  echo "  ✓ Verified download for $archive_name: $downloaded_hash"
  
  DOWNLOADED_HASHES_JSON="$(node -e "
    const hashes = JSON.parse(process.argv[1]);
    hashes['$archive_name'] = '$downloaded_hash';
    console.log(JSON.stringify(hashes));
  " "$DOWNLOADED_HASHES_JSON")"
done

# Step 5: Update dist-arcus/arcus-manifest.json with verified downloaded hashes
echo "[publish] Stamping manifest with verified downloaded hashes..."
bun -e '
import { readFileSync, writeFileSync } from "fs";
const manifestPath = process.argv[2];
const hashes = JSON.parse(process.argv[3]);
const doc = JSON.parse(readFileSync(manifestPath, "utf8"));

const matrix = doc.daemon?.target_matrix ?? {};
for (const [key, target] of Object.entries(matrix)) {
  const filename = target.asset?.filename;
  if (filename && hashes[filename]) {
    target.asset.sha256 = hashes[filename];
  }
}
writeFileSync(manifestPath, JSON.stringify(doc, null, 2) + "\n");
' "$MANIFEST_FILE" "$DOWNLOADED_HASHES_JSON"

# Step 6: Sync verified manifest to local Arcus repository
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
  
  echo "[publish] Syncing verified manifest to Arcus repository: $TARGET_MANIFEST"
  cp "$MANIFEST_FILE" "$TARGET_MANIFEST"
  echo "[publish] Synced manifest to $TARGET_MANIFEST."
fi

echo ""
echo "=== Arcus Publish Complete (Fail-Closed & Download-Verified) ==="
echo "  Manifest: $MANIFEST_FILE"
echo "  Release:  https://github.com/$REPO/releases/tag/$TAG"
echo "  Targets:  5 canonical platforms verified and hashed"
