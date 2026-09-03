#!/bin/sh
# =============================================================================
# arcus-pipeline.sh — Unified Arcus v2 Packaging & Release Pipeline Dispatcher
#
# Standalone, portable runner for driving all Arcus v2 lifecycle steps:
#   - pack
#   - sign
#   - validate
#   - publish
#   - migrate
#   - all (pack -> sign -> validate -> publish)
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
  pack       Stage payload, pack artifacts, compute distinct digests.
  sign       Sign release envelope using Ed25519 key (file/env/stdin).
  validate   Strictly validate release manifests/envelopes (fail-closed).
  publish    Stage envelopes to Arcus and upload release assets.
  migrate    Convert legacy v1 manifest into v2 release envelope skeleton.
  all        Execute full sequence: pack -> sign -> validate -> publish.
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
    printf 'arcus-pipeline: starting end-to-end v2 release pipeline...\n'
    sh "${SCRIPT_DIR}/pack-arcus.sh" "$@"
    sh "${SCRIPT_DIR}/validate-arcus.sh"
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
