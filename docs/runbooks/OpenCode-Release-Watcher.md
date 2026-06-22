# OpenCode Release Watcher — Operator Runbook

`@cortexkit/orw` watches `anomalyco/opencode` for new releases, AI-merges the fork's patch branches onto each release tag, builds a native macOS CLI binary, and installs it automatically.

---

## Config

**Location**: `~/opencode-release-watch/orw.config.json`

| Key | Value | Notes |
|-----|-------|-------|
| `release_repo` | `anomalyco/opencode` | Upstream watched for new tags |
| `source_repo` | `/Volumes/Topper2TB/Git/opencode` | Local fork root |
| `work_repo` | `./.orw/repo/opencode-build` | Scratch clone for each integration |
| `base_branch` | `dev` | Base for integration branch |
| `branches` | see below | Fork patches + upstream PRs to merge |
| `poll_minutes` | `30` | launchd fires every 30 min |
| `model` | `anthropic/claude-opus-4-8` | Agent used for conflict resolution |
| `opencode_bin` | `~/.opencode/bin/opencode` | Install destination (fork binary, takes PATH precedence) |
| `install_cli` | `true` | Install CLI after build |
| `install_desktop` | `false` | Desktop packaging disabled — TUI/web only |

---

## Branch List (`branches[]`)

Entries are merged in order onto the upstream release tag. Two kinds:

- **Fork patches** (bare branch name on `rustybret/opencode`): `fork/local`
- **Upstream PRs** (full GitHub PR URL from `anomalyco/opencode`): `https://github.com/anomalyco/opencode/pull/<N>`

**Maintenance rule**: when a PR merges upstream or a branch is deleted, remove it from `branches[]` immediately. orw hard-fails (`git fetch` exit 128) on the first missing ref — the entire build aborts.

```json
"branches": [
  "fork/local",
  "https://github.com/anomalyco/opencode/pull/30182",
  ...
]
```

---

## Trigger Behavior

| Event | orw behavior |
|-------|-------------|
| New upstream release tag | Auto-builds within 30 min (launchd poll) |
| New commits on `fork/local` only (no new tag) | **Does not auto-build** — use `--force` |
| Transient 504 from GitHub releases API | Logged, retried on next poll |

### After pushing to `fork/local` with no upstream release

```bash
cd ~/opencode-release-watch && bunx @cortexkit/orw check --force
```

This rebuilds on the current `last_tag` with the latest branch state.

---

## launchd Job

| Item | Value |
|------|-------|
| Plist | `~/Library/LaunchAgents/com.orw.opencode.plist` |
| Script | `~/opencode-release-watch/run-check.sh` |
| Interval | 1800 s (30 min) |
| stdout log | `~/opencode-release-watch/.orw/logs/launchd-stdout.log` |
| stderr log | `~/opencode-release-watch/.orw/logs/launchd-stderr.log` |

```bash
# Check job is loaded
launchctl list com.orw.opencode

# Reload after plist changes
launchctl unload ~/Library/LaunchAgents/com.orw.opencode.plist
launchctl load  ~/Library/LaunchAgents/com.orw.opencode.plist
```

---

## Status & Logs

```bash
# Current state
cd ~/opencode-release-watch && bunx @cortexkit/orw status

# Tail live launchd output
tail -f ~/opencode-release-watch/.orw/logs/launchd-stdout.log

# Last integration log (per-release file)
ls -lt ~/opencode-release-watch/.orw/logs/*.log
```

---

## Manual Operations

```bash
# Force rebuild on current tag (e.g. after fork/local push)
cd ~/opencode-release-watch && bunx @cortexkit/orw check --force

# Install last verified build (waits until opencode process exits)
cd ~/opencode-release-watch && bunx @cortexkit/orw install-when-closed

# Install immediately (opencode must not be running)
cd ~/opencode-release-watch && bunx @cortexkit/orw install-ready

# Preview the integration prompt without building
cd ~/opencode-release-watch && bunx @cortexkit/orw preview
```

---

## Install Paths

| Binary | How updated |
|--------|-------------|
| `~/.opencode/bin/opencode` | orw auto-install (`opencode_bin`) — fork binary, active via PATH |
| `/opt/homebrew/bin/opencode` | Homebrew-managed vanilla upstream; manual fallback only, never overwritten by orw |

`~/.opencode/bin/` is prepended to `PATH` in `~/.zshrc` and `~/.zprofile` — `which opencode` resolves to the fork binary. Run `/opt/homebrew/bin/opencode` explicitly to use the upstream Homebrew version.

After a `--force` build, if OpenCode is running:
```bash
cd ~/opencode-release-watch && bunx @cortexkit/orw install-when-closed
```

Or copy the artifact directly if OpenCode is closed:
```bash
cp ~/opencode-release-watch/.orw/repo/opencode-build/packages/opencode/dist/opencode-darwin-arm64/bin/opencode ~/.opencode/bin/opencode
codesign --force --sign - ~/.opencode/bin/opencode
~/.opencode/bin/opencode --version
```

---

## Troubleshooting

### Build aborts immediately with `git fetch` error

A branch in `branches[]` no longer exists. Check which:
```bash
for b in $(jq -r '.branches[]' ~/opencode-release-watch/orw.config.json | grep -v '^https'); do
  gh api repos/rustybret/opencode/branches/$b --jq '.name' 2>/dev/null || echo "MISSING: $b"
done
```
Remove missing entries from `orw.config.json`.

### `No new release` on every poll despite new upstream tag

Check `last_tag` in `orw status`. If it matches the latest tag, orw already processed it. Use `--force` to rebuild anyway.

### Binary runs but reports `0.0.0-fork/local-<timestamp>` instead of semver

Built via `./packages/opencode/script/build.ts --single` which doesn't inject version. orw injects `OPENCODE_CHANNEL=latest OPENCODE_VERSION=<tag>` — use orw-produced artifacts for versioned builds.

### Install skipped: OpenCode is running

```bash
cd ~/opencode-release-watch && bunx @cortexkit/orw install-when-closed
```

### Desktop packaging times out

Expected — `install_desktop: false` is set. Desktop packaging is disabled; ignore any desktop-related log lines.
