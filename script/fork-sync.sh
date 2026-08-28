#!/usr/bin/env bash
# Fork sync — fast-forward-or-merge model.
#
# Syncs this fork (rustybret/opencode) with upstream
# (anomalyco/opencode) WITHOUT ever rebasing or force-pushing:
#
#   1. fetch upstream and origin
#   2. fast-forward the pristine mirror branch (opencode-mirror) to upstream/<branch>
#   3. bring fork/local up to date: fast-forward when possible, otherwise a
#      real merge commit
#   4. auto-resolve the fork's standing conflict classes from
#      script/fork-sync-exclusions:
#        - keep-deleted  -> upstream modifications/restorations are removed
#        - take-theirs   -> regenerable bundles take upstream's version
#        - regenerate    -> checkout upstream version, rebuild against merged manifests,
#                           and stage into the merge commit
#      and sweep any NEW upstream files that match keep-deleted globs out of
#      the merge result
#   5. commit (--no-verify) and push
#
# Any conflict the manifest does not cover is left for manual review; the
# script exits 1 and prints the unresolved paths.
#
# Usage:
#   script/fork-sync.sh                     # full sync (fetches, merges, pushes)
#   script/fork-sync.sh <remote> <branch>   # sync from a different upstream
#   FORK_SYNC_NO_PUSH=1 script/fork-sync.sh # skip all pushes (dry run / test mode)

set -euo pipefail
export HUSKY=0

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXCLUSIONS="$ROOT/script/fork-sync-exclusions"
REMOTE="${1:-upstream}"
BRANCH="${2:-dev}"
MIRROR_BRANCH="opencode-mirror"
LOCAL_BRANCH="${FORK_SYNC_LOCAL_BRANCH:-fork/local}"
NO_PUSH="${FORK_SYNC_NO_PUSH:-0}"
SKIP_VERIFY="${FORK_SYNC_SKIP_VERIFY:-0}"

if [[ ! -f "$EXCLUSIONS" ]]; then
  echo "error: exclusion manifest not found: $EXCLUSIONS" >&2
  exit 2
fi

# --- guards ------------------------------------------------------------------
if git rev-parse -q --verify REBASE_HEAD >/dev/null 2>&1; then
  echo "error: a rebase is in progress. The fork model is merge-only: abort or finish it first." >&2
  exit 2
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is not clean. Commit or stash before syncing." >&2
  exit 2
fi

# --- helpers ------------------------------------------------------------------
trim() {
  local var="$1"
  var="${var#"${var%%[![:space:]]*}"}"
  var="${var%"${var##*[![:space:]]}"}"
  printf '%s' "$var"
}

matches_any() {
  local p="$1"
  shift
  local g
  for g in "$@"; do
    [[ "$p" == $g ]] && return 0
  done
  return 1
}

# --- parse the exclusion manifest ---------------------------------------------
KEEP_DELETED=()
TAKE_THEIRS=()
REGENERATE=()
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(trim "$line")"
  [[ -z "$line" ]] && continue
  case "$line" in
    keep-deleted:*) KEEP_DELETED+=("$(trim "${line#keep-deleted:}")") ;;
    take-theirs:*)  TAKE_THEIRS+=("$(trim "${line#take-theirs:}")") ;;
    regenerate:*)   REGENERATE+=("$(trim "${line#regenerate:}")") ;;
    *) echo "warning: unrecognized manifest line: $line" >&2 ;;
  esac
done < "$EXCLUSIONS"

matches_keep_deleted() {
  matches_any "$1" "${KEEP_DELETED[@]}"
}
matches_take_theirs() {
  matches_any "$1" "${TAKE_THEIRS[@]}"
}
matches_regenerate() {
  matches_any "$1" "${REGENERATE[@]}"
}

ecosystem_for() {
  local target="$1"
  local base
  base="$(basename "$target")"
  case "$base" in
    bun.lock|bun.lockb) echo "bun" ;;
    Cargo.lock) echo "cargo" ;;
    *)
      echo "error: unknown ecosystem for regenerate target: $target" >&2
      return 1
      ;;
  esac
}

regenerate_targets() {
  local target dir eco
  for target in "$@"; do
    dir="$(dirname "$target")"
    eco="$(ecosystem_for "$target")" || return 1
    case "$eco" in
      bun)
        echo "== regenerating $target with bun install =="
        (cd "$ROOT/$dir" && bun install --no-frozen-lockfile --quiet)
        ;;
      cargo)
        echo "== regenerating $target with cargo metadata =="
        (cd "$ROOT/$dir" && cargo metadata --format-version 1 >/dev/null)
        ;;
    esac
    git add "$ROOT/$target"
  done
}

# --- 1. fetch ------------------------------------------------------------------
echo "== fetch $REMOTE and origin =="
git fetch "$REMOTE" "$BRANCH"
git fetch origin "$MIRROR_BRANCH" "$LOCAL_BRANCH" || true

# --- 2. fast-forward the pristine mirror ---------------------------------------
echo "== fast-forward $MIRROR_BRANCH to $REMOTE/$BRANCH =="
git checkout -q "$MIRROR_BRANCH"
git merge --ff-only "$REMOTE/$BRANCH"
if [[ "$NO_PUSH" != "1" ]]; then
  git push --no-verify origin "$MIRROR_BRANCH"
fi

# --- 3+4. bring fork/local up to date -------------------------------------------
echo "== merge $MIRROR_BRANCH into $LOCAL_BRANCH =="
git checkout -q "$LOCAL_BRANCH"
PRE_MERGE_HEAD="$(git rev-parse HEAD)"

if git merge --ff-only "$MIRROR_BRANCH" >/dev/null 2>&1; then
  if [[ "$(git rev-parse HEAD)" == "$(git rev-parse "$PRE_MERGE_HEAD")" ]]; then
    echo "$LOCAL_BRANCH already up to date with $MIRROR_BRANCH"
  else
    echo "$LOCAL_BRANCH fast-forwarded to $MIRROR_BRANCH"
  fi
else
  echo "$LOCAL_BRANCH has diverged: merging with a merge commit"
  if ! git merge --no-edit "$MIRROR_BRANCH"; then
    echo "== auto-resolving known conflict classes =="
    REGENERATE_TARGETS=()
    for f in $(git diff --name-only --diff-filter=U); do
      if ! git cat-file -e ":2:$f" 2>/dev/null; then
        # deleted by us (no stage-2 blob), modified by them
        if matches_keep_deleted "$f"; then
          git rm -f --quiet "$f"
          echo "  removed (keep-deleted): $f"
        fi
      elif matches_regenerate "$f"; then
        git checkout --theirs --quiet -- "$f"
        git add "$f"
        echo "  took theirs for regeneration: $f"
        REGENERATE_TARGETS+=("$f")
      elif matches_take_theirs "$f"; then
        git checkout --theirs --quiet -- "$f"
        git add "$f"
        echo "  took theirs (regenerable bundle): $f"
      fi
    done
    if [[ -n "$(git diff --name-only --diff-filter=U)" ]]; then
      echo "error: unresolved conflicts remain (not covered by the manifest):" >&2
      git status --short | grep -E '^(UU|DU|UD|AA|DD|AU|UA)' >&2 || true
      echo "resolve them manually, then finish with:" >&2
      echo "  git add <resolved-files> && git commit --no-verify" >&2
      echo "then push $LOCAL_BRANCH:  git push --no-verify origin $LOCAL_BRANCH" >&2
      exit 1
    fi
    if [[ ${#REGENERATE_TARGETS[@]} -gt 0 ]]; then
      regenerate_targets "${REGENERATE_TARGETS[@]}"
    fi
    git commit --no-verify -m "merge: sync $REMOTE/$BRANCH ($(git rev-parse --short "$REMOTE/$BRANCH")) into $LOCAL_BRANCH"
  else
    # Clean textual merge: if bun.lock or package.json was modified by the merge, ensure it stays consistent with fork package.json
    if git diff --name-only "$PRE_MERGE_HEAD" HEAD | grep -E -q "(^bun\.lock$|package\.json$)"; then
      echo "== reconciling lockfile on clean merge =="
      bun install --no-frozen-lockfile --quiet
      if [[ -n "$(git status --porcelain bun.lock)" ]]; then
        git add bun.lock
        git commit --amend --no-verify --no-edit
      fi
    fi
  fi
fi

# --- 4b. sweep newly-added upstream files that match keep-deleted globs --------
SWEPT=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if matches_keep_deleted "$f"; then
    git rm -f --quiet "$f"
    echo "  swept (keep-deleted, new from upstream): $f"
    SWEPT=1
  fi
done < <(git diff --name-only --diff-filter=A "$PRE_MERGE_HEAD" HEAD)
if [[ "$SWEPT" == "1" ]]; then
  git commit --amend --no-verify --no-edit
fi

# --- 4c. sync submodules -------------------------------------------------------
echo "== synchronizing submodules =="
git submodule sync --recursive --quiet || true
git submodule update --init --recursive --quiet || true

# --- 4d. pre-push verification gates -------------------------------------------
if [[ "$SKIP_VERIFY" != "1" ]]; then
  echo "== running pre-push verification gates =="
  bun turbo typecheck
  bun test --cwd packages/opencode test/fork-sync-model.test.ts
fi

# --- 5. push --------------------------------------------------------------------
if [[ "$NO_PUSH" != "1" ]]; then
  git push --no-verify origin "$LOCAL_BRANCH"
fi

echo "== sync complete =="
git log --oneline --first-parent -3
