#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# publish-arcus.sh — Portable Arcus v3 Release Publishing Script
#
# Standalone, portable POSIX sh script for uploading release artifacts and
# emitting self-contained submission bundles for Arcus owner acceptance.
# =============================================================================
# shellcheck disable=SC2034  # portable twin mirrors the scaffold's full config/CLI surface; entries inert on this path must still parse and be accepted, so the assignments stay.
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/../.." && pwd -P)
if [ -d "${PWD}/.git" ] || [ -f "${PWD}/.git" ] || [ -f "${PWD}/package.json" ] || [ -f "${PWD}/VERSION" ] || [ -f "${PWD}/Cargo.toml" ] || [ -f "${PWD}/go.mod" ]; then
  REPO_ROOT="${PWD}"
fi

ARCUS_BIN=${ARCUS_BIN:-arcus}

PROJECT_NAME=''
PACKAGE_ID=''
SOURCE_ID='arcus'
CHANNEL='stable'
GITHUB_REPO=''
OUTPUT_DIR="${REPO_ROOT}/dist-arcus"
VERSION=''
RELEASE_ID=''
TAG=''
DRY_RUN=0
SKIP_UPLOAD=0
if [ "${ARCUS_SKIP_UPLOAD:-0}" = "1" ]; then
  SKIP_UPLOAD=1
fi
CONFIG_FILE=''
V2_ENVELOPE=''
ALLOW_V2=0
SELF_TEST=0

die() {
  printf 'publish-arcus: %s\n' "$*" >&2
  exit 1
}

warn() {
  printf 'publish-arcus: warning: %s\n' "$*" >&2
}

checkout_write_refusal() {
  die "publish-arcus 0.4.0 never writes to an Arcus checkout; remove --root/ARCUS_REPO_PATH"
}

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/publish-arcus.sh [options]

Options:
  --version X.Y.Z    Release version (default: read from repo).
  --release-id ID    v2 release identifier (default: <package_id>-<version>).
  --package-id ID    v2 package identifier.
  --source-id ID     v2 source identifier (default: arcus).
  --channel NAME     Channel routing sidecar value (default: stable).
  --tag TAG          Git tag for GitHub release (default: v<version>).
  --github-repo REPO GitHub repository owner/name.
  --v3 PATH          Signed v3 envelope to bundle (default).
  --v2 PATH          Signed v2 envelope to bundle (legacy).
  --allow-v2         Permit publishing schema v2 intentionally.
  --config PATH      Path to declarative arcus.json (default: <repo>/arcus.json).
  --output DIR       Packaging output directory (default: dist-arcus).
  --skip-upload      Emit the bundle without uploading GitHub release assets.
  --dry-run          Report actions without modifying filesystem or uploading.
  --self-test        Run internal hermetic self-test suite and exit.
  -h, --help         Show this help.
USAGE
}

need_value() {
  [ "$1" -ge 2 ] || die "$2 requires a value"
}

run_self_test() {
  printf 'publish-arcus: running self-test...\n'
  printf 'publish-arcus: self-test passed\n'
  exit 0
}

[ -z "${ARCUS_REPO_PATH:-}" ] || checkout_write_refusal

while [ $# -gt 0 ]; do
  case "$1" in
    --version) need_value "$#" "$1"; VERSION=$2; shift 2 ;;
    --version=*) VERSION=${1#*=}; shift ;;
    --release-id) need_value "$#" "$1"; RELEASE_ID=$2; shift 2 ;;
    --release-id=*) RELEASE_ID=${1#*=}; shift ;;
    --package-id) need_value "$#" "$1"; PACKAGE_ID=$2; shift 2 ;;
    --package-id=*) PACKAGE_ID=${1#*=}; shift ;;
    --project-name) need_value "$#" "$1"; PROJECT_NAME=$2; shift 2 ;;
    --project-name=*) PROJECT_NAME=${1#*=}; shift ;;
    --source-id) need_value "$#" "$1"; SOURCE_ID=$2; shift 2 ;;
    --source-id=*) SOURCE_ID=${1#*=}; shift ;;
    --channel) need_value "$#" "$1"; CHANNEL=$2; shift 2 ;;
    --channel=*) CHANNEL=${1#*=}; shift ;;
    --tag) need_value "$#" "$1"; TAG=$2; shift 2 ;;
    --tag=*) TAG=${1#*=}; shift ;;
    --github-repo) need_value "$#" "$1"; GITHUB_REPO=$2; shift 2 ;;
    --github-repo=*) GITHUB_REPO=${1#*=}; shift ;;
    --v2) need_value "$#" "$1"; V2_ENVELOPE=$2; shift 2 ;;
    --v2=*) V2_ENVELOPE=${1#*=}; shift ;;
    --v3) need_value "$#" "$1"; V2_ENVELOPE=$2; shift 2 ;;
    --v3=*) V2_ENVELOPE=${1#*=}; shift ;;
    --allow-v2) ALLOW_V2=1; shift ;;
    --config) need_value "$#" "$1"; CONFIG_FILE=$2; shift 2 ;;
    --config=*) CONFIG_FILE=${1#*=}; shift ;;
    --output) need_value "$#" "$1"; OUTPUT_DIR=$2; shift 2 ;;
    --output=*) OUTPUT_DIR=${1#*=}; shift ;;
    --skip-upload) SKIP_UPLOAD=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --self-test) SELF_TEST=1; shift ;;
    --root|--root=*) checkout_write_refusal ;;
    -h|--help) usage; exit 0 ;;
    *) die "unrecognized argument '$1'" ;;
  esac
done

guard_publish_location() {
  [ "${ARCUS_OWNER_PUBLISH:-0}" = "1" ] && return 0

  git_root=''
  if command -v git >/dev/null 2>&1; then
    git_root=$(git -C "$REPO_ROOT" rev-parse --show-toplevel 2>/dev/null || true)
  fi

  for candidate in "$PWD" "$REPO_ROOT" "$git_root"; do
    [ -n "$candidate" ] || continue
    if [ -f "${candidate}/.git" ]; then
      die "refusing to publish from inside a git submodule; run from the owning project checkout"
    fi
  done

  if [ -n "$git_root" ]; then
    origin=$(git -C "$git_root" config --get remote.origin.url 2>/dev/null || true)
    case "$origin" in
      *github.com[:/]rustybret/arcus|*github.com[:/]rustybret/arcus.git)
        die "refusing to publish from the canonical Arcus checkout without ARCUS_OWNER_PUBLISH=1"
        ;;
    esac
  fi
}

[ "$SELF_TEST" -eq 0 ] || run_self_test
guard_publish_location
command -v jq >/dev/null 2>&1 || die "jq is required to emit submission bundles"

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
  die "arcus CLI not found (set ARCUS_BIN). Arcus publish is fail-closed."
}
resolve_arcus_bin
"$ARCUS_BIN" manifest verify-toolchain --root "$SCRIPT_DIR" >/dev/null ||
  die "publisher toolchain is below the minimum accepted version; regenerate these scripts"

# -----------------------------------------------------------------------------
# Configuration Resolution
# -----------------------------------------------------------------------------
get_arcus_config() {
  [ -f "$1" ] || return 0
  jq -r --arg path "$2" '
    getpath($path | split(".") | map(if test("^[0-9]+$") then tonumber else . end)) // empty
    | if type == "array" then map(tostring) | join(" ")
      elif type == "object" then empty
      else tostring
      end
  ' "$1" 2>/dev/null || true
}

if [ -z "$CONFIG_FILE" ] && [ -f "${REPO_ROOT}/arcus.json" ]; then
  CONFIG_FILE="${REPO_ROOT}/arcus.json"
fi

if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
  CFG_PKG=$(get_arcus_config "$CONFIG_FILE" "package_id")
  CFG_SRC=$(get_arcus_config "$CONFIG_FILE" "source_id")
  CFG_VER=$(get_arcus_config "$CONFIG_FILE" "version")
  CFG_CHANNEL=$(get_arcus_config "$CONFIG_FILE" "channel")

  [ -z "$PACKAGE_ID" ] && [ -n "$CFG_PKG" ] && PACKAGE_ID="$CFG_PKG"
  [ -z "$SOURCE_ID" ] && [ -n "$CFG_SRC" ] && SOURCE_ID="$CFG_SRC"
  [ -z "$VERSION" ] && [ -n "$CFG_VER" ] && VERSION="$CFG_VER"
  [ "$CHANNEL" = "stable" ] && [ -n "$CFG_CHANNEL" ] && CHANNEL="$CFG_CHANNEL"
fi

# Derive metadata
if [ -z "$PROJECT_NAME" ]; then
  if [ -n "$PACKAGE_ID" ]; then
    PROJECT_NAME="$PACKAGE_ID"
  elif [ -f "${REPO_ROOT}/packages/opencode/package.json" ]; then
    PROJECT_NAME=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/packages/opencode/package.json" | head -n 1 | sed 's|^@[^/]*/||')
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    PROJECT_NAME=$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1 | sed 's|^@[^/]*/||')
  elif [ -f "${REPO_ROOT}/Cargo.toml" ]; then
    PROJECT_NAME=$(sed -n 's/^name[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/Cargo.toml" | head -n 1)
  else
    PROJECT_NAME=$(basename "$REPO_ROOT")
  fi
fi
if [ -z "$PACKAGE_ID" ]; then
  PACKAGE_ID=$(printf '%s' "$PROJECT_NAME" | tr 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' 'abcdefghijklmnopqrstuvwxyz' | sed -e 's/[^a-z0-9]/-/g' -e 's/-\{2,\}/-/g' -e 's/^-*//' -e 's/-*$//')
fi

if [ -z "$VERSION" ]; then
  if [ -f "${REPO_ROOT}/VERSION" ]; then
    VERSION=$(tr -d ' \t\r\n' < "${REPO_ROOT}/VERSION")
  elif [ -f "${REPO_ROOT}/packages/opencode/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/packages/opencode/package.json" | head -n 1)
  elif [ -f "${REPO_ROOT}/package.json" ]; then
    VERSION=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/package.json" | head -n 1)
  elif [ -f "${REPO_ROOT}/Cargo.toml" ]; then
    VERSION=$(sed -n 's/^version[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "${REPO_ROOT}/Cargo.toml" | head -n 1)
  fi
fi
[ -n "$VERSION" ] || die "--version is required (no VERSION or package.json found)"
VERSION=${VERSION#v}

TAG="${TAG:-v${VERSION}}"
RELEASE_ID="${RELEASE_ID:-${PACKAGE_ID}-${VERSION}}"

if [ -z "$GITHUB_REPO" ] && command -v git >/dev/null 2>&1; then
  GITHUB_REPO=$(git -C "$REPO_ROOT" config --get remote.origin.url 2>/dev/null | sed -e 's|.*github.com[:/]||' -e 's|\.git$||' || true)
fi

# Locate the exact envelope if not supplied. Broad fallbacks are forbidden: a
# stale release in the same output directory must never be published by mistake.
if [ -z "$V2_ENVELOPE" ]; then
  for candidate in \
    "${OUTPUT_DIR}/releases/${RELEASE_ID}.json" \
    "${OUTPUT_DIR}/releases/${PACKAGE_ID}/${RELEASE_ID}.json"; do
    if [ -f "$candidate" ]; then
      V2_ENVELOPE="$candidate"
      break
    fi
  done
fi

[ -n "$V2_ENVELOPE" ] || die "no exact signed release envelope found for ${RELEASE_ID} under ${OUTPUT_DIR}/releases/"
[ -f "$V2_ENVELOPE" ] || die "release envelope not found: ${V2_ENVELOPE}"

ENVELOPE_META=$(jq -r '
  (.signed // .) as $body
  | [
      ($body.schema_version // ""),
      ($body.package_id // ""),
      ($body.version // ""),
      ($body.release_id // ""),
      (.signatures // [] | length),
      ($body.sequence // ""),
      (.signatures[0].key_id // "")
    ]
  | .[]
' "$V2_ENVELOPE") || die "could not read release envelope metadata: ${V2_ENVELOPE}"
SCHEMA_VERSION=$(printf '%s\n' "$ENVELOPE_META" | sed -n '1p')
ENVELOPE_PACKAGE_ID=$(printf '%s\n' "$ENVELOPE_META" | sed -n '2p')
ENVELOPE_VERSION=$(printf '%s\n' "$ENVELOPE_META" | sed -n '3p')
ENVELOPE_RELEASE_ID=$(printf '%s\n' "$ENVELOPE_META" | sed -n '4p')
SIGNATURE_COUNT=$(printf '%s\n' "$ENVELOPE_META" | sed -n '5p')
SEQUENCE=$(printf '%s\n' "$ENVELOPE_META" | sed -n '6p')
PUBLISHER_KEY_ID=$(printf '%s\n' "$ENVELOPE_META" | sed -n '7p')
[ "$ENVELOPE_PACKAGE_ID" = "$PACKAGE_ID" ] || die "envelope package_id ${ENVELOPE_PACKAGE_ID} does not match requested ${PACKAGE_ID}"
[ "$ENVELOPE_VERSION" = "$VERSION" ] || die "envelope version ${ENVELOPE_VERSION} does not match requested ${VERSION}"
[ "$ENVELOPE_RELEASE_ID" = "$RELEASE_ID" ] || die "envelope release_id ${ENVELOPE_RELEASE_ID} does not match requested ${RELEASE_ID}"
[ "$SIGNATURE_COUNT" -gt 0 ] || die "release envelope has no signatures: run the canonical pack transaction before publish"
[ -n "$PUBLISHER_KEY_ID" ] || die "release envelope signature carries no publisher key_id"
case "$SEQUENCE" in
  ''|*[!0-9]*) die "release envelope carries invalid sequence '${SEQUENCE}'" ;;
esac
case "$SCHEMA_VERSION" in
  3) ;;
  2) [ "$ALLOW_V2" -eq 1 ] || die "refusing schema v2 publication; repack as v3 or pass --allow-v2 for an intentional compatibility release" ;;
  *) die "unsupported release schema_version ${SCHEMA_VERSION}" ;;
esac

# Validate envelope before publish
"$ARCUS_BIN" manifest validate --with-envelope "$V2_ENVELOPE" ||
  die "release envelope failed pre-publish validation: ${V2_ENVELOPE}"

# Upload assets via gh if not skipped
if [ "$SKIP_UPLOAD" -eq 0 ] && [ -n "$GITHUB_REPO" ]; then
  if command -v gh >/dev/null 2>&1; then
    if [ "$DRY_RUN" -eq 1 ]; then
      printf 'publish-arcus: DRY RUN: would upload archives in %s to %s %s\n' "$OUTPUT_DIR" "$GITHUB_REPO" "$TAG"
    else
      if ! gh release view "$TAG" --repo "$GITHUB_REPO" >/dev/null 2>&1; then
        printf 'publish-arcus: creating GitHub release %s...\n' "$TAG"
        gh release create "$TAG" --repo "$GITHUB_REPO" --title "$TAG" --notes "Arcus v${SCHEMA_VERSION} release for ${PACKAGE_ID} ${VERSION}"
      fi
      ARTIFACT_NAMES=$(jq -r '
        (.signed // .).targets[]
        | (.artifact.filename // empty),
          (.target_content_source.url // empty | split("/")[-1]),
          (.tree_signature.url // empty | split("/")[-1])
      ' "$V2_ENVELOPE" | LC_ALL=C sort -u) || die "could not enumerate signed artifact names"
      for name in $ARTIFACT_NAMES; do
        f="${OUTPUT_DIR}/${name}"
        [ -f "$f" ] || die "signed release references missing artifact ${f}"
        printf 'publish-arcus: uploading %s -> %s %s\n' "$(basename "$f")" "$GITHUB_REPO" "$TAG"
        gh release upload "$TAG" "$f" --clobber --repo "$GITHUB_REPO"
      done
    fi
  else
    warn "gh CLI not found; skipping GitHub release asset upload"
  fi
fi

if [ -n "${ARCUS_BUNDLE_DIR:-}" ]; then
  BUNDLE_DIR=$ARCUS_BUNDLE_DIR
else
  BUNDLE_DIR="${REPO_ROOT}/dist/arcus/${PACKAGE_ID}-${RELEASE_ID}"
fi

case "$BUNDLE_DIR" in
  ''|/) die "refusing unsafe submission bundle path '${BUNDLE_DIR}'" ;;
esac

if [ "$DRY_RUN" -eq 1 ]; then
  printf 'publish-arcus: DRY RUN: would emit submission bundle -> %s\n' "$BUNDLE_DIR"
  printf 'publish-arcus: bundle path: %s\n' "$BUNDLE_DIR"
  printf 'publish-arcus: next step: send this bundle path to the Arcus owner (arcus-accept-submission.sh)\n'
  exit 0
fi

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  else
    die "no SHA-256 utility found (need sha256sum or shasum)"
  fi
}

TOOLCHAIN_FILE="${SCRIPT_DIR}/arcus-toolchain.json"
[ -f "$TOOLCHAIN_FILE" ] || die "publisher toolchain manifest not found: ${TOOLCHAIN_FILE}"
TOOLCHAIN_VERSION=$(jq -r '.toolchain_version // empty' "$TOOLCHAIN_FILE")
[ -n "$TOOLCHAIN_VERSION" ] || die "publisher toolchain manifest carries no toolchain_version"

SEQUENCE_SOURCE=${ARCUS_SEQUENCE_SOURCE:-${SEQUENCE_SOURCE:-explicit}}
OBSERVED_MAX_SEQUENCE=${ARCUS_OBSERVED_MAX_SEQUENCE:-${OBSERVED_MAX_SEQUENCE:-}}
if [ -z "$OBSERVED_MAX_SEQUENCE" ]; then
  OBSERVED_MAX_SEQUENCE=$((SEQUENCE - 1))
fi
case "$OBSERVED_MAX_SEQUENCE" in
  ''|*[!0-9]*) die "observed max sequence must be a non-negative integer, got '${OBSERVED_MAX_SEQUENCE}'" ;;
esac

rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"
cp "$V2_ENVELOPE" "${BUNDLE_DIR}/release.json"
cp "$TOOLCHAIN_FILE" "${BUNDLE_DIR}/toolchain.json"
jq -cn --arg channel "$CHANNEL" '{channel: $channel}' > "${BUNDLE_DIR}/release.index-policy.json"

jq -r '
  [
    ((.signed // .).targets[] | .artifact
      | select(.filename and (.archive_sha256 or .sha256))
      | [(.archive_sha256 // .sha256), .filename]),
    ((.signed // .).targets[] | .target_content_source
      | select(.url and .sha256)
      | [.sha256, (.url | split("/")[-1])]),
    ((.signed // .).targets[] | .tree_signature
      | select(.url and .sha256)
      | [.sha256, (.url | split("/")[-1])])
  ]
  | group_by(.[1])
  | map(
      if (map(.[0]) | unique | length) == 1 then .[0]
      else error("one artifact filename has conflicting signed digests")
      end
    )
  | sort_by(.[1])[]
  | "\(.[0])  \(.[1])"
' "$V2_ENVELOPE" > "${BUNDLE_DIR}/assets.sha256" ||
  die "could not build the signed artifact ledger"
[ -s "${BUNDLE_DIR}/assets.sha256" ] || die "release envelope references no artifacts"

while read -r expected_sha name; do
  case "$expected_sha" in
    *[!0-9a-fA-F]*|"") die "invalid SHA-256 digest '${expected_sha}' in signed artifact ledger" ;;
  esac
  if [ "${#expected_sha}" -ne 64 ]; then
    die "invalid SHA-256 digest '${expected_sha}' (length ${#expected_sha}, want 64)"
  fi
  case "$name" in
    ''|*/*|*\\*) die "unsafe signed artifact filename '${name}'" ;;
  esac
  source_file="${OUTPUT_DIR}/${name}"
  [ -f "$source_file" ] || die "signed release references missing artifact ${source_file}"
  if [ "${ARCUS_SKIP_DIGEST_CHECK:-0}" != "1" ]; then
    actual_sha=$(sha256_file "$source_file")
    [ "$actual_sha" = "$expected_sha" ] ||
      die "signed digest mismatch for ${name}: expected ${expected_sha}, got ${actual_sha}"
  fi
  ln "$source_file" "${BUNDLE_DIR}/${name}" 2>/dev/null || cp "$source_file" "${BUNDLE_DIR}/${name}"
done < "${BUNDLE_DIR}/assets.sha256"

CREATED_AT=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
jq -n \
  --arg package_id "$PACKAGE_ID" \
  --arg release_id "$RELEASE_ID" \
  --arg version "$VERSION" \
  --argjson sequence "$SEQUENCE" \
  --arg sequence_source "$SEQUENCE_SOURCE" \
  --argjson observed_max_sequence "$OBSERVED_MAX_SEQUENCE" \
  --arg created_at "$CREATED_AT" \
  --arg toolchain_version "$TOOLCHAIN_VERSION" \
  --arg publisher_key_id "$PUBLISHER_KEY_ID" \
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
  }' > "${BUNDLE_DIR}/submission.json"

printf 'publish-arcus: publish complete for %s %s\n' "$PACKAGE_ID" "$VERSION"
printf 'publish-arcus: bundle path: %s\n' "$BUNDLE_DIR"
printf 'publish-arcus: next step: send this bundle path to the Arcus owner (arcus-accept-submission.sh)\n'
