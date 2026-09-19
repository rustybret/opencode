#!/bin/sh
# ARCUS_PUBLISHER_TOOLCHAIN_VERSION=0.4.0
# ARCUS_LOOM_BUNDLE=arcus-prep
# ARCUS_LOOM_BUNDLE_VERSION=0.1.0
# =============================================================================
# arcus-pipeline.sh — Unified Arcus v3 Packaging & Release Pipeline Dispatcher
#
# Standalone, portable runner for driving all Arcus release lifecycle steps:
#   - pack
#   - sign
#   - validate
#   - publish
#   - migrate
#   - all (pack+sign -> validate -> publish)
# =============================================================================
set -eu

SCRIPT_DIR=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd -P)

die() {
  printf 'arcus-pipeline: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: sh skills/scripts/arcus-pipeline.sh <command> [options]

Commands:
  pack       Stage payload, pack artifacts, compute digests, and sign.
  sign       Re-sign or migrate an existing release envelope.
  validate   Strictly validate release manifests/envelopes (fail-closed).
  publish    Stage envelopes to Arcus and upload release assets.
  migrate    Convert legacy v1 manifest into a release envelope skeleton.
  all        Execute full sequence: pack+sign -> validate -> publish.
  self-test  Run self-test across all pipeline scripts.
  -h, --help Show this help.

Run 'sh skills/scripts/<command>-arcus.sh --help' for detailed command options.
USAGE
}

if [ $# -eq 0 ]; then
  usage
  exit 0
fi

CMD=$1
shift

case "$CMD" in
  pack)
    exec sh "${SCRIPT_DIR}/pack-arcus.sh" "$@"
    ;;
  sign)
    exec sh "${SCRIPT_DIR}/sign-arcus.sh" "$@"
    ;;
  validate)
    exec sh "${SCRIPT_DIR}/validate-arcus.sh" "$@"
    ;;
  publish)
    exec sh "${SCRIPT_DIR}/publish-arcus.sh" "$@"
    ;;
  migrate)
    exec sh "${SCRIPT_DIR}/migrate-arcus.sh" "$@"
    ;;
  self-test)
    printf 'arcus-pipeline: running self-test across all scripts...\n'
    sh "${SCRIPT_DIR}/pack-arcus.sh" --self-test
    sh "${SCRIPT_DIR}/sign-arcus.sh" --self-test
    sh "${SCRIPT_DIR}/validate-arcus.sh" --self-test
    sh "${SCRIPT_DIR}/publish-arcus.sh" --self-test
    sh "${SCRIPT_DIR}/migrate-arcus.sh" --self-test
    printf 'arcus-pipeline: all self-tests passed successfully\n'
    exit 0
    ;;
  all)
    printf 'arcus-pipeline: starting end-to-end v3 release pipeline...\n'
    PACK_LOG=$(mktemp 2>/dev/null || mktemp -t 'arcus-pack-log')
    trap 'rm -f "$PACK_LOG"' EXIT INT TERM
    if ! sh "${SCRIPT_DIR}/pack-arcus.sh" "$@" >"$PACK_LOG" 2>&1; then
      cat "$PACK_LOG" >&2
      die "pack+sign stage failed"
    fi
    cat "$PACK_LOG"
    ENVELOPE=$(sed -n 's/^pack-arcus: envelope[[:space:]]*//p' "$PACK_LOG" | tail -n 1)
    [ -n "$ENVELOPE" ] && [ -f "$ENVELOPE" ] || die "pack stage did not report an envelope path"
    sh "${SCRIPT_DIR}/validate-arcus.sh" "$ENVELOPE"
    META=$(jq -r '(.signed // .) | "\(.package_id)\n\(.version)\n\(.release_id)"' "$ENVELOPE") ||
      die "could not read packed release metadata"
    PACKAGE_ID=$(printf '%s\n' "$META" | sed -n '1p')
    VERSION=$(printf '%s\n' "$META" | sed -n '2p')
    RELEASE_ID=$(printf '%s\n' "$META" | sed -n '3p')
    OUTPUT_DIR=$(CDPATH='' cd -- "$(dirname -- "$ENVELOPE")/.." && pwd -P)
    sh "${SCRIPT_DIR}/publish-arcus.sh" \
      --v3 "$ENVELOPE" \
      --package-id "$PACKAGE_ID" \
      --version "$VERSION" \
      --release-id "$RELEASE_ID" \
      --output "$OUTPUT_DIR"
    printf 'arcus-pipeline: end-to-end pipeline completed successfully\n'
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    die "unknown command '$CMD'. Run with --help for usage."
    ;;
esac
