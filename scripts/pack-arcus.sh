#!/bin/sh
# =============================================================================
# pack-arcus.sh - Arcus v2 packaging for opencode (multi-arch standalone service)
#
#   software type : service
#   package_id    : opencode
#   source_id     : arcus
#
# Stages payload trees for all five canonical Arcus targets:
#   darwin-arm64  darwin-x64  linux-arm64  linux-x64  windows-x64
#
# Runs `arcus pack` to emit a signed v2 release envelope at:
#   dist-arcus/releases/<release_id>.json
#
# Also stages a dual-window v1 manifest at:
#   dist-arcus/arcus-manifest.json
#
# The publisher sequence is an INPUT, never inferred: v2 clients reject a
# non-monotonic sequence, so the caller owns allocation.
#
# Signing key material is NEVER read from argv. Pass a key file path, stdin, or
# an environment variable NAME.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/.." && pwd -P)
OPENCODE_DIST="${REPO_ROOT}/packages/opencode/dist"
OPENCODE_PKG_JSON="${REPO_ROOT}/packages/opencode/package.json"

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME='opencode'
PACKAGE_ID='opencode'
SOURCE_ID='arcus'
CHANNEL='stable'
SOFTWARE_TYPE='service'
GITHUB_REPO='rustybret/opencode'
ARCHIVE_FORMAT='tar.zst'
BINARY_NAME='opencode'
SERVICE_ID='opencode'

CANONICAL_TARGETS='darwin-arm64 darwin-x64 linux-arm64 linux-x64 windows-x64'

OUTPUT_DIR="${REPO_ROOT}/dist-arcus"
PAYLOAD_ROOT=''
VERSION=''
RELEASE_ID=''
SEQUENCE=${ARCUS_SEQUENCE:-}
KEY_FILE_OPT=''
KEY_ENV_OPT=''
SKIP_BUILD=0
SKIP_VALIDATE=0

die() {
  printf 'pack-arcus: %s\n' "$*" >&2
  exit 1
}

warn() {
  printf 'pack-arcus: warning: %s\n' "$*" >&2
}

usage() {
  cat <<'USAGE'
Usage: sh scripts/pack-arcus.sh --sequence N [options]

  --sequence N        Publisher-allocated monotonic sequence (>=1). Required.
                      May also be supplied as ARCUS_SEQUENCE.
  --version X.Y.Z     Release version (default: packages/opencode/package.json).
  --release-id ID     Release identifier (default: <version>-ucs-1).
  --channel NAME      Distribution channel (default: stable).
  --payload DIR       Use a pre-staged payload root holding <target-id>/ subdirs.
  --output DIR        Output directory (default: dist-arcus).
  --format FMT        Archive format: tar.zst or zip (default: tar.zst).
  --key-file PATH     Ed25519 private key file. Use '-' to read stdin.
  --key-env NAME      Name of an environment variable holding the key.
  --skip-build        Do not run binary build step; use existing dist/.
  --skip-validate     Do not run validate-arcus.sh on the emitted envelope.
  -h, --help          Show this help.

Key material is never accepted as a command-line VALUE. Supply --key-file,
--key-file - (stdin), --key-env NAME, ARCUS_SIGNING_KEY_FILE, or ARCUS_SIGNING_KEY.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --sequence) need_value "$#" "$1"; SEQUENCE=$2; shift 2 ;;
    --sequence=*) SEQUENCE=${1#*=}; shift ;;
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --channel) need_value "$#" "$1"; CHANNEL=$2; shift 2 ;;
    --channel=*) CHANNEL=${1#*=}; shift ;;
    --payload) need_value "$#" "$1"; PAYLOAD_ROOT=$2; shift 2 ;;
    --payload=*) PAYLOAD_ROOT=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --format) need_value "$#" "$1"; ARCHIVE_FORMAT=$2; shift 2 ;;
    --format=*) ARCHIVE_FORMAT=${1#*=}; shift ;;
    --key-file) need_value "$#" "$1"; KEY_FILE_OPT=$2; shift 2 ;;
    --key-file=*) KEY_FILE_OPT=${1#*=}; shift ;;
    --key-env) need_value "$#" "$1"; KEY_ENV_OPT=$2; shift 2 ;;
    --key-env=*) KEY_ENV_OPT=${1#*=}; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --skip-validate) SKIP_VALIDATE=1; shift ;;
    --key|--key=*|--signing-key|--signing-key=*|--private-key|--private-key=*)
      die "refusing ${1%%=*}: key material must never appear in argv; use --key-file PATH, --key-file - (stdin), or --key-env NAME" ;;
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
  die "arcus CLI not found (set ARCUS_BIN); v2 packaging is fail-closed"

[ -n "$SEQUENCE" ] ||
  die "--sequence (or ARCUS_SEQUENCE) is required: the publisher allocates the monotonic v2 sequence"
case "$SEQUENCE" in
  ''|*[!0-9]*) die "--sequence must be a positive integer, got '$SEQUENCE'" ;;
esac
[ "$SEQUENCE" -ge 1 ] || die "--sequence must be >= 1, got '$SEQUENCE'"

if [ -z "$VERSION" ]; then
  if [ -f "$OPENCODE_PKG_JSON" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$OPENCODE_PKG_JSON" | head -n 1)
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1)
  fi
fi
[ -n "$VERSION" ] || die "--version is required (no package.json found)"
VERSION=${VERSION#v}

if [ -z "$RELEASE_ID" ]; then
  RELEASE_ID="${VERSION}-ucs-1"
fi
[ -n "$RELEASE_ID" ] || die "could not derive a release_id"

target_dist_bin() {
  case "$1" in
    darwin-arm64) printf '%s' "${OPENCODE_DIST}/opencode-darwin-arm64/bin/opencode" ;;
    darwin-x64)   printf '%s' "${OPENCODE_DIST}/opencode-darwin-x64/bin/opencode" ;;
    linux-arm64)  printf '%s' "${OPENCODE_DIST}/opencode-linux-arm64/bin/opencode" ;;
    linux-x64)    printf '%s' "${OPENCODE_DIST}/opencode-linux-x64/bin/opencode" ;;
    windows-x64)  printf '%s' "${OPENCODE_DIST}/opencode-windows-x64/bin/opencode.exe" ;;
    *) die "unsupported canonical target '$1'" ;;
  esac
}

target_binary_filename() {
  case "$1" in
    windows-x64) printf 'opencode.exe' ;;
    *) printf 'opencode' ;;
  esac
}

if [ "$SKIP_BUILD" -eq 0 ]; then
  NEED_BUILD=0
  for TID in $CANONICAL_TARGETS; do
    BIN_PATH=$(target_dist_bin "$TID")
    if [ ! -f "$BIN_PATH" ]; then
      NEED_BUILD=1
      break
    fi
  done
  if [ "$NEED_BUILD" -eq 1 ]; then
    printf 'pack-arcus: building multi-platform opencode binaries via build.ts...\n'
    ( cd "$REPO_ROOT" && bun run ./packages/opencode/script/build.ts ) ||
      die "build.ts failed"
  fi
fi

mkdir -p "$OUTPUT_DIR"

STAGED=0
if [ -z "$PAYLOAD_ROOT" ]; then
  PAYLOAD_ROOT="${OUTPUT_DIR}/payload"
  rm -rf "$PAYLOAD_ROOT"
  mkdir -p "$PAYLOAD_ROOT"
  STAGED=1
fi
[ -d "$PAYLOAD_ROOT" ] || die "payload root ${PAYLOAD_ROOT} does not exist"

set --
for TID in $CANONICAL_TARGETS; do
  TARGET_PAYLOAD="${PAYLOAD_ROOT}/${TID}"
  if [ "$STAGED" -eq 1 ]; then
    mkdir -p "$TARGET_PAYLOAD"
    SRC_BIN=$(target_dist_bin "$TID")
    [ -f "$SRC_BIN" ] || die "target ${TID}: required binary not found at ${SRC_BIN}"
    DST_NAME=$(target_binary_filename "$TID")
    cp "$SRC_BIN" "${TARGET_PAYLOAD}/${DST_NAME}"
    chmod 0755 "${TARGET_PAYLOAD}/${DST_NAME}"
  fi
  [ -d "$TARGET_PAYLOAD" ] || die "target payload ${TARGET_PAYLOAD} missing"
  set -- "$@" --target-input "${TID}=${TARGET_PAYLOAD}"
done

set -- "$@" --managed "opencode"

run_pack() {
  if [ -n "$KEY_FILE_OPT" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "$KEY_FILE_OPT"
  elif [ -n "$KEY_ENV_OPT" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-env "$KEY_ENV_OPT"
  elif [ -n "${ARCUS_SIGNING_KEY_FILE:-}" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "$ARCUS_SIGNING_KEY_FILE"
  elif [ -n "${ARCUS_SIGNING_KEY:-}" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-env ARCUS_SIGNING_KEY
  elif [ -f "${HOME}/.config/arcus/signing.key" ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file "${HOME}/.config/arcus/signing.key"
  elif [ ! -t 0 ]; then
    "$ARCUS_BIN" pack --json "$@" --key-file -
  else
    die "no signing key: pass --key-file PATH, --key-file - (stdin), --key-env NAME, or set ARCUS_SIGNING_KEY_FILE / ARCUS_SIGNING_KEY"
  fi
}

REPORT="${OUTPUT_DIR}/pack-report.json"

printf 'pack-arcus: packing %s %s (release %s, sequence %s, channel %s)\n' \
  "$PACKAGE_ID" "$VERSION" "$RELEASE_ID" "$SEQUENCE" "$CHANNEL"

run_pack \
  "$@" \
  --output "$OUTPUT_DIR" \
  --source-id "$SOURCE_ID" \
  --package-id "$PACKAGE_ID" \
  --release-id "$RELEASE_ID" \
  --version "$VERSION" \
  --sequence "$SEQUENCE" \
  --channel "$CHANNEL" \
  --format "$ARCHIVE_FORMAT" \
  --strategy "$SOFTWARE_TYPE" \
  --action-id daemon \
  --action-type service \
  --action-executable "$BINARY_NAME" > "$REPORT" ||
  die "arcus pack failed (report: ${REPORT})"

json_field() {
  sed -n 's/.*"'"$1"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$REPORT" | head -n 1
}

ARCHIVE_SHA=$(json_field archive_sha256)
CONTENT_SHA=$(json_field content_source_sha256)
TREE_SIG_SHA=$(json_field tree_signature_sha256)
ENVELOPE_PATH=$(json_field envelope_path)

[ -n "$ARCHIVE_SHA" ] || die "pack report carried no archive_sha256"
[ -n "$CONTENT_SHA" ] || die "pack report carried no content_source_sha256"
[ -n "$TREE_SIG_SHA" ] || die "pack report carried no tree_signature_sha256"
[ -n "$ENVELOPE_PATH" ] || die "pack report carried no envelope_path"

if [ "$ARCHIVE_SHA" = "$CONTENT_SHA" ] ||
   [ "$ARCHIVE_SHA" = "$TREE_SIG_SHA" ] ||
   [ "$CONTENT_SHA" = "$TREE_SIG_SHA" ]; then
  die "digest collision: artifact, target_content_source and tree_signature must be distinct objects"
fi

[ -f "$ENVELOPE_PATH" ] || die "pack reported envelope ${ENVELOPE_PATH} not found on disk"
for TID in $CANONICAL_TARGETS; do
  grep -q "\"${TID}\": {" "$ENVELOPE_PATH" ||
    die "emitted envelope is missing canonical target ${TID}"
done
if grep -q '"win32-x64"' "$ENVELOPE_PATH"; then
  die "emitted envelope carries legacy target key win32-x64"
fi

# Stage v1 backward-compatible manifest for dual-window publication
TAG="v${VERSION}+ucs.1"
V1_MANIFEST="${OUTPUT_DIR}/arcus-manifest.json"
cat > "$V1_MANIFEST" <<EOF
{
  "\$schema": "https://raw.githubusercontent.com/rustybret/arcus/main/manifests/schema.json",
  "name": "opencode",
  "version": "${VERSION}+ucs.1",
  "description": "AI-powered development tool (UCS native standalone binary)",
  "harness": "opencode",
  "daemon": {
    "name": "opencode",
    "service_id": "opencode-server",
    "protocol_version": 1,
    "target_matrix": {
      "darwin-arm64": {
        "target_triple": "aarch64-apple-darwin",
        "binary_name": "opencode",
        "asset": {
          "filename": "opencode-darwin-arm64.tar.gz",
          "url": "https://github.com/${GITHUB_REPO}/releases/download/${TAG}/opencode-darwin-arm64.tar.gz",
          "sha256": "${ARCHIVE_SHA}"
        }
      },
      "darwin-x64": {
        "target_triple": "x86_64-apple-darwin",
        "binary_name": "opencode",
        "asset": {
          "filename": "opencode-darwin-x64.tar.gz",
          "url": "https://github.com/${GITHUB_REPO}/releases/download/${TAG}/opencode-darwin-x64.tar.gz",
          "sha256": "${ARCHIVE_SHA}"
        }
      },
      "linux-arm64": {
        "target_triple": "aarch64-unknown-linux-gnu",
        "binary_name": "opencode",
        "asset": {
          "filename": "opencode-linux-arm64.tar.gz",
          "url": "https://github.com/${GITHUB_REPO}/releases/download/${TAG}/opencode-linux-arm64.tar.gz",
          "sha256": "${ARCHIVE_SHA}"
        }
      },
      "linux-x64": {
        "target_triple": "x86_64-unknown-linux-gnu",
        "binary_name": "opencode",
        "asset": {
          "filename": "opencode-linux-x64.tar.gz",
          "url": "https://github.com/${GITHUB_REPO}/releases/download/${TAG}/opencode-linux-x64.tar.gz",
          "sha256": "${ARCHIVE_SHA}"
        }
      },
      "win32-x64": {
        "target_triple": "x86_64-pc-windows-msvc",
        "binary_name": "opencode.exe",
        "asset": {
          "filename": "opencode-win32-x64.zip",
          "url": "https://github.com/${GITHUB_REPO}/releases/download/${TAG}/opencode-win32-x64.zip",
          "sha256": "${ARCHIVE_SHA}"
        }
      }
    }
  }
}
EOF

if [ "$SKIP_VALIDATE" -eq 0 ] && [ -f "${SCRIPT_DIR}/validate-arcus.sh" ]; then
  sh "${SCRIPT_DIR}/validate-arcus.sh" "$ENVELOPE_PATH" ||
    die "emitted envelope failed strict validation: ${ENVELOPE_PATH}"
fi

printf 'pack-arcus: envelope   %s\n' "$ENVELOPE_PATH"
printf 'pack-arcus: archive    %s\n' "$ARCHIVE_SHA"
printf 'pack-arcus: content    %s\n' "$CONTENT_SHA"
printf 'pack-arcus: treesig    %s\n' "$TREE_SIG_SHA"
printf 'pack-arcus: v1 manifest%s\n' "$V1_MANIFEST"
printf 'pack-arcus: report     %s\n' "$REPORT"
