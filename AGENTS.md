- To regenerate the legacy JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- After changing the public Protocol or Server `HttpApi`, run `bun run generate` from `packages/client`. Do not edit `src/generated` or `src/generated-effect` directly.
- Keep runtime dependencies directed from Schema to Core and Protocol, then from Core and Protocol to Server. Client runtime code may depend on Schema and Protocol but never Core or Server; `sdk-next` composes Client, Core, and Server.
- The default branch in this repo is `dev`.
- Local `main` ref may not exist; use `dev` or `origin/dev` for diffs.

## Fork Development

This repo is a private fork of `anomalyco/opencode` using a **two-branch model**:

- **`opencode-mirror`** — clean mirror of `upstream/dev`. Never commit fork changes here. Updated via `script/fork-sync.sh` (fast-forward only).
- **`fork/local`** — the customization layer. All local development happens here.

### Syncing with upstream

```bash
script/fork-sync.sh
```

Future syncs are a single command via `script/fork-sync.sh` (or `git sync-upstream`). It fetches upstream, fast-forwards `opencode-mirror`, merges into `fork/local`, auto-resolves standing exclusions in `script/fork-sync-exclusions` (removing restored workflows/docs and keeping fork deletions permanent), sweeps new upstream files matching exclusions, and pushes. If manual conflicts arise, resolve them, commit (`git commit --no-verify`), and push `fork/local`.

### Standalone build

```bash
./packages/opencode/script/build.ts --single
# Output: packages/opencode/dist/opencode-<platform>/bin/opencode
```

Run `bun typecheck` from `packages/opencode` (never `tsc` directly) before building.

### Release watcher (orw)

`@cortexkit/orw` runs at `~/opencode-release-watch/` via launchd (30-min poll). On each new upstream release it AI-merges `fork/local` onto the release tag using `claude-opus-4-8`, builds a native CLI (TUI/web only — desktop disabled), and auto-installs to `~/.opencode/bin/opencode`. `~/.opencode/bin/opencode` is prepended to PATH and takes precedence — `which opencode` resolves here. `/opt/homebrew/bin/opencode` holds the vanilla upstream Homebrew version as a manual fallback only.

After pushing new commits to `fork/local` with no upstream release, trigger a rebuild manually through the hardened wrapper — **never** call `bunx @cortexkit/orw check` directly (that bypasses the independent smoke gate and is what shipped the broken v1.18.2 `plugin-not-defined` build):

```bash
cd ~/opencode-release-watch && run/orw-check check --force
```

The wrapper pins the ORW version, refuses to run unless `install_cli=false`, and independently verifies the built artifact (exact `--version` match + isolated `GET /agent` HTTP 200 smoke on an ephemeral port with temp XDG dirs) before ever reporting success. To re-verify the artifact already recorded in state without rebuilding, run `run/orw-check verify`.

Operator runbook: `agent-harness/docs/runbooks/OpenCode-Release-Watcher.md`

## Commits and PR Titles

Use conventional commit-style messages and PR titles: `type(scope): summary`.

Valid types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`. Scopes are optional; use the affected package or area when helpful, e.g. `core`, `opencode`, `tui`, `app`, `desktop`, `sdk`, or `plugin`.

Examples: `fix(tui): simplify thinking toggle styling`, `docs: update contributing guide`, `chore(sdk): regenerate types`.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Do not extract single-use helpers preemptively. Inline the logic at the call site unless the helper is reused, hides a genuinely complex boundary, or has a clear independent name that improves the caller.
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream
- In `src/config`, follow the existing self-export pattern at the top of the file (for example `export * as ConfigAgent from "./agent"`) when adding a new config module.
- In Effect generators, bind services to named variables before calling methods. Do not use nested service yields such as `yield* (yield* Foo.Service).bar()`.

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Imports

- Never alias imports. Do not use `import { foo as bar } from "..."` or renamed imports like `resolve as pathResolve`.
- Never use star imports. Do not use `import * as Foo from "..."` or `import type * as Foo from "..."`.
- If a namespace-style value is needed, import the module's own exported namespace by name, for example `import { Project } from "@opencode-ai/core/project"`, then reference `Project.ID`.
- Prefer dynamic imports for heavy modules that are only needed in selected code paths, especially in startup-sensitive entrypoints. Destructure dynamic import bindings near the top of the narrowest scope that needs them so they read like normal imports. Avoid inline chains such as `await import("./module").then((mod) => mod.value())` or `(await import("./module")).value()`. Keep branch-specific imports inside the branch that needs them to preserve lazy loading.

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Complex Logic

When a function has several validation branches or supporting details, make the main function read as the happy path and move supporting details into small helpers below it.

```ts
// Good
export function loadThing(input: unknown) {
  const config = requireConfig(input)
  const metadata = readMetadata(input)
  return createThing({ config, metadata })
}

function requireConfig(input: unknown) {
  ...
}
```

- Keep helpers close to the code they support, below the main export when that improves readability.
- Do not over-abstract simple expressions into many single-use helpers; extract only when it names a real concept like `requireConfig` or `readMetadata`.
- Do not return `Effect` from helpers unless they actually perform effectful work. Synchronous parsing, validation, and option building should stay synchronous.
- Prefer Effect schema helpers such as `Schema.UnknownFromJsonString` and `Schema.decodeUnknownOption` over manual `JSON.parse` wrapped in `Effect.try` when parsing untrusted JSON strings.
- Add comments for non-obvious constraints and surprising behavior, not for obvious assignments or control flow.

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root (guard: `do-not-run-tests-from-root`); run from package dirs like `packages/opencode`.

## Type Checking

- Always run `bun typecheck` from package directories (e.g., `packages/opencode`), never `tsc` directly.
