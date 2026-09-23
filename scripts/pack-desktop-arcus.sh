#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# pack-desktop-arcus.sh — Package OpenCode Desktop App for Arcus Distribution
#
# Emits an immutable Arcus v3 submission bundle at:
#   dist/<version>/<sequence>/opencode-desktop/
# =============================================================================
set -eu

SCRIPT_DIR="$(CDPATH="" cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH="" cd -- "${SCRIPT_DIR}/.." && pwd)"
DESKTOP_DIR="${REPO_ROOT}/packages/desktop"

VERSION=""
SEQUENCE="${ARCUS_SEQUENCE:-}"
SKIP_BUILD="${SKIP_BUILD:-0}"
NO_CLEAN="${NO_CLEAN:-0}"
OFFLINE=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --sequence) SEQUENCE="$2"; shift 2 ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --no-clean) NO_CLEAN=1; shift ;;
    --offline) OFFLINE=1; shift ;;
    -h|--help)
      cat <<EOF
Usage: $0 [options] [version] [sequence]
  --version X.Y.Z    Release version (default: from packages/desktop/package.json)
  --sequence N       Release sequence
  --skip-build       Skip electron build and packaging
  --no-clean         Do not purge output directory before packing
  --offline          Skip live gateway sequence allocation
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
        printf 'pack-desktop-arcus: error: unknown option: %s\n' "$1" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION=$(node -e 'console.log(require("./packages/desktop/package.json").version)')
fi
VERSION="${VERSION#v}"

# Bootstrap toolchain if not present
if [ ! -d "${REPO_ROOT}/packages/arcus/toolchain" ]; then
  printf "pack-desktop-arcus: bootstrapping Arcus toolchain...\n"
  sh "${REPO_ROOT}/packages/arcus/bootstrap.sh"
fi

TOOLCHAIN_PACK="${REPO_ROOT}/packages/arcus/toolchain/scripts/pack-arcus.sh"
TOOLCHAIN_VALIDATE="${REPO_ROOT}/packages/arcus/toolchain/scripts/validate-arcus.sh"
TOOLCHAIN_META="${REPO_ROOT}/packages/arcus/toolchain/scripts/arcus-toolchain.json"

[ -f "$TOOLCHAIN_PACK" ] || { printf "pack-desktop-arcus: error: toolchain script not found: %s\n" "$TOOLCHAIN_PACK" >&2; exit 1; }

# Sequence allocation
if [ -z "$SEQUENCE" ]; then
  if [ "$OFFLINE" -eq 0 ] && command -v arcus >/dev/null 2>&1; then
    printf "pack-desktop-arcus: allocating sequence from gateway for opencode-desktop...\n"
    ALLOC_JSON=$(arcus manifest allocate-sequence --gateway https://arcus-auth.rustybret.com/v1/index --package-id opencode-desktop --json 2>/dev/null || true)
    if [ -n "$ALLOC_JSON" ]; then
      SEQUENCE=$(printf '%s' "$ALLOC_JSON" | jq -r '.sequence // empty')
    fi
  fi
fi

if [ -z "$SEQUENCE" ]; then
  HIGHEST=0
  if [ -d "${REPO_ROOT}/dist/${VERSION}" ]; then
    for d in "${REPO_ROOT}/dist/${VERSION}"/*; do
      [ -d "$d" ] || continue
      base="$(basename "$d")"
      case "$base" in
        *[!0-9]*) continue ;;
        *) [ "$base" -gt "$HIGHEST" ] && HIGHEST="$base" ;;
      esac
    done
  fi
  if [ "$HIGHEST" -gt 0 ]; then
    SEQUENCE=$((HIGHEST + 1))
  else
    SEQUENCE=1
  fi
  printf "pack-desktop-arcus: using sequence %s (local fallback)\n" "$SEQUENCE"
fi

OUTPUT_DIR="${REPO_ROOT}/dist/${VERSION}/${SEQUENCE}/opencode-desktop"

if [ "$NO_CLEAN" -eq 0 ] && [ -d "$OUTPUT_DIR" ]; then
  printf "pack-desktop-arcus: cleaning stale output directory: %s\n" "$OUTPUT_DIR"
  rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# Build step if requested
if [ "$SKIP_BUILD" -eq 0 ]; then
  printf "pack-desktop-arcus: building OpenCode Desktop application...\n"
  bun run --cwd "$DESKTOP_DIR" build
fi

# Detect host target for desktop package
ARCH=$(uname -m)
case "$ARCH" in
  arm64|aarch64) HOST_TARGET="darwin-arm64" ;;
  x86_64) HOST_TARGET="darwin-x64" ;;
  *) HOST_TARGET="darwin-arm64" ;;
esac

# Stage application payload
PAYLOAD_DIR="${OUTPUT_DIR}/payload"
rm -rf "$PAYLOAD_DIR"
mkdir -p "$PAYLOAD_DIR"

if [ -d "${DESKTOP_DIR}/dist" ]; then
  cp -R "${DESKTOP_DIR}/dist"/* "$PAYLOAD_DIR/" 2>/dev/null || true
fi
if [ -d "${DESKTOP_DIR}/out" ]; then
  mkdir -p "${PAYLOAD_DIR}/out"
  cp -R "${DESKTOP_DIR}/out"/* "${PAYLOAD_DIR}/out/" 2>/dev/null || true
fi
cp "${DESKTOP_DIR}/package.json" "${PAYLOAD_DIR}/package.json"

printf "pack-desktop-arcus: packaging opencode-desktop %s (seq: %s) -> %s\n" "$VERSION" "$SEQUENCE" "$OUTPUT_DIR"

sh "$TOOLCHAIN_PACK" \
  --package-id opencode-desktop \
  --software-type cli \
  --binary-name opencode-desktop \
  --action-executable opencode-desktop \
  --version "$VERSION" \
  --release-id "opencode-desktop-${VERSION}-${SEQUENCE}" \
  --sequence "$SEQUENCE" \
  --output "$OUTPUT_DIR" \
  --channel stable \
  --schema-version 3 \
  --offline \
  --target "$HOST_TARGET" \
  --input "$PAYLOAD_DIR"

rm -rf "$PAYLOAD_DIR"

# Populate flat submission bundle artifacts
ENVELOPE="${OUTPUT_DIR}/releases/opencode-desktop-${VERSION}-${SEQUENCE}.json"
if [ -f "$ENVELOPE" ]; then
  cp "$ENVELOPE" "${OUTPUT_DIR}/release.json"
  POLICY_FILE="${OUTPUT_DIR}/releases/opencode-desktop-${VERSION}-${SEQUENCE}.index-policy.json"
  if [ -f "$POLICY_FILE" ]; then
    cp "$POLICY_FILE" "${OUTPUT_DIR}/release.index-policy.json"
  else
    jq -cn '{channel: "stable"}' > "${OUTPUT_DIR}/release.index-policy.json"
  fi

  if [ -f "$TOOLCHAIN_META" ]; then
    cp "$TOOLCHAIN_META" "${OUTPUT_DIR}/toolchain.json"
  fi

  sha256_fn() {
    if command -v sha256sum >/dev/null 2>&1; then
      sha256sum "$1" | awk '{print $1}'
    else
      shasum -a 256 "$1" | awk '{print $1}'
    fi
  }

  (
    cd "$OUTPUT_DIR"
    rm -f assets.sha256
    for f in *.tar.zst *.zip *.pwr; do
      [ -f "$f" ] || continue
      sha=$(sha256_fn "$f")
      printf '%s  %s\n' "$sha" "$f"
    done | LC_ALL=C sort -k2 > assets.sha256
  )

  TOOLCHAIN_VER="0.4.0"
  if [ -f "${OUTPUT_DIR}/toolchain.json" ]; then
    TOOLCHAIN_VER=$(jq -r '.toolchain_version // "0.4.0"' "${OUTPUT_DIR}/toolchain.json")
  fi
  PUB_KEY_ID=$(jq -r '.signatures[0].key_id // empty' "$ENVELOPE")
  CREATED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

  jq -n \
    --arg package_id "opencode-desktop" \
    --arg release_id "opencode-desktop-${VERSION}-${SEQUENCE}" \
    --arg version "$VERSION" \
    --argjson sequence "$SEQUENCE" \
    --arg sequence_source "explicit" \
    --argjson observed_max_sequence $((SEQUENCE - 1)) \
    --arg created_at "$CREATED_AT" \
    --arg toolchain_version "$TOOLCHAIN_VER" \
    --arg publisher_key_id "$PUB_KEY_ID" \
    '{
      schema_version: 1,
      package_id: $package_id,
      release_id: $release_id,
      version: $version,
      sequence: $sequence,
      sequence_source: $sequence_source,
      observed_max_sequence: $observed_max_sequence,
      created_at: $created_at,
      toolchain_version: $toolchain_version,
      publisher_key_id: $publisher_key_id
    }' > "${OUTPUT_DIR}/submission.json"
fi

printf "\n=====================================================================\n"
printf "pack-desktop-arcus: Desktop submission bundle ready at:\n"
printf "  %s\n" "$OUTPUT_DIR"
printf "=====================================================================\n"
