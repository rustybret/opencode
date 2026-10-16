#!/usr/bin/env bash
# opencode native fork guards v1 (local policy, not security against overrides).
set -euo pipefail

fail() { printf 'fork-git-guards: %s\n' "$*" >&2; exit 1; }
git_common() { GIT_MASTER=1 git rev-parse --path-format=absolute --git-common-dir; }

hooks=(pre-commit pre-merge-commit prepare-commit-msg commit-msg post-commit
  applypatch-msg pre-applypatch post-applypatch pre-rebase post-rewrite
  post-checkout post-merge pre-push pre-auto-gc reference-transaction)
policy=(
  branch.opencode-mirror.remote upstream
  branch.opencode-mirror.merge refs/heads/v1
  branch.opencode-mirror.rebase false
  branch.opencode-mirror.mergeOptions --ff-only
  branch.opencode-mirror.vscode-merge-base upstream/v1
  branch.fork/local.rebase false
  branch.fork/local.vscode-merge-base origin/fork/local
  alias.sync-upstream '!script/fork-sync.sh'
)

stub() {
  cat <<'HOOK'
#!/usr/bin/env bash
# opencode native fork dispatcher v1
exec bash "$(dirname -- "$0")/fork-git-guards.sh" hook "$(basename -- "$0")" "$@"
HOOK
}

preflight() {
  local common=$1 active scope top
  top=$(GIT_MASTER=1 git rev-parse --show-toplevel)
  # An inherited path cannot be removed without changing global/system policy.
  while IFS=$'\t' read -r scope active; do
    [[ "$scope" == local ]] || fail "inherited core.hooksPath; refusing installation"
    case "$active" in
      ''|.husky/_|"$top/.husky/_"|.git/hooks|"$common/hooks") ;;
      *) fail "foreign core.hooksPath; refusing installation" ;;
    esac
  done < <(GIT_MASTER=1 git config --show-scope --get-all core.hooksPath || true)
  if [[ -e "$common/hooks/fork-git-guards.sh" || -L "$common/hooks/fork-git-guards.sh" ]]; then
    [[ ! -L "$common/hooks/fork-git-guards.sh" ]] || fail "foreign guard symlink"
    local header
    header=$(head -n 2 "$common/hooks/fork-git-guards.sh")
    [[ "$header" == $'#!/usr/bin/env bash\n# opencode native fork guards v1 (local policy, not security against overrides).' ]] || fail "foreign guard copy"
  fi
  local hook
  for hook in "${hooks[@]}"; do
    if [[ -e "$common/hooks/$hook" || -L "$common/hooks/$hook" ]]; then
      if [[ -L "$common/hooks/$hook" ]] || ! cmp -s "$common/hooks/$hook" <(stub); then
        fail "foreign native hook: $hook"
      fi
    fi
  done
}

verify() {
  local common=$1 i active
  active=$(GIT_MASTER=1 git config --get core.hooksPath || true)
  [[ -z "$active" ]] || fail "core.hooksPath still overrides native hooks"
  [[ -x "$common/hooks/fork-git-guards.sh" ]] || fail "missing executable guard copy"
  cmp -s "${BASH_SOURCE[0]}" "$common/hooks/fork-git-guards.sh" || fail "guard copy differs"
  local hook
  for hook in "${hooks[@]}"; do
    if [[ ! -x "$common/hooks/$hook" ]] || ! cmp -s "$common/hooks/$hook" <(stub); then
      fail "missing or changed dispatcher: $hook"
    fi
  done
  for ((i=0; i<${#policy[@]}; i+=2)); do
    [[ "$(GIT_MASTER=1 git config --local --get-all "${policy[i]}" || true)" == "${policy[i+1]}" ]] || fail "local policy mismatch: ${policy[i]}"
    [[ "$(GIT_MASTER=1 git config --get "${policy[i]}" || true)" == "${policy[i+1]}" ]] || fail "effective policy mismatch: ${policy[i]}"
  done
  printf 'fork-git-guards: verified native guards\n'
}

install() {
  local common i hook source
  common=$(git_common)
  preflight "$common"
  source=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/$(basename -- "${BASH_SOURCE[0]}")
  mkdir -p "$common/hooks"
  if [[ "$source" != "$common/hooks/fork-git-guards.sh" ]]; then
    cp "$source" "$common/hooks/fork-git-guards.sh"
  fi
  chmod 755 "$common/hooks/fork-git-guards.sh"
  for hook in "${hooks[@]}"; do
    stub > "$common/hooks/$hook"
    chmod 755 "$common/hooks/$hook"
  done
  if GIT_MASTER=1 git config --local --get core.hooksPath >/dev/null; then
    GIT_MASTER=1 git config --local --unset-all core.hooksPath
  fi
  for ((i=0; i<${#policy[@]}; i+=2)); do
    GIT_MASTER=1 git config --local --replace-all "${policy[i]}" "${policy[i+1]}"
  done
  verify "$common"
}

reference_guard() {
  [[ "${1:-}" == prepared ]] || return 0
  local input=$2 old new ref mirror_old='' mirror_new='' upstream
  upstream=$(GIT_MASTER=1 git rev-parse --verify refs/remotes/upstream/v1 2>/dev/null || true)
  # Read the whole transaction before checking: fetch may advance both tips.
  while read -r old new ref; do
    case "$ref" in
      refs/heads/opencode-mirror) mirror_old=$old; mirror_new=$new ;;
      refs/remotes/upstream/v1) upstream=$new ;;
    esac
  done <<< "$input"
  [[ -n "$mirror_new" ]] || return 0
  [[ ! "$mirror_new" =~ ^0+$ ]] || fail "opencode-mirror deletion is forbidden"
  [[ -n "$upstream" && ! "$upstream" =~ ^0+$ ]] || fail "missing pinned upstream/v1 tracking ref"
  GIT_MASTER=1 git cat-file -e "$mirror_new^{commit}" 2>/dev/null || fail "mirror tip must be a commit"
  GIT_MASTER=1 git merge-base --is-ancestor "$mirror_new" "$upstream" || fail "mirror tip is not reachable from upstream/v1"
  if [[ "$mirror_old" =~ ^0+$ ]]; then
    mirror_old=$(GIT_MASTER=1 git rev-parse --verify refs/heads/opencode-mirror 2>/dev/null || true)
  fi
  if [[ -n "$mirror_old" && ! "$mirror_old" =~ ^0+$ ]]; then
    GIT_MASTER=1 git merge-base --is-ancestor "$mirror_old" "$mirror_new" || fail "opencode-mirror requires fast-forward updates"
  fi
}

delegate() {
  local hook=$1 top
  shift
  [[ "${HUSKY:-}" != 0 ]] || return 0
  top=$(GIT_MASTER=1 git rev-parse --show-toplevel 2>/dev/null) || return 0
  if [[ -x "$top/.husky/_/$hook" ]]; then
    "$top/.husky/_/$hook" "$@"
  fi
}

hook() {
  local name=${1:?hook name required} branch input
  shift
  case "$name" in
    pre-commit)
      branch=$(GIT_MASTER=1 git symbolic-ref --quiet HEAD || true)
      [[ "$branch" != refs/heads/opencode-mirror ]] || fail "direct commits on opencode-mirror are forbidden"
      ;;
    pre-rebase)
      branch=${2:-$(GIT_MASTER=1 git symbolic-ref --quiet HEAD || true)}
      case "$branch" in
        fork/local|opencode-mirror|refs/heads/fork/local|refs/heads/opencode-mirror)
          fail "rebase of $branch is forbidden; use merge/fast-forward sync" ;;
      esac
      ;;
    reference-transaction)
      # Preserve stdin exactly for the delegate, including trailing newlines.
      input=$(cat; printf '.')
      input=${input%.}
      reference_guard "${1:-}" "$input"
      printf '%s' "$input" | delegate "$name" "$@"
      return
      ;;
  esac
  delegate "$name" "$@"
}

case "${1:-install}" in
  install) install ;;
  verify) verify "$(git_common)" ;;
  hook) shift; hook "$@" ;;
  *) fail "usage: fork-git-guards.sh [install|verify|hook <name> [args]]" ;;
esac
