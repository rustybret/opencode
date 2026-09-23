#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# pack-arcus.sh — Package OpenCode Native CLI for Arcus v3 Distribution
#
# Emits a self-contained Arcus v3 submission bundle at:
#   dist/<version>/<sequence>/opencode/
#
# Target coverage: all five canonical platforms:
#   - darwin-arm64
#   - darwin-x64
#   - linux-arm64
#   - linux-x64
#   - windows-x64
# =============================================================================
set -eu

SCRIPT_DIR="$(CDPATH="" cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH="" cd -- "${SCRIPT_DIR}/.." && pwd)"

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
  --version X.Y.Z    Release version (default: from packages/opencode/package.json)
  --sequence N       Monotonic sequence (default: gateway-allocated or 1)
  --skip-build       Skip binary build gate if binaries exist
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
        printf 'pack-arcus: error: unknown option: %s\n' "$1" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  VERSION=$(node -e 'console.log(require("./packages/opencode/package.json").version)')
fi
VERSION="${VERSION#v}"

# Bootstrap toolchain if not present
if [ ! -d "${REPO_ROOT}/packages/arcus/toolchain" ]; then
  printf "pack-arcus: bootstrapping Arcus toolchain...\n"
  sh "${REPO_ROOT}/packages/arcus/bootstrap.sh"
fi

TOOLCHAIN_PACK="${REPO_ROOT}/packages/arcus/toolchain/scripts/pack-arcus.sh"
TOOLCHAIN_VALIDATE="${REPO_ROOT}/packages/arcus/toolchain/scripts/validate-arcus.sh"
TOOLCHAIN_META="${REPO_ROOT}/packages/arcus/toolchain/scripts/arcus-toolchain.json"

[ -f "$TOOLCHAIN_PACK" ] || { printf "pack-arcus: error: toolchain script not found: %s\n" "$TOOLCHAIN_PACK" >&2; exit 1; }

# Sequence allocation
if [ -z "$SEQUENCE" ]; then
  if [ "$OFFLINE" -eq 0 ] && command -v arcus >/dev/null 2>&1; then
    printf "pack-arcus: allocating sequence from gateway for opencode...\n"
    ALLOC_JSON=$(arcus manifest allocate-sequence --gateway https://arcus-auth.rustybret.com/v1/index --package-id opencode --json 2>/dev/null || true)
    if [ -n "$ALLOC_JSON" ]; then
      SEQUENCE=$(printf '%s' "$ALLOC_JSON" | jq -r '.sequence // empty')
    fi
  fi
fi

if [ -z "$SEQUENCE" ]; then
  # Fallback: scan local dist/ or default to 21 (current active fork sequence)
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
    SEQUENCE=21
  fi
  printf "pack-arcus: using sequence %s (local fallback)\n" "$SEQUENCE"
fi

OUTPUT_DIR="${REPO_ROOT}/dist/${VERSION}/${SEQUENCE}/opencode"

if [ "$NO_CLEAN" -eq 0 ] && [ -d "$OUTPUT_DIR" ]; then
  printf "pack-arcus: cleaning stale output directory: %s\n" "$OUTPUT_DIR"
  rm -rf "$OUTPUT_DIR"
fi
mkdir -p "$OUTPUT_DIR"

# Build gate: ensure 5 canonical platform binaries exist
TARGETS="darwin-arm64 darwin-x64 linux-arm64 linux-x64 windows-x64"
MISSING_BINARIES=0
for t in $TARGETS; do
  bin_name="opencode"
  [ "$t" = "windows-x64" ] && bin_name="opencode.exe"
  if [ ! -f "${REPO_ROOT}/packages/opencode/dist/opencode-${t}/bin/${bin_name}" ]; then
    MISSING_BINARIES=1
    break
  fi
done

if [ "$MISSING_BINARIES" -eq 1 ]; then
  if [ "$SKIP_BUILD" -eq 1 ]; then
    printf "pack-arcus: error: missing native binaries under packages/opencode/dist/ and --skip-build was specified\n" >&2
    exit 1
  fi
  printf "pack-arcus: compiling multi-platform native binaries...\n"
  bun run --cwd "${REPO_ROOT}/packages/opencode" script/build.ts
fi

printf "pack-arcus: packaging opencode %s (seq: %s) -> %s\n" "$VERSION" "$SEQUENCE" "$OUTPUT_DIR"

sh "$TOOLCHAIN_PACK" \
  --package-id opencode \
  --software-type cli \
  --binary-name opencode \
  --action-executable bin/opencode \
  --version "$VERSION" \
  --release-id "opencode-${VERSION}-${SEQUENCE}" \
  --sequence "$SEQUENCE" \
  --output "$OUTPUT_DIR" \
  --channel stable \
  --schema-version 3 \
  --offline \
  --target-input darwin-arm64="${REPO_ROOT}/packages/opencode/dist/opencode-darwin-arm64" \
  --target-input darwin-x64="${REPO_ROOT}/packages/opencode/dist/opencode-darwin-x64" \
  --target-input linux-arm64="${REPO_ROOT}/packages/opencode/dist/opencode-linux-arm64" \
  --target-input linux-x64="${REPO_ROOT}/packages/opencode/dist/opencode-linux-x64" \
  --target-input windows-x64="${REPO_ROOT}/packages/opencode/dist/opencode-windows-x64"

# Populate flat submission bundle artifacts in OUTPUT_DIR
ENVELOPE="${OUTPUT_DIR}/releases/opencode-${VERSION}-${SEQUENCE}.json"
[ -f "$ENVELOPE" ] || { printf "pack-arcus: error: envelope missing: %s\n" "$ENVELOPE" >&2; exit 1; }

cp "$ENVELOPE" "${OUTPUT_DIR}/release.json"

POLICY_FILE="${OUTPUT_DIR}/releases/opencode-${VERSION}-${SEQUENCE}.index-policy.json"
if [ -f "$POLICY_FILE" ]; then
  cp "$POLICY_FILE" "${OUTPUT_DIR}/release.index-policy.json"
else
  jq -cn '{channel: "stable"}' > "${OUTPUT_DIR}/release.index-policy.json"
fi

if [ -f "$TOOLCHAIN_META" ]; then
  cp "$TOOLCHAIN_META" "${OUTPUT_DIR}/toolchain.json"
fi

# Build assets.sha256 ledger
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

# Build submission.json
TOOLCHAIN_VER="0.4.0"
if [ -f "${OUTPUT_DIR}/toolchain.json" ]; then
  TOOLCHAIN_VER=$(jq -r '.toolchain_version // "0.4.0"' "${OUTPUT_DIR}/toolchain.json")
fi
PUB_KEY_ID=$(jq -r '.signatures[0].key_id // empty' "$ENVELOPE")
CREATED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

jq -n \
  --arg package_id "opencode" \
  --arg release_id "opencode-${VERSION}-${SEQUENCE}" \
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

printf "\n=====================================================================\n"
printf "pack-arcus: Submission bundle ready at:\n"
printf "  %s\n" "$OUTPUT_DIR"
printf "\nTo submit to Arcus Gateway:\n"
printf "  arcus publish submit --bundle \"%s\" --gateway https://arcus-auth.rustybret.com\n" "$OUTPUT_DIR"
printf "=====================================================================\n"
