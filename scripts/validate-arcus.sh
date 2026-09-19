#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# validate-arcus.sh — Portable Arcus v2 Strict Validation Gate
#
# Standalone, portable POSIX sh script for validating Arcus v2 release
# manifests and signed release envelopes.
#
# Strict, fail-closed validation:
#   - Fails if signatures are invalid or missing (unless --body-only).
#   - Fails if placeholder digests (000000...) are present.
#   - Fails if targets don't conform to canonical naming.
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH='' cd -- "${SCRIPT_DIR}/../.." && pwd -P)
if [ -d "${PWD}/.git" ] || [ -f "${PWD}/package.json" ] || [ -f "${PWD}/VERSION" ] || [ -f "${PWD}/Cargo.toml" ] || [ -f "${PWD}/go.mod" ]; then
  REPO_ROOT="${PWD}"
fi

ARCUS_BIN=${ARCUS_BIN:-arcus}
BODY_ONLY=0

die() {
  printf 'validate-arcus: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/validate-arcus.sh [options] [manifest/envelope ...]

Options:
  --body-only   Validate unsigned document body instead of signed envelope.
  --self-test   Run internal hermetic self-test suite and exit.
  -h, --help    Show this help.

If no manifest paths are given, all envelopes under dist-arcus/releases/ are validated.
Exit status: 0 = all targets valid, 1 = validation failure.
USAGE
}

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
  die "arcus CLI not found (set ARCUS_BIN). Arcus validation is fail-closed."
}

run_self_test() {
  printf 'validate-arcus: running self-test...\n'
  resolve_arcus_bin

  tmp_dir=$(mktemp -d 2>/dev/null || mktemp -d -t 'arcus-val-selftest')
  trap 'rm -rf "$tmp_dir"' EXIT INT TERM

  key_file="${tmp_dir}/test.key"
  "$ARCUS_BIN" gen-key --out "$key_file" >/dev/null 2>&1 || die "self-test: failed to generate key"

  payload_dir="${tmp_dir}/payload"
  mkdir -p "${payload_dir}/bin"
  printf '#!/bin/sh\necho ok\n' > "${payload_dir}/bin/test-bin"
  head -c 8192 /dev/zero >> "${payload_dir}/bin/test-bin"
  chmod 755 "${payload_dir}/bin/test-bin"

  case "$(uname -s)-$(uname -m)" in
    Darwin-arm64) target="darwin-arm64" ;;
    Darwin-x86_64) target="darwin-x64" ;;
    Linux-x86_64) target="linux-x64" ;;
    Linux-aarch64|Linux-arm64) target="linux-arm64" ;;
    *) target="linux-x64" ;;
  esac

  out_dir="${tmp_dir}/dist"
  "$ARCUS_BIN" pack \
    --input "$payload_dir" \
    --package-id selftest-pkg \
    --release-id selftest-pkg-1.0.0 \
    --version 1.0.0 \
    --sequence 1 \
    --source-id arcus \
    --channel stable \
    --target "$target" \
    --action-executable bin/test-bin \
    --key-file "$key_file" \
    --output "$out_dir" >/dev/null 2>&1 || die "self-test: pack failed"

  envelope="${out_dir}/releases/selftest-pkg-1.0.0.json"
  [ -f "$envelope" ] || die "self-test: envelope not generated at ${envelope}"

  # Assertion 1: Valid envelope passes
  if ! "$ARCUS_BIN" manifest validate --with-envelope "$envelope" >/dev/null 2>&1; then
    die "self-test: valid envelope unexpectedly failed validation"
  fi
  printf 'validate-arcus: PASS: valid envelope passes validation\n'

  # Assertion 2: Envelope with empty signatures fails
  no_sigs="${tmp_dir}/no-sigs.json"
  jq '.signatures = []' "$envelope" > "$no_sigs" 2>/dev/null || sed 's/"signatures": \[.*/"signatures": []/' "$envelope" > "$no_sigs"
  if "$ARCUS_BIN" manifest validate --with-envelope "$no_sigs" >/dev/null 2>&1; then
    die "self-test: envelope with empty signatures unexpectedly passed validation"
  fi
  printf 'validate-arcus: PASS: envelope with empty signatures fails validation\n'

  # Assertion 3: Invalid schema_version fails validation
  bad_ver="${tmp_dir}/bad-ver.json"
  sed 's/"schema_version": 3/"schema_version": 99/' "$envelope" > "$bad_ver"
  if "$ARCUS_BIN" manifest validate --with-envelope "$bad_ver" >/dev/null 2>&1; then
    die "self-test: invalid schema_version unexpectedly passed validation"
  fi
  printf 'validate-arcus: PASS: invalid schema_version fails validation\n'

  rm -rf "$tmp_dir"
  trap - EXIT INT TERM
  printf 'validate-arcus: all self-test assertions passed\n'
  exit 0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --body-only) BODY_ONLY=1; shift ;;
    --allow-placeholders)
      die "refusing --allow-placeholders: v2 validation is strict and fail-closed" ;;
    --self-test) run_self_test ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) die "unrecognized option '$1'" ;;
    *) break ;;
  esac
done

resolve_arcus_bin
"$ARCUS_BIN" manifest verify-toolchain --root "$SCRIPT_DIR" >/dev/null ||
  die "publisher toolchain is below the minimum accepted version; regenerate these scripts"

if [ $# -eq 0 ]; then
  RELEASES_DIR="${REPO_ROOT}/dist-arcus/releases"
  [ -d "$RELEASES_DIR" ] ||
    die "no manifest paths given and ${RELEASES_DIR} does not exist"
  set --
  for candidate in "$RELEASES_DIR"/*.json "$RELEASES_DIR"/*/*.json; do
    [ -f "$candidate" ] || continue
    case "$candidate" in
      *.index-policy.json) continue ;;
    esac
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
