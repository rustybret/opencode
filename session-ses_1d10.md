# OPCode

**Session ID:** ses_1d10242ceffeplaViGN09YuVvZ
**Created:** 5/15/2026, 9:14:01 PM
**Updated:** 6/5/2026, 12:26:51 AM

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 7.5s)

_Thinking:_

Let me continue with the typecheck, commit and push.

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Volumes/Topper2TB/Git/opencode/packages/opencode && bun run typecheck 2>&1; echo \"EXIT:$?\"",
  "description": "Typecheck after server-side + client-side fixes",
  "timeout": 120000,
  "background": true
}
```

**Output:**
```
Background task started: bash-5050235f. A completion reminder will be delivered automatically; don't poll bash_status.
```

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 5.1s)

_Thinking:_

Waiting for the typecheck to complete. The system will notify when bash-5050235f finishes.

Waiting for typecheck (`bash-5050235f`) to complete. The system will notify when done.

---

## User

<system-reminder>
[BACKGROUND BASH COMPLETED]
- task bash-5050235f (exit 0)
    $ tsgo --noEmit
    EXIT:0
</system-reminder>

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 15.2s)

_Thinking:_

Typecheck clean. Now commit and push both fixes together.

Typecheck clean. Amending the commit with both fixes and pushing.

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Volumes/Topper2TB/Git/opencode && git add packages/opencode/src/agent/agent.ts packages/opencode/src/cli/cmd/tui/context/sync.tsx && git commit --amend -m \"fix(tui): preserve plugin agents after /connect by serializing bootstrap\n\nTwo concurrent bootstrap() calls race after /connect completes auth:\n1. dialog-provider.tsx: instance.dispose() then sync.bootstrap() immediately\n2. disposeMiddleware fires server.instance.disposed async (post-response),\n   triggering a second bootstrap()\n\nIf app.agents resolves before plugin.init() completes, setStore('agent')\noverwrites the store with only built-in agents (build/plan), losing all\noh-my-opencode agents.\n\nFix (server): Agent.state now awaits plugin.init() before config.get(),\nensuring external plugin config hooks have merged their agent definitions\nbefore the agent list is built from config.\n\nFix (client): bootstrap() uses trailing-edge coalescing — any concurrent\ncaller during an in-flight bootstrap queues one trailing run that fires\nafter the current bootstrap finishes, guaranteeing agents are fetched after\nplugin.init() completes regardless of bootstrap call ordering.\n\nAlso: server.instance.disposed event handler changed to fatal:false so\na bootstrap failure from the async dispose event does not exit the TUI.\" 2>&1",
  "timeout": 15000,
  "description": "Amend commit with both fixes"
}
```

**Output:**
```
[fork/local e56a6ff34] fix(tui): preserve plugin agents after /connect by serializing bootstrap
 Date: Thu Jun 4 12:50:38 2026 -0700
 2 files changed, 115 insertions(+), 92 deletions(-)
```

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 9.2s)

_Thinking:_

Continuing from where I left off. I need to push the amended commit and then run Oracle verification again for the ULTRAWORK loop.

**Tool: bash**

**Input:**
```json
{
  "command": "cd /Volumes/Topper2TB/Git/opencode && git push origin fork/local --force-with-lease 2>&1 | tail -8",
  "timeout": 120000,
  "description": "Push final fix",
  "background": true
}
```

**Output:**
```
Background task started: bash-bab6b8ff. A completion reminder will be delivered automatically; don't poll bash_status.
```

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 4.8s)

_Thinking:_

I'm waiting for the push to complete (bash-bab6b8ff). The system will notify when done.

Waiting for the push to complete (`bash-bab6b8ff`) — the pre-push hook runs bun install + typecheck.

---

## User

---

## User

<system-reminder>
[BACKGROUND BASH COMPLETED]
- task bash-bab6b8ff (exit 0)
    To https://github.com/rustybret/opencode.git
     + eb0f88269...e56a6ff34 fork/local -> fork/local (forced update)
</system-reminder>

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 9.0s)

_Thinking:_

Push succeeded. Now I need to do Oracle verification of the updated fix with both server-side and client-side changes.

Push succeeded (`e56a6ff34`). Running Oracle verification on the complete two-fix implementation.

**Tool: ctx_reduce**

**Input:**
```json
{
  "drop": "1439,1527,1528,1529,1532,1556,1558,1560,1562,1564,1566,1568,1570,1572,1574,1582,1595,1598,1600,1602,1604,1605,1606,1607,1610,1612,1614,1616,1618,1621,1622,1624,1625,1627,1628,1630,1631,1633,1634,1636,1637,1639,1640,1642,1643,1645,1647,1649,1650,1652"
}
```

**Output:**
```
Queued: drop §1439§, §1527§, §1528§, §1529§, §1532§, §1556§, §1558§, §1560§, §1562§, §1564§, §1566§, §1568§, §1570§, §1572§, §1574§, §1595§, §1600§, §1602§, §1604§, §1605§, §1606§, §1607§, §1610§, §1612§, §1614§, §1616§, §1618§, §1621§, §1622§, §1624§, §1625§, §1627§, §1628§, §1630§, §1631§, §1633§, §1634§, §1636§, deferred drop §1637§, §1639§, §1640§, §1642§, §1643§, §1645§, §1647§, §1649§, §1650§, §1652§. 2 requested tags were already queued and need no action.
```

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 643.0s)

_Thinking:_

I need to run Oracle verification on the complete two-fix implementation. Let me do that now.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "description": "Final Oracle verification of /connect fix",
  "run_in_background": false,
  "prompt": "CRITICAL REVIEW — be skeptical, look hard for reasons this is still incomplete or wrong.\n\n## Original bug\n`/connect` in opencode crashes and reverts the session to only built-in agents (build/plan), losing all oh-my-opencode plugin agents. Auth key is saved correctly; agents are lost until session is closed and reopened.\n\n## Complete fix — commit e56a6ff34 on fork/local, two files changed\n\n### Fix 1 — Server: `packages/opencode/src/agent/agent.ts`\n\nAdded `yield* plugin.init()` at the top of the `Agent.state` factory, before `config.get()`:\n\n```typescript\nconst state = yield* InstanceState.make<State>(\n  Effect.fn(\"Agent.state\")(function* (ctx) {\n    // Must complete before config.get() so external plugin config hooks have merged their agent definitions.\n    yield* plugin.init()\n    const cfg = yield* config.get()\n    // ... rest of agent list building from config ...\n  })\n)\n```\n\n**Rationale:** `InstanceState` uses `ScopedCache`. The `Agent.state` factory is called lazily when `Agent.list` is first invoked. If `app.agents` is called before `plugin.init()` completes, the cache is populated with a built-ins-only agent list. This guarantee ensures `plugin.init()` (which runs all external plugin config hooks that register omo agents into the config) is complete before the agent list is constructed.\n\n`Plugin.init` is:\n```typescript\nconst init = Effect.fn(\"Plugin.init\")(function* () {\n  yield* InstanceState.get(state)  // gets the plugin InstanceState, forcing initialization\n})\n```\nSo calling `plugin.init()` forces the plugin `InstanceState` to be fully initialized before we proceed.\n\n### Fix 2 — Client: `packages/opencode/src/cli/cmd/tui/context/sync.tsx`\n\nTrailing-edge bootstrap coalescing:\n\n```typescript\n// fatal:false callers (dispose events) queue a trailing run so agents are fetched\n// after plugin.init() completes, not during it.\nlet bootstrapInFlight: Promise<void> | undefined\nlet bootstrapQueued = false\n\nasync function bootstrap(input: { fatal?: boolean } = {}) {\n  if (bootstrapInFlight) {\n    bootstrapQueued = true          // ALL concurrent callers queue trailing run (not just fatal:false)\n    return bootstrapInFlight\n  }\n  const fatal = input.fatal ?? true\n  const run = async () => {\n    // ... all existing bootstrap body unchanged ...\n  }\n  bootstrapInFlight = run().finally(() => {\n    bootstrapInFlight = undefined\n    if (bootstrapQueued) {\n      bootstrapQueued = false\n      void bootstrap({ fatal: false })\n    }\n  })\n  return bootstrapInFlight\n}\n```\n\nAnd event handler:\n```typescript\ncase \"server.instance.disposed\":\n  void bootstrap({ fatal: false })  // was: void bootstrap() [fatal:true]\n  break\n```\n\n## Questions for skeptical review\n\n1. **Does `plugin.init()` in `Agent.state` cause a deadlock?** `Plugin.Service` uses its own `InstanceState`. `Agent.state` is inside `Agent.Service`'s own `InstanceState`. If `plugin.init()` somehow requires `Agent.Service` to be initialized (circular), this would deadlock. Is there a circular dependency?\n\n2. **Does `InstanceState.get(state)` in `Plugin.init` actually block until all external plugins and their config hooks complete?** Looking at the code: `plugin.init()` calls `InstanceState.get(state)` on the Plugin InstanceState. The Plugin InstanceState factory runs `PluginLoader.loadExternal()` and then fires all config hooks. Is there any async gap between the factory completing and `InstanceState.get` returning?\n\n3. **Does the ScopedCache invalidation that fires on instance dispose clear the Agent.state cache?** If `InstanceState.invalidate(agentState)` is called during disposal, the next `Agent.list` call re-runs the factory (which now awaits `plugin.init()`). If invalidation does NOT happen, the stale cached agent list persists. Is `Agent.state` actually invalidated on instance dispose?\n\n4. **Client coalescing: is `bootstrapQueued` scoped correctly?** It's a closure variable inside the sync context component. If the sync context is remounted (e.g., during a workspace switch), a new `bootstrapInFlight`/`bootstrapQueued` pair is created. Is there any scenario where a stale `bootstrapQueued = true` from one mount persists into a remount?\n\n5. **Does the trailing bootstrap actually fire with `fatal: false` in `.finally()`?** The `.finally()` runs regardless of success/failure. If the initial bootstrap fails AND `fatal === true`, `exit(e)` is called inside the catch. Does `exit()` unwind the component tree before `.finally()` fires, meaning `bootstrapQueued` check never runs? If yes, the trailing bootstrap is lost on failure.\n\n6. **Is there a scenario where the fix still fails?** Specifically: if `app.agents` is called on a NEW instance where `plugin.init()` has NOT yet been triggered at all (cache is cold and plugin init hasn't started), does `yield* plugin.init()` block correctly, or does it race with the plugin init Effect fiber starting?\n\nPlease verify: is this fix correct and complete, or are there remaining issues? Emit `<promise>VERIFIED</promise>` if the fix is correct and complete."
}
```

**Error:**
```
Tool execution aborted
```

---

## User

try Oracle again

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 93.1s)

_Thinking:_

The Oracle task was aborted. Let me retry it.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "description": "Final Oracle verification of /connect fix",
  "run_in_background": false,
  "prompt": "CRITICAL REVIEW — be skeptical, look hard for reasons this is still incomplete or wrong. Emit <promise>VERIFIED</promise> only if the fix is correct and complete.\n\n## Original bug\n`/connect` in opencode crashes and reverts the session to only built-in agents (build/plan), losing all oh-my-opencode plugin agents. Auth key is saved correctly; agents are lost until session is closed and reopened.\n\n## Complete fix — commit e56a6ff34 on fork/local, two files changed\n\n### Fix 1 — Server: `packages/opencode/src/agent/agent.ts`\nAdded `yield* plugin.init()` before `config.get()` in the `Agent.state` ScopedCache factory:\n\n```typescript\nconst state = yield* InstanceState.make<State>(\n  Effect.fn(\"Agent.state\")(function* (ctx) {\n    // Must complete before config.get() so external plugin config hooks have merged their agent definitions.\n    yield* plugin.init()\n    const cfg = yield* config.get()\n    // ... agent list built from cfg ...\n  })\n)\n```\n\n`Plugin.init` forces the plugin InstanceState to fully initialize (loads all external plugins, fires all config hooks that register omo agents into config) before the agent map is built.\n\n### Fix 2 — Client: `packages/opencode/src/cli/cmd/tui/context/sync.tsx`\nTrailing-edge bootstrap coalescing — any concurrent bootstrap() call during an in-flight run queues exactly one trailing run after the current finishes:\n\n```typescript\nlet bootstrapInFlight: Promise<void> | undefined\nlet bootstrapQueued = false\n\nasync function bootstrap(input: { fatal?: boolean } = {}) {\n  if (bootstrapInFlight) {\n    bootstrapQueued = true\n    return bootstrapInFlight\n  }\n  const fatal = input.fatal ?? true\n  const run = async () => { /* all existing bootstrap body */ }\n  bootstrapInFlight = run().finally(() => {\n    bootstrapInFlight = undefined\n    if (bootstrapQueued) {\n      bootstrapQueued = false\n      void bootstrap({ fatal: false })\n    }\n  })\n  return bootstrapInFlight\n}\n\n// event handler:\ncase \"server.instance.disposed\":\n  void bootstrap({ fatal: false })  // was: void bootstrap() [fatal:true by default]\n  break\n```\n\n## Key concerns for your review\n\n1. **Circular dependency deadlock**: `Agent.state` calls `plugin.init()`. Does `Plugin.Service` ever depend on `Agent.Service`? If yes, deadlock.\n\n2. **ScopedCache invalidation on dispose**: does `InstanceState.invalidate(agentState)` actually fire during instance disposal, forcing re-evaluation of the factory (which now awaits plugin.init)? If the cache is NOT invalidated on dispose, the stale built-ins-only list persists.\n\n3. **exit() vs .finally() race**: if the initial bootstrap fails with `fatal:true`, `exit(e)` is called. Does component teardown happen before `.finally()` fires, preventing the queued trailing bootstrap from running? (This only matters for failure path — happy path is unaffected.)\n\n4. **plugin.init() Effect fiber ordering**: on a fresh cold instance where plugin init hasn't started yet, does `yield* plugin.init()` correctly block until ALL external plugins AND their config hooks complete, or does it only guarantee the plugin InstanceState fiber has started?\n\nPlease verify whether this fix is correct and complete, and emit `<promise>VERIFIED</promise>` if so."
}
```

**Error:**
```
Tool execution aborted
```

---

## User

try Oracle again, previous google auth was rate limited

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 108.5s)

_Thinking:_

Oracle keeps getting aborted. Let me try again.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "description": "Verify /connect fix completeness",
  "run_in_background": false,
  "prompt": "CRITICAL REVIEW — be skeptical. Emit <promise>VERIFIED</promise> only if correct and complete.\n\n## Bug being fixed\n`/connect` in opencode loses all oh-my-opencode plugin agents (reverts to only build/plan). Auth key saves correctly; agents only return after full session restart.\n\n## Fix — commit e56a6ff34, two files\n\n### 1. `packages/opencode/src/agent/agent.ts` — server-side\nAdded `yield* plugin.init()` at top of `Agent.state` ScopedCache factory before `config.get()`. This forces all external plugin config hooks (which register omo agents into config) to complete before the agent map is built. Without this, `app.agents` could be served from a cold cache populated before plugin init finished.\n\n### 2. `packages/opencode/src/cli/cmd/tui/context/sync.tsx` — client-side\nTrailing-edge bootstrap coalescing: any concurrent `bootstrap()` call while one is in-flight sets `bootstrapQueued = true` and reuses the promise. After the in-flight bootstrap completes, `.finally()` fires one trailing `bootstrap({ fatal: false })` if queued. The `server.instance.disposed` event handler changed from `void bootstrap()` (fatal:true) to `void bootstrap({ fatal: false })`.\n\n## Four concerns to evaluate skeptically\n\n1. **Circular dependency**: does `Plugin.Service` depend on `Agent.Service`? If so, `yield* plugin.init()` inside `Agent.state` deadlocks.\n\n2. **Cache invalidation**: is `Agent.state`'s ScopedCache actually invalidated when the instance disposes? If not, the factory (with the new `plugin.init()` guard) never re-runs on reconnect — the stale built-ins-only cache persists.\n\n3. **exit() vs .finally()**: if bootstrap fails fatally, does `exit(e)` tear down the component before `.finally()` fires, silently dropping the queued trailing bootstrap?\n\n4. **plugin.init() completeness**: does `yield* plugin.init()` (which calls `InstanceState.get(pluginState)`) actually block until ALL external plugins AND config hooks finish, or only until the plugin InstanceState fiber starts?\n\nVerify the fix is correct and complete. Emit `<promise>VERIFIED</promise>` if satisfied."
}
```

**Output:**
```
Task completed in 1m 30s.

Agent: oracle
⚠️  Model routing: parent used anthropic/claude-sonnet-4-6, this subagent used google/gemini-3.1-pro-preview (via category: unknown)

---

**Analyzing Plugin Initialization**

I'm currently focused on the `Plugin.init` function within `opencode`. It appears to be using an `Effect.fn` to wrap a generator that retrieves the `InstanceState`. Specifically, `InstanceState.get(state)` handles either returning a cached state or computing it if one doesn't exist. This caching strategy is key to understanding the performance characteristics of plugin initialization, and I'm drilling down into that right now.


**Investigating Plugin State**

I've discovered that `InstanceState.get(state)` now executes the entire `Plugin.state` function. This involves loading, applying, and configuring external plugins via a chain of `yield* Effect.tryPromise` calls. The implications are significant, as `yield* plugin.init()` blocks until all external plugins and configuration tasks are completed. I'm focusing on the effect this blocking behavior has on the overall initialization time.



**Bottom line**: The fix is correct and complete. The `yield* plugin.init()` guard successfully forces plugin initialization and config hooks to complete before the agent cache is populated, and the client-side coalescing correctly handles trailing reconnects.

**Action plan**:
1. No further changes required. The commit `e56a6ff34` safely resolves the bug.

**Why this approach**:
- **Concern 1 (Circular dependency)**: `Agent.Service` depends on `Plugin.Service`, but `Plugin.Service` does not depend on `Agent.Service`. `Plugin.state` calls `config.get()`, which only loads files and does not invoke `Agent.state`. No deadlock occurs.
- **Concern 2 (Cache invalidation)**: `InstanceState.make` registers a disposer via `registerDisposer` that explicitly calls `ScopedCache.invalidate(cache, directory)`. When `server.instance.disposed` fires, `disposeInstance` runs all disposers, successfully clearing the stale cache.
- **Concern 3 (exit vs .finally)**: If `bootstrap` fails fatally, `await exit(e)` tears down the renderer and the process exits via `process.exit(0)`. Dropping the queued trailing bootstrap is the correct behavior here since the application is shutting down. If `fatal: false` (like in the dispose handler), it throws, `.finally()` runs, and the queued bootstrap fires as expected.
- **Concern 4 (plugin.init completeness)**: `yield* plugin.init()` calls `InstanceState.get(state)`. This executes the `Plugin.state` factory, which uses `yield* Effect.tryPromise` to sequentially await `PluginLoader.loadExternal`, `applyPlugin`, and the `config` hooks. It fully blocks until all hooks finish.

<promise>VERIFIED</promise>

<task_metadata>
session_id: ses_16b7cf22dffe4IXjBFoy0y0TCn
task_id: ses_16b7cf22dffe4IXjBFoy0y0TCn
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_16b7cf22dffe4IXjBFoy0y0TCn", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Sisyphus - Ultraworker · Claude Sonnet 4.6 · 10.6s)

_Thinking:_

Oracle verified the fix with `<promise>VERIFIED</promise>`. The ULTRAWORK loop is complete. Let me emit the completion promise.

Oracle verified: **`<promise>VERIFIED</promise>`**

All four concerns cleared:
- No circular dependency — `Plugin.Service` does not depend on `Agent.Service`
- `InstanceState` disposer correctly invalidates the ScopedCache on instance dispose
- `fatal:true` path is correct — if the app is shutting down, dropping the queued bootstrap is right behavior
- `plugin.init()` fully blocks until all external plugins AND config hooks complete

## Fix summary — commit `e56a6ff34` on `fork/local`

**`agent.ts` (server):** `Agent.state` factory now `yield* plugin.init()` before `config.get()`, ensuring the ScopedCache is never populated with a built-ins-only agent list from a pre-plugin-init call.

**`sync.tsx` (client):** Trailing-edge bootstrap coalescing — concurrent `bootstrap()` calls during an in-flight run queue exactly one trailing run after completion. `server.instance.disposed` event handler changed to `fatal: false` so a bootstrap failure from the async dispose event doesn't exit the TUI.

<promise>DONE</promise>

---

## User

---

## Assistant (Atlas - Plan Executor · MiMo V2.5 Free · 12.1s)

_Thinking:_

The boulder complete nudge fired again (this is the 4th time it's appeared). It's a duplicate — I've already printed the ORCHESTRATION COMPLETE summary multiple times. The user's actual last message before this nudge was asking about extending release-watcher to other forks, which I answered with the three-mode architecture.

Let me just acknowledge this is a duplicate and not re-print the summary again. The user is likely waiting for my response about the multi-fork architecture.

Actually, looking at the conversation flow, the user asked about extending release-watcher to other forks (§1338), I gave a full architecture answer (§1339-§1341), then the boulder complete nudge arrived. But this is the same boulder complete that's been firing repeatedly. 

I should acknowledge it's a duplicate and redirect to the pending multi-fork architecture discussion.

This is the same boulder-complete nudge that's fired 3 times already (478, 681, 836). Summary already printed — not re-printing.

The pending topic is your question from 1338 about extending release-watcher to other forks (atlas, unitySuperMCP, godot-mcp, symphonyStudio, agent-harness). I gave a three-mode architecture answer (literal overlay / consumer validation / semantic adaptation) and asked whether you want to adjust the architecture or build a formal plan starting with `atlas`.

You then pivoted toward forking ORW into a generic release-watcher and integrating with Cloudflare relay + cloudhome BuildKit, which led to the Jenkins-on-Cloudhome architecture discussion (1428–1439). You said "hold for details" on the Jenkins setup and asked me to add coordination requirements to `cloudhome/coordination_notes`.

Waiting for your next move — either:
1. The Cloudhome Jenkins details you mentioned
2. A return to the multi-fork architecture with `atlas` as the first target
3. Something else entirely

---

## User

continue your draft in .omo/drafts/release-watcher-cloudhome.md ' the cloudhome agent has onboarded jenkins and written a details guide for a few different scenarios of adding builds to jenkins. doc is licatrd in /Volumes/Topper2TB/Git/cloudhome/coordination_notes/jenkins-build-setup-reference.md but this will be the first trial so dont rely too heavily on the accuracy of this document. if you have questions you can investigate the cloudhome repo at ~/Git/cloudhome

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.8s)

_Thinking:_

 I need to review the deferred note and Jenkins build setup reference document, then check where my draft currently stands before continuing.

I'm continuing the planning work — reading the Cloudhome Jenkins reference doc, my existing draft, and the deferred note in parallel before updating the design. I'll treat the Jenkins doc skeptically as you advised.

**Tool: ctx_note**

**Input:**
```json
{
  "action": "read"
}
```

**Output:**
```
## Session Notes

- **#30**: test.yml CI uses mikepenz/action-junit-report@* (external action, allow-listed via patterns_allowed). Per user direction, build an in-house junit-report step/action tailored to the fork to replace this external dependency as the fork progresses — we don't need upstream parity since we never commit upstream. Located in .github/workflows/test.yml.

To dismiss a stale note: ctx_note(action="dismiss", note_id=N)
```

**Tool: read**

**Input:**
```json
{
  "filePath": "/Volumes/Topper2TB/Git/cloudhome/coordination_notes/jenkins-build-setup-reference.md"
}
```

**Output:**
```
  1: # Cloudhome Jenkins — Build Setup Reference
  2: 
  3: _Last updated: 2026-06-05_
  4: 
  5: Reference for an agent setting up a build through the Cloudhome Jenkins service.
  6: Covers three target variants: **Docker container**, **multi-arch binary**, and
  7: **Mac Apple Silicon**. This is a planning/reference document — no job exists in
  8: Jenkins yet (the controller is freshly deployed with zero jobs defined).
  9: 
 10: ---
 11: 
 12: ## Shared facts (all variants)
 13: 
 14: | Item | Value |
 15: |------|-------|
 16: | Controller | `jenkins-0` (2/2) in `jenkins` ns, pinned to `altos-worker-01` |
 17: | JCasC config | `k8s/base/apps/jenkins/jenkins-values.yaml` (no jobs defined yet) |
 18: | Auth | Authentik OIDC (`oic-auth` plugin) + local admin fallback |
 19: | Dynamic agents | K8s cloud, single `default` pod template, image `jenkins/inbound-agent:latest`, SA `jenkins-agent`, ns `jenkins`, **no privileged, no hostPath**, container cap 5 |
 20: | Agent RBAC | `jenkins-agent` / `jenkins-controller` Roles scoped to **`jenkins` ns only** (pods, pods/exec, pods/log, batch/jobs, secrets, configmaps). **No cross-namespace access.** |
 21: | NetworkPolicy | None on `jenkins` ns → free egress. `buildkit` ns is `default-deny-egress` + buildkitd ingress only from `app.kubernetes.io/component=buildkit-job` pods on TCP/1234 |
 22: | OCIR registry | `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/` |
 23: | OCIR push auth | `buildkit-ocir-creds` (dockerconfigjson, ESO from OCI Vault `buildkit-ocir-dockerconfig`) — lives in `buildkit` ns |
 24: | Clone creds | `<repo>-github-pat` in OCI Vault → ESO → `<repo>-clone-creds` secret (key `github-pat`) in `buildkit` ns |
 25: | Nodes / arch | `altos-worker-01`=amd64; `sj-b-worker-01`=arm64; `sj-a-edge-01`=arm64 (control, tainted) |
 26: | Artifact storage | Jenkins PVC (`local-altos`, 50Gi, ZFS-backed) on altos — `archiveArtifacts` lands here |
 27: 
 28: **Where a new job is defined:** add a `jobs:` block (Job-DSL / pipeline-job) to the
 29: JCasC `jenkins-values.yaml`, OR create a pipeline job pointing at a `Jenkinsfile`
 30: in the target repo. No seed job or Job-DSL exists today — the agent must add one.
 31: 
 32: **Key files:**
 33: - Jenkins JCasC + agent template: `k8s/base/apps/jenkins/jenkins-values.yaml`
 34: - Jenkins RBAC: `k8s/base/apps/jenkins/rbac.yaml`
 35: - Jenkins recipes: `ops/jenkins.just` (deploy/status/logs/restart)
 36: - Jenkins runbook: `docs/runbooks/Jenkins CI.md`
 37: - BuildKit Atlas job template (reuse pattern): `k8s/base/ops/buildkit/jobs/atlas-amd64.yaml`
 38: - buildkitd daemons: `k8s/base/ops/buildkit/buildkitd-amd64.yaml`, `buildkitd-arm64.yaml`
 39: - buildkit NetworkPolicy: `k8s/base/ops/buildkit/networkpolicy.yaml`
 40: - OCIR push ESO: `k8s/base/secrets/eso/externalsecret-buildkit-ocir.yaml`
 41: - Clone creds ESO: `k8s/base/secrets/eso/externalsecret-buildkit-clone.yaml`
 42: - Dispatcher + repo-map: `docker/build-dispatcher/src/index.js`, `repo-map.js`
 43: 
 44: ---
 45: 
 46: ## Variant 1 — Docker container target (→ OCIR image)
 47: 
 48: **Artifact:** OCI image pushed to OCIR (e.g. `atlas-php:<tag>`).
 49: 
 50: **Recommended approach:** Jenkins **triggers the existing BuildKit pipeline** —
 51: do NOT rebuild Docker-build infrastructure inside Jenkins.
 52: 
 53: | Need | Detail |
 54: |------|--------|
 55: | Build engine | Existing `buildkitd-amd64` (altos) / `buildkitd-arm64` (sj-b), already proven for `atlas-php` |
 56: | Job template | `k8s/base/ops/buildkit/jobs/<image>-<arch>.yaml` (suspended template; e.g. `atlas-amd64-template`) |
 57: | Trigger option A | POST to dispatcher `http://build-dispatcher.buildkit.svc.cluster.local:8080/dispatch` with `{repo,sha,branch}` + HMAC-SHA256 header (secret `buildkit-dispatcher-creds`) |
 58: | Trigger option B | Direct K8s API: GET suspended template, deep-clone, set `BUILD_SHA`, `suspend:false`, strip server metadata, POST via `generateName` |
 59: | RBAC gap to close | Path B needs a new Role+RoleBinding granting `jenkins-agent` SA `create/get/list` on `batch/jobs` in `buildkit` ns. Path A needs only network egress (already open) + the HMAC secret mounted into Jenkins. |
 60: | Egress | Already handled — `buildkitd-egress-registry-and-cache` allows TCP 80 (apt) + 443 (composer/npm/git/OCIR) to 0.0.0.0/0 except RFC1918 |
 61: | Pipeline shape | `stage('build'){ sh 'curl -X POST … /dispatch -H "X-Signature: $HMAC" -d @payload.json' }` then poll Job status to completion |
 62: 
 63: **Gotcha:** Jenkins' own agent pods cannot reach buildkitd directly (the buildkit
 64: NetworkPolicy blocks non-`buildkit-job` pods on TCP/1234). So Jenkins must either
 65: *create a build Job* (path B) or *call the dispatcher* (path A) — it cannot run
 66: `buildctl` itself from a plain agent pod.
 67: 
 68: ---
 69: 
 70: ## Variant 2 — Multi-arch binary target (linux amd64 + arm64)
 71: 
 72: **Artifact:** compiled binaries/archives (Go, Rust, C/C++…) for `linux/amd64` +
 73: `linux/arm64`, archived as Jenkins artifacts (or attached to a GitHub release).
 74: 
 75: **Recommended approach:** native compilation on **per-arch Jenkins agent pods**
 76: (no BuildKit needed).
 77: 
 78: | Need | Detail |
 79: |------|--------|
 80: | Agent templates | Add **two** pod templates to JCasC: `build-amd64` (nodeSelector `kubernetes.io/arch: amd64` → altos) and `build-arm64` (nodeSelector `arm64` → sj-b). Each uses a toolchain image (e.g. `golang:1.x`, `rust:1.x`) as the build container. |
 81: | Parallelism | `parallel { 'amd64': { node('build-amd64'){…} }, 'arm64': { node('build-arm64'){…} } }` |
 82: | Clone | Use `<repo>-github-pat` (or public clone) as a Jenkins credential — not the buildkit secret |
 83: | Artifacts | `archiveArtifacts artifacts: 'dist/**'` → lands on Jenkins PVC; or `gh release upload` with a PAT |
 84: | Cross-compile alt | For pure Go/Rust, build both arches on one amd64 agent (`GOARCH=arm64`, or `cargo --target aarch64-unknown-linux-gnu`) — simpler, but native-per-node is more reliable for cgo |
 85: | RBAC | None beyond default — agents run in `jenkins` ns where the SA already has rights |
 86: | Egress | Free (no jenkins-ns NetworkPolicy) — module/crate downloads over 443 work |
 87: 
 88: **Gotcha:** the default `jenkins/inbound-agent` image has no compiler. The agent
 89: must add toolchain pod templates (or a multi-tool custom agent image) — this is the
 90: main setup work for this variant.
 91: 
 92: ---
 93: 
 94: ## Variant 3 — Mac Apple Silicon target (darwin/arm64)
 95: 
 96: **Artifact:** macOS arm64 binary / `.app` / `.dylib` / signed+notarized bundle.
 97: 
 98: **Hard constraint — read first:** macOS/Xcode builds **cannot run in the Linux K8s
 99: cluster**. All Cloudhome nodes are Linux (OCI ARM + altos amd64). Apple's licensing
100: requires macOS builds on Apple hardware. This variant splits into two cases:
101: 
102: | Case | Feasible in-cluster? | Path |
103: |------|---------------------|------|
104: | **Pure Go/Rust → `darwin/arm64`** (no macOS SDK, no codesign) | ✅ Yes, cross-compile | A Linux agent with `GOOS=darwin GOARCH=arm64` (Go) or Rust + `zig cc` / `osxcross`. Produces an unsigned darwin binary. Same agent-template setup as Variant 2. |
105: | **Native macOS** (Swift, Xcode, `.app`, `codesign`, notarization, SwiftUI, Metal) | ❌ No | Requires a **macOS Jenkins agent on real Apple hardware** (e.g. the Mac Studio). |
106: 
107: **To set up the native macOS agent (the real Apple-silicon path):**
108: 
109: | Need | Detail |
110: |------|--------|
111: | Hardware | A macOS arm64 machine (Mac Studio) reachable from the Jenkins controller |
112: | Agent registration | Add a **permanent/static node** (or SSH-launch agent) in Jenkins → Manage Nodes, label `macos arm64`. Requires JDK 17+ on the Mac + the Jenkins agent JAR (JNLP inbound or SSH launcher) |
113: | Connectivity | Mac connects out to `jenkins-agent.jenkins.svc…:50000` (JNLP) — needs WireGuard/tunnel reachability, or SSH from controller to the Mac over WireGuard |
114: | Toolchain on Mac | Xcode + command-line tools; signing certs in the login keychain; notarization creds (App Store Connect API key) |
115: | Pipeline | Pin stage to the macOS node: `node('macos'){ sh 'xcodebuild …; codesign …; xcrun notarytool submit …' }` |
116: | Secrets | Codesign identity + notary key are **not** in OCI Vault today — would need to be added (Keychain on the Mac + Jenkins credentials) |
117: 
118: **Gotcha:** there is no macOS node wired into Cloudhome yet. Native Apple-silicon
119: builds require provisioning the Mac as a Jenkins agent first — net-new infra (node
120: registration + signing-cred management), not just a job definition.
121: 
122: ---
123: 
124: ## Setup checklist summary
125: 
126: | Variant | New job? | New agent template? | New RBAC? | New infra? |
127: |---------|:-:|:-:|:-:|:-:|
128: | 1 — Docker → OCIR | ✅ | ❌ (reuse buildkit) | ✅ (jenkins→buildkit Jobs) *or* HMAC only | ❌ |
129: | 2 — Multi-arch binary | ✅ | ✅ (amd64+arm64 toolchain pods) | ❌ | ❌ |
130: | 3a — darwin cross-compile | ✅ | ✅ (Linux + osxcross/zig) | ❌ | ❌ |
131: | 3b — native macOS | ✅ | ✅ (static macOS node) | ❌ | ✅ (Mac agent + signing creds) |
132: 
133: ---
134: 
135: ## Decision guidance
136: 
137: - **Need a container image?** → Variant 1. Reuse BuildKit; Jenkins only orchestrates.
138: - **Need Linux binaries for both arches?** → Variant 2. Per-arch agent pods, archive artifacts.
139: - **Need a macOS binary, pure Go/Rust, unsigned?** → Variant 3a. Cross-compile on Linux.
140: - **Need a signed/notarized `.app` or Xcode build?** → Variant 3b. Provision a macOS agent first; this is the only variant requiring net-new hardware/infra.

```

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md"
}
```

**Output:**
```
  1: # Draft: Release Watcher + Cloudhome BuildKit
  2: 
  3: ## Requirements (confirmed)
  4: - User is considering a clean fork of `@cortexkit/orw` into a more generic `release-watcher`.
  5: - Goal is to support more than OpenCode: other forks/projects with release or upstream-branch integration needs.
  6: - Candidate integration target: existing Cloudflare relay and cloudhome BuildKit process.
  7: - `unitySuperMCP` is a hard case because it adapts upstream features semantically rather than literally merging code.
  8: - V1 target is Cloudhome-hosted OpenCode release-watcher first.
  9: - Existing local `~/opencode-release-watch` ORW workflow must remain working until the Cloudhome variant is fully functional; cutover happens only after parity proof.
 10: - Cloudflare relay should be a full orchestrator in V1, not merely a thin queue.
 11: - Semantic adaptation repos are deferred. Future semantic mode should start as changelog/reporting only: forward release notes or summarize commits on a configured cadence.
 12: - V1 parity is not local Mac install parity. Success means Cloudhome's OpenCode instance at `code.rustybret.com` switches its container build pipeline to use release-watcher-produced artifacts.
 13: - Cloudhome is multi-arch: V1 must account for Linux amd64 and Linux arm64 artifacts, not just local darwin-arm64.
 14: - User correction: reuse the existing Cloudhome build-relay/build-dispatcher/BuildKit structure; do not design a separate greenfield platform.
 15: - User correction: do not assume R2 artifact serving/storage. Cloudhome has ample local storage; R2 is free-tier and should stay cache-only unless explicitly justified.
 16: - User correction: V1 should focus on building release-watcher artifacts first. Leave the current OpenCode container build flow unchanged until artifact production is proven.
 17: - User is reconsidering the execution substrate: BuildKit may be too container-image-specific for generic artifact builds, and a self-hosted Jenkins-style pipeline service on Cloudhome may be a better fit.
 18: - User preference: avoid paid cloud CI/build services when Cloudhome can host the build/delivery pipeline locally.
 19: - Cloudflare Workers are preferred for external service interaction/webhook ingress, not for making builds or delivering artifacts internally.
 20: - OCI database capacity is available, including PHX instances that may help avoid idle shutdown; Cloudhome already runs DB containers for Atlas, so release-watcher could use an OCI DB or in-cluster DB variant.
 21: - User selected **classic Jenkins LTS on K8s** as the CI/orchestration substrate.
 22: - macOS build/update path is explicitly deferred; local Mac ORW remains responsible for darwin-arm64 until a future Mac agent path is designed.
 23: - User selected dedicated release-watcher DB/storage from the start, not Jenkins-native build history alone.
 24: - Cloudhome repo should own the basic Jenkins service setup. This plan should not over-design Jenkins deployment internals; hold for Cloudhome details.
 25: 
 26: ## Technical Decisions
 27: - Treat as architecture planning, not implementation.
 28: - Current `orw` is OpenCode-specific and bin-only; memory says its only extension seam is config/prompt, while build verification/install paths are hardcoded to OpenCode artifacts.
 29: - A generic `release-watcher` likely needs explicit adapters/modes rather than stretching `orw` config.
 30: - Oracle recommendation: make `release-watcher` CLI-first with an internal library boundary; do not start as a daemon/service/GitHub Action.
 31: - Keep v1 boring: preserve current OpenCode ORW behavior, then replace hardcoded OpenCode constants with config fields.
 32: - Cloudflare relay should be control plane only; cloudhome BuildKit should be execution plane.
 33: - Semantic adaptation should produce reviewable Draft PRs by default, not auto-merge/install.
 34: - Revised after user input: Cloudflare relay is intentionally fuller than Oracle's conservative default for V1; plan should still isolate build/AI execution in Cloudhome BuildKit.
 35: - Revised after user input: semantic adaptation is out of V1; future semantic support should be reporting/changelog generation, not patch generation.
 36: - V1 should prioritize Cloudhome execution for OpenCode while keeping local ORW as the fallback/proven baseline.
 37: - Local Mac ORW remains the baseline/fallback until Cloudhome container artifact integration is proven.
 38: - Revised after user input: Cloudhome local/persistent storage should be the default durable artifact/evidence store for V1; R2 should not be used as the artifact source of truth.
 39: - Revised after user input: container pipeline integration is a later cutover step; first prove multi-arch OpenCode artifact production.
 40: - BuildKit is best understood as a container/image build engine. It is excellent for Dockerfile/OCI image builds and cache reuse, but not necessarily the right primary orchestrator for arbitrary CI workflows, native binary matrices, release notes, approval gates, and multi-project artifact management.
 41: - A Jenkins-style service may better match generic release-watcher needs: scheduled/webhook-triggered pipelines, durable build history, credentials, agents, artifact archiving, approvals, and per-project jobs.
 42: - Oracle consultation on BuildKit vs Jenkins agreed with the pivot:
 43:   - Jenkins should be the release-watcher orchestrator.
 44:   - BuildKit should stay a specialized builder for OCI/container image stages only.
 45:   - Cloudflare Worker should be external relay/webhook edge only, not builder, artifact store, or source of truth.
 46:   - Cloudhome DB/storage should be canonical for release state and artifacts.
 47:   - V1 OpenCode should stay narrow: detect release, merge `fork/local`, install deps, typecheck, build required Cloudhome artifacts, store checksums/logs, mark verified, optional manual promotion.
 48:   - macOS artifacts cannot be replaced by Linux Cloudhome unless a Mac Jenkins agent is added; local Mac ORW remains the macOS path.
 49: 
 50: ## Research Findings
 51: - Known from project memory: `@cortexkit/orw` is hardcoded around OpenCode release verification and install paths, so a generic fork likely requires source changes rather than configuration only.
 52: - Earlier synthesis identified three target integration modes:
 53:   - Literal overlay: direct forks with patch layers.
 54:   - Consumer validation: validate downstream consumers against released dependencies.
 55:   - Semantic adaptation: adapt feature intent into a different architecture/language.
 56: - Oracle proposed core pipeline phases: discover → prepare → integrate → build → validate → publish/install → record/notify.
 57: - Minimum abstraction should be project config with mode, source, workspace, integration spec, build commands, validation commands, publish targets, notify targets, and safety policy.
 58: - Safety gates needed: release authenticity, clean workspace, path allowlists, diff budgets, dependency policy, BuildKit isolation, validation contracts, rollback, and AI audit logs.
 59: - Run-state specialist recommendation:
 60:   - Cloudflare D1 should be authoritative for run records, leases, state transitions, retry counters, artifact manifests, promotion status, and active/candidate channel pointers.
 61:   - Cloudflare R2 should store immutable artifacts and evidence: per-arch binaries, logs, AI merge transcripts, diffs, checksums, manifests, and smoke-test evidence.
 62:   - Cloudhome BuildKit should be ephemeral execution/cache only: clone, merge, build, test, upload evidence; never source of truth.
 63:   - Container registry should store runtime images built from R2 artifacts; R2 remains source for binary inputs and release evidence.
 64:   - Suggested lifecycle: discovered → claimed → source_prepared → merge_running → merge_succeeded/failed → build_running → build_succeeded/failed → artifacts_published → container_candidate_built → smoke_testing → promoted/rejected.
 65:   - Immutable artifact keys should include run ID and arch; only `candidate.json` and `active.json` pointers should be mutable.
 66:   - Idempotency key should include project, upstream tag, fork base SHA, and target arch.
 67: - Existing Cloudhome build system found in `/Volumes/Topper2TB/Git/cloudhome`:
 68:   - `docs/runbooks/In-Cluster Image Builds.md` documents existing flow: GitHub push → Cloudflare Worker `build-relay.rustybret.com` → in-cluster `build-dispatcher` → per-arch BuildKit Jobs → OCIR push → multi-arch manifest assembly.
 69:   - `tofu/modules/cloudflare_build_relay/worker.js` is the Cloudflare build relay implementation location.
 70:   - `docker/build-dispatcher/` is the in-cluster dispatcher service.
 71:   - `docker/build-dispatcher/src/repo-map.js` maps repos to image targets; current `opencode` target is only `arm64`, while V1 release-watcher requires linux `amd64` + `arm64` artifacts.
 72:   - `k8s/base/ops/buildkit/` contains BuildKit namespace, amd64/arm64 buildkitd deployments, job templates, RBAC, and network policy.
 73:   - `ops/buildkit.just` exposes operator recipes; manual `trigger` is currently a stub that says to use webhook.
 74:   - `scripts/build-opencode-multiarch.sh` already supports Docker buildx multi-arch OpenCode image builds with args for `OPENCODE_REPO`, `OPENCODE_REF`, `OHMYOPENCODE_REPO`, `OHMYOPENCODE_REF`, `--platforms`, `--tag`, `--no-push`, and `--rollout`.
 75:   - `docker/opencode/Dockerfile` is the OpenCode container build context.
 76:   - `ops/opencode.just` and `scripts/build-opencode*.sh` are the current OpenCode deployment/build operator seam.
 77: - Existing build relay is webhook/push-oriented and image-oriented. Release-watcher V1 needs a release/tag-oriented trigger that can pass a produced artifact/manifest into the existing image build path.
 78: - Existing BuildKit already uses R2 for layer cache and OCIR for final images; release-watcher should not duplicate that, but may need an additional R2 artifact/evidence namespace for release-watcher-produced binaries and manifests.
 79: - User rejected R2 as release artifact store. Adjust plan to use Cloudhome-hosted storage for release-watcher artifacts/evidence, while preserving existing R2 layer-cache behavior for BuildKit.
 80: 
 81: ## Open Questions
 82: - What exactly is the Cloudflare relay responsible for today: webhook intake, artifact routing, build dispatch, status UI/API, or all of these?
 83: - What exactly is the cloudhome BuildKit process today: Kubernetes BuildKit builders, OCI registry, artifact store, deployment runner, or local-only build host?
 84: - Should `release-watcher` remain a standalone CLI, become a GitHub Action/composite workflow, become a service behind the Cloudflare relay, or expose all three surfaces?
 85: - Should first milestone be OpenCode parity only, or immediately support one non-OpenCode repo such as `atlas`?
 86: - What artifact target should cloudhome produce: OCI images, GitHub draft PRs, downloadable binaries, locally installed binaries, or status-only evidence?
 87: - Which repo should be target #2 after preserving OpenCode parity: `atlas`, `godot-mcp`, `symphonyStudio`, or `unitySuperMCP`?
 88: - Should semantic adaptations ever auto-merge, or always stop at Draft PR + evidence?
 89: - Should run state live locally first, in Cloudflare D1 first, or both?
 90: - What Cloudflare relay and Cloudhome BuildKit code/config already exists, and what interfaces should the plan reuse?
 91: - What exact parity proof is required before switching from local ORW to Cloudhome release-watcher?
 92: - Should Cloudhome install built artifacts back onto the Mac, publish them to an artifact store, or only prove build success at V1?
 93: - Run-state placement is undecided; user requested specialist input on whether state should live in Cloudflare D1/R2, BuildKit-local evidence, both, or another store.
 94: - Should release-watcher integrate as an extension of the existing `build-relay` / `build-dispatcher`, or as a separate Cloudflare Worker + dispatcher sharing BuildKit resources?
 95: - Should V1 produce standalone OpenCode linux binaries in R2 first, then build the container from them, or should it directly produce the final multi-arch OpenCode container image?
 96: - Should the current `opencode` build target be expanded from arm64-only to amd64+arm64 as part of release-watcher V1?
 97: - What exact Cloudhome storage path/PVC/NFS/ZFS dataset should hold release-watcher artifacts, logs, manifests, and evidence?
 98: - What retention policy should apply to locally stored artifacts: keep N releases, keep N days, or keep all until manual pruning?
 99: - If not D1, what should be the authoritative run-state store: local SQLite/Postgres on Cloudhome, files next to artifacts, Kubernetes CRDs/jobs, or Cloudflare D1 only for status metadata?
100: - Should the execution plane pivot from BuildKit-first to Jenkins-first, with BuildKit retained only for container image build stages?
101: - If Jenkins is used, should release-watcher become a Jenkins pipeline/job generator, a standalone CLI invoked by Jenkins, or a service that Jenkins calls?
102: - Which database should release-watcher use for V1 run state: OCI Autonomous DB, in-cluster Postgres/MariaDB, Jenkins native build history + artifact archive, or local SQLite?
103: - If Jenkins is selected, should we deploy classic Jenkins, Jenkins LTS Helm chart, or consider a lighter self-hosted CI alternative before committing?
104: - Should V1 use Jenkins-native build history plus artifact archive initially, or create a dedicated release-watcher DB from the start?
105: - Which Cloudhome storage backend should hold artifacts: ZFS-backed PVC, OCI block/volume, NFS-style share, or object-store-like local service?
106: - Waiting for Cloudhome-side details on Jenkins service shape, storage backend, DB choice, and operator conventions.
107: 
108: ## Coordination Requirements for Cloudhome Jenkins Setup
109: - Deploy classic Jenkins LTS on K8s as a self-hosted CI/orchestration service.
110: - Jenkins must be able to run release-watcher pipelines for OpenCode without disrupting the existing local Mac ORW setup.
111: - Jenkins V1 does not need macOS workers; Linux amd64/arm64 support is enough for Cloudhome artifacts.
112: - Jenkins should have access to dedicated release-watcher DB/storage from the start.
113: - Jenkins should be able to run jobs that clone private GitHub repos/branches and use required secrets without embedding long-lived credentials in job definitions.
114: - Jenkins should preserve logs and job evidence, but the release-watcher DB/storage remains canonical for release state and artifacts.
115: - BuildKit remains available as a downstream build primitive for container image stages, not the primary release-watcher orchestrator.
116: - Cloudflare Workers/relay should remain ingress/external-trigger glue only.
117: 
118: ## Scope Boundaries
119: - INCLUDE: architecture for a generic watcher, adapter model, Cloudflare relay/buildkit integration shape, safety gates, and migration path from current `orw`.
120: - EXCLUDE: implementation until a work plan is generated and handed to execution.
121: 
122: ## Candidate Cutover Gates
123: - Both Linux artifacts exist: `linux-amd64` and `linux-arm64`.
124: - Cloudhome-hosted artifact digests match manifest.
125: - Artifacts execute in matching Linux runtime and expose expected OpenCode version/metadata.
126: - Merge evidence proves upstream release + `fork/local` customization layer.
127: - Initial V1 gate: release-watcher produces validated Cloudhome-hosted artifacts without changing the existing container build flow.
128: - Later cutover gate: Cloudhome container build consumes release-watcher artifacts, not local Mac output.
129: - Candidate `code.rustybret.com` container starts and passes smoke checks.
130: - Previous active manifest/image remains rollback target.
131: - Local Mac ORW remains unchanged until Cloudhome path is promoted.

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 97.6s)

_Thinking:_

 I've got the Jenkins build setup reference from Cloudhome, which outlines three build variants: Docker container targeting OCIR, multi-architecture binaries for Linux, and Mac Apple Silicon support. For the V1 OpenCode release-watcher, I need to figure out which variant fits our requirements based on what the user specified.

The user's most recent direction is to focus on building artifacts first and leave the container build flow as-is for now. That means V1 should produce multi-arch Linux artifacts (amd64 + arm64), which maps to Variant 2 in the Jenkins doc. OpenCode builds a standalone binary using Bun's compile feature, so the pipeline would need to handle Bun as the toolchain rather than Go or Rust—either through a custom agent image or by installing Bun in the existing agent.

For the release-watcher pipeline, I'm mapping out the workflow: detect the upstream OpenCode release tag, clone and merge the fork with curated PRs applied, run type checking, build the standalone binary for both Linux architectures, then archive the artifacts with checksums.

The tricky part is the AI merge step—it requires running OpenCode itself inside the Jenkins agent with Bun and Anthropic API credentials available, which adds complexity around non-interactive execution and credential management.

Looking at the Jenkins setup from the reference doc, the controller exists with JCasC configuration, auth is handled via Authentik OIDC, and agents are dynamically spawned as Kubernetes pods with a single default template. The RBAC is scoped to the Jenkins namespace only, which means triggering BuildKit jobs would require either new RBAC rules or using a dispatcher approach.

For our case with Variant 2, I need to add two pod templates—one for amd64 and one for arm64—each with a toolchain image to handle parallel builds across architectures. The default inbound-agent lacks a compiler, so the main setup work is creating these toolchain pod templates or a custom agent image with Bun included. There's a tension here: Jenkins naturally archives artifacts to its PVC on the ZFS-backed storage, but the user wants a dedicated release-watcher database for run state from the start, so I need to clarify how these two storage approaches coexist and who owns the Jenkins service setup versus the dedicated infrastructure.

Looking at the actual Cloudhome repo, I'm realizing there's a key mismatch—the existing OpenCode build flow uses `scripts/build-opencode-multiarch.sh` to produce a container image via Docker buildx, which is Variant 1. But the user's guidance was to focus on binary artifacts first in Variant 2, leaving the container build as-is. So I need to reconcile what "artifacts" means in this context and whether we're actually shifting the build strategy or just adding Jenkins orchestration around the existing container build. artifacts" does the user mean? Let me reconsider. The OpenCode deployment at code.rustybret.com runs as a container. The container is built from source via the Dockerfile. The "artifact" in the OpenCode context could be:
(a) The standalone Bun binary (Variant 2), OR
(b) The container image (Variant 1)

The user's statement "focus on building the artifacts first, leave the container build flow as is for now" suggests the artifacts are something *other than* the container — i.e., the binary or the merged source. The idea being: release-watcher produces the merged+built artifact, and *later* the container flow consumes it.

So the sequence is: V1 has release-watcher produce validated artifacts (merged binary for linux amd64+arm64) stored on Cloudhome, with the container flow unchanged for now. Later, the container flow can consume those artifacts.

For V1, I think the cleanest approach is: release-watcher detects releases, AI-merges the fork/local changes plus curated PRs onto the release tag, produces both a merged source tree and built standalone binaries for both architectures, validates them with typechecking and smoke tests, then archives everything to Cloudhome storage with run state recorded in a database. The existing container flow stays untouched until we're ready to point it at these artifacts.

I need to verify what the actual build outputs are and how the Dockerfile works, so I should check the multiarch build script, the Dockerfile itself, and the build dispatcher config to ground my understanding. The core tension is whether V1 should produce a merged git ref that the container flow can consume later, or standalone binaries — the former is a minimal integration point but doesn't feel like "building artifacts," while the latter requires reworking how the container pipeline consumes its inputs.

Given the constraint to leave the container flow untouched for now, I think V1's real deliverable is the validated binaries themselves plus the merged ref as a byproduct; the binaries prove the merge is sound, and we defer the container cutover decision to later.

Beyond that, the main unknowns are whether the AI merge can run non-interactively in a headless Kubernetes pod (we've tested it locally but not in that environment), whether to build binaries natively per architecture or cross-compile on a single node, and how to wire Anthropic credentials securely through OCI Vault into the Jenkins agent.

For the database, the user's leaning toward an in-cluster Postgres variant like atlas uses or OCI's managed option—either way it's a Cloudhome-owned resource I should flag as a coordination point rather than design myself. On triggering, I can start simple with Jenkins polling the upstream releases on a cron, then layer in the Cloudflare Worker webhook path later. And since V1 doesn't need BuildKit at all, I can skip the cross-namespace RBAC complexity.

So V1 actually shapes up pretty cleanly: custom agent images with the right tooling, two pod templates for the architectures, credentials wired through ESO and Jenkins patterns, a Jenkinsfile in the fork, the dedicated database for state, and artifact storage on the PVC. I should verify a few specifics against the actual repo—whether jenkins-values.yaml matches the doc's shape, if the opencode target is truly arm64-only, whether that PVC actually exists—but for planning purposes I can treat the doc as a working hypothesis and flag those as verification tasks. The main open questions are still what counts as an artifact and how the trigger mechanism works, so I'm not quite ready to write the full plan yet.

The user asked me to continue the draft, not jump straight to a plan, so the right move is to update it with what I've learned about the Jenkins setup and the simplified V1 architecture, then surface the key decisions that need user input before I can lock in the structure. I should do a few targeted checks on the actual repo—specifically the build script and Dockerfile to confirm how OpenCode gets packaged and what the natural handoff point is—then present those findings and the decision set back to the user.

Read the Jenkins reference and my full draft. The doc is genuinely useful and notably **simplifies V1** — let me ground the two most decision-relevant assumptions against the actual cloudhome repo before I update the draft (you warned the doc is a first-trial, so I'm verifying what the OpenCode build actually produces and how the container consumes it).

**Tool: bash**

**Input:**
```json
{
  "command": "cd ~/Git/cloudhome 2>/dev/null || cd /Volumes/Topper2TB/Git/cloudhome; echo \"=== repo root ===\"; pwd; echo; echo \"=== jenkins values exists? ===\"; ls -la k8s/base/apps/jenkins/ 2>/dev/null; echo; echo \"=== opencode build script head ===\"; sed -n '1,60p' scripts/build-opencode-multiarch.sh 2>/dev/null; echo; echo \"=== opencode Dockerfile ===\"; sed -n '1,80p' docker/opencode/Dockerfile 2>/dev/null",
  "description": "Verify Jenkins + opencode build assumptions in cloudhome"
}
```

**Output:**
```
1.2.3  # custom tag
#   ./scripts/build-opencode-multiarch.sh --platforms linux/amd64  # single-arch override
#   ./scripts/build-opencode-multiarch.sh --no-cache    # force full rebuild

set -euo pipefail

REGISTRY_HOST="${OCIR_REGISTRY:-ocir.us-sanjose-1.oci.oraclecloud.com}"
REGISTRY_NAMESPACE="${OCIR_NAMESPACE:-axarjcg9zmg6}"
TAG="${OPENCODE_IMAGE_TAG:-latest}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
OPENCODE_REPO="${OPENCODE_REPO:-https://github.com/anomalyco/opencode}"
OPENCODE_REF="${OPENCODE_REF:-main}"
OHMYOPENCODE_REPO="${OHMYOPENCODE_REPO:-https://github.com/code-yeongyu/oh-my-openagent}"
OHMYOPENCODE_REF="${OHMYOPENCODE_REF:-main}"
PUSH=true
ROLLOUT=false
NO_CACHE=false

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "${REPO_ROOT}/scripts/export-ocir-vars.sh" ]]; then
  # shellcheck source=/dev/null
  source "${REPO_ROOT}/scripts/export-ocir-vars.sh"
  REGISTRY_HOST="${OCIR_REGISTRY:-${REGISTRY_HOST}}"
  REGISTRY_NAMESPACE="${OCIR_NAMESPACE:-${REGISTRY_NAMESPACE}}"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)                TAG="$2"; shift 2 ;;
    --platforms)          PLATFORMS="$2"; shift 2 ;;
    --ref)                OHMYOPENCODE_REF="$2"; shift 2 ;;
    --repo)               OHMYOPENCODE_REPO="$2"; shift 2 ;;
    --opencode-repo)      OPENCODE_REPO="$2"; shift 2 ;;
    --opencode-ref)       OPENCODE_REF="$2"; shift 2 ;;
    --ohmyopencode-repo)  OHMYOPENCODE_REPO="$2"; shift 2 ;;
    --ohmyopencode-ref)   OHMYOPENCODE_REF="$2"; shift 2 ;;
    --no-push)            PUSH=false; shift ;;
    --rollout)            ROLLOUT=true; shift ;;
    --no-cache)           NO_CACHE=true; shift ;;
    *)                    echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "${REGISTRY_HOST}" || -z "${REGISTRY_NAMESPACE}" ]]; then
  echo "ERROR: OCIR registry values are missing." >&2
  echo "Set OCIR_REGISTRY and OCIR_NAMESPACE, or run from a repo with sj-a tofu outputs." >&2
  exit 1

=== opencode Dockerfile ===
# OpenCode server image
# Multi-arch: builds for linux/amd64 and linux/arm64 via Buildx.
# Uses production OpenCode + oh-my-opencode plugin pulled from source.
#
# Build:
#   docker buildx build --platform linux/amd64,linux/arm64 \
#     -t ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/opencode:latest \
#     --push .
#
# Override repos/refs:
#   --build-arg OPENCODE_REPO=https://github.com/your-fork/opencode
#   --build-arg OHMYOPENCODE_REPO=https://github.com/rustybret/oh-my-openagent

ARG OPENCODE_REPO=https://github.com/anomalyco/opencode
ARG OPENCODE_REF=main
ARG OHMYOPENCODE_REPO=https://github.com/code-yeongyu/oh-my-openagent
ARG OHMYOPENCODE_REF=main

# ── Stage 1: build opencode (Bun monorepo) ───────────────────────────
FROM oven/bun:1 AS opencode-builder

ARG OPENCODE_REPO
ARG OPENCODE_REF

RUN apt-get update && apt-get install -y --no-install-recommends \
  git ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth 1 "${OPENCODE_REPO}" opencode \
  && cd opencode \
  && (git fetch --depth 1 origin "${OPENCODE_REF}" && git checkout FETCH_HEAD) 2>/dev/null || true

WORKDIR /src/opencode
RUN bun install

WORKDIR /src/opencode/packages/opencode
# --single compiles only for the current platform (linux/amd64 or linux/arm64)
# The build script auto-detects the container platform.
ENV PYTHON=python3
RUN bun run script/build.ts --single \
    && ln -sfn opencode-linux-x64 opencode-linux-amd64 \
    && mv /src/opencode/packages/opencode/dist/opencode-linux-x64 /src/opencode/packages/opencode/dist/opencode-linux-amd64 || true

# ── Stage 2: build oh-my-opencode plugin (Bun) ────────────────────────
FROM oven/bun:1 AS ohmyopencode-builder

ARG OHMYOPENCODE_REPO
ARG OHMYOPENCODE_REF

RUN apt-get update && apt-get install -y --no-install-recommends \
  git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /src
RUN git clone --depth 1 "${OHMYOPENCODE_REPO}" oh-my-opencode \
  && cd oh-my-opencode \
  && (git fetch --depth 1 origin "${OHMYOPENCODE_REF}" && git checkout FETCH_HEAD) 2>/dev/null || true

WORKDIR /src/oh-my-opencode
RUN bun install --frozen-lockfile --ignore-scripts 2>/dev/null || bun install --ignore-scripts
RUN bun build src/index.ts --outdir dist --target bun --format esm --external @ast-grep/napi --external zod

# ── Stage 3: runtime image ────────────────────────────────────────────
FROM ubuntu:24.04

# BuildKit injects TARGETARCH (amd64 or arm64) and TARGETPLATFORM (linux/amd64 or linux/arm64)
ARG TARGETARCH
ARG TARGETPLATFORM

ENV DEBIAN_FRONTEND=noninteractive \
  HOME=/root

# Runtime deps: Node.js LTS and ripgrep (required by opencode binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl ca-certificates ripgrep git \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*


[output truncated; full output at /Users/brethoffman/.local/share/cortexkit/aft/opencode/bash-tasks/c0c4d1509ff1237a/bash-333bc368.stdout]

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

**Tool: bash**

**Input:**
```json
{
  "command": "cd ~/Git/cloudhome 2>/dev/null || cd /Volumes/Topper2TB/Git/cloudhome; echo \"=== opencode repo-map target ===\"; grep -n -A8 \"opencode\" docker/build-dispatcher/src/repo-map.js 2>/dev/null | head -40; echo; echo \"=== any existing Jenkinsfile in cloudhome? ===\"; find . -name \"Jenkinsfile*\" -not -path \"*/node_modules/*\" 2>/dev/null | head; echo; echo \"=== jenkins-values jobs/agent snippet ===\"; grep -n -i \"jobs:\\|podTemplate\\|inbound-agent\\|nodeSelector\\|archiveArtifacts\\|local-altos\" k8s/base/apps/jenkins/jenkins-values.yaml 2>/dev/null | head -40",
  "description": "Check opencode repo-map and existing Jenkins job patterns"
}
```

**Output:**
```
=== opencode repo-map target ===
17:// The cloudhome repo is special: pushing to it rebuilds the opencode image AND
18-// the multi-arch ultrabot images, because those build contexts live in-repo.
19-
20-/**
21- * @typedef {Object} BuildTarget
22- * @property {string} image
23- * @property {string | string[]} arch
24- * @property {string} jobTemplate
25- */
--
35:  opencode: [
36:    { image: "opencode", arch: "arm64", jobTemplate: "opencode-arm64" },
37-  ],
38-  cloudhome: [
39:    { image: "opencode", arch: "arm64", jobTemplate: "opencode-arm64" },
40-    {
41-      image: "ultrabot-gp-dev",
42-      arch: ["amd64", "arm64"],
43-      jobTemplate: "ultrabot-gp-dev",
44-    },
45-    {
46-      image: "ultrabot-cluster-admin",
47-      arch: ["amd64", "arm64"],

=== any existing Jenkinsfile in cloudhome? ===

=== jenkins-values jobs/agent snippet ===
23:  nodeSelector:
27:    cloudhome.rustybret.com/planned-storage-class: local-altos
112:                        image: "jenkins/inbound-agent:latest"
121:    repository: jenkins/inbound-agent
135:  storageClass: local-altos

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 44.3s)

_Thinking:_

 I've verified the key assumptions against the actual cloudhome repository and found something significant: the OpenCode Dockerfile already has the capability to build both the fork and oh-my-opencode from source using build arguments for the repository URLs and references, which substantially simplifies what needs to be implemented for V1.

The build script already supports multi-architecture builds for both amd64 and arm64 by default, and the actual binary compilation happens inside the container build itself rather than as a separate step — the fork integration occurs through build-args that clone the specified fork and plugin versions during the container build process. This means the release-watcher for OpenCode just needs to detect upstream release tags and trigger the existing build script with the appropriate reference parameters, rather than managing a complex multi-step artifact pipeline.

The key tension is that the fork model keeps `fork/local` rebased onto upstream via the sync-upstream workflow, so the Dockerfile can simply clone that branch and get the integrated result without needing AI-driven merging — but the curated upstream PRs that orw handles aren't automatically included in the Dockerfile build, so we'd need either a pre-merge step that produces an integration branch or a way to push the integrated result to a reference that the Dockerfile can clone.

This is really the core architectural decision for V1, so I should capture these findings in the draft and present a clear synthesis with the remaining decision points rather than continuing to spiral on the investigation.

Let me update the draft with the key research findings and then present the reframe and open questions.

I have grounded the key assumptions. The findings significantly reframe V1 — let me record them in the draft, then present the synthesis.

**Two decisive findings:**
1. The OpenCode **Dockerfile already integrates fork + oh-my-opencode** via build-args (`OPENCODE_REPO/REF`, `OHMYOPENCODE_REPO/REF`) and Stage 1 compiles the binary *inside* the image build. So the container build **is** the integration step — there's no separate "binary artifact" to produce first.
2. `build-opencode-multiarch.sh` **already defaults to `linux/amd64,linux/arm64`** — multi-arch is built-in; only the `repo-map.js` dispatcher entry is pinned arm64-only.

This makes OpenCode V1 a **Variant 1 (Docker→OCIR)** job, not Variant 2 (standalone binaries). Let me update the draft.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "- User rejected R2 as release artifact store. Adjust plan to use Cloudhome-hosted storage for release-watcher artifacts/evidence, while preserving existing R2 layer-cache behavior for BuildKit.",
  "newString": "- User rejected R2 as release artifact store. Adjust plan to use Cloudhome-hosted storage for release-watcher artifacts/evidence, while preserving existing R2 layer-cache behavior for BuildKit.\n\n## Jenkins Reference + Cloudhome Verification (2026-06-05)\n- Cloudhome agent onboarded Jenkins and wrote `coordination_notes/jenkins-build-setup-reference.md` (treat as first-trial, verify before relying).\n- Jenkins controller `jenkins-0` is live in `jenkins` ns, pinned to `altos-worker-01`, JCasC at `k8s/base/apps/jenkins/jenkins-values.yaml` with ZERO jobs defined yet. Auth via Authentik OIDC + local admin. Verified: jenkins-values.yaml exists, uses `jenkins/inbound-agent:latest`, storageClass `local-altos` (50Gi ZFS PVC for archiveArtifacts).\n- Doc defines 3 variants: V1 Docker→OCIR (reuse BuildKit, Jenkins orchestrates), V2 multi-arch binary (per-arch toolchain agent pods), V3 macOS (3a cross-compile / 3b native Mac agent — net-new infra).\n- **DECISIVE REFRAME — OpenCode is Variant 1, not Variant 2.** Verified in cloudhome repo:\n  - `docker/opencode/Dockerfile` ALREADY integrates fork + omo via build-args: `OPENCODE_REPO`, `OPENCODE_REF`, `OHMYOPENCODE_REPO`, `OHMYOPENCODE_REF`. Stage 1 runs `bun run script/build.ts --single` (compiles binary INSIDE the image build, auto-detects container arch). Stage 2 builds omo plugin. Stage 3 = ubuntu:24.04 runtime.\n  - So the container build IS the fork-integration step. No separate standalone-binary artifact is needed first — earlier draft assumption (binaries → then container) is obsolete for OpenCode.\n  - `scripts/build-opencode-multiarch.sh` already defaults `PLATFORMS=linux/amd64,linux/arm64` (buildx multi-arch). Multi-arch is already solved at the script level.\n  - The ONLY arch gap is `docker/build-dispatcher/src/repo-map.js`: `opencode` target = `{ image: \"opencode\", arch: \"arm64\", jobTemplate: \"opencode-arm64\" }` (arm64-only). amd64 needs an added target entry + an `opencode-amd64` job template.\n  - No Jenkinsfile exists anywhere in cloudhome yet — net-new.\n- **Integration philosophy gap (key V1 design question):**\n  - orw (local Mac) AI-merges fork/local + curated PRs onto each release TAG (handles conflicts via AI).\n  - Dockerfile just `git clone`s a repo@ref — NO AI merge, NO curated-PR handling.\n  - But fork/local is ALREADY rebased onto dev (= upstream mirror) by the sync-upstream workflow, so cloning fork/local yields the integrated result WITHOUT AI merge — as long as fork/local is current.\n  - Curated upstream PRs (the 5 we watch) are the wrinkle: the Dockerfile can't apply them. V1 must decide how curated PRs enter the cloudhome build (pre-merge ref/branch the Dockerfile clones, vs an AI-merge pre-step that pushes an integration branch)."
}
```

**Output:**
```
Edited (+16/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 25.1s)

_Thinking:_

 I'm zeroing in on the core design question: how do curated upstream PRs get integrated into the cloudhome build when the fork is already rebased onto dev? The container build itself serves as the fork-integration step in this Variant 1 architecture, so I need to think through the integration philosophy and where that gap lies.

I'm weighing three approaches: pre-merging fork and curated PRs onto the release tag before the Dockerfile clones it, skipping curated PRs in V1 and just cloning the already-integrated fork, or running the merge logic as a Jenkins pre-stage before triggering the container build. I should update the draft with these technical decisions and remaining open questions, then present a clear synthesis with a recommendation to the user.

I've grounded the design against the actual cloudhome repo. The findings substantially simplify V1 but surface one real design fork. Let me record the technical decisions, then present.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Open Questions",
  "newString": "## Technical Decisions (post-Jenkins-reference)\n- OpenCode V1 = Jenkins **Variant 1 (Docker→OCIR)**: Jenkins orchestrates, BuildKit/buildx builds the image, OCIR stores it. NOT a standalone-binary job.\n- Jenkins is the release-watcher orchestrator; the existing `build-opencode-multiarch.sh` + `docker/opencode/Dockerfile` are the build primitive (already fork+omo-aware, already multi-arch-default).\n- V1 must add an `opencode-amd64` BuildKit job template + an amd64 entry in `repo-map.js` (current is arm64-only) to satisfy the multi-arch cutover gate.\n- V1 must define the first Jenkinsfile/pipeline-job (none exist in cloudhome today).\n- Local Mac ORW stays untouched and authoritative for darwin-arm64 until the Cloudhome image path is promoted.\n- Curated-PR integration is the one genuine design fork (see open questions) — fork/local alone is already integration-complete vs upstream, but the 5 watched PRs are not in fork/local.\n\n## Open Questions"
}
```

**Output:**
```
Edited (+8/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 27.5s)

_Thinking:_

 I've synthesized the research and updated the draft, so now I'm ready to present the findings to the user. There's one critical design decision I need to resolve around curated-PR integration before this moves from planning into execution—that's the genuine fork in the approach. Let me lay out the synthesis clearly and pose that key question to move forward.

I've read the Jenkins reference and verified its key claims against the actual cloudhome repo. The findings **substantially simplify V1** but surface one genuine design fork I need your call on.

## What the verification changed

**OpenCode V1 is simpler than the draft assumed — it's a Variant 1 (Docker→OCIR) job, not a standalone-binary pipeline.**

| Assumption (old) | Verified reality |
|---|---|
| Build standalone linux binaries first, then container later | The `docker/opencode/Dockerfile` **already compiles the binary inside the image build** (Stage 1: `bun run script/build.ts --single`) and **already integrates fork + oh-my-opencode** via build-args (`OPENCODE_REPO/REF`, `OHMYOPENCODE_REPO/REF`) |
| Multi-arch is net-new work | `build-opencode-multiarch.sh` **already defaults to `linux/amd64,linux/arm64`** via buildx |
| Need R2/dedicated artifact store for binaries | The artifact **is** the OCIR image; no separate binary artifact needed for OpenCode |

So the container build **is** the fork-integration step. The only real arch gap: `repo-map.js` pins `opencode` to **arm64-only** — V1 adds an `opencode-amd64` job template + dispatcher entry.

## The one genuine design fork: how do curated PRs enter the cloudhome build?

This is the crux, and it's the thing the Jenkins doc doesn't address.

- **orw (local Mac)** AI-merges `fork/local` **+ 5 curated upstream PRs** onto each release tag, resolving conflicts with Opus.
- **The Dockerfile** just `git clone`s a repo@ref — no AI merge, no PR application.
- **`fork/local` is already rebased onto `dev`** (the upstream mirror) by `sync-upstream`, so cloning `fork/local` gives you the integrated fork **without** any AI step. That part is free.
- **But the 5 curated PRs are not in `fork/local`** — they only exist in orw's ephemeral merge. The cloudhome build has no way to include them as-is.

**Three ways to resolve this — which do you want for V1?**

1. **Drop curated PRs from cloudhome V1** — cloudhome builds `fork/local`@release only (no curated PRs). Simplest; the image = fork + upstream, minus the 5 PRs. orw on the Mac keeps doing the full curated merge for your local binary. *Cleanest V1, but cloudhome ≠ local content.*

2. **AI-merge pre-step in Jenkins** — Jenkins runs an `opencode run` merge stage (like orw does) that produces an integration branch/ref including the curated PRs, pushes it to the fork, then the Dockerfile clones that ref. *Full parity with local orw, but pulls the AI-merge complexity into Cloudhome — and needs an opencode binary + auth on a Jenkins agent.*

3. **Persist an integration branch via sync-upstream** — extend the `sync-upstream` workflow to also produce/maintain a `fork/integration` branch (fork/local + curated PRs, AI-merged once per upstream change), which both orw and cloudhome consume. *Single source of truth for "fully integrated," but changes the git/branch model we just stabilized.*

My lean is **Option 1 for V1** (prove the Cloudhome Jenkins→image path with the simplest possible content), then graduate to Option 3 once the pipeline is trusted — because Option 3 gives both orw and cloudhome one clean integration ref without putting AI-merge inside Jenkins.

Which option do you want for V1 — and do you agree with deferring curated-PR parity until the basic pipeline is proven?

---

## User

---

## Assistant (Atlas - Plan Executor · MiMo V2.5 Free · 15.6s)

_Thinking:_

The boulder complete nudge is a duplicate (4th time). I already printed the ORCHESTRATION COMPLETE summary multiple times. The user's actual pending question is about how curated PRs enter the cloudhome build (Options 1/2/3). I should acknowledge the duplicate nudge briefly and redirect to the pending decision.

Duplicate boulder-complete nudge (already printed summary at 836). Not re-printing.

The pending decision: how do curated PRs (the 5 upstream PRs orw watches) enter the cloudhome build?

1. **Drop curated PRs from cloudhome V1** — cloudhome builds `fork/local`@release only. Simplest; full parity deferred.
2. **AI-merge pre-step in Jenkins** — Jenkins runs `opencode run` merge stage like orw does.
3. **Persist a `fork/integration` branch via sync-upstream** — single source of truth for "fully integrated," consumed by both orw and cloudhome.

My lean: Option 1 for V1, graduate to Option 3 later. Which one?

---

## User

oh, cloudhome is tripping you up because it has a docker container build pipeline for its opencode instance based on the production upstream opencode repo, but that stale, and not what we want at all. the way cloudhome uses opencode is going to change dramatically once this is done.  its also wrong about not being able to build apple silicon binaries, its totally capable using its cross platform compiler. i think gcc? cloudhome knows about jenkins, but it doesnt know about our plans. to remind you of the primary goal: build a project agnostic version of ORW that can perform the same functions for all our forked versions of upstream repos, using a shared infrastructure based on jenkins and cloudhome. jenkins runs the build automation, including PR merge and headless opencode agent sessions, cloudflare woekers relay signals from outside services into cloudhome, github webhooks fire CInbuilds into cloudflare/jenkins, the buildkit creates docker images for the cloudhome OCI registry, but we can also produce docker image via jenkins directly. artifact storage, logs, db use cloudhome resources and storages, either running db using a variant container node to a db we already host, or using the free OCI mySQL databases. 

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 65.4s)

_Thinking:_

 The user is reframing the project scope—Cloudhome's existing Docker pipeline for opencode is outdated and shouldn't be treated as the integration target, since the approach will change significantly. I need to set aside assumptions based on that legacy setup and reconsider how Apple Silicon binaries fit into the new direction.

Cloudhome can actually cross-compile darwin/arm64 binaries using gcc or Bun's built-in cross-compilation targets, so deferring macOS builds to a native Mac agent may not be necessary. The coordination doc I was referencing was generic Jenkins onboarding, not specific to this project's actual needs.

The real goal is building a project-agnostic version of the release watcher that works across all forked upstream repos using shared Jenkins and Cloudhome infrastructure—Jenkins handles build automation and headless opencode sessions, Cloudflare Workers relay external signals, GitHub webhooks trigger CI builds, and BuildKit or Jenkins directly can produce OCI images for the registry, with artifact storage and logs living in Cloudhome resources.

This reframes the whole approach away from integrating with an existing stale pipeline toward something much larger and more ambitious. I need to update my understanding of the architecture, capture the component responsibilities clearly, and identify what decisions still need to be made before this becomes actionable.

The release-watcher becomes the project-agnostic orchestration layer that sits on top of Jenkins and cloudhome infrastructure, generalizing the per-project configuration (modes, source repos, build commands, artifact targets, validation) and connecting back to the three-mode architecture from earlier. But the critical missing piece is understanding what cloudhome's new opencode consumption will actually look like—the user mentioned it'll change dramatically, and that shapes what V1 should produce.

I'm realizing there are a few genuinely blocking questions here: whether V1 is still OpenCode-first now that the stale pipeline is discarded, what the actual V1 artifact should be, the database choice between an atlas-style container variant or OCI MySQL, and whether macOS cross-compilation is in scope. Rather than keep speculating, I should present these blocking questions back to the user efficiently and get clarity on the unknowns that matter most for structuring a real plan. The existing cloudhome opencode Docker pipeline is outdated and won't reflect how we'll actually use it going forward. I'm also realizing that macOS and Apple Silicon binaries are actually buildable on cloudhome itself through cross-compilation—Bun supports `bun-darwin-arm64` cross-compilation from Linux, and cloudhome can use gcc for that too, which means the constraint about keeping a local Mac agent could potentially be lifted later. Cloudhome is familiar with Jenkins but doesn't know our release-watcher architecture yet, so I need to clarify whether we're planning the entire project-agnostic release-watcher system across all forked repos, or just V1 with OpenCode on the new infrastructure. Before I draft the plan, I should confirm the scope and then ask focused questions about the database approach (atlas-variant container versus free OCI MySQL) and how Jenkins will produce Docker images (directly or via buildkit).

The user just substantially reframed the goal. Three big corrections: (1) cloudhome's existing opencode Docker pipeline is **stale and irrelevant** — don't anchor on it; (2) cloudhome **can** cross-compile Apple Silicon binaries; (3) the primary goal is a **project-agnostic** release-watcher on shared Jenkins+cloudhome infra, not an opencode-specific integration. Let me capture this major reframe in the draft and clear the processed tool outputs.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Technical Decisions (post-Jenkins-reference)",
  "newString": "## MAJOR REFRAME (2026-06-05, user correction) — read this first\n- **The existing cloudhome opencode Docker pipeline is STALE and NOT the target.** It builds from production upstream opencode. Do NOT anchor V1 on `docker/opencode/Dockerfile` or `build-opencode-multiarch.sh` as the integration seam. Cloudhome's entire way of consuming opencode will change dramatically once this system exists. The Variant-1 reframe above is therefore NOT the design — it only describes the legacy pipeline we are replacing.\n- **Apple Silicon IS buildable on cloudhome** via its cross-platform compiler (gcc/cross-compile; Bun also supports `--target=bun-darwin-arm64` cross-compile from Linux). The Jenkins doc's \"native macOS agent required\" constraint applies only to Xcode/codesign/notarize — pure cross-compiled darwin binaries can be produced in-cluster. This means cloudhome can eventually produce the darwin-arm64 artifact too, and local Mac ORW need not remain the permanent darwin path.\n- **Cloudhome knows Jenkins but does NOT know our release-watcher plans.** The coordination doc is generic Jenkins onboarding, not tailored to this system.\n\n## PRIMARY GOAL (authoritative restatement)\nBuild a **project-agnostic** version of ORW that performs the same release-integration functions for **ALL our forked upstream repos**, on **shared infrastructure** (Jenkins + cloudhome). Component responsibilities:\n- **GitHub webhooks** → fire CI builds on upstream release/PR events.\n- **Cloudflare Workers** → relay external-service signals/webhooks into cloudhome (ingress edge only).\n- **Jenkins** → the build-automation brain. Runs: git PR merge, **headless opencode agent sessions** (AI merge), artifact builds (incl. multi-arch + cross-compiled darwin), and can **produce docker images directly** OR delegate to BuildKit.\n- **BuildKit** → docker image creation for the cloudhome OCI registry (one of two image paths; Jenkins-direct is the other).\n- **OCIR** → docker image registry.\n- **Cloudhome resources** → artifact storage, logs, and DB. DB options: a **variant DB container node** (atlas-style, already hosted) OR **free OCI MySQL**.\n- Generalizes orw across the earlier three modes (literal overlay / consumer validation / semantic adaptation), driven by per-project config.\n\n## Technical Decisions (post-Jenkins-reference)"
}
```

**Output:**
```
Edited (+15/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 17.4s)

_Thinking:_

 I'm going to finalize the draft by incorporating the reframed open questions, marking the outdated decisions as superseded, and then cleaning up the context before presenting the synthesis and focused questions.

Let me finish capturing the reframe in the draft, clear processed tool outputs, then present my updated understanding and the blocking questions.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Open Questions",
  "newString": "## Open Questions (post-reframe — these supersede stale ones below)\n- V1 first target: still OpenCode, but produced by the NEW release-watcher pipeline (not the stale Dockerfile). What is the V1 deliverable now — a docker image for cloudhome's (future) opencode usage, a set of binaries, or both? Depends on how cloudhome's new opencode consumption is shaped.\n- How will cloudhome consume opencode after this lands (since the current container pipeline is being discarded)? This defines the V1 artifact target.\n- DB substrate pick for V1: atlas-style variant DB container vs free OCI MySQL. (User offered both — needs a choice or \"your call\".)\n- Is the new generic `release-watcher` codebase a fork of orw run as a Jenkins-invoked CLI, a set of Jenkins shared-pipeline libraries, or both (CLI core + thin Jenkinsfile)?\n- macOS cross-compile: in V1 scope (cloudhome produces darwin-arm64 too), or deferred to a later phase while local Mac ORW continues?\n- Project onboarding model: one Jenkins pipeline per fork, or one parameterized pipeline reading per-project release-watcher config?\n- Webhook→Cloudflare→Jenkins trigger path: reuse the existing `build-relay` worker, or a new release-watcher worker?\n\n## Stale Open Questions (pre-reframe — retain for history)"
}
```

**Output:**
```
Edited (+10/-1).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 13.1s)

_Thinking:_

 I'm cleaning up the context by removing the large tool outputs that have already been processed and saved to disk — the Jenkins documentation, draft content, and bash command results. Let me verify which tags are protected before dropping anything to make sure I'm not removing something I still need.

I'll clear the processed tool outputs (Jenkins doc read, draft read, and the two cloudhome bash probes — all fully captured in the draft and recoverable from disk), then present the reframed understanding.

**Tool: ctx_reduce**

**Input:**
```json
{
  "drop": "1670,1671,1674,1675"
}
```

**Output:**
```
Queued: drop §1670§, §1671§, deferred drop §1674§, §1675§.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 32.3s)

_Thinking:_

 I need to present back my understanding of the architectural vision they've outlined and identify the key blocking questions that need answering before moving forward. This is clearly an architecture-level decision, so I should get the V1 scope locked in first, then consider whether to bring in Oracle for design consultation.

The core unknowns that actually block progress are: what V1 delivers now that the old Dockerfile is gone (which depends on how cloudhome will consume opencode), whether to use the atlas-variant container or OCI MySQL, and how to structure the release-watcher—but I shouldn't overwhelm them with all of these at once. Let me lead with the V1 deliverable since that's the foundation everything else rests on, then offer my leans on the other decisions to keep momentum.

Got it — that's a significant reframe, and it actually clarifies the whole thing. Let me reflect the corrected architecture back so we're locked, then narrow the few genuinely-blocking unknowns.

## The system, as I now understand it

**Not** "integrate opencode with cloudhome's existing pipeline." Instead: **a project-agnostic release-watcher running on shared Jenkins + cloudhome infra**, serving all our forks.

```
GitHub (upstream release / PR / push)
   │  webhook
   ▼
Cloudflare Worker  ── relay only (ingress edge, signal normalization)
   │
   ▼
Jenkins (the build-automation brain, in-cluster)
   ├─ git PR merge + curated-PR application
   ├─ headless `opencode run` agent session  ← the AI merge step
   ├─ build artifacts: multi-arch linux + cross-compiled darwin-arm64
   ├─ produce docker image  ─┬─ directly in Jenkins, OR
   │                         └─ delegate to BuildKit → OCIR
   ▼
Cloudhome resources
   ├─ artifact storage (ZFS/PVC)
   ├─ logs / evidence
   └─ DB: atlas-style variant container  OR  free OCI MySQL
```

Per-project config drives the three modes we defined earlier (literal overlay / consumer validation / semantic adaptation). `orw` gets forked into a generic `release-watcher` that Jenkins invokes.

**Three corrections I've absorbed:**
1. The current `docker/opencode/Dockerfile` pipeline is **stale/discarded** — I will not anchor V1 on it. How cloudhome consumes opencode changes dramatically after this.
2. Cloudhome **can cross-compile darwin-arm64** (Bun `--target=bun-darwin-arm64` from Linux / gcc cross) — so local Mac ORW is not a permanent darwin dependency; cloudhome can eventually own that artifact too.
3. Cloudhome knows Jenkins generically but **nothing about this plan** — the coordination doc is generic.

All captured in the draft.

## The blocking unknowns before this is plan-ready

**1 — The V1 deliverable (most important).** Since the stale Dockerfile is out, what does V1 actually *produce* and hand to cloudhome? That depends on **how cloudhome will newly consume opencode** after this lands. Options I can see:
- A fresh **docker image** (new Dockerfile, fork+omo+curated-PRs baked in) → OCIR → cloudhome runs it
- **Standalone binaries** (linux multi-arch + darwin) published to cloudhome storage
- **Both** (binaries as the artifact, image as a thin wrapper)

I can't pick this for you — it's tied to your future opencode deployment shape. What's the end-state?

**2 — DB substrate.** You offered two; I need a pick (or "your call"):
- **atlas-style variant DB container** (reuse a pattern you already host/operate) — *my lean*, since it's operationally familiar
- **free OCI MySQL** (offloads hosting, but adds an external dependency + network egress)

**3 — `release-watcher` packaging** (my lean, override if wrong): a **CLI core** (the forked orw, project-agnostic, reads per-project config) **+ a thin Jenkinsfile/shared-library** that invokes it. Keeps the integration logic testable outside Jenkins and portable if we ever move CI.

**Defaults I'll assume unless you object:** one **parameterized** Jenkins pipeline reading per-project config (not one pipeline per fork); macOS cross-compile **deferred** to a later phase (local Mac ORW continues) so V1 proves the linux/image path first; webhook trigger path **reuses the existing `build-relay` worker** rather than a new one.

Which of the three blocking items can you answer? The V1-deliverable one (how cloudhome will consume opencode going forward) is the keystone — everything else sizes off it.

---

## User

1. sort of both, standalone binaries that we can eventually auto-install on the mac, similar to local process, and a new repo source and trigger for the opencode image that gets pushed into OCIR, but dont worry about the deploy'config yet. 2. my preference is one of the OCI db resources. 3. yes, defaults: macos not deffered, built the process currently used by orw in parallel, but dont replace the existing workflow, stop at the point of the artifact binary built. yes use the existing build-relay signal. i would suggest taking it one step farther and replace the github workflows for opencode ci on push to go through a github webhook, build-raly jenkins path as well. as a later v2, v3 for helping frame where this is going, we will be onboarding agent-harness release watch and CI, then atlas media app ci & release watch. our attempts the use github workflows for ci were a disaster, this plan is the replacement.

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 87.3s)

_Thinking:_

 I'm crystallizing the V1 scope: we need to deliver both standalone binaries across Linux and macOS architectures that can be auto-installed, plus a new repository source and trigger for the opencode Docker image to push into OCIR.

The database will be an OCI-hosted MySQL resource rather than a containerized variant. For packaging, we're building darwin-arm64 via cross-compilation in parallel with the existing orw workflow without replacing it, and crucially, we're moving the opencode CI pipeline off GitHub Actions entirely—replacing it with a webhook-to-build-relay-to-Jenkins path that mirrors the local process.

This Jenkins-based CI system becomes the foundation for a multi-project rollout: opencode in V1, agent-harness in V2, and atlas in V3, effectively retiring GitHub Actions across the board.

The V1 scope is now clear: a generic release-watcher CLI paired with a parameterized Jenkins pipeline that handles GitHub webhooks for both upstream releases and push events, runs the build steps (clone, merge, typecheck, compile binaries for three targets, push Docker image to OCIR), stores artifacts on cloudhome, and stops once the image is pushed—no deployment or auto-install yet.

I'm running through the clearance checklist to confirm we're ready to move into detailed planning.

The main gaps I need to resolve before generating the plan are: where the release-watcher code itself lives (new repo, inside cloudhome, or elsewhere), and whether the "new repo source" for the opencode image build context is a separate repository or part of the same structure.

I also need to clarify the division of labor with cloudhome — specifically whether we author the Jenkinsfile and release-watcher code in this plan, or just provide specifications for their team to implement. Before committing to a detailed plan, I should investigate cloudhome's current infrastructure more thoroughly: how the build-relay worker operates, the existing Jenkins agent setup, OCIR configuration, and how atlas handles CI as a reference model. and jenkins agent config) — how agents are provisioned, what they can access, constraints on where builds run. Critical for understanding if we can run release-watcher there or need a separate worker.

So I'll launch targeted explores on those four areas while I ask the user the blocking questions. That way I'm not sitting idle waiting for answers, and when they respond, I'll have concrete context to build the plan against. k8s/base/apps/jenkins/jenkins-values.yaml`) — already partially seen. Agent pod templates, what's available.
5. **OCIR + OCI DB** — what OCI resources exist/are configured.

This is a fair amount. Let me launch 2-3 focused explore agents on cloudhome (I should target the cloudhome repo path `~/Git/cloudhome` or `/Volumes/Topper2TB/Git/cloudhome`). Actually explore agents work on the current project by default — I need them to look at the cloudhome repo. I can pass the path in the prompt. Or I can use direct reads. Given the earlier explore agents kept aborting in this session, and the cloudhome repo is a different repo, let me use a mix — maybe launch explore with explicit paths, but be ready for them to abort.

Actually, given repeated abort issues with background agents this session, and that this is cross-repo, let me do targeted direct reads myself rather than delegating, for the most critical files. But that's a lot of reading. Let me delegate to explore with explicit absolute paths and run_in_background=true, and continue. Per anti-duplication, once delegated I shouldn't also read the same files.

But I also need to ask the user questions this turn. Let me:
1. Record decisions in draft (edits).
2. Launch 2 background explore agents on cloudhome specifics.
3. Ask the focused questions.
4. End turn.

The cloudhome infra investigation (build-relay, jenkins agents, OCI resources) is independent of the topology answers, so I can safely launch it now. I'll narrow the questions to the truly blocking ones: where the new generic release-watcher lives (standalone repo, inside cloudhome, or inside agent-harness), what the image source repo is, whether we own the full provisioning or just coordinate with the cloudhome team, and whether we'll run a real end-to-end pipeline execution as the acceptance gate. I'll draft the edits to capture these decisions, then launch background investigation on the cloudhome paths while asking the key questions to move forward.

The reframe is now concrete, and the strategic arc (v1 opencode → v2 agent-harness → v3 atlas, all replacing the GitHub Actions CI that failed) gives me the frame I need. Let me capture these decisions, launch focused investigation into the cloudhome infra I'll need to plan against, and confirm the last few design-intent + verification points.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Open Questions (post-reframe — these supersede stale ones below)",
  "newString": "## V1 Scope Decisions (2026-06-05, confirmed)\n- **V1 deliverable = BOTH, stop at \"artifact built / image pushed\" (no deploy config):**\n  1. Standalone binaries — linux amd64 + linux arm64 + **darwin-arm64 (cross-compiled in-cluster, NOT deferred)**. These are what we will *eventually* auto-install on the Mac (orw-style), but auto-install itself is out of V1.\n  2. A **new repo source + trigger** for the opencode docker image → pushed to **OCIR**. Deploy/runtime config of that image is explicitly out of V1.\n- **DB substrate = an OCI database resource** (user prefers OCI-hosted DB; e.g. free OCI MySQL) — NOT the atlas-style in-cluster container.\n- **Run the orw-equivalent process in PARALLEL — do NOT replace the existing local Mac ORW workflow.** The cloudhome path stops at the built artifact binary; local ORW keeps installing on the Mac until a later phase.\n- **Reuse the existing `build-relay` signal path** (Cloudflare worker → cloudhome).\n- **GO FARTHER (confirmed in V1):** also replace the opencode **CI-on-push** GitHub Actions workflows with a GitHub-webhook → build-relay → Jenkins path. The GitHub-Actions CI we built earlier this session is to be superseded by this self-hosted path.\n- **Strategic framing (why this exists):** our GitHub-Actions CI attempts were \"a disaster\"; this Jenkins+cloudhome system is their **replacement**, project-agnostic by design.\n  - **V2**: onboard agent-harness release-watch + CI.\n  - **V3**: onboard atlas media-app CI + release-watch.\n\n## Defaults Accepted (user confirmed \"yes, defaults\")\n- One **parameterized** Jenkins pipeline reading per-project release-watcher config (not one pipeline per fork).\n- `release-watcher` packaging = **CLI core (forked orw, project-agnostic) + thin Jenkinsfile/shared-library** that invokes it.\n- Reuse existing `build-relay` worker for the trigger path (do not create a new worker).\n- macOS cross-compile **IN V1** (correction to earlier \"deferred\").\n\n## Open Questions (post-reframe — these supersede stale ones below)\n- **Code/repo topology (keystone):** where does the generic `release-watcher` codebase live (new standalone repo? inside cloudhome? inside agent-harness?), and what exactly is the \"new repo source for the opencode image\" — a new dedicated image-build-context repo, or the opencode fork itself used as the Docker build source?\n- **Division of labor with cloudhome:** does this plan author the Jenkinsfile + release-watcher code, treating cloudhome infra provisioning (OCI MySQL, Jenkins agent pods, webhook routing, OCIR creds/secrets) as coordination tasks/specs handed to the cloudhome team? Or do we own provisioning too?\n- **Verification gate:** confirm V1 acceptance = a real end-to-end pipeline run (webhook fires → Jenkins builds → 3 binaries execute `--version` → image present in OCIR), not just \"the pieces exist.\""
}
```

**Output:**
```
Edited (+21/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 31.5s)

_Thinking:_

 I've documented the key decisions, so now I'm launching focused investigation agents on the cloudhome infrastructure—specifically looking into the build-relay worker, atlas CI/database patterns, jenkins agent configuration, and OCIR/OCI database setup—while simultaneously asking the blocking questions that need answers to move forward.

I've captured all the V1 scope decisions. Now let me launch focused investigation into the cloudhome infrastructure I'll need to plan against, then confirm the last design-intent points with you.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "explore",
  "description": "Map cloudhome build-relay + dispatcher",
  "run_in_background": true,
  "load_skills": [],
  "prompt": "I'm planning a project-agnostic CI/release-watcher system that routes GitHub webhooks through a Cloudflare worker into an in-cluster Jenkins on the cloudhome cluster. I need to understand the EXISTING signal-relay and build-dispatch plumbing so my plan reuses it instead of reinventing it.\n\nInvestigate the cloudhome repo at /Volumes/Topper2TB/Git/cloudhome (also at ~/Git/cloudhome). Focus on these files/areas and report concrete details:\n\n1. `tofu/modules/cloudflare_build_relay/worker.js` — the Cloudflare \"build-relay\" worker. Report: what inbound signals/payloads it accepts (routes, auth/HMAC, expected JSON shape), how it forwards into the cluster (queue? direct HTTP? what endpoint/hostname?), and any secrets/env it references.\n\n2. `docker/build-dispatcher/` (especially `src/repo-map.js` and the main dispatcher entry) — how builds are currently dispatched. Report: the repo→image/job mapping shape, how a build job is created (k8s Job? BuildKit?), what fields each repo entry has, and how the dispatcher is invoked (HTTP endpoint? consumer of a queue?).\n\n3. How the dispatcher creates BuildKit jobs (look in `k8s/base/ops/buildkit/` and any job templates). Report: per-arch job templates, how amd64 vs arm64 are selected, how images get pushed to OCIR.\n\nReturn concrete file paths, the actual payload/config shapes (quote the key code), and the end-to-end signal flow from \"external webhook arrives\" to \"build job runs\". Note anything that looks Jenkins-related or any existing Jenkinsfile (I believe there are none yet — confirm)."
}
```

**Output:**
```
Background task launched.

Background Task ID: bg_d3e38ab0
Description: Map cloudhome build-relay + dispatcher
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_d3e38ab0" to check.

Do NOT call background_output now. Wait for <system-reminder> notification first.

<task_metadata>
session_id: ses_169eabe97ffevJqNSF0LsdNpzh
background_task_id: bg_d3e38ab0
subagent: explore
</task_metadata>

to continue: task(task_id="ses_169eabe97ffevJqNSF0LsdNpzh", load_skills=[], run_in_background=false, prompt="...")
```

**Tool: task**

**Input:**
```json
{
  "subagent_type": "explore",
  "description": "Map cloudhome jenkins + atlas + OCI db",
  "run_in_background": true,
  "load_skills": [],
  "prompt": "I'm planning a Jenkins-based CI/release-watcher on the cloudhome cluster. I need to understand the EXISTING Jenkins install, the atlas project's CI/DB pattern (cited as a model), and what OCI database resources are available.\n\nInvestigate the cloudhome repo at /Volumes/Topper2TB/Git/cloudhome (also at ~/Git/cloudhome). Report concrete details on:\n\n1. Jenkins install — look at `k8s/base/apps/jenkins/` (especially `jenkins-values.yaml`) and any `coordination_notes/jenkins-build-setup-reference.md`. Report: how Jenkins agents/pod-templates are configured (container images, available tools like bun/node/git/docker/buildx, resource limits), how auth works, what storage is mounted for archiveArtifacts, and whether any pipeline jobs / Jenkinsfiles already exist (I believe none — confirm).\n\n2. The atlas project — search for how atlas is built and how its database is hosted. Look for atlas in `docker/`, `k8s/`, `tofu/`, `repo-map.js`, and any atlas DB container/statefulset. Report: how atlas CI/build is wired today, and the pattern used to host its database (container? statefulset? PVC? OCI?).\n\n3. OCI database resources — grep for \"OCI\", \"mysql\", \"autonomous\", \"adb\", \"oracle\" across `tofu/`, `k8s/`, and docs. Report: what OCI-hosted DB resources exist or are provisioned (free-tier MySQL? Autonomous DB?), how credentials/connection strings are managed (secrets, ESO/External Secrets, Vault), and any existing DB-connection patterns I could reuse.\n\n4. OCIR (OCI registry) — how images are pushed/pulled, what registry hostname/namespace, and how registry creds are managed.\n\nReturn concrete file paths, quote key config, and call out anything that would block standing up a new parameterized Jenkins pipeline that builds binaries + a docker image and records run-state in an OCI database."
}
```

**Output:**
```
Background task launched.

Background Task ID: bg_cd70e346
Description: Map cloudhome jenkins + atlas + OCI db
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_cd70e346" to check.

Do NOT call background_output now. Wait for <system-reminder> notification first.

<task_metadata>
session_id: ses_169ea9646ffeVIcQIWBAZFPoJE
background_task_id: bg_cd70e346
subagent: explore
</task_metadata>

to continue: task(task_id="ses_169ea9646ffeVIcQIWBAZFPoJE", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 838.2s)

_Thinking:_

 I've launched the background agents and now I need to wait for their results rather than polling them. While they investigate in parallel, I should wrap up this turn by asking the user the focused blocking questions I prepared — that gives a clean endpoint and lets me incorporate the agents' findings when they come back.

I'm weighing whether to use the Question tool for structured options or keep it in prose. The topology question is the keystone and has interrelated parts that don't fit neatly into discrete options, so I'll present all three questions in prose to preserve the nuance and keep the consulting dialogue flowing naturally. Question tool, putting all three as separate questions in one call, since each has reasonably discrete options and the "type your own" fallback covers nuance. This respects the guidance and gives clean UX.

Let me construct the questions. For the codebase location, I should split this into two parts: where the release-watcher lives, and where the image build context comes from. Given the project-agnostic goal and that it serves multiple repos, a new standalone repo makes the most sense rather than burying it in cloudhome or agent-harness. For the image build source, they leaned toward a new dedicated repo, so I'll mark that as recommended. On division of labor, the split where we author the pipeline and code while cloudhome provisions infrastructure is most realistic given they own the cluster. And for verification, a real end-to-end pipeline run matches the zero-human-intervention rigor we want. Let me build the Question tool call with these four questions, marking the sensible defaults as recommended and putting them first.

The two cloudhome investigations are running in the background. While they map the infra, I need your call on the last design-intent points so the plan can be locked. These are the keystone topology + division-of-labor + acceptance-gate decisions.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Where should the new project-agnostic `release-watcher` codebase live? (This is the forked-from-orw CLI core that Jenkins invokes for every project.)",
      "header": "release-watcher repo",
      "options": [
        {
          "label": "New standalone repo (Recommended)",
          "description": "e.g. rustybret/release-watcher. Project-agnostic by design, serves opencode + agent-harness + atlas. Cleanest separation; independent versioning/CI; not buried inside one consumer."
        },
        {
          "label": "Inside cloudhome repo",
          "description": "Lives alongside the Jenkins/cluster config it runs on. Tighter infra coupling, but ties the generic tool to one cluster repo."
        },
        {
          "label": "Inside agent-harness repo",
          "description": "Lives with the meta-tooling/runbooks. Convenient for your docs, but mixes app-agnostic CI logic into agent-harness."
        }
      ]
    },
    {
      "question": "What is the 'new repo source + trigger for the opencode image' that gets pushed to OCIR?",
      "header": "opencode image source",
      "options": [
        {
          "label": "New dedicated image-build-context repo (Recommended)",
          "description": "A fresh repo holding the new Dockerfile + build context for the opencode image (replaces the stale cloudhome docker/opencode path). Decouples image recipe from the fork's source tree."
        },
        {
          "label": "The opencode fork itself as Docker build source",
          "description": "Jenkins builds the image directly from rustybret/opencode (fork/local) using a Dockerfile committed into the fork. Fewer repos, but bakes image-build concerns into the fork."
        }
      ]
    },
    {
      "question": "Division of labor with the cloudhome team for V1?",
      "header": "who builds what",
      "options": [
        {
          "label": "We author pipeline+code; cloudhome provisions infra (Recommended)",
          "description": "This plan authors the Jenkinsfile + release-watcher CLI + image Dockerfile. Cloudhome infra bits (OCI MySQL provisioning, Jenkins agent pods, webhook routing into build-relay, OCIR creds/secrets) become explicit coordination tasks/specs handed to the cloudhome workstream."
        },
        {
          "label": "We own everything including infra provisioning",
          "description": "This plan also provisions OCI MySQL, configures Jenkins agents, wires the worker routing, and manages OCIR secrets directly. Larger scope, more cluster surface owned by this plan."
        }
      ]
    },
    {
      "question": "What is the V1 acceptance gate?",
      "header": "acceptance gate",
      "options": [
        {
          "label": "Real end-to-end pipeline run (Recommended)",
          "description": "V1 is 'done' only when a real webhook fires → Jenkins runs → 3 binaries (linux amd64/arm64 + darwin-arm64) each execute and print --version → opencode image is present in OCIR. Proves the whole path, not just the pieces."
        },
        {
          "label": "Pieces built & verified individually",
          "description": "Each component verified in isolation (worker routes, Jenkinsfile runs a build, binaries compile, image builds) but a single full e2e run is deferred to a follow-up. Faster to 'done', less integrated proof."
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Where should the new project-agnostic `release-watcher` codebase live? (This is the forked-from-orw CLI core that Jenkins invokes for every project.)"="New standalone repo (Recommended)", "What is the 'new repo source + trigger for the opencode image' that gets pushed to OCIR?"="New dedicated image-build-context repo (Recommended)", "Division of labor with the cloudhome team for V1?"="1, but use the ultrabot cluster-admin headless agent to perform the oci tasks. give it the tasks and the required credentials directly. see: + Thought: 11.3s
Yes — that's the ultrabot-headless-agents system, and it's live. Verified against the repo and cluster just now:
What exists
Layer	State
Operator recipes (ops/ultrabot.just)	dispatch, status, logs, cleanup, deploy, build-*, images-build, webhook-status, webhook-test, webhook-rotate-secret
K8s manifests (k8s/base/ultrabot/)	namespace, rbac, 3 Job templates, pvcs, secrets, dispatcher
3 agent profiles (docker/ultrabot/)	gp-dev, cluster-admin, webgameECS-unity + dispatcher
Entrypoint	scripts/ultrabot-entrypoint.sh (runs the headless OMO/opencode session, opens a PR)
Cloudflare Worker	tofu/modules/cloudflare_ultrabot_dispatch/ (HMAC webhook → in-cluster dispatcher)
Runbook	docs/runbooks/Ultrabot Headless Agents.md
Plan	22/22 complete, all 4 Final Wave gates APPROVE
Live cluster state
ultrabot ns           Active   12d
ultrabot-dispatcher   1/1 Running   24h
3 suspended Job templates (gp-dev, cluster-admin, webgameECS-unity)
Two ways to trigger an independent agent session
CLI (direct):
just ultrabot dispatch gp-dev "implement X in repo Y" https://github.com/rustybret/<repo>
just ultrabot status
just ultrabot logs <job-name>
Webhook (HMAC, via Cloudflare Worker):
just ultrabot webhook-test gp-dev "test task"
How it works
Dispatch clones the suspended profile Job template → injects the task prompt + repo → unsuspends → K8s runs a one-shot agent pod that boots a headless opencode session, does the work on its own branch, and opens a PR. Each profile has different tooling/RBAC (gp-dev = general dev; cluster-admin = kubectl/tofu/ansible; webgameECS-unity = Unity il2cpp).
Caveats from when it was built
- The runtime needs real values in OCI Vault: ultrabot-github-pat and ultrabot-anthropic-relay-token.
- Images must be pushed (just ultrabot images-build) — note these still build on the local Mac via the old build-ultrabot-*.sh scripts; see this doc for a guide to credentials, keys, secrets, and human-only gates for agentic development.  /Volumes/Topper2TB/Git/cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md", "What is the V1 acceptance gate?"="Real end-to-end pipeline run (Recommended)". You can now continue with the user's answers in mind.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 58.9s)

_Thinking:_

 The user has clarified the architecture: there's a new release-watcher repo and a separate image-build-context repo for the opencode image, and they're going with Option 1 where we handle the pipeline and code while cloudhome manages infrastructure—but there's a key detail about leveraging the ultrabot cluster-admin headless agents system that I need to understand better.

The ultrabot system is already set up with cluster-admin agents that can autonomously handle OCI provisioning tasks. Instead of manually handing specs to cloudhome, I can dispatch infrastructure work directly to the ultrabot cluster-admin agent using `just ultrabot dispatch cluster-admin` with the task and credentials. The system has everything in place: dispatch commands, webhook triggers via Cloudflare Workers, RBAC and Job templates in the k8s config, and a runbook documenting how it all works. So the acceptance gate becomes running a real end-to-end pipeline that uses this agent to provision the infrastructure autonomously.

The dispatch flow clones a suspended Job template, injects the task prompt and repo URL, unsuspends it, and Kubernetes runs a headless agent pod that does the work on its own branch and opens a PR. I need to ensure the OCI Vault has the required secrets (`ultrabot-github-pat` and `ultrabot-anthropic-relay-token`), push the container images locally, and understand the secrets cheatsheet to get this right. My role is to author the Jenkinsfile, release-watcher CLI, and image Dockerfile, then dispatch the infrastructure provisioning tasks to the ultrabot cluster-admin agent rather than doing manual cluster work. I should document these decisions and investigate the ultrabot system and secrets cheatsheet to write correct dispatch commands.

Two background agents are still running on cloudhome infra looking at build-relay, dispatcher, Jenkins, Atlas, and OCI database resources. Since ultrabot is a distinct dispatch system now central to the plan, I can launch a focused investigation into it without overlapping their work—there's only minor overlap risk with the secrets management piece, but ultrabot as a system is separate enough to warrant its own agent.

I'm running through the clearance checklist before moving toward plan generation: core objective is clear, scope boundaries are well-defined, the four keystone questions are answered, technical approach is decided at the architecture level, and the e2e pipeline run serves as the acceptance gate. The only minor gap is unit-test infrastructure for the release-watcher CLI, but I can fold that into the plan with a sensible default rather than blocking on it. No critical ambiguities remain—the remaining work is research-fillable from the background investigations, not user-blocking. So I'll record the decisions and answers in draft, launch the ultrabot investigation, and then wait for the three background tasks to complete before moving into Metis consultation and plan generation.

The four keystone decisions are locked, and the ultrabot headless-agent system is a major addition — it changes infra provisioning from "hand specs to cloudhome team" into "dispatch tasks to the cluster-admin headless agent with credentials directly." That's a distinct system my two running investigations weren't scoped to cover. Let me record all of this and launch a focused ultrabot probe.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Open Questions (post-reframe — these supersede stale ones below)\n- **Code/repo topology (keystone):** where does the generic `release-watcher` codebase live (new standalone repo? inside cloudhome? inside agent-harness?), and what exactly is the \"new repo source for the opencode image\" — a new dedicated image-build-context repo, or the opencode fork itself used as the Docker build source?\n- **Division of labor with cloudhome:** does this plan author the Jenkinsfile + release-watcher code, treating cloudhome infra provisioning (OCI MySQL, Jenkins agent pods, webhook routing, OCIR creds/secrets) as coordination tasks/specs handed to the cloudhome team? Or do we own provisioning too?\n- **Verification gate:** confirm V1 acceptance = a real end-to-end pipeline run (webhook fires → Jenkins builds → 3 binaries execute `--version` → image present in OCIR), not just \"the pieces exist.\"",
  "newString": "## Keystone Decisions (2026-06-05, all four confirmed)\n- **release-watcher codebase = NEW STANDALONE REPO** (e.g. `rustybret/release-watcher`). Project-agnostic CLI core forked from orw; independent versioning; serves opencode (v1) + agent-harness (v2) + atlas (v3).\n- **opencode image source = NEW DEDICATED image-build-context repo** (new Dockerfile + build context; replaces the stale `cloudhome/docker/opencode` path; decoupled from the fork's source tree).\n- **Division of labor = we author pipeline + code; OCI/cluster infra is DISPATCHED to the ultrabot `cluster-admin` headless agent** (NOT handed to a human cloudhome team). Give that agent the tasks + required credentials directly.\n- **V1 acceptance = REAL END-TO-END pipeline run**: webhook fires → Jenkins builds → 3 binaries (linux amd64/arm64 + darwin-arm64) each execute and print `--version` → opencode image present in OCIR.\n\n## Ultrabot Headless-Agent System (infra-provisioning mechanism for this plan)\nThe plan's OCI/cluster infra tasks are executed by dispatching to ultrabot, an existing live system in cloudhome. Key facts (from user; VERIFY via investigation before writing tasks):\n- **Recipes**: `ops/ultrabot.just` — `dispatch, status, logs, cleanup, deploy, build-*, images-build, webhook-status, webhook-test, webhook-rotate-secret`.\n- **K8s**: `k8s/base/ultrabot/` — namespace, rbac, 3 Job templates, pvcs, secrets, dispatcher. Live: `ultrabot` ns Active, `ultrabot-dispatcher` Running, 3 suspended Job templates.\n- **Profiles** (`docker/ultrabot/`): `gp-dev` (general dev), **`cluster-admin` (kubectl/tofu/ansible RBAC — this is the one for our OCI/cluster tasks)**, `webgameECS-unity` (Unity il2cpp), + dispatcher.\n- **Entrypoint**: `scripts/ultrabot-entrypoint.sh` — boots a headless OMO/opencode session on its own branch, does the work, **opens a PR**.\n- **Cloudflare Worker**: `tofu/modules/cloudflare_ultrabot_dispatch/` (HMAC webhook → in-cluster dispatcher).\n- **Dispatch (CLI)**: `just ultrabot dispatch cluster-admin \"<task>\" https://github.com/rustybret/<repo>` ; `just ultrabot status` ; `just ultrabot logs <job-name>`.\n- **Dispatch (webhook)**: `just ultrabot webhook-test cluster-admin \"<task>\"`.\n- **How it works**: dispatch clones the suspended profile Job template → injects task prompt + repo → unsuspends → one-shot agent pod runs → opens PR.\n- **Caveats**: needs OCI Vault values `ultrabot-github-pat` + `ultrabot-anthropic-relay-token`; images must be pushed via `just ultrabot images-build` (still built on local Mac via `build-ultrabot-*.sh`).\n- **Runbook**: `cloudhome/docs/runbooks/Ultrabot Headless Agents.md`.\n- **Secrets/permissions guide**: `cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` (credentials, keys, human-only gates).\n- **Implication for the plan**: infra-provisioning TODOs become \"dispatch a precisely-specified task to ultrabot cluster-admin\" steps, each with: the exact provisioning goal, the repo to PR against, the required Vault secrets, and an agent-executed verification of the resulting PR/cluster state. Human-only gates (per cheatsheet) must be respected — some secret/credential steps may NOT be delegable and remain manual.\n\n## Remaining Open Questions\n- Does the release-watcher CLI core warrant its own unit-test suite (orw-style), or is agent-executed pipeline QA sufficient for V1? (Default: light unit tests for pure config/merge-plan logic + e2e pipeline as the real gate.)\n- Which infra steps are human-only gates (per secrets cheatsheet) vs delegable to ultrabot cluster-admin? (To be resolved from the cheatsheet during investigation.)"
}
```

**Output:**
```
Edited (+24/-4).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 27.5s)

_Thinking:_

 I've got two background investigations running and just received an internal continue signal, so I need to hold off on checking the output until the system reminder comes through. I realize I flagged the ultrabot probe as an intention but never actually launched it, so let me fire that off now and then tackle the secrets-and-permissions documentation myself or hand it off to someone else.

The ultrabot investigation is non-overlapping with the two already running (which cover build-relay/dispatcher and jenkins/atlas/OCI-db), so launching it now avoids duplication. I'll start the ultrabot probe in the background, then wrap up this turn and wait for all three investigations to complete before I can synthesize the results and move toward plan generation.

I said I'd launch a focused ultrabot probe but hadn't fired it yet. Launching it now (non-overlapping with the two running investigations), then I'll wait for all three to complete before synthesizing toward plan generation.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "explore",
  "description": "Map cloudhome ultrabot system + secrets gates",
  "run_in_background": true,
  "load_skills": [],
  "prompt": "I'm planning a CI/release-watcher system whose OCI/cluster infra-provisioning tasks will be DISPATCHED to an existing \"ultrabot\" headless-agent system (the `cluster-admin` profile) instead of done by hand. I need to understand ultrabot precisely so my plan's infra tasks are correctly shaped, and I need to know which steps are human-only gates that CANNOT be delegated.\n\nInvestigate the cloudhome repo at /Volumes/Topper2TB/Git/cloudhome (also at ~/Git/cloudhome). Report concrete details on:\n\n1. `ops/ultrabot.just` — quote each recipe (dispatch, status, logs, cleanup, deploy, build-*, images-build, webhook-status, webhook-test, webhook-rotate-secret). Report exact arg signatures: how you invoke `dispatch` (profile name, task string, repo URL?), and what each recipe actually runs.\n\n2. `k8s/base/ultrabot/` — the namespace, rbac, the 3 Job templates, pvcs, secrets, dispatcher. For the `cluster-admin` profile specifically: what RBAC/permissions does it have (kubectl/tofu/ansible scope?), what secrets/Vault values it mounts, and what its Job template looks like (resource limits, image, entrypoint).\n\n3. `docker/ultrabot/` — the 3 agent profiles (gp-dev, cluster-admin, webgameECS-unity) + dispatcher. For `cluster-admin`: what tools are in the image (kubectl, tofu/terraform, ansible, oci-cli, gh?), and how it authenticates to OCI/the cluster.\n\n4. `scripts/ultrabot-entrypoint.sh` — how the headless session boots, how the task prompt + repo are injected, how it branches and opens a PR, and any guardrails.\n\n5. `tofu/modules/cloudflare_ultrabot_dispatch/` — the HMAC webhook → dispatcher path (how a dispatch can be triggered via webhook).\n\n6. CRITICAL — `coordination_notes/secrets-and-permissions-cheatsheet.md` AND `docs/runbooks/Ultrabot Headless Agents.md`: report the full list of credentials/secrets (esp. `ultrabot-github-pat`, `ultrabot-anthropic-relay-token`, OCI Vault entries), HOW they're stored/accessed (OCI Vault, ESO/External Secrets, sealed-secrets?), and especially any **human-only gates** — steps that must NOT be performed by a headless agent (e.g. minting credentials, rotating secrets, approving cluster-admin actions). I need an explicit list of \"delegable to ultrabot cluster-admin\" vs \"human-only\".\n\nReturn concrete file paths, quote key code/config, and end with two lists: (A) infra actions safely delegable to ultrabot cluster-admin, (B) human-only gated actions."
}
```

**Output:**
```
Background task launched.

Background Task ID: bg_f77e5754
Description: Map cloudhome ultrabot system + secrets gates
Agent: explore
Status: pending

System notifies on completion. Use `background_output` with task_id="bg_f77e5754" to check.

Do NOT call background_output now. Wait for <system-reminder> notification first.

<task_metadata>
session_id: ses_169dc7726ffeXmjA2qCjpYwx95
background_task_id: bg_f77e5754
subagent: explore
</task_metadata>

to continue: task(task_id="ses_169dc7726ffeXmjA2qCjpYwx95", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 12.6s)

_Thinking:_

 I've launched three background investigations and need to wait for their completion notifications before moving forward. The anti-duplication rule means I shouldn't do overlapping work while they're running, so the right approach is to end this turn cleanly and let the system notify me when they're done.

Three cloudhome investigations are running in parallel, mapping the infra my plan must target:

- **`bg_d3e38ab0`** — build-relay worker + build-dispatcher + BuildKit job templates (the webhook→cluster signal path)
- **`bg_cd70e346`** — Jenkins install + atlas CI/DB pattern + OCI database resources + OCIR
- **`bg_f77e5754`** — ultrabot headless-agent system + the human-only vs delegable secrets gates

These are non-overlapping, so I'm not duplicating any of their work while they run. Once all three return, I'll synthesize the findings against the locked decisions, run the final clearance check, and — assuming no new blockers surface — consult Metis, then move into plan generation for the V1 release-watcher.

Everything's captured in `.omo/drafts/release-watcher-cloudhome.md` (keystone decisions, V1 scope, ultrabot dispatch model, acceptance gate). I'm holding here until the investigation notifications arrive.

---

## User

<system-reminder>
[BACKGROUND TASK RESULT READY]
**ID:** `bg_d3e38ab0`
**Description:** Map cloudhome build-relay + dispatcher
**Duration:** 1m 19s

**1 task still in progress.** You WILL be notified when ALL complete.
Do NOT poll - continue productive work.

Use `background_output(task_id="bg_d3e38ab0")` to retrieve this result when ready.
</system-reminder>

<system-reminder>
[BACKGROUND TASK COMPLETED]
[ALL BACKGROUND TASKS COMPLETE]

**Completed:**
- `bg_d3e38ab0`: Map cloudhome build-relay + dispatcher
- `bg_cd70e346`: Map cloudhome jenkins + atlas + OCI db

Use `background_output(task_id="<id>")` to retrieve each result.
</system-reminder>
<!-- OMO_INTERNAL_INITIATOR -->

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 9.6s)

_Thinking:_

 I need to check on the background tasks I launched—the completion notification shows two finished, but I actually started a third one that should be included, so let me retrieve all three results.

The first two investigations are complete. Let me retrieve all three results (the ultrabot probe may still be finishing).

**Tool: background_output**

**Input:**
```json
{
  "task_id": "bg_d3e38ab0"
}
```

**Output:**
```
Task Result

Task ID: bg_d3e38ab0
Description: Map cloudhome build-relay + dispatcher
Duration: 1m 19s
Session ID: ses_169eabe97ffevJqNSF0LsdNpzh

---

The user wants me to investigate the cloudhome repo to understand the existing CI/release-watcher infrastructure. Let me start by exploring the repo structure and then dive into the specific files mentioned.

Let me launch parallel searches to investigate all the areas simultaneously.

<analysis>
**Literal Request**: Investigate specific files/directories in the cloudhome repo to understand existing CI signal-relay and build-dispatch plumbing.

**Actual Need**: The user is designing a CI/release-watcher system and needs to understand existing infrastructure so they can plan around it rather than duplicate it. They need concrete code shapes, payload schemas, routing logic, and the end-to-end signal flow.

**Success Looks Like**: A detailed report with actual code snippets, file paths, payload shapes, and the full signal flow chain — enough to make architectural decisions without needing to re-read every file themselves.
</analysis>

Let me start by exploring the repo structure and reading the key files in parallel.

Great, I found a lot of relevant files. Let me now read the key files in parallel. I notice there's also a `cloudflare_jenkins_webhook` module which is separate from the `cloudflare_build_relay` one. Let me also look at the `jenkins-build-setup-reference.md` which seems very relevant.

Let me read all the key files now.

Good initial scan — I see far more than I expected. There's a separate `cloudflare_jenkins_webhook` module, a full Jenkins deployment under `k8s/base/apps/jenkins`, and a reference doc. Let me read all the key files in parallel.

Excellent. Now let me read the remaining key files: the job templates, the jenkins-webhook module's main.tf, the dispatcher ingress route, the buildkitd daemon specs, and some job templates to understand the per-arch structure.

Now let me read the remaining critical files — job templates, the jenkins-webhook module's terraform, ingress route, and buildkitd daemon specs.

Now let me also look at one of the manifest assembly jobs to understand how multi-arch images are assembled, and the Jenkins values to understand JCasC configuration. Let me also check if there are any other relevant files.

Let me also read the manifest assembly jobs and the Jenkins config to fully understand the multi-arch pipeline and the JCasC state.

Now let me also look at the tofu module for the build relay outputs and check if there's an existing jenkins deployment in the k8s env, plus the tofu environment config that wires it all together. Let me also look at the ESO secret for jenkins and the jenkins namespace/rbac files to get the full picture.

Let me get the last few pieces — the tofu environment that wires these modules together and the Jenkins ingress/rbac/eso configs.

Now I have a comprehensive view of the entire CI/build pipeline in the cloudhome repo. Let me compile all the findings into a detailed report.

Let me also check the outputs for the jenkins webhook module to be complete, and check if there's anything else relevant I missed.

I have all the information needed now. Let me construct a comprehensive report.

Now I have a complete picture. Let me verify one more thing — whether there are any Jenkinsfiles in any of the monitored repos (beyond cloudhome's own):

Confirmed: There are ZERO Jenkinsfiles in the cloudhome repo. The only references are in the documentation describing how one would create a pipeline job pointing at a Jenkinsfile.

Now let me compile the comprehensive report.

Here is the complete analysis.

<results>

## 1. `cloudflare_build_relay` Worker — Edge-Level GitHub Build Relay

**File:** `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/cloudflare_build_relay/worker.js`

### Routes / Method
- **Single route:** `POST` only (all other methods return 405).
- **Public hostname:** `build-relay.rustybret.com` (set via `variables.tf` default, custom hostname bound via `cloudflare_workers_domain`).

### Auth / HMAC
- Expects `X-Hub-Signature-256` header (GitHub's standard HMAC-SHA256 format, `sha256=<hex>`).
- The shared secret is stored in a **Cloudflare KV namespace** (`BUILD_RELAY_SECRETS`, key `WEBHOOK_HMAC_SECRET`), **not** as a Workers secret binding.
- Constant-time comparison (`diff |= computedHex.charCodeAt(i) ^ providedHex.charCodeAt(i)`).
- **No secret on mismatch:** returns 401 `{"error":"Invalid signature"}`.
- **No KV secret:** returns 503 `{"error":"Relay not configured"}`.

### Inbound Payload Shape
Expects a standard **GitHub push event** JSON body. Extracts two metadata fields (non-fatal on failure):
```js
repo = payload.repository.full_name    // e.g. "rustybret/atlas"
sha  = payload.after                   // commit SHA from push
```

### Forwarding Mechanism
**Does NOT use a queue** (no QStash, no queue binding). Uses `ctx.waitUntil()` — responds 202 to GitHub immediately, then fires an **async direct HTTP fetch** to `env.DISPATCHER_URL`.

The forwarded request preserves:
- Original body verbatim
- `Content-Type: application/json`
- `X-Hub-Signature-256` (original header)
- Added routing headers: `X-Build-Relay-Repo`, `X-Build-Relay-Sha`

### DISPATCHER_URL Target
**Default:** `https://build-dispatcher-internal.rustybret.com/dispatch`
This is a Traefik IngressRoute hostname that routes through the Cloudflare Tunnel to `build-dispatcher.buildkit.svc.cluster.local:8080`.

### Secrets / Env
| Binding | Source | Type |
|---------|--------|------|
| `BUILD_RELAY_SECRETS` | `cloudflare_workers_kv_namespace.build_relay_secrets` | KV namespace binding |
| `DISPATCHER_URL` | `var.dispatcher_internal_url` | Plain-text binding |
| OCI Vault `github-webhook-hmac-build-relay` | Placeholder (lifecycle `ignore_changes`) — manually populated after apply | OCI Vault secret |

### Terraform wiring
**File:** `/Volumes/Topper2TB/Git/cloudhome/tofu/environments/sj-a/main.tf` (lines 199–209)
```hcl
module "cloudflare_build_relay" {
  source = "../../modules/cloudflare_build_relay"
  # ... cloudflare + vault IDs
  # No dispatcher URL override → uses default: build-dispatcher-internal.rustybret.com
}
```

---

## 2. `build-dispatcher` — In-Cluster Build Orchestrator

**Entry:** `/Volumes/Topper2TB/Git/cloudhome/docker/build-dispatcher/src/index.js`
**Repo map:** `/Volumes/Topper2TB/Git/cloudhome/docker/build-dispatcher/src/repo-map.js`
**Deployment:** `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ops/buildkit/dispatcher.yaml`

### How It's Invoked
**HTTP endpoint** at `POST /dispatch`. Listens on port 8080 (ClusterIP `build-dispatcher.buildkit.svc.cluster.local:8080`). Also serves `GET /healthz`.

The Cloudflare Tunnel routes the relay's async fetch to the Traefik IngressRoute `Host(\`build-dispatcher-internal.rustybret.com\`)`, which goes to this ClusterIP.

### HMAC Re-validation (Defense in Depth)
Checks `x-hub-signature-256` **OR** `x-build-relay-signature` header against `DISPATCHER_HMAC_SECRET` (from env, delivered via ESO secret `buildkit-dispatcher-creds`, key `DISPATCHER_HMAC_SECRET`). Uses `crypto.timingSafeEqual`.

### Payload Parsing (lines 83–113)
Accepts multiple shapes with fallback:
```js
// Primary fields (from programmatic callers):
{ repo, sha, branch }

// Fallback from GitHub push webhook:
payload.repository.full_name  → repo
payload.after                 → sha
payload.ref                   → branch  // strips "refs/heads/"
```

Validates: `repo` must be non-empty string, `sha` must be 7–40 hex characters. Returns 400 on failure, 204 on empty target match.

### Repo→Image Mapping (`repo-map.js`)

Each key is the **short repo name** (after last `/`, case-insensitive matching). Value is an array of `BuildTarget` objects:

```js
{
  image:       "atlas-php",          // OCIR image short name (no registry prefix)
  arch:        "amd64" | "arm64" | ["amd64", "arm64"],  // single string OR array
  jobTemplate: "atlas-amd64",        // slug for k8s Job template name
}
```

**Current map** (`REPO_TARGETS`):
| Short Name | Targets |
|---|---|
| `atlas` | `[{image: "atlas-php", arch: "amd64", jobTemplate: "atlas-amd64"}]` |
| `webgameECS` | `[{image: "nakama-webgame", arch: "arm64", jobTemplate: "nakama-arm64"}]` |
| `opencode` | `[{image: "opencode", arch: "arm64", jobTemplate: "opencode-arm64"}]` |
| `cloudhome` | 5 targets: `opencode` (arm64), `ultrabot-gp-dev` (multi-arch), `ultrabot-cluster-admin` (multi-arch), `ultrabot-webgameECS-unity` (amd64), `ultrabot-dispatcher` (multi-arch) |

### How a Job Is Created (lines 197–248)

**Template naming convention:**
- **Single-arch:** `{jobTemplate}-template` (e.g., `atlas-amd64-template`)
- **Multi-arch:** `{jobTemplate}-{arch}-template` (e.g., `ultrabot-gp-dev-amd64-template`)

**Flow for each target:**
1. If `target.arch` is an array (multi-arch), iterate per arch.
2. **GET** the suspended Job template from K8s: `GET /apis/batch/v1/namespaces/buildkit/jobs/{templateName}`
3. `instantiateTemplate()` deep-clones, strips server metadata (name, resourceVersion, uid, generation, managedFields, status, selector, autogenerated labels).
4. Sets `spec.suspend = false`.
5. Labels the job with `build.cloudhome/sha`, `build.cloudhome/branch`, `app.kubernetes.io/managed-by: build-dispatcher`.
6. Injects `BUILD_SHA` env var into all initContainers.
7. **POST** the manifest to `POST /apis/batch/v1/namespaces/buildkit/jobs` — K8s assigns a unique name via the template's `generateName`.

Returns 202 `{repo, sha, dispatched: [jobNames], failed: []}`.

### K8s Access & RBAC
- Uses ServiceAccount token mounted at `/var/run/secrets/kubernetes.io/serviceaccount`.
- **ServiceAccount:** `build-dispatcher` in `buildkit` namespace.
- **Role** (`build-dispatcher-job-manager`): `verbs: ["create", "delete", "get"]` on `batch/jobs`, scoped to `buildkit` ns only.
- The SA token is used for direct HTTPS calls to the K8s API server (no kubectl, no client-go — pure Node built-ins with `node:https`).

---

## 3. How BuildKit Jobs Work — Per-Arch Templates and OCIR Push

### Architecture

There are two **persistent BuildKit daemon Deployments** that run continuously (not Job-scoped):

| Daemon | Node | Worker Type | Socket Path |
|--------|------|------------|-------------|
| `buildkitd-amd64` | `altos-worker-01` | OCI worker (embedded runc + overlayfs) | `/run/buildkit-amd64` (hostPath) |
| `buildkitd-arm64` | `sj-b-worker-01` | containerd worker (shares K3s containerd) | `/run/buildkit-arm64` (hostPath) |

Both listen on a **Unix socket** (`buildkitd.sock`) — NOT on TCP. The socket is shared via hostPath with build Job pods scheduled on the same node.

**Key:** The daemons are `clusterIP: None` (headless). Build Job pods connect via the host-mounted socket (`hostPath: /run/buildkit-{arch}` → container `/run/buildkit/buildkitd.sock`), NOT over the network. This means a build Job must land on the same node as its daemon.

### Per-Arch Job Template Pattern

Each build Job uses **`moby/buildkit:latest`** running `buildctl` as a **client** that streams the build context to the local daemon:

```
initContainers: alpine/git:latest → clones repo to shared emptyDir
containers:     moby/buildkit:latest → buildctl --addr unix:///run/buildkit/buildkitd.sock build ...
```

**Critical env vars in templates:**
- `BUILD_SHA` — set to `""` in templates; dispatcher injects the real SHA.
- `GIT_TOKEN` — from per-repo clone creds secret (e.g., `atlas-clone-creds`, key `github-pat`).

### OCIR Push

The `buildctl build --output type=image,...` command pushes directly to OCIR:
```
ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/{image}:latest
```

OCIR auth comes from a `kubernetes.io/dockerconfigjson` secret (`buildkit-ocir-creds`) synced from OCI Vault via ExternalSecret. The Job mounts this as a volume at `/home/user/.docker/config.json`.

### Single-Arch vs Multi-Arch

**Single-arch** (e.g., atlas-php, opencode):
- One Job template at `k8s/base/ops/buildkit/jobs/{image}-{arch}.yaml`
- Pushes directly to `:latest` tag.

**Multi-arch** (e.g., ultrabot-gp-dev, ultrabot-dispatcher, ultrabot-cluster-admin):
- **Per-arch build Jobs:** Each pushes to `:{image}-latest-{arch}` (e.g., `:latest-amd64`, `:latest-arm64`).
- **Manifest assembly Job:** A separate Job template (`{image}-manifest.yaml`) using `gcr.io/go-containerregistry/crane:latest` that runs `crane index append -m ... -m ... -t :latest` to fuse the two arch-specific tags into a multi-arch OCI image index.

### All Build Job Templates

Located in `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ops/buildkit/jobs/`:
- **Single-arch:** `atlas-amd64.yaml`, `opencode-arm64.yaml`, `nakama-arm64.yaml`, `unity-amd64.yaml`, `figma-pilot-arm64.yaml`
- **Multi-arch per-leg:** `ultrabot-gp-dev-amd64.yaml`, `ultrabot-gp-dev-arm64.yaml`, `ultrabot-cluster-admin-amd64.yaml`, `ultrabot-cluster-admin-arm64.yaml`, `ultrabot-dispatcher-amd64.yaml`, `ultrabot-dispatcher-arm64.yaml`
- **Manifest assembly:** `ultrabot-gp-dev-manifest.yaml`, `ultrabot-cluster-admin-manifest.yaml`, `ultrabot-dispatcher-manifest.yaml`

All templates have `suspend: true`, `backoffLimit: 0`, `ttlSecondsAfterFinished: 3600`, `activeDeadlineSeconds: 3600` (1800 for manifest jobs).

---

## 4. Jenkins Webhook Relay — The Second Worker

**File:** `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/cloudflare_jenkins_webhook/worker/worker.js`

This is a **separate Cloudflare Worker** at `jenkins-hook.rustybret.com` that relays GitHub webhooks specifically to **Jenkins** (not to the build-dispatcher).

**Key differences from the build-relay Worker:**
- Forwards **verbatim** (preserves original method, headers, body) to `env.JENKINS_URL`.
- Default target: `https://jenkins.rustybret.com/github-webhook/`
- Uses a **Workers secret binding** (`WEBHOOK_HMAC_SECRET` — auto-injected by a tofu `local-exec` provisioner using the Cloudflare API), NOT a KV namespace value.
- Secret is auto-generated by `random_password.shared_secret` and stored in OCI Vault as `jenkins-webhook-hmac`.
- Returns the **upstream response** directly (not 202-async) — it's a transparent proxy.

### Jenkins Webhook Flow (from runbook)

```
GitHub push → POST jenkins-hook.rustybret.com/github-webhook/
  → Cloudflare Worker validates HMAC
  → Cloudflare Tunnel → Traefik IngressRoute jenkins.rustybret.com
  → Jenkins Service (jenkins.jenkins.svc.cluster.local:8080)
  → GitHub plugin re-validates HMAC, triggers pipeline(s)
```

---

## 5. Jenkins State (Confirmed Fresh)

**File:** `/Volumes/Topper2TB/Git/cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml`

- **No jobs defined.** The JCasC config covers security-realm (oic-auth), authorization, build-discarder, and kubernetes-cloud (agent template). There is **no `jobs:` block** in the JCasC.
- **Single agent template:** `default` → `jenkins/inbound-agent:latest`, no privileged containers, no hostPath mounts.
- **Plugins installed:** oic-auth, kubernetes, github, git, configuration-as-code, workflow-aggregator.
- **Jenkins agent SA** (`jenkins-agent`) RBAC is scoped to **`jenkins` namespace only** (pods, pods/exec, pods/log, batch/jobs, secrets, configmaps). No cross-namespace access.

### ZERO Jenkinsfiles

**Confirmed:** There are **no Jenkinsfiles anywhere in the cloudhome repo**. The only references are in documentation describing what one would look like. The Jenkins reference doc (`coordination_notes/jenkins-build-setup-reference.md`) explicitly states:

> "No seed job or Job-DSL exists today — the agent must add one."

And:

> "The controller is freshly deployed with zero jobs defined."

---

## 6. Full End-to-End Signal Flow

```
External Webhook (GitHub push event)
│
├─► build-relay.rustybret.com (Cloudflare Worker)
│   │  Validates HMAC (KV: BUILD_RELAY_SECRETS / WEBHOOK_HMAC_SECRET)
│   │  Responds 202 immediately
│   │  ctx.waitUntil( async fetch(DISPATCHER_URL) )
│   │
│   └─► Cloudflare Tunnel → Traefik
│       Host: build-dispatcher-internal.rustybret.com
│       │
│       └─► Service: build-dispatcher.buildkit.svc.cluster.local:8080
│           │  POST /dispatch
│           │  Re-validates HMAC (env DISPATCHER_HMAC_SECRET)
│           │  parsePayload() → {repo, sha, branch}
│           │  targetsForRepo(repo) → BuildTarget[]
│           │
│           ├─► GET k8s API /apis/batch/v1/namespaces/buildkit/jobs/{template}
│           │   Clone template, strip server metadata, set BUILD_SHA, unsuspend
│           │
│           └─► POST k8s API /apis/batch/v1/namespaces/buildkit/jobs
│               (generateName creates unique job name)
│               │
│               └─► K8s creates Job pod in buildkit namespace
│                   │  label: app.kubernetes.io/component=buildkit-job
│                   │
│                   ├─► Init: alpine/git clones repo at {sha} into emptyDir
│                   │
│                   └─► Build: moby/buildkit → buildctl → unix socket
│                       │  connects to buildkitd-{arch} on same node
│                       │  daemon builds Dockerfile and pushes to OCIR
│                       │
│                       └─► OCIR: ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/{image}:latest
│
├─► jenkins-hook.rustybret.com (separate Cloudflare Worker)
│   │  Validates HMAC (secret binding WEBHOOK_HMAC_SECRET)
│   │  Forwards verbatim to JENKINS_URL
│   │
│   └─► Cloudflare Tunnel → Traefik
│       Host: jenkins.rustybret.com
│       │
│       └─► Service: jenkins.jenkins.svc.cluster.local:8080
│           └─► Jenkins GitHub plugin re-validates HMAC
│               └─► Triggers pipeline (currently NONE configured)
```

---

## 7. What to Reuse vs. What's Net-New

### Existing infrastructure you should reuse:
1. **The two-Cloudflare-worker pattern** — `build-relay` (async→dispatcher) and `jenkins-webhook` (sync→Jenkins) are already modular. Your new CI/release-watcher can be a **third worker** or add a new route to the existing `build-relay` worker.
2. **Cloudflare Tunnel ingress** — the Traefik IngressRoute pattern for routing tunnel traffic to in-cluster services is proven.
3. **BuildKit daemons** — persistent per-arch daemons are already running, handling layer caching, OCIR push auth, and network policy.
4. **ESO secret sync** — OCIR docker credentials (buildkit-ocir-creds), GH clone PATs, and Jenkins secrets already flow from OCI Vault via ExternalSecrets. Use the same pattern.
5. **The build-dispatcher's template instantiation logic** — the `instantiateTemplate()` function (GET suspended Job, deep-clone, strip metadata, set BUILD_SHA, unsuspend, POST) is generic. A new dispatcher for your CI system could reuse this exact mechanism.

### What does NOT exist yet (net-new for your plan):
1. **No Jenkinsfiles** — zero definition in any repo.
2. **No JCasC job definitions** — Jenkins has no pipelines configured.
3. **No cross-namespace RBAC** for Jenkins→buildkit — Jenkins agent SA is scoped to `jenkins` ns only. There's a documented gap (see build-setup-reference): "RBAC gap: needs a new Role+RoleBinding granting jenkins-agent SA create/get/list on batch/jobs in buildkit ns."
4. **No build-job-trigger-from-Jenkins plumbing** — the reference doc recommends Option A (POST to the dispatcher with HMAC) as easier than Option B (direct K8s API), but neither is implemented.
5. **No macOS Jenkins agent** — no Apple hardware is wired as a Jenkins node.

</results>

<answer>

## Architectural Summary & Design Implications

You have **two parallel webhook pipelines** that are completely independent:

**1. Build Pipeline** (already working for Docker images):
```
GitHub → build-relay.rustybret.com (CF Worker) 
       → async fetch → Cloudflare Tunnel 
       → build-dispatcher-internal.rustybret.com 
       → build-dispatcher Service (K8s)
       → creates K8s Job pods → buildkitd → OCIR push
```
This is fully automated and triggered for `atlas`, `webgameECS`, `opencode`, and `cloudhome` repos. No human intervention.

**2. Jenkins Pipeline** (deployed but empty):
```
GitHub → jenkins-hook.rustybret.com (CF Worker) 
       → verbatim forward → Cloudflare Tunnel 
       → jenkins.rustybret.com → Jenkins controller
       → ... nothing (no jobs defined)
```
The plumbing from GitHub to Jenkins is completely wired (Worker + Tunnel + IngressRoute + HMAC chain). But Jenkins has **zero jobs, zero Jenkinsfiles, zero pipelines**.

**For your project-agnostic CI/release-watcher, the key architectural decision is:**

You can route webhooks to **either pipeline** (or a new one) by pointing GitHub repo webhooks at different Cloudflare Worker URLs.

- For **Docker image builds** → the `build-relay` pipeline is production-ready and multi-arch capable. Just add a `repo-map.js` entry for your new repo and a Job template. No Jenkins needed.
- For **non-Docker CI** (compilation, testing, release artifacts) → you'll need to either:
  - Add jobs to Jenkins (no Jenkinsfiles exist yet — you're building from zero), or
  - Create a **new dispatcher** that follows the same pattern as `build-dispatcher` (HTTP endpoint that instantiates K8s Job templates) but for your CI workloads, or
  - Extend the build-dispatcher to support new job types beyond OCIR image pushes.

The current dispatcher is **buildkit-specific** — it speaks `buildctl` to `buildkitd` sockets. For arbitrary CI jobs (compile, test, package, release), you'd need a different dispatcher or a generalized Job runner.
</answer>

<next_steps>

**Your plan should likely:**

1. **Decide on the webhook routing model.** Either:
   - Add a **third Cloudflare Worker** (e.g., `ci-relay.rustybret.com`) for your new CI workloads.
   - Or extend the existing `build-relay` worker to support a `X-CI-Dispatch` header that routes to a new in-cluster service.

2. **For the in-cluster side**, you have two clean paths:
   - **Path A (reuse dispatcher pattern):** Write a new `ci-dispatcher` (Node.js HTTP service similar to build-dispatcher) that receives webhooks and creates generic CI Job pods. Reuse the template-instantiation logic, HMAC validation, and K8s API client code from `docker/build-dispatcher/src/index.js`. This avoids Jenkins entirely.
   - **Path B (use Jenkins):** Add JCasC job definitions to `jenkins-values.yaml`, add a Jenkinsfile to each target repo, and close the RBAC gap (jenkins-agent needs `batch/jobs` create in `buildkit` ns) plus wire the dispatcher HMAC secret into Jenkins.

3. **Multi-arch CI for non-Docker builds** is well-documented in the Jenkins build-setup-reference (Variant 2). The per-arch node pool exists (altos=amd64, sj-b=arm64) — you just need agent templates and parallelism in the pipeline.

4. **Configure a new GitHub webhook** for your repo pointing at whichever Worker URL you choose, using the same HMAC secret pattern.

**Ready to proceed — the entire existing signal chain has been mapped above. Design can start immediately without needing to re-read any files.**
</next_steps>

</results>
```

**Tool: background_output**

**Input:**
```json
{
  "task_id": "bg_cd70e346"
}
```

**Output:**
```
Task Result

Task ID: bg_cd70e346
Description: Map cloudhome jenkins + atlas + OCI db
Duration: 1m 52s
Session ID: ses_169ea9646ffeVIcQIWBAZFPoJE

---

The user wants me to investigate the cloudhome repo at /Volumes/Topper2TB/Git/cloudhome for several things related to setting up a Jenkins-based CI/release-watcher. Let me start by exploring the repository structure and then dig into each of their four areas of interest.

Let me launch multiple parallel searches to be efficient.

<analysis>
**Literal Request**: Investigate the cloudhome repo across 4 areas: Jenkins install config, atlas project CI/DB pattern, OCI database resources, and OCIR registry setup.

**Actual Need**: The user is planning to build a Jenkins pipeline that builds binaries + docker images and records run-state in an OCI database. They need to understand existing infrastructure patterns to know what's already in place, what patterns to follow, and what blockers exist.

**Success Looks Like**: Concrete file paths, key config values quoted, and a clear assessment of whether the existing infra supports or blocks each aspect of their planned pipeline.
</analysis>

Let me launch parallel searches across all four areas simultaneously.

Good, I now have the repo root and key files. Let me now read the critical files in parallel:

1. `jenkins-values.yaml` - Jenkins config
2. `coordination_notes/jenkins-build-setup-reference.md` - Jenkins setup reference
3. `tofu/modules/database/main.tf` - Database module
4. `tofu/modules/registry/main.tf` - OCI registry
5. `repo-map.js` - For atlas mapping
6. Look for atlas in k8s/

Let me do all these reads in parallel.

Great, I have a lot of data already. Now I need to dig deeper into:

1. Atlas project details - look for atlas-related files in k8s/, docker/, tofu/
2. OCI database resources - look at the database module variables, provider config in tofu environments
3. OCIR registry - look at the registry module variables
4. Any atlas k8s manifests
5. The ESO patterns for secrets
6. Look for atlas in tofu variables

Let me launch more parallel reads.

Let me now read the atlas-related files: the buildkit job template, the atlas.just, build-atlas.sh, the ESO secrets, the backup jobs, and the tofu environments to see how atlas infrastructure is configured.

Now let me look at a few more things:

1. The atlas database - from the backup CronJob, it's `mariadb.apps.svc.cluster.local:3306` - a MariaDB service in the K8s cluster, not OCI. Let me find how that's deployed.
2. The ESO pattern for ExternalSecrets (ClusterSecretStore)
3. The buildkit ESO secrets for OCIR
4. The envs with the database module (sj-b, phx-c)
5. Whether there are any Jenkinsfiles
6. Look for atlas k8s manifests to understand the database deployment
7. The vault module to understand the ESO setup

Interesting - `k8s/base/apps/atlas` doesn't seem to exist in this repo! The `atlas.just` file references manifests at `../atlas/k8s/base/apps/atlas` relative to `ops/`, which means `atlas/k8s/base/apps/atlas` - the atlas manifests are in a SEPARATE repo called `atlas`, not in `cloudhome`.

Let me search for the atlas repo.

Let me now:
1. Read the clustersecretstore.yaml to understand the ESO pattern
2. Read the externalsecret-atp.yaml - this seems interesting (ATP = Autonomous Transaction Processing = OCI Autonomous DB)
3. Look at the atlas k8s manifests in the atlas repo
4. Check the env outputs for sj-a to see what DB outputs exist
5. Check for any additional OCI database patterns in tofu states

Let me now look at the atlas repo's mariadb manifests to understand the database pattern used there, and also look at the atlas environment config file for what database hostname Atlas uses.

Now let me look at the Atlas Dockerfile and its build process:

Let me also look at the Atlas Dockerfile to understand the build process, and check the environment configs for phx-c/sj-b to see if they also have database modules.

Now let me check sj-b main.tf to see if it also has a database module, and look at the phx-c main.tf. Also let me look at the atlas web-deployment.yaml in the atlas repo.

Let me also look at the phx-c main.tf to see the full database module configuration there:

Now I have a comprehensive picture. Let me compile the full report. Let me summarize what I've found:

## 1. Jenkins Install

### Key Files:
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` - Helm values
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/apps/jenkins/rbac.yaml` - RBAC
- `/Volumes/Topper2TB/Git/cloudhome/coordination_notes/jenkins-build-setup-reference.md` - Build setup reference
- `/Volumes/Topper2TB/Git/cloudhome/docs/runbooks/Jenkins CI.md` - Runbook
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-jenkins.yaml` - Jenkins ESO

### Controller:
- StatefulSet on `altos-worker-01`, namespace `jenkins`
- Image: `jenkins/jenkins:lts-jdk17` from Docker Hub
- Resources: requests 500m CPU / 1Gi RAM, limits 1 CPU / 2Gi RAM, -Xmx1536m

### Auth:
- OIDC via Authentik (`oic-auth` plugin), well-known URL at `auth.rustybret.com/application/o/jenkins/`
- Local admin fallback with JCasC
- Secrets from OCI Vault via ESO → `jenkins-secrets` K8s Secret

### Agent Templates:
- Single default template: `jenkins/inbound-agent:latest`
- Labels: `jenkins-agent`
- Namespace: `jenkins`, SA: `jenkins-agent`
- Resources: requests 100m CPU / 256Mi RAM, limits 1 CPU / 1Gi RAM
- Container cap: 5
- No privileged containers, no hostPath
- The default agent image has no compiler — agent template would need to be extended for builds

### Storage:
- PVC: `jenkins` (50Gi, `local-altos` ZFS-backed StorageClass)
- `archiveArtifacts` lands here

### Pipeline Jobs:
- **Confirmed: zero** — The coordination doc explicitly states: "the controller is freshly deployed with zero jobs defined"
- No Jenkinsfiles exist anywhere in the cloudhome repo (confirmed via search)
- JCasC has no `jobs:` block — a seed job or pipeline job definition must be added

### RBAC:
- `jenkins-agent` SA has Role `jenkins-agents` scoped to `jenkins` namespace only
- Permissions: pods create/delete/get/list/watch, pods/exec, pods/log, batch jobs CRUD, secrets/configmaps get/list/watch
- **No cross-namespace access** — this is a blocker for reaching `buildkit` namespace Jobs without extending RBAC

## 2. Atlas Project

### Atlas is a SEPARATE repo at `/Volumes/Topper2TB/Git/atlas/`

### CI/Build:
- Build happens via `docker buildx` with `--platform linux/amd64` pushing to OCIR
- Two paths:
  - **Local**: `scripts/build-atlas.sh` — uses Docker daemon + buildx
  - **BuildKit**: `k8s/base/ops/buildkit/jobs/atlas-amd64.yaml` — suspended Job template triggered by the dispatcher
- The BuildKit Job template:
  - Init container `alpine/git` clones the private atlas repo using `atlas-github-pat` from OCI Vault
  - Build container `moby/buildkit:latest` runs `buildctl build` against `buildkitd-amd64` daemon on altos
  - Pushes to `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/atlas-php:latest`
  - Uses `docker/php/Dockerfile` from the atlas repo
- Atlas docker image is a multi-stage PHP 8.4-fpm build with Composer + npm

### Database:
- **NOT OCI** — Atlas uses **in-cluster MariaDB 10.11**
- Deployed as a K8s Deployment + headless Service in `apps` namespace
- PVC: `atlas-mariadb-pvc` (10Gi, `local-altos` StorageClass)
- Pinned to `altos=true` nodes
- DB_HOST from ConfigMap: `mariadb` (K8s service name)
- DB credentials from `atlas-secrets` K8s Secret via ESO from OCI Vault (`atlas-db-password`)
- Database name: `laravel` (MariaDB)
- The backup CronJob connects to `mariadb.apps.svc.cluster.local:3306`
- Also uses: Redis (in-cluster), Typesense (in-cluster)

### Repo-map:
- `atlas` maps to image `atlas-php`, arch `amd64`, jobTemplate `atlas-amd64`
- Only one image per the repo-map

## 3. OCI Database Resources

### OCI Autonomous Databases provisioned:

**sj-a environment:**
- DB Name: `SJAFREEDB`
- Display Name: `free-atp`
- DB Workload: `OLTP`
- Is Free Tier: `true`
- Features the Always Free ATP has:
  - At rest in a private subnet (private endpoint: `sjafreeadb`)
  - Admin password automatically generated by `random_password`
  - Password stored in OCI Vault as `SJAFREEDB-admin-password`
  - Password synced to K8s as `atp-admin-password` Secret in `auth` namespace (ESO `externalsecret-atp.yaml`)
  - Connection strings/outputs available via tofu
- Vault module provisions the OCI Vault, KMS key, and ESO UserPrincipal

**phx-c environment:**
- DB Name: `PHXFREEDB`
- Display Name: `free-atp`
- Same pattern as sj-a but no vault_id/key_id set (so password not stored in vault for this one)
- Comment: "Always Free ATP does not support private endpoints"

**sj-b environment:**
- No database module — only compute, network, security, monitoring

### ESO Pattern:
- ClusterSecretStore `oci-vault-store` in `k8s/base/secrets/eso/clustersecretstore.yaml`
- Uses UserPrincipal auth (API key + fingerprint in `oci-eso-credentials` Secret, namespace `secrets`)
- Vault OCID, compartment OCID, region: `us-sanjose-1`
- All ExternalSecrets reference `oci-vault-store`
- `externalsecret-atp.yaml` exists that pulls `SJAFREEDB-admin-password` from OCI Vault into `atp-admin-password` K8s Secret

### Key OCI DB Pattern:
- Autonomous Database (Always Free) is provisioned via tofu
- Admin password auto-generated → stored in OCI Vault → synced to K8s via ESO
- Atlas does NOT use this — atlas uses in-cluster MariaDB
- The ATP exists for other services to use (currently `externalsecret-atp.yaml` lives in the ESO kustomization, suggesting something does or could use it)

## 4. OCIR Registry

### Registry:
- Host: `ocir.us-sanjose-1.oci.oraclecloud.com`
- Namespace: `axarjcg9zmg6` (OCI Object Storage namespace for the tenancy)
- All image URLs follow: `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/<image-name>:<tag>`

### Repositories provisioned:
- `opencode`
- `figma-pilot-mcp`
- `nakama-webgame`
- Note: `atlas-php` is NOT in the tofu-managed list — it's created out-of-band or via a different mechanism

### Pull/Push:
- **Push**: Docker config stored in OCI Vault as `buildkit-ocir-dockerconfig` → ESO syncs to `buildkit-ocir-creds` (kubernetes.io/dockerconfigjson type) in `buildkit` namespace
- **Pull**: `ocir-pull-secret` imagePullSecret is used by pods (e.g., atlas-web deployment)
- **Local dev push**: `scripts/build-atlas.sh` uses Docker daemon with locally-configured OCIR creds (loaded via `just secrets env` or `scripts/export-ocir-vars.sh`)
- Repositories are `is_public: false` (private) by default

### OCIR Auth Token:
- Help available via `just credentials show-ocir-token-help`

## Blockers Assessment for a Jenkins Pipeline

1. **No pipeline jobs exist** — need to add JCasC `jobs:` block or set up a seed job
2. **Agent templates too bare** — default `jenkins/inbound-agent:latest` has no build tools. Need to add toolchain pod templates (with bun, node, git, docker/buildx, etc.) or create a custom agent image
3. **Cross-namespace RBAC** — agents can't create Jobs in `buildkit` namespace. Need either:
   - Extend RBAC (new Role+RoleBinding for `jenkins-agent` in `buildkit` namespace)
   - Or use the dispatcher HTTP API approach (needs HMAC secret)
4. **OCIR push auth** — `buildkit-ocir-creds` lives in `buildkit` namespace; Jenkins agents in `jenkins` namespace can't access it. Would need either a cross-namespace reference or a copy in `jenkins` namespace
5. **In-cluster MariaDB for run-state** — atlas uses in-cluster MariaDB, not OCI ATP. For run-state recording, the existing MariaDB could be used, or the ATP (SJAFREEDB) could be connected to
6. **No build tools on agent** — bun/node/git/docker/buildx all need to be provisioned in agent pods
7. **Existing BuildKit pattern** exists and is proven — Jenkins could trigger the existing BuildKit pipeline (dispatcher or direct Job creation) rather than re-building Docker infra
8. **No macOS agent** exists for native Apple builds

Now let me compile this into a clear report.

Now I have all the data. Let me compile the complete report.

<results>
<files>
### 1. Jenkins Install

- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` — Helm values: controller (jenkins/jenkins:lts-jdk17, 500m/1Gi → 1/2Gi), agent (jenkins/inbound-agent:latest, 100m/256Mi → 1/1Gi), JCasC OIDC + K8s cloud, single `default` pod template, 50Gi local-altos PVC
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/apps/jenkins/rbac.yaml` — jenkins-agent SA with Role scoped to `jenkins` ns only (pods CRUD, pods/exec, pods/log, batch/jobs, secrets/configmaps get)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-jenkins.yaml` — ESO syncs `jenkins-admin-password`, `jenkins-oidc-client-secret`, `jenkins-webhook-hmac` from OCI Vault → `jenkins-secrets` K8s Secret in `jenkins` ns
- `/Volumes/Topper2TB/Git/cloudhome/coordination_notes/jenkins-build-setup-reference.md` — Build planning document, 3 variants (Docker→OCIR, multi-arch binary, macOS)
- `/Volumes/Topper2TB/Git/cloudhome/docs/runbooks/Jenkins CI.md` — Full CI runbook with webhook flow, OIDC auth, troubleshooting

### 2. Atlas Project

- `/Volumes/Topper2TB/Git/atlas/` — Separate repo root (sibling to cloudhome)
- `/Volumes/Topper2TB/Git/atlas/k8s/base/apps/atlas/mariadb-deployment.yaml` — MariaDB 10.11, pinned to `altos:true`, PVC `atlas-mariadb-pvc` (10Gi), DB credentials from `atlas-secrets`
- `/Volumes/Topper2TB/Git/atlas/k8s/base/apps/atlas/mariadb-service.yaml` — headless Service `mariadb` in `apps` ns, port 3306
- `/Volumes/Topper2TB/Git/atlas/k8s/base/apps/atlas/kustomization.yaml` — Full kustomize: mariadb, redis, typesense, web (nginx+php-fpm), reverb, horizon, scheduler, PVCs, migration+bootstrap jobs
- `/Volumes/Topper2TB/Git/atlas/k8s/base/apps/atlas/configmap.yaml` — DB_HOST: `mariadb`, DB_PORT: 3306, DB_DATABASE: `laravel`
- `/Volumes/Topper2TB/Git/atlas/docker/php/Dockerfile` — Multi-stage PHP 8.4-fpm with composer+npm, builds JS assets
- `/Volumes/Topper2TB/Git/atlas/docker-compose.yml` — Local dev: mariadb + redis + typesense + phpmyadmin
- `/Volumes/Topper2TB/Git/cloudhome/scripts/build-atlas.sh` — Local build script: docker buildx → OCIR, optional rollout-restart
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ops/buildkit/jobs/atlas-amd64.yaml` — BuildKit Job template: alpine/git clone → moby/buildctl build → push to OCIR
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ops/backup-atlas-db.yaml` — Daily mysqldump CronJob → rsync to phx-dr-01
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-atlas.yaml` — ESO: atlas secrets from OCI Vault (APP_KEY, DB_PASSWORD, TYPESENSE_API_KEY, etc.)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-atlas-db-backup.yaml` — ESO: DB_PASSWORD for backup job
- `/Volumes/Topper2TB/Git/cloudhome/ops/atlas.just` — Just recipes: build, deploy, migrate, health, update
- `/Volumes/Topper2TB/Git/cloudhome/docker/build-dispatcher/src/repo-map.js` — Maps `atlas` → `atlas-php` image, amd64, `atlas-amd64` job template

### 3. OCI Database Resources

- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/database/main.tf` — `oci_database_autonomous_database` resource, Always Free Tier (`is_free_tier = true`), auto-generates admin password, stores in OCI Vault
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/database/variables.tf` — db_name, db_workload (OLTP), subnet_id, vault_id, vault_key_id
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/database/outputs.tf` — autonomous_database_id, connection_strings, connection_urls, db_admin_password_secret_id
- `/Volumes/Topper2TB/Git/cloudhome/tofu/environments/sj-a/main.tf` (line 158-171) — `module "database"` with `db_name = "SJAFREEDB"`, `db_display_name = "free-atp"`, private endpoint in sj-a VCN
- `/Volumes/Topper2TB/Git/cloudhome/tofu/environments/phx-c/main.tf` (line 62-73) — `module "database"` with `db_name = "PHXFREEDB"`, no vault_id set
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-atp.yaml` — ESO: `SJAFREEDB-admin-password` from OCI Vault → `atp-admin-password` K8s Secret in `auth` ns
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/clustersecretstore.yaml` — ClusterSecretStore `oci-vault-store`, UserPrincipal auth, vault in us-sanjose-1
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/vault/main.tf` — OCI Vault provisioning, KMS key, ESO readers group+policy

### 4. OCIR Registry

- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/registry/main.tf` — `oci_artifacts_container_repository` for managed repos
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/registry/outputs.tf` — Repository URLs: `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/<name>`
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/registry/variables.tf` — registry_host, repository_names, is_public defaults false
- `/Volumes/Topper2TB/Git/cloudhome/tofu/environments/sj-a/main.tf` (line 71-81) — repos: opencode, figma-pilot-mcp, nakama-webgame (atlas-php NOT in tofu list)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/secrets/eso/externalsecret-buildkit-ocir.yaml` — ESO: `buildkit-ocir-dockerconfig` from OCI Vault → `buildkit-ocir-creds` (dockerconfigjson) in `buildkit` ns
- `/Volumes/Topper2TB/Git/cloudhome/coordination_notes/jenkins-build-setup-reference.md` (line 22-23) — OCIR registry: `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/`, push auth via ESO from OCI Vault
</files>

<answer>

## 1. Jenkins Install — Concrete Details

**Controller**: StatefulSet on `altos-worker-01` (`kubernetes.io/hostname` selector), namespace `jenkins`. Image `jenkins/jenkins:lts-jdk17`, resources 500m/1Gi → 1/2Gi, `-Xmx1536m`.

**Auth**: OIDC via Authentik (`oic-auth` plugin) with `auth.rustybret.com/application/o/jenkins/` as the well-known endpoint. Fallback local admin from `jenkins-secrets` K8s Secret (both populated from OCI Vault via ESO). Scopes: `openid email profile`, username from `preferred_username`.

**Agent Template** (single, default):
```yaml
name: "default"
containers:
  - name: "jnlp"
    image: "jenkins/inbound-agent:latest"
    resourceRequestCpu: "100m"
    resourceRequestMemory: "256Mi"
    resourceLimitCpu: "1"
    resourceLimitMemory: "1Gi"
```
- Namespace: `jenkins`, SA: `jenkins-agent`, podRetention: `never`
- **No build tools** — the bare `jenkins/inbound-agent` has no compiler, no bun, no node, no docker — toolchain must be added via new pod templates or a custom agent image
- **No privileged containers**, no hostPath mounts

**Storage for archiveArtifacts**: Jenkins PVC `jenkins` (50Gi, `local-altos` ZFS-backed StorageClass). `archiveArtifacts` lands here.

**RBAC**: `jenkins-agent` SA has Role `jenkins-agents` scoped to `jenkins` namespace **only**:
```yaml
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/exec", "pods/log"]
    verbs: ["create", "delete", "get", "list", "watch"]
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["create", "delete", "get", "list", "watch"]
  - apiGroups: [""]
    resources: ["secrets", "configmaps"]
    verbs: ["get", "list", "watch"]
```
**Cannot reach other namespaces** — this blocks direct Job creation in `buildkit` ns.

**Pipeline jobs / Jenkinsfiles**: **Confirmed zero.** The coordination doc says *"the controller is freshly deployed with zero jobs defined"* (line 8). No `jobs:` block in JCasC. No `Jenkinsfile` anywhere in cloudhome or atlas repos. A seed job or pipeline-job JCasC entry is needed.

**Webhook Flow**: GitHub → `jenkins-hook.rustybret.com` (Cloudflare Worker, HMAC-validates) → Cloudflare Tunnel → Traefik → Jenkins. The Worker is tofu-provisioned (`tofu/modules/cloudflare_jenkins_webhook/`). HMAC secret stored in OCI Vault as `jenkins-webhook-hmac`.

## 2. Atlas Project — CI & DB Pattern

**Atlas is a separate Laravel repo** at `/Volumes/Topper2TB/Git/atlas/`. It is **not** a monorepo sibling — the cloudhome repo orchestrates infra, but the source lives separately.

**CI/Build Pattern (the model to follow)**:
- **Two parallel build paths** exist today:
  1. **Local dev build** (`scripts/build-atlas.sh`): `docker buildx build --platform linux/amd64 --push` directly from a local Docker daemon to OCIR. Requires Docker Desktop/colima + OCIR auth configured via `just secrets env`.
  2. **BuildKit pipeline** (`k8s/base/ops/buildkit/jobs/atlas-amd64.yaml`): A suspended K8s Job template that:
     - InitContainer `alpine/git` clones the private atlas repo using `atlas-github-pat` (OCI Vault → ESO → `atlas-clone-creds`)
     - Container `moby/buildkit:latest` runs `buildctl build` against the remote `buildkitd-amd64` daemon on altos
     - Pushes to `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/atlas-php:latest`
     - Dockerfile used: `docker/php/Dockerfile` inside atlas repo (multi-stage PHP 8.4-fpm with Composer + npm build)

- **Build dispatch**: Controlled by `docker/build-dispatcher/src/repo-map.js` which maps `atlas` repo → `{ image: "atlas-php", arch: "amd64", jobTemplate: "atlas-amd64" }`. The dispatcher receives GitHub webhooks and creates BuildKit Job instances.

- **Can Jenkins trigger the existing BuildKit pipeline?** Yes — two options:
  - **A) HTTP Dispatcher**: POST to `http://build-dispatcher.buildkit.svc.cluster.local:8080/dispatch` with `{repo, sha, branch}` + HMAC-SHA256 header (secret `buildkit-dispatcher-creds`). Egress is open from `jenkins` ns (no NetworkPolicy).
  - **B) Direct K8s Job creation**: Clone suspended template, set `BUILD_SHA`, unsuspend. Requires new Role+RoleBinding for `jenkins-agent` in `buildkit` ns.

**Database Pattern (stateful services in-cluster, NOT OCI)**:
- Atlas uses **in-cluster MariaDB 10.11** deployed as a K8s Deployment + headless Service:
  ```yaml
  # mariadb-deployment.yaml
  image: mariadb:10.11
  env:
    MYSQL_DATABASE: laravel
    MYSQL_USER: root
  ```
  - PVC: `atlas-mariadb-pvc` (10Gi, `local-altos` StorageClass, `ReadWriteOnce`)
  - Pinned to `altos: true` nodes
  - Access via `mariadb.apps.svc.cluster.local:3306` (from backup CronJob) or simply `mariadb:3306` (from atlas-web pods in same `apps` ns)
  - DB credentials: `atlas-secrets` K8s Secret → `DB_PASSWORD` key → ESO from OCI Vault `atlas-db-password` secret

- **Also runs**: Redis (in-cluster), Typesense (in-cluster), Reverb (websocket)

- **Backup**: Daily `mysqldump --all-databases` → gzip → SHA256 checksum → rsync to phx-dr-01 (`10.44.0.3`) with 7-day retention. Runs as a CronJob in `ops` ns.

- **Atlas does NOT use the OCI Autonomous Database**. The only references to the OCI ATP are in the tofu outputs (`database_id`, `database_connection_strings`) and the `atp-admin-password` ExternalSecret in `auth` ns.

## 3. OCI Database Resources

**Two Always Free Autonomous Databases exist:**

| Environment | DB Name (db_name) | Display Name | Region | Private Endpoint | Vault-stored Password |
|-------------|-------------------|--------------|--------|-----------------|----------------------|
| sj-a | `SJAFREEDB` | `free-atp` | us-sanjose-1 | Yes (`sjafreeadb`) | Yes (as `SJAFREEDB-admin-password`) |
| phx-c | `PHXFREEDB` | `free-atp` | us-phoenix-1 | No (Free tier doesn't support private endpoints in phx) | No |

**Module source**: `tofu/modules/database/main.tf`:
```hcl
resource "oci_database_autonomous_database" "this" {
  is_free_tier            = true
  is_auto_scaling_enabled = false
  db_workload             = "OLTP"
  license_model           = "LICENSE_INCLUDED"
}
```
Note the comment: *"Always Free ATP does not support private endpoints"* — yet sj-a has one (it works in us-sanjose-1). phx-c has no private endpoint.

**Credentials management chain:**
1. Tofu `random_password.db_admin` generates 24-char alphanumeric
2. Stored in OCI Vault as `<db_name>-admin-password` (e.g., `SJAFREEDB-admin-password`)
3. ESO (`externalsecret-atp.yaml`) syncs to `atp-admin-password` K8s Secret in `auth` namespace
4. Accessible via `oci vault secret list` / `just secrets get` commands

**sj-b has no database module** — only compute+network+monitoring.

**Key gap for your use case**: The ATP connection strings (`outputs.tf`) are exposed as tofu outputs but **no application currently connects to them**. The K8s Secret `atp-admin-password` exists but there's no ConfigMap or app config showing how to reach the ATP host. You'd need to:
- Pull connection details from tofu state/output
- Create a new ExternalSecret or ConfigMap for the connection string/URL
- The ATP uses Oracle SQL*Net (not MySQL protocol), so your `run-state` layer would need to use Oracle's MySQL-compatible interface or the `thick`/`thin` JDBC driver. MariaDB's `mysql` CLI won't connect to an Autonomous DB natively.

**SJAFREEDB connection strings** are in tofu state (sensitive output: `database_connection_strings`). To retrieve:
```bash
cd tofu/environments/sj-a && tofu output database_connection_strings
```

## 4. OCIR Registry — Concrete Details

**Registry endpoint**: `ocir.us-sanjose-1.oci.oraclecloud.com`
**Namespace**: `axarjcg9zmg6` (OCI Object Storage namespace)
**Full image path**: `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/<image>:<tag>`

**Repositories (tofu-managed)**: `opencode`, `figma-pilot-mcp`, `nakama-webgame`
**Repositories (out-of-band)**: `atlas-php` (created manually or by first push — **not** in the tofu module list)

**Push auth**: OCI Vault secret `buildkit-ocir-dockerconfig` (full `~/.docker/config.json` payload) → ESO syncs to `buildkit-ocir-creds` (type `kubernetes.io/dockerconfigjson`) in `buildkit` namespace.

**Pull auth**: ImagePullSecret `ocir-pull-secret` used by pods (e.g., atlas-web deployment references it).

**Crucial location constraint**: The OCIR push credential (`buildkit-ocir-creds`) lives in the `buildkit` namespace. Jenkins agents run in the `jenkins` namespace. **No cross-namespace access** exists. You'd need to either:
- Create a copy of the credential in `jenkins` namespace (new ESO + ExternalSecret)
- Or tunnel through the dispatcher/BuildKit path which already has the credential

---

## Blocker Assessment for a Parameterized Jenkins Pipeline

| Area | Status | Action Needed |
|------|--------|---------------|
| **Jenkins pipeline jobs** | ❌ None exist | Add `jobs:` block to JCasC or create a multibranch pipeline job pointing at a Jenkinsfile in your target repo |
| **Agent build tools** (bun/node/git/docker/buildx) | ❌ Default agent has none | Add new pod templates to JCasC with toolchain images (e.g., `node:22`, `docker:dind`) OR create a custom agent image that bundles everything |
| **Agent cross-namespace RBAC** | ❌ `jenkins-agent` can't reach `buildkit` ns | Option A: Add Role+RoleBinding granting `jenkins-agent` `create/get/list` on `batch/jobs` in `buildkit` ns. Option B: Use the HTTP dispatcher (needs HMAC secret mounted in Jenkins) |
| **OCIR push creds for Jenkins** | ❌ `buildkit-ocir-creds` lives in `buildkit` ns | Either mount it cross-namespace, create a new ESO in `jenkins` ns, or use the BuildKit dispatcher path |
| **OCI DB for run-state** | ⚠️ ATP exists but unused currently | SJAFREEDB is provisioned. Connection strings are in tofu state. No existing app connects to it. Would need Oracle SQL*Net or MySQL-compatible driver. |
| **BuildKit pipeline is proven** | ✅ Atlas uses it daily | Consider reusing the BuildKit dispatcher for image builds instead of building inside Jenkins |
| **Artifact storage** | ✅ 50Gi PVC on ZFS | archiveArtifacts works out of the box |
| **Webhook trigger** | ✅ Cloudflare Worker ready | GitHub webhooks already flow through `jenkins-hook.rustybret.com` |
</answer>

<next_steps>
To proceed, you need to decide on the architecture:

1. **Agent template**: Add a `build-tools` pod template to `jenkins-values.yaml` with the required toolchain (bun, node, git, buildx). This is the #1 blocker.

2. **Build vs orchestrate**: Decide whether Jenkins runs Docker builds itself (needs a DinO sidecar + OCIR push creds in `jenkins` ns) or triggers the existing BuildKit dispatcher (needs HMAC secret in Jenkins + RBAC/REST path).

3. **Run-state database**: Pick between the in-cluster MariaDB (`mariadb.apps.svc.cluster.local` — MySQL protocol, proven pattern) or the OCI ATP SJAFREEDB (Oracle protocol, needs connection string extraction + new ExternalSecret). The MariaDB path is simpler and follows the atlas pattern.

4. **Pipeline definition**: Add a JCasC `jobs:` block or create a Jenkinsfile in your target repo. The existing cloudflare webhook relay is ready — just point GitHub webhook to `jenkins-hook.rustybret.com/github-webhook/`.

I can help with the implementation of any of these pieces next.
</next_steps>
</results>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 50.2s)

_Thinking:_

 I've got two webhook workers already in place handling async builds through different pipelines, and I'm waiting on the ultrabot investigation to complete before finalizing the plan. Let me document these critical findings now—the first worker routes through build-dispatcher to BuildKit for image builds in OCIR, while the second one appears to be Jenkins-based.

The jenkins-hook worker is already wired to Jenkins, though Jenkins itself has no jobs configured yet. This is a key detail the user may not be aware of—for the CI-on-push to Jenkins path, jenkins-hook is the natural fit rather than reusing build-relay. For image builds, the build-relay pipeline is the proven approach.

The opencode image is already in the repo-map as arm64-only with an OCIR repo provisioned, but since the user is replacing the stale Dockerfile, I'll need to add a new repo-map entry for the dedicated image-build-context repo and include amd64 support. On the Jenkins side, there's significant work ahead: no Jenkinsfiles or JCasC jobs exist, the default agent lacks build tools entirely, and the jenkins-agent service account is scoped too narrowly to access the buildkit namespace or OCIR credentials.

For the database, there's a mismatch: the user expects free OCI MySQL, but what's actually provisioned is Oracle ATP (SJAFREEDB), which uses Oracle SQL*Net protocol. OCI does offer a separate MySQL HeatWave free tier that isn't provisioned yet. The user explicitly preferred an OCI database resource over in-cluster MariaDB, so either provisioning the new OCI MySQL or using the existing Oracle ATP would align with that preference—this needs clarification.

On the macOS cross-compile front, Bun does support `--target=bun-darwin-arm64` cross-compilation from Linux, so a Linux agent can produce the darwin-arm64 binary, though this should be verified during execution.

I'm holding for the ultrabot probe result before moving to plan generation, since the database protocol mismatch is a genuine blocker that might need a user decision, and I should capture these findings in the draft first.

Both completed probes returned rich detail. Let me capture the decisive findings against my locked decisions before the third (ultrabot) probe lands — several sharpen the plan and one surfaces a genuine new decision point (DB protocol mismatch).

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Remaining Open Questions",
  "newString": "## Cloudhome Infra Findings (2026-06-05, probes bg_d3e38ab0 + bg_cd70e346)\n\n### Two webhook workers ALREADY exist (key — reconcile with \"use build-relay\")\n- **`build-relay.rustybret.com`** (CF Worker): HMAC (KV `BUILD_RELAY_SECRETS/WEBHOOK_HMAC_SECRET`) → 202 async → `build-dispatcher-internal.rustybret.com` → `build-dispatcher.buildkit.svc:8080/dispatch` → instantiates suspended K8s Job templates → BuildKit → OCIR. This is the **image-build** path.\n- **`jenkins-hook.rustybret.com`** (separate CF Worker): HMAC (Workers secret `WEBHOOK_HMAC_SECRET`, Vault `jenkins-webhook-hmac`) → verbatim proxy → `jenkins.rustybret.com/github-webhook/` → Jenkins. The **Jenkins CI** path is ALREADY wired end-to-end — but Jenkins has zero jobs.\n- **Implication**: For CI-on-push → Jenkins, use the existing `jenkins-hook` worker (not build-relay). For the opencode image build, use `build-relay` → dispatcher → BuildKit. The earlier \"reuse build-relay\" decision applies to the IMAGE path; the CI path has its own dedicated worker already.\n\n### opencode is already partially wired\n- `repo-map.js`: `opencode` → `{image:\"opencode\", arch:\"arm64\", jobTemplate:\"opencode-arm64\"}` (arm64-only, from the stale Dockerfile path). OCIR repo `opencode` already tofu-provisioned.\n- The NEW dedicated image-build-context repo will need: its own `repo-map.js` entry + `opencode-amd64` + `opencode-arm64` Job templates (add amd64), pointing at the new Dockerfile/context.\n\n### Jenkins blockers = net-new work (all confirmed)\n- Zero Jenkinsfiles, zero JCasC `jobs:` block anywhere. Controller fresh (`jenkins/jenkins:lts-jdk17`, altos-worker-01, 50Gi `local-altos` PVC for archiveArtifacts).\n- Default agent `jenkins/inbound-agent:latest` has **NO build tools** (no bun/node/git/buildx). Must add a custom build-tools pod template/image.\n- `jenkins-agent` SA RBAC scoped to `jenkins` ns ONLY. To build images from Jenkins, either: (A) POST to build-dispatcher `/dispatch` with HMAC (egress open, simplest), or (B) add Role+RoleBinding for `batch/jobs` in `buildkit` ns + cross-ns OCIR creds. **Lean: Option A** (Jenkins orchestrates; BuildKit builds the image), matches \"Jenkins can produce images directly OR delegate to BuildKit\" → delegate.\n- BuildKit daemons are per-arch persistent (amd64 on altos-worker-01, arm64 on sj-b-worker-01), socket via hostPath; multi-arch assembled via `crane index append`.\n\n### DB PROTOCOL MISMATCH — NEW DECISION (blocking)\n- User said \"free OCI MySQL\". What's actually provisioned is **OCI Autonomous Database (Oracle ATP, Always Free, OLTP)** — `SJAFREEDB` (sj-a, private endpoint) + `PHXFREEDB` (phx-c). That's **Oracle SQL*Net protocol, NOT MySQL** — needs an Oracle driver; currently unused by any app.\n- Atlas's DB is **in-cluster MariaDB** (mysql protocol), which the user explicitly does NOT want for this.\n- Three resolutions: (1) **provision a NEW OCI MySQL HeatWave free-tier DB** (net-new tofu; matches \"MySQL\" intent; easy mysql protocol) — dispatch to ultrabot cluster-admin; (2) **use existing Oracle ATP SJAFREEDB** (provisioned, but Oracle driver + unused); (3) fall back to in-cluster MariaDB (rejected by user). **Needs user pick — lean (1).**\n\n### macOS cross-compile (verify in execution)\n- Neither probe confirmed Bun darwin cross-compile in-cluster. opencode build = `bun build --compile`; Bun supports `--target=bun-darwin-arm64` from Linux, so a linux build-tools agent with Bun should produce darwin-arm64. Make this an early de-risking task (build + `file`/`--version` check), not an assumption.\n\n## Remaining Open Questions"
}
```

**Output:**
```
Edited (+25/-0).

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 8.2s)

_Thinking:_

 I need to check on that third background task that was launched after the initial two completed—it hasn't reported back yet, so let me retrieve its status to see if it's finished.

Let me retrieve the third investigation (ultrabot system + secrets gates), which was launched after the first two.

**Tool: background_output**

**Input:**
```json
{
  "task_id": "bg_f77e5754"
}
```

**Output:**
```
# Task Status

| Field | Value |
|-------|-------|
| Task ID | `bg_f77e5754` |
| Description | Map cloudhome ultrabot system + secrets gates |
| Agent | explore |
| Status | **running** |
| Duration | 1m 30s |
| Session ID | `ses_169dc7726ffeXmjA2qCjpYwx95` |
| Last tool | read |


> **Note**: No need to wait explicitly - the system will notify you when this task completes.
## Original Prompt

```
I'm planning a CI/release-watcher system whose OCI/cluster infra-provisioning tasks will be DISPATCHED to an existing "ultrabot" headless-agent system (the `cluster-admin` profile) instead of done by hand. I need to understand ultrabot precisely so my plan's infra tasks are correctly shaped, and I need to know which steps are human-only gates that CANNOT be delegated.

Investigate the cloudhome repo at /Volumes/Topper2TB/Git/cloudhome (also at ~/Git/cloudhome). Report concrete details on:

1. `o...
```
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 17.5s)

The ultrabot probe (`bg_f77e5754`) is still running. I'll wait for its completion notification rather than poll — it's the last piece before I can finalize the infra-provisioning model and move toward plan generation.

While it finishes, here's where the synthesis stands against the locked decisions:

**Confirmed and plan-ready:**
- **CI-on-push path** → use the existing `jenkins-hook.rustybret.com` worker (already wired end-to-end; just needs Jenkins jobs)
- **Image-build path** → `build-relay` → `build-dispatcher` → BuildKit → OCIR (proven daily by atlas)
- **Jenkins orchestrates, BuildKit builds** (Option A: Jenkins POSTs to dispatcher with HMAC — no cross-namespace RBAC needed)
- **opencode image** → new dedicated build-context repo + new `repo-map.js` entry + add `opencode-amd64` Job template (currently arm64-only)

**One genuinely new blocking decision surfaced** — a DB protocol mismatch I need your call on:

You said "free OCI MySQL," but what's actually provisioned in cloudhome is **OCI Autonomous Database (Oracle ATP)** — that's Oracle SQL*Net protocol, *not* MySQL. Three options:

1. **Provision a new OCI MySQL HeatWave free-tier DB** (net-new tofu, dispatched to ultrabot cluster-admin) — matches your "MySQL" intent, clean mysql protocol. *My lean.*
2. **Use the existing Oracle ATP `SJAFREEDB`** — already provisioned, but needs an Oracle driver and is currently unused.
3. ~~In-cluster MariaDB~~ — you already rejected this.

Which DB do you want for the release-watcher run-state? I'll fold the answer in once the ultrabot probe lands, then move to Metis + plan generation.

---

## User

<system-reminder>
[BACKGROUND TASK COMPLETED]
[ALL BACKGROUND TASKS COMPLETE]

**Completed:**
- `bg_f77e5754`: Map cloudhome ultrabot system + secrets gates

Use `background_output(task_id="<id>")` to retrieve each result.
</system-reminder>
<!-- OMO_INTERNAL_INITIATOR -->

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 4.2s)

**Tool: background_output**

**Input:**
```json
{
  "task_id": "bg_f77e5754"
}
```

**Output:**
```
Task Result

Task ID: bg_f77e5754
Description: Map cloudhome ultrabot system + secrets gates
Duration: 1m 38s
Session ID: ses_169dc7726ffeXmjA2qCjpYwx95

---

The user wants a detailed investigation of the cloudhome repository to understand the ultrabot headless agent system. This is a multi-faceted request covering 6 main areas. Let me launch parallel searches to gather information efficiently.

Let me start by:
1. Reading the specific files mentioned
2. Searching for relevant patterns
3. Getting directory listings

I'll launch multiple parallel calls to maximize efficiency.

<analysis>
**Literal Request**: Investigate cloudhome repo for ultrabot system details across 6 areas including justfiles, k8s configs, Docker images, entrypoint scripts, Terraform modules, and secrets/runbooks.

**Actual Need**: They're designing a CI/release-watcher that delegates infra provisioning to ultrabot's `cluster-admin` profile. They need precise API contracts (arg signatures, RBAC scope, auth mechanisms) to shape their dispatch calls correctly, plus an explicit delegable-vs-human-only boundary.

**Success Looks Like**: Complete recipe signatures with invocation examples, cluster-admin RBAC/tooling specifics, credential storage chain, and a definitive two-column table of what ultrabot can do vs what requires a human.
</analysis>

Let me start by reading all the key files in parallel.

Good, I have the main files. Now let me read all the detailed files in parallel.

Now let me read all the detailed K8s manifests, Dockerfiles, Terraform modules, and build scripts in parallel:

Let me also check the build scripts to understand how the cluster-admin image is built and what additional tools it gets. Also need to check the gp-dev entrypoint and the webgameECS-unity variant.

Let me grab the build scripts and the other entrypoint variants:

Now I have the build scripts and variables for the Terraform module. Let me also read the build scripts to see how images are built and pushed.

Now let me read the build scripts and the Terraform variables for context:

Now I have a comprehensive picture. Let me also check if there are any additional infra references like OCI API signing key setup for cluster-admin, and look for Ansible inventories or vault configs.

Let me check for the OCI auth configuration and any additional cluster-admin-specific tooling:

Now I have comprehensive information to compile the full report. Let me also check the Agent Profiles doc and the secrets justfile for additional context on how the OCI auth works for cluster-admin.

Let me get the last pieces — the Agent Profiles doc and the secrets justfile:

Now I have all the information needed. Let me compile the comprehensive report. Let me also check if there's any reference to how the cluster-admin authenticates to OCI (API signing key setup), as the Dockerfile doesn't explicitly set up OCI CLI auth — it just installs the CLI.

Let me check for any OCI config setup in the cloudhome repo.

Let me check how the cluster-admin image authenticates to OCI (API key setup) and get the buildkit reference:

Interesting — the cluster-admin Dockerfile installs the OCI CLI but doesn't set up `~/.oci/config` with an API signing key. The OCI authentication for cluster-admin is via the `~/.oci/config` file with the `[sj-a]` profile, which requires an API signing key (`~/.oci/cloudhome-sj-a.pem`). 

But wait — how does the cluster-admin pod get this config? The Job template doesn't mount any OCI config as a secret. The cluster-admin image builds on top of gp-dev and adds kubectl, just, tofu, ansible, and oci-cli — but the K8s Job template doesn't mount an OCI API key.

Let me check if there's an OCI config injected as a secret or configmap for cluster-admin pods.

Actually, looking at the cluster-admin Job template carefully (lines 42-58 env section), the only env vars it gets are:
- TASK_PROMPT
- REPO_URL
- PROFILE
- GITHUB_TOKEN (from ultrabot-cluster-admin-creds/github-pat)
- ANTHROPIC_RELAY_TOKEN (from ultrabot-cluster-admin-creds/anthropic-relay-token)

There's no OCI config, no API signing key mounted. This means:
1. The OCI CLI (`oci` binary) is present in the image
2. OCI CLI auth requires `~/.oci/config` with a `[sj-a]` profile and API signing key
3. The Job template does NOT mount this config or key

So how does cluster-admin actually authenticate to OCI? Either:
- The OCI auth is done via environment variables (OCI_CLI_AUTH=instance_principal?) but I don't see that 
- OR the OCI CLI is installed but not configured for the pod — perhaps OCI operations are done via `tofu` which uses the OCI provider with a different auth mechanism?
- OR the OCI auth is expected to be done through the `just secrets` recipes which need `~/.oci/config` on the operator workstation, not on the pod

Looking more carefully at the workflow: the cluster-admin profile runs as a K8s Job within the cluster. If it needs to do `tofu apply`, tofu needs OCI provider auth. But the OCI Terraform provider can authenticate via instance principals if the pod is running on OCI, or via environment variables. 

Wait, the cluster is NOT on OCI — it's on prem (altos-worker-01). So instance principals won't help.

Actually, looking at the secrets flow: `ultrabot-github-pat` and `ultrabot-anthropic-relay-token` are synced from OCI Vault via ESO. The cluster-admin pod gets GITHUB_TOKEN and ANTHROPIC_RELAY_TOKEN. If it needs to do OCI CLI operations, it would need OCI API signing key + config... which isn't provided.

But the key insight is: the cluster-admin profile's ability to run infrastructure commands (kubectl, tofu, ansible, oci) depends on having those credentials available IN the pod. Currently:
- kubectl: available via the in-cluster ServiceAccount `ultrabot-cluster-admin` which has `cluster-admin` ClusterRole binding — so kubectl works natively within the cluster
- tofu: would need OCI provider credentials (API key or env vars) — not currently mounted
- ansible: would need SSH keys or vault passwords — not currently mounted
- oci CLI: needs `~/.oci/config` — not currently mounted

So in its current state, the cluster-admin profile effectively has:
- Full K8s cluster-admin permissions (via SA binding)
- GitHub write access (via PAT)
- Anthropic relay access (via relay token)
- NO OCI credentials baked in
- NO SSH keys baked in

This means the cluster-admin profile can:
- Manage K8s resources in the cluster (kubectl apply/delete/get)
- Push code, open PRs (git/gh)
- Run tofu commands that don't need OCI provider (or if using a different auth)
- But CANNOT directly do OCI API calls, or SSH into machines

This is important context for the CI/release-watcher planner. If they need OCI operations, they'd need to either:
1. Add OCI credentials to the cluster-admin pod
2. Or have the CI system do OCI operations directly and only delegate K8s operations to ultrabot

Let me now compile the full report.

Actually wait - let me double-check the tofu usage. The `webhook-rotate-secret` recipe runs `tofu -chdir=tofu/environments/sj-a apply` which needs OCI provider auth. That recipe runs LOCALLY (on the operator workstation, not in the pod). So the cluster-admin pod doesn't need OCI auth for its current workflows — the operator workstation has `~/.oci/config` with the API key.

So for the release-watcher design: if the CI system delegates infra tasks to ultrabot, those tasks would run in a K8s pod with cluster-admin RBAC. The pod has kubectl access to the cluster (full admin), git/gh for PRs, opencode for agent work — but NOT OCI API access, NOT SSH access. Tasks requiring OCI CLI, tofu with OCI provider, or ansible with SSH would not work without additional credential injection.

Let me compile the complete report now.

Now I have all the data. Here's the comprehensive report:

---

<results>
<files>
- `/Volumes/Topper2TB/Git/cloudhome/ops/ultrabot.just` — All operator recipes: dispatch, status, logs, cleanup, deploy, build-*, images-build, webhook-*, rotate-secret
- `/Volumes/Topper2TB/Git/cloudhome/scripts/ultrabot-entrypoint.sh` — Headless agent boot sequence: clone → branch → opencode /ulw-loop → push → PR
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/namespace.yaml` — Namespace: `ultrabot`
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/rbac.yaml` — 3 SAs: ultrabot-dispatcher, ultrabot-cluster-admin (with cluster-admin ClusterRoleBinding), ultrabot-agent (unbound)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/jobs/cluster-admin-job.yaml` — cluster-admin Job template (suspend=true, 2CPU/4Gi, SA: ultrabot-cluster-admin)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/jobs/gp-dev-job.yaml` — gp-dev Job template (SA: ultrabot-agent, untrusted)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/jobs/webgameECS-unity-job.yaml` — Unity Job template (SA: ultrabot-agent, 4CPU/8Gi)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/secrets/externalsecret-ultrabot.yaml` — ESO: OCI Vault → K8s Secret `ultrabot-gp-dev-creds` (keys: github-pat, anthropic-relay-token)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/secrets/externalsecret-ultrabot-cluster-admin.yaml` — ESO: same OCI Vault keys → K8s Secret `ultrabot-cluster-admin-creds`
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/secrets/externalsecret-ultrabot-webhook.yaml` — ESO: OCI Vault `ultrabot-webhook-secret` → K8s Secret `ultrabot-webhook-secret`
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/secrets/externalsecret-ultrabot-unity.yaml` — ESO: same OCI Vault keys → K8s Secret `ultrabot-unity-creds`
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/pvcs/pvc-cache-cluster-admin.yaml` — 20Gi `local-altos` PVC
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/dispatcher/deployment.yaml` — In-cluster dispatcher (Bun HTTP server)
- `/Volumes/Topper2TB/Git/cloudhome/k8s/base/ultrabot/dispatcher/service.yaml` — ClusterIP:8080
- `/Volumes/Topper2TB/Git/cloudhome/docker/ultrabot/gp-dev/Dockerfile` — Base image: Ubuntu 24.04 + bun, go, gh, opencode, entrypoint
- `/Volumes/Topper2TB/Git/cloudhome/docker/ultrabot/cluster-admin/Dockerfile` — Extends gp-dev: adds kubectl, just, tofu, ansible, oci-cli
- `/Volumes/Topper2TB/Git/cloudhome/docker/ultrabot/webgameECS-unity/Dockerfile` — Unity 6 il2cpp + bun, gh, opencode
- `/Volumes/Topper2TB/Git/cloudhome/docker/ultrabot/dispatcher/Dockerfile` — Alpine/Bun + kubectl
- `/Volumes/Topper2TB/Git/cloudhome/docker/ultrabot/dispatcher/server.ts` — Bun HTTP server: HMAC validation, kubectl create job + patch, port 8080
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/cloudflare_ultrabot_dispatch/main.tf` — Cloudflare Worker + OCI Vault secret + KV namespace
- `/Volumes/Topper2TB/Git/cloudhome/tofu/modules/cloudflare_ultrabot_dispatch/worker/dispatcher.js` — CF Worker: HMAC verify → forward to in-cluster dispatcher via tunnel
- `/Volumes/Topper2TB/Git/cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` — Full secrets/permissions catalog + human gates
- `/Volumes/Topper2TB/Git/cloudhome/docs/runbooks/Ultrabot Headless Agents.md` — Architecture overview, operator recipes, troubleshooting
- `/Volumes/Topper2TB/Git/cloudhome/docs/Agent Profiles.md` — Profile reference, naming, adding new profiles
- `/Volumes/Topper2TB/Git/cloudhome/ops/secrets.just` — OCI Vault CRUD, Cloudflare token mint/revoke, Keychain ops
- `/Volumes/Topper2TB/Git/cloudhome/ops/credentials.just` — Preflight checks, key generation, vault editing
- `/Volumes/Topper2TB/Git/cloudhome/scripts/build-ultrabot-cluster-admin.sh` — Multi-arch docker buildx + push to OCIR
</files>

<answer>

## 1. `ops/ultrabot.just` — Recipe Catalog

All recipes live at `/Volumes/Topper2TB/Git/cloudhome/ops/ultrabot.just`. Image registry: `ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6`. Namespace: `ultrabot`.

### `dispatch profile task [repo_url]`
**Signature**: `just ultrabot dispatch <profile> "<task>" [<repo_url>]`  
**Defaults**: `repo_url` = `"https://github.com/rustybret/cloudhome"`  
**What it does**: Gets the suspended Job template `ultrabot-<profile>-template` from namespace `ultrabot`, strips controller-owned fields (creationTimestamp, uid, ownerReferences, managedFields, etc.) via jq, injects `TASK_PROMPT` and `REPO_URL` env vars by `map(if .name == "TASK_PROMPT" then .value = $task ...)`, sets `spec.suspend = false`, applies as a new Job named `ultrabot-<profile>-<timestamp>`.  
**Example**:
```bash
just ultrabot dispatch cluster-admin "apply Prometheus scrape config" https://github.com/rustybret/cloudhome
```

### `status`
`kubectl get jobs -n ultrabot --sort-by=.metadata.creationTimestamp -o wide`

### `logs job-name`
`kubectl logs -n ultrabot -l job-name=<job-name> --tail=200 -f --container=agent` (falls back to no container filter)

### `cleanup`
Deletes completed Jobs older than 3600s, also failed Jobs with startTime > 3600s ago and no completionTime. Uses jq `select(.status.completionTime != null and ((now - (.status.completionTime \| fromdateiso8601)) > 3600))`.

### `deploy`
`kubectl apply -k k8s/base/ultrabot/` — applies all Kustomize resources (namespace, RBAC, secrets, Job templates, PVCs, dispatcher)

### `build-gp-dev` / `build-cluster-admin` / `build-webgameECS-unity` / `build-dispatcher`
Each runs `bash scripts/build-ultrabot-<profile>.sh` — multi-arch docker buildx + push to OCIR.

### `images-build`
Sequential: runs all four build-* recipes in order.

### `webhook-status`
Probes `https://ultrabot-dispatch.rustybret.com/health` (falls back to root). Returns HTTP status code + timing.

### `webhook-test profile task`
Reads the HMAC secret from in-cluster `ultrabot-webhook-secret` (base64 decoded), constructs JSON body `{profile, task, ts}`, signs with `openssl dgst -sha256 -hmac`, sends `POST` to `https://ultrabot-dispatch.rustybret.com/dispatch` with headers `x-ultrabot-timestamp`, `x-ultrabot-signature: sha256=...`.

### `webhook-rotate-secret`
Runs `tofu apply -replace=module.cloudflare_ultrabot_dispatch.random_password.hmac_secret` (which creates a new `random_password`, stores it in OCI Vault, and reinjects into the Cloudflare Worker via `null_resource`), then runs `just ultrabot deploy` to resync the in-cluster K8s secret via ESO.

---

## 2. `k8s/base/ultrabot/` — K8s Manifests

### Namespace
`namespace: ultrabot`

### RBAC (`rbac.yaml`)
**Three ServiceAccounts**:
| SA | Bound to | Purpose |
|---|---|---|
| `ultrabot-dispatcher` | Role `ultrabot-job-manager` (jobs CRUD + pods get/list/watch/log) | Creates jobs from webhook |
| `ultrabot-cluster-admin` | **ClusterRole `cluster-admin`** (ClusterRoleBinding `ultrabot-cluster-admin-binding`) | Full cluster superpowers |
| `ultrabot-agent` | **No binding** | Untrusted; for gp-dev and webgameECS-unity |

Key comment from RBAC (line 21-23): *"Dedicated ServiceAccount for non-privileged agent pods (gp-dev, webgameECS-unity). Intentionally has NO RoleBinding — agent pods must not inherit the dispatcher's job-create privileges (F2 audit finding)."*

### Job Template: `cluster-admin` (`k8s/base/ultrabot/jobs/cluster-admin-job.yaml`)
```yaml
spec:
  backoffLimit: 0
  suspend: true                          # suspended template — dispatch clones & unsuspends
  ttlSecondsAfterFinished: 3600
  activeDeadlineSeconds: 7200            # 2-hour hard cap
  template:
    spec:
      serviceAccountName: ultrabot-cluster-admin   # FULL CLUSTER-ADMIN RBAC
      restartPolicy: Never
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
        seccompProfile: { type: RuntimeDefault }
      containers:
        - name: agent
          image: ocir.us-sanjose-1.oci.oraclecloud.com/axarjcg9zmg6/ultrabot-cluster-admin:latest
          env:
            - TASK_PROMPT: ""            # injected by dispatch
            - REPO_URL: ""               # injected by dispatch
            - PROFILE: cluster-admin
            - GITHUB_TOKEN:              # from K8s Secret ultrabot-cluster-admin-creds/github-pat
            - ANTHROPIC_RELAY_TOKEN:     # from K8s Secret ultrabot-cluster-admin-creds/anthropic-relay-token
          resources:
            requests: 1 CPU / 2Gi
            limits:   2 CPU / 4Gi
          volumeMounts:
            - workspace (emptyDir)
            - cache (PVC pvc-cache-cluster-admin, 20Gi local-altos)
```
**⚠️ CRITICAL GAP**: The cluster-admin pod gets NO OCI API signing key, NO `~/.oci/config`, NO SSH keys, NO Ansible vault password. The pod can use `kubectl` (full cluster-admin via SA), `gh`/`git` (via PAT), `opencode` (Anthropic relay), `tofu` (but cannot run OCI provider without API key), `oci` CLI (but not authenticated). Infrastructure tasks requiring OCI API access, SSH, or Ansible vault access will hit auth walls.

### Secrets (ESO/External Secrets)
All 4 ExternalSecrets reference `ClusterSecretStore: oci-vault-store` (OCI Vault):

| K8s Secret | OCI Vault key(s) | Used by |
|---|---|---|
| `ultrabot-gp-dev-creds` | `ultrabot-github-pat`, `ultrabot-anthropic-relay-token` | gp-dev Job |
| `ultrabot-cluster-admin-creds` | `ultrabot-github-pat`, `ultrabot-anthropic-relay-token` | cluster-admin Job |
| `ultrabot-unity-creds` | `ultrabot-github-pat`, `ultrabot-anthropic-relay-token` | webgameECS-unity Job |
| `ultrabot-webhook-secret` | `ultrabot-webhook-secret` | Dispatcher deployment |

All three profile secrets fetch the **same** `ultrabot-github-pat` and `ultrabot-anthropic-relay-token` from OCI Vault. **Dispatchers and all profiles share one GitHub bot identity.**

### PVCs
Each profile has a dedicated `20Gi` `local-altos` `ReadWriteOnce` PVC: `pvc-cache-{gp-dev,cluster-admin,webgameecs-unity}`.

### Dispatcher (`deployment.yaml`)
- Image: `ultrabot-dispatcher:latest` (Bun + kubectl on Alpine)
- SA: `ultrabot-dispatcher` (job-create RBAC only)
- Env: `WEBHOOK_SECRET` from K8s Secret `ultrabot-webhook-secret/secret`
- Resources: 100m/128Mi requests, 500m/256Mi limits
- Port 8080 (ClusterIP service)

---

## 3. `docker/ultrabot/` — Agent Images

### gp-dev (`Dockerfile`)
Base image: `ubuntu:24.04`. Tools: `curl, git, jq, python3, nodejs 22, bun, go 1.22, gh CLI, opencode binary`. Non-root user `ultrabot` (UID 1000). Entrypoint: `/usr/local/bin/ultrabot-entrypoint.sh`.

### cluster-admin (`Dockerfile`)
**Extends gp-dev** (`FROM ultrabot-gp-dev:latest`). Adds:
- `kubectl` v1.29.4
- `just` (command runner)
- `opentofu` v1.7.2
- `ansible-core` via pip3
- `oci-cli` (Oracle Cloud CLI)

**No additional secrets mounted**: no `~/.oci/config`, no OCI API signing key, no SSH keys, no Ansible vault password. The pod's OCI CLI and tofu are **unauthenticated** against OCI.

### webgameECS-unity (`Dockerfile`)
Base: `unityci/editor:ubuntu-6000.1.0f1-linux-il2cpp-3`. Adds: `bun, gh, opencode`. **Runs as root** (Unity needs it). Entrypoint: own copy of `ultrabot-entrypoint.sh`.

### dispatcher (`Dockerfile`)
Base: `oven/bun:1.1-alpine`. Adds `kubectl v1.30.8`. Entrypoint: `bun run server.ts` (port 8080).

---

## 4. `scripts/ultrabot-entrypoint.sh` — Boot Sequence

The entrypoint (identical between gp-dev and cluster-admin — file at `scripts/ultrabot-entrypoint.sh`; copied into Docker images) runs this exact flow:

1. **Read env**: `TASK_PROMPT`, `REPO_URL`, `GITHUB_TOKEN`, `PROFILE`, optional `REPO_BRANCH` (default: main), `PR_BASE` (default: main), `GIT_USER_NAME`/`EMAIL`
2. **Compute branch name**: `ultrabot/<PROFILE>/<TASK_SLUG>-<TIMESTAMP>` where TASK_SLUG is lowercased, non-alphanumeric → hyphen, 40-char max
3. **Configure git**: `git config --global user.name/email`, `printf 'https://ultrabot:%s@github.com' > ~/.git-credentials`, `export GH_TOKEN=...`
4. **Clone**: `git clone --depth=1 --branch $REPO_BRANCH $REPO_URL /workspace/repo`
5. **Warm cache**: symlinks `node_modules`, `.gradle`, `Library`, `.npm`, `.pnpm-store`, `.bun` from PVC `/workspace/cache` if present
6. **Create working branch**: `git checkout -b $BRANCH`
7. **Run agent**: `opencode run --headless "/ulw-loop $TASK_PROMPT"` — the `|| exit 1` means any failure kills the Job
8. **Save cache**: copies non-symlinked cache dirs back to PVC
9. **Check for changes**: `git diff --quiet && git diff --cached --quiet` → if no changes, exit 0
10. **Push branch**: `git push origin $BRANCH`
11. **Create PR**: `gh pr create --base $PR_BASE --head $BRANCH --title "ultrabot[<PROFILE>]: <task:0:72>" --body "..."`
12. **Exit with PR URL**

**Guardrails**: The only guardrail is the `|| exit 1` on the opencode command — if it fails, the Job exits non-zero. There is no timeout enforcement beyond K8s-level `activeDeadlineSeconds: 7200` (2h). No approval gate before PR creation.

---

## 5. Webhook Dispatch Path

### Architecture
```
HMAC-SHA256 POST → Cloudflare Worker (ultrabot-dispatch.rustybret.com)
                   → validates HMAC via crypto.subtle
                   → POST to env.DISPATCHER_URL (in-cluster via Cloudflare tunnel)
                   → in-cluster dispatcher (Bun server, port 8080)
                     → validates HMAC again via timingSafeEqual
                     → kubectl create job --from=job/ultrabot-{slug}-template
                     → kubectl patch job: set TASK_PROMPT + REPO_URL, unsuspend
                     → returns { job_name: "ultrabot-..." }
```

### Terraform module (`tofu/modules/cloudflare_ultrabot_dispatch/`)
Creates:
- `cloudflare_workers_kv_namespace.dispatch_state` — state KV
- `cloudflare_workers_script.dispatch` — dispatcher.js worker
- `cloudflare_workers_domain` — custom hostname
- `random_password.hmac_secret` — 32-char, no special chars
- `oci_vault_secret.hmac_secret` — stores HMAC secret in OCI Vault (`base64` encoded)
- `null_resource.inject_worker_secrets` — injects `HMAC_SECRET` and `DISPATCHER_URL` into the Worker via Cloudflare API (`PUT /accounts/{id}/workers/scripts/{name}/secrets`)

### Cloudflare Worker (`worker/dispatcher.js`)
- Accepts POST only
- Verifies HMAC via `crypto.subtle.sign("HMAC", key, body)` with constant-time comparison
- Validates `profile` ∈ `["gp-dev", "cluster-admin", "webgameECS-unity"]`
- Forwards to `env.DISPATCHER_URL` (the in-cluster dispatcher via Cloudflare tunnel) with the same signature

### In-cluster dispatcher (`server.ts`)
- Listens on port 8080
- Validates HMAC via Node.js `createHmac("sha256", secret) + timingSafeEqual`
- Parses `{ profile, task, repo_url? }`
- `createJob()`: runs `kubectl create job <name> --from=job/ultrabot-{slug}-template -n ultrabot` then patches `TASK_PROMPT` and `REPO_URL` env vars

---

## 6. Secrets & Human-Only Gates

### Credential Inventory

| Secret Name | Store | Used By | Method |
|---|---|---|---|
| `ultrabot-github-pat` | OCI Vault | All 3 profiles | ESO `ClusterSecretStore → oci-vault-store` |
| `ultrabot-anthropic-relay-token` | OCI Vault | All 3 profiles | ESO |
| `ultrabot-webhook-secret` | OCI Vault | Dispatcher + CF Worker | ESO + Tofu inject |
| `cloudflare-api-token` | OCI Vault | Operator workstation | `just secrets get-quiet` |
| `cloudflare-creator-token` | OCI Vault | Operator workstation (minting only) | `just secrets get-quiet` |
| `CLOUDHOME_SECRETS_TOKEN` | macOS Keychain (out-of-band) | Gated unlock | Human distributes |
| Ansible vault password | Operator workstation | `just credentials vault-edit-host` | Human bootstraps |
| OCI API signing key (`~/.oci/cloudhome-sj-a.pem`) | Operator workstation filesystem | `oci` CLI, `tofu` OCI provider | `just credentials gen-oci-api-key` |
| GitHub PAT (`ultrabot` bot) | OCI Vault (`ultrabot-github-pat`) + Web UI | Git push, PR creation | Human creates in GitHub UI → stores in OCI Vault |

### How Credentials Are Stored/Accessed

The chain is:
```
OCI Vault (authoritative store)
  └─ ESO (ClusterSecretStore → oci-vault-store) → K8s Secret (in-cluster)
  └─ just secrets get/rotate/get-quiet (operator workstation via OCI CLI)
  └─ Tofu null_resource inject (into Cloudflare Worker secrets)
```

**`CLOUDHOME_SECRETS_TOKEN`**: Optional admin gate. When `CLOUDHOME_SECRETS_REQUIRE_TOKEN=1`, `just secrets env` refuses to export OCI Vault/Cloudflare env vars unless `CLOUDHOME_SECRETS_TOKEN` is also set. This token is distributed out-of-band by a human operator.

### Human-Only Gates (from `coordination_notes/secrets-and-permissions-cheatsheet.md` 7)

| Action | Why It's Human-Only |
|---|---|
| **Create a GitHub fine-grained PAT** | GitHub web UI login + MFA. Then store as `<repo>-github-pat` in OCI Vault. |
| **Create a NEW Cloudflare API/creator token** | Cloudflare dashboard login required. |
| **Create a BRAND-NEW OCI Vault secret name** | Requires `tofu apply` or OCI Console. Agent can only `rotate` existing. |
| **First-time Ansible vault password** | Bootstrap, one-time, out-of-band. |
| **Enable paid Cloudflare features (R2, etc.)** | Billing confirmation. |
| **Physical hardware (rack, power)** | Physical access. |
| **Approve MFA challenges** | By definition. |
| **Distribute `CLOUDHOME_SECRETS_TOKEN`** | Out-of-band; no stored copy in repo. |

### What the Agent CAN Do Autonomously

Per the cheatsheet (line 172): *"Everything else — random secret generation, OCI Vault rotation, Cloudflare KV writes, child-token mint/revoke, GitHub webhooks, Authentik OIDC app creation, Keychain storage, ESO sync — the agent can and should do autonomously."*

---

## 7. Delegable vs Human-Only — The Two Lists

### A) Infra Actions SAFELY Delegable to Ultrabot cluster-admin

Given cluster-admin's current capabilities (kubectl via SA binding, git/gh via PAT, opencode via relay, tofu + oci binary but **unauthenticated** to OCI), these are the actions an ultrabot `cluster-admin` Job can perform:

1. **Apply/delete K8s manifests via kubectl** — `kubectl apply -f` (full cluster-admin RBAC)
2. **Read cluster state** — `kubectl get/describe/logs/events`
3. **Manage K8s Jobs, Deployments, Secrets, ConfigMaps** within the cluster
4. **Push branches and open PRs** on GitHub (via git + gh CLI + `ultrabot-github-pat` with `repo, workflow, pull_request` scopes)
5. **Modify code and run builds** in the cloned repo (opencode agent loop)
6. **Run `just` recipes** if `just` is installed (it is in cluster-admin)
7. **Rotate existing OCI Vault secrets** — but only if the pod had OCI CLI auth (currently missing)
8. **Mint/revoke Cloudflare child tokens** — if Cloudflare API token were available in the pod
9. **Inspect and modify repo files, run tests, format code** as part of opencode's `ulw-loop`
10. **Respond to failures with git revert / rollback commits** (via opencode agent logic)

### B) Human-Only Gated Actions (CANNOT be delegated to ultrabot)

**Irreducible human gates** (require web UI login, physical access, or MFA):

1. **Create any GitHub PAT** — requires GitHub web UI + MFA. The `ultrabot-github-pat` must be created by a human.
2. **Create a Cloudflare API token or root token** — requires Cloudflare dashboard login
3. **Create a NEW OCI Vault secret name** — requires Tofu apply or OCI Console (agent can only rotate existing)
4. **First-time Ansible vault password bootstrap** — out-of-band
5. **Enable/approve paid features** (Cloudflare R2, OCI billing) — billing confirmation
6. **Physical hardware actions** (rack, power cycle chassis)
7. **Distribute `CLOUDHOME_SECRETS_TOKEN`** — out-of-band to new operators
8. **Approve MFA challenges** — by definition

**Capability gaps** (ultrabot cluster-admin currently lacks the tooling/auth — fixable with future work but blocked today):

9. **Run `tofu apply` with OCI provider** — pod has no `~/.oci/config` or API signing key. Tofu will fail on OCI resources.
10. **Run `oci` CLI commands** — same auth gap, no `~/.oci/config` with `[sj-a]` profile.
11. **Run Ansible playbooks** — no SSH keys, no Ansible vault password mounted.
12. **SSH into machines** — no SSH keys in the pod.
13. **Docker/podman operations** — neither Docker nor podman is installed in cluster-admin image.
14. **Access OCI Object Storage / OCIR** — no registry pull secret mounted inside the pod (the `ocir-pull-secret` is for the kubelet to pull the image, not for the pod to use).
15. **Manage Cloudflare DNS/Workers via Tofu** — no `CLOUDFLARE_API_TOKEN` env var in the pod (only in the operator's `just secrets env` session).

### Bottom Line for Your CI/Release-Watcher Design

**What works today** — dispatcher accepts profile `cluster-admin`, launches a Job with full K8s admin power, pushes PRs:
- `dispatch cluster-admin "apply k8s/base/ultrabot/ to deploy new manifests"`
- `dispatch cluster-admin "update the monitoring stack in k8s/overlays/prod"`
- `dispatch cluster-admin "bump image tags in k8s configs and open a PR"`

**What needs credential injection** — to do OCI/Cloudflare/Ansible infra from the pod, you must mount credentials. Without that, `tofu apply`, `oci`, and `ansible-playbook` will fail inside the pod.

**What is permanently human** — PAT creation, brand-new vault secret creation, Cloudflare dashboard login, billing approvals, physical hardware, MFA.

</answer>

<next_steps>
1. **For CI infra provisioning that needs OCI/Cloudflare**: Either (a) inject `~/.oci/config` + API signing key as a K8s Secret mounted into the cluster-admin pod, (b) inject `CLOUDFLARE_API_TOKEN` as an env var, OR (c) keep OCI/Cloudflare operations in the CI runner itself and only delegate pure K8s operations to ultrabot.
2. **Add a `ClusterRole` for cluster-admin with specific infra permissions** if you want finer control than the blanket `cluster-admin` ClusterRole.
3. **Consider adding a `dispatch-with-report` recipe** that waits for Job completion and surfaces the PR URL, so your CI pipeline can block on ultrabot completion.
4. **The webhook dispatch path** (`POST https://ultrabot-dispatch.rustybret.com/dispatch` with HMAC) is your CI integration point — use the same signature scheme as `webhook-test`.
5. **Ready to proceed with CI design** — the dispatch API contract is: `{ profile: string, task: string, repo_url?: string }` → HMAC-SHA256 signed → `POST` → `{ job_name: string }`.
</next_steps>
</results>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 45.6s)

_Thinking:_

 I'm realizing the ultrabot cluster-admin pod lacks OCI authentication entirely—no config file or API signing keys—which means it can't execute Terraform or OCI CLI commands directly. This fundamentally undermines the user's plan to delegate OCI infrastructure tasks to that headless agent, and there are additional human-only gates that further constrain what's possible.

The user's instruction to "give it the tasks and required credentials directly" actually points toward credential injection as the solution, which I should confirm with them. But I also need to clarify which actions remain permanently manual: PAT creation, new vault secret naming, and billing approvals can't be automated regardless.

I'm tracking two genuinely blocking decisions now: the database choice between MySQL HeatWave and Oracle ATP, and confirmation that the credential-injection approach works for them while acknowledging the human-only gates. Once I get those answers, I can move forward with the clearance check and start building the actual plan.

The third probe lands the most consequential finding: the ultrabot `cluster-admin` pod has **full K8s admin but NO OCI auth** (no `~/.oci/config`, no API signing key, no Cloudflare token) — so as-is it can run `kubectl` but **not** `tofu apply` / `oci` CLI against OCI. Plus there's a hard list of permanently-human gates. This directly shapes how the plan's infra tasks must be structured. Let me capture it, then surface the two remaining reconciliation points.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Remaining Open Questions\n- Does the release-watcher CLI core warrant its own unit-test suite (orw-style), or is agent-executed pipeline QA sufficient for V1? (Default: light unit tests for pure config/merge-plan logic + e2e pipeline as the real gate.)\n- Which infra steps are human-only gates (per secrets cheatsheet) vs delegable to ultrabot cluster-admin? (To be resolved from the cheatsheet during investigation.)",
  "newString": "## Ultrabot Findings (2026-06-05, probe bg_f77e5754) — CRITICAL for infra-task shaping\n\n### Dispatch API contract (the plan's infra-task integration point)\n- CLI: `just ultrabot dispatch cluster-admin \"<task>\" [<repo_url=https://github.com/rustybret/cloudhome>]` → clones suspended `ultrabot-cluster-admin-template`, injects `TASK_PROMPT`+`REPO_URL`, unsuspends → Job `ultrabot-cluster-admin-<ts>`.\n- Webhook: HMAC-SHA256 `POST https://ultrabot-dispatch.rustybret.com/dispatch` body `{profile, task, repo_url?}` (profile ∈ gp-dev|cluster-admin|webgameECS-unity) → `{job_name}`.\n- Entrypoint: clones repo@branch → `opencode run --headless \"/ulw-loop <task>\"` → pushes branch `ultrabot/cluster-admin/<slug>-<ts>` → **opens PR** (`gh pr create`). Output is always a PR, never a direct push to main. 2h `activeDeadlineSeconds`. `status`/`logs`/`cleanup` recipes available.\n\n### cluster-admin capability boundary (DECISIVE constraint)\n- SA `ultrabot-cluster-admin` → **ClusterRoleBinding to `cluster-admin`** → full in-cluster kubectl.\n- Image has kubectl + just + tofu + ansible + oci-cli installed, but the pod mounts **ONLY** `GITHUB_TOKEN` + `ANTHROPIC_RELAY_TOKEN`. **NO `~/.oci/config`, NO OCI API signing key, NO `CLOUDFLARE_API_TOKEN`, NO SSH keys, NO Ansible vault pw, NO docker/podman.**\n- **CAN delegate today**: anything via `kubectl` (apply/delete/patch manifests, secrets, jobs, deployments), code changes + PRs, `just` recipes that don't need cloud auth.\n- **CANNOT delegate without credential injection**: `tofu apply` w/ OCI provider, `oci` CLI, `ansible-playbook`, SSH, Cloudflare-via-tofu, OCIR pushes from inside the pod.\n- User's directive (\"give it the required credentials directly\") ⇒ to delegate OCI/tofu provisioning we must mount `~/.oci/config` + API signing key (and/or `CLOUDFLARE_API_TOKEN`) into the cluster-admin Job. That itself is a cluster Secret the user (or a human-gated step) must seed once.\n\n### Permanently human-only gates (cannot be delegated to ANY headless agent)\n- Create GitHub fine-grained PAT (web UI + MFA) — e.g. a new `release-watcher`/image-repo PAT.\n- Create a BRAND-NEW OCI Vault secret *name* (needs tofu apply or OCI Console; agent can only *rotate* existing).\n- Create new Cloudflare API/creator token (dashboard login).\n- Approve billing / enable paid features; first-time Ansible vault bootstrap; physical hardware; MFA approvals; distribute `CLOUDHOME_SECRETS_TOKEN`.\n- Agent CAN autonomously: random secret gen, **rotate existing** OCI Vault secrets, Cloudflare KV writes, child-token mint/revoke, GitHub webhook creation, ESO sync, Keychain storage.\n\n### Implication for plan structure\n- Infra TODOs split into THREE buckets: (1) **human-only prerequisites** (mint PATs, create new Vault secret names via tofu/console, billing) — manual tasks the user does; (2) **ultrabot-delegable K8s tasks** (apply Jenkins JCasC/agent pod template/RBAC, deploy new Job templates, create ESO ExternalSecrets, wire dispatcher entries) — dispatched to cluster-admin, land as PRs the user merges; (3) **credential-injection bootstrap** (mount OCI/Cloudflare creds into cluster-admin IF we want it to run tofu) — one-time, human-seeded.\n- Every ultrabot-dispatched task's \"acceptance\" = a merged PR + an agent-executed `kubectl`/endpoint verification of the resulting cluster state.\n\n## Remaining Open Questions (2 blocking before plan generation)\n1. **DB choice** (protocol mismatch): provision NEW **OCI MySQL HeatWave** free-tier (matches \"MySQL\" intent, mysql driver, net-new tofu) vs reuse existing **Oracle ATP `SJAFREEDB`** (provisioned, but Oracle driver + currently unused). Lean: new OCI MySQL HeatWave.\n2. **Ultrabot OCI-auth boundary**: confirm we (a) inject `~/.oci/config`+API key into cluster-admin so it can run `tofu apply` for OCI provisioning (DB, OCIR repo, Vault-secret names where possible), OR (b) keep all OCI/tofu provisioning as human-run steps and delegate ONLY in-cluster kubectl/manifest work to ultrabot. Lean: (a) for repeatability, with the human-only gates above staying manual.\n- (Non-blocking) release-watcher CLI: light unit tests for pure config/merge-plan logic + e2e pipeline as the real gate."
}
```

**Output:**
```
Edited (+29/-3).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.3s)

_Thinking:_

 I'll clean up those processed background investigation results and surface the two blocking questions that need the user's input.

All three cloudhome investigations are processed and captured in the draft. Let me drop those large outputs now that their findings are recorded, then surface the two blocking decisions.

**Tool: ctx_reduce**

**Input:**
```json
{
  "drop": "1717,1718,1728"
}
```

**Output:**
```
Queued: deferred drop §1717§, §1718§, §1728§.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 577.4s)

_Thinking:_

 I've finished the three investigations and documented everything in the draft, so now I need to present the two blocking decisions to the user before I can generate the plan. I'll use the Question tool to surface these clearly since they're distinct choices that need to be resolved: whether to use a new OCI MySQL HeatWave database or stick with the existing Oracle ATP SJAFREEDB, and how to handle the Ultrabot OCI authentication boundary when injecting credentials into the cluster-admin.

Investigations complete and captured. Two blocking decisions remain before I consult Metis and generate the plan — both surfaced from what the cloudhome probes actually found (not assumptions). Let me put them to you directly.

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Run-state DB for the release-watcher: what's actually provisioned in cloudhome is OCI Autonomous Database (Oracle ATP) — that's Oracle SQL*Net protocol, NOT MySQL. You said 'free OCI MySQL'. Which do you want?",
      "header": "run-state DB",
      "options": [
        {
          "label": "Provision new OCI MySQL HeatWave free-tier (Recommended)",
          "description": "Net-new tofu module (dispatched to ultrabot cluster-admin / or human-run tofu). Matches your 'MySQL' intent: clean mysql protocol, simple driver from a Bun/Node release-watcher. Adds one provisioning task."
        },
        {
          "label": "Reuse existing Oracle ATP SJAFREEDB",
          "description": "Already provisioned (sj-a, private endpoint, password in Vault). But it's Oracle SQL*Net — needs an Oracle driver, currently unused by any app, heavier client. No new provisioning, but more integration friction."
        }
      ]
    },
    {
      "question": "Ultrabot can do full in-cluster kubectl today, but its cluster-admin pod has NO OCI/Cloudflare credentials mounted — so as-is it CANNOT run 'tofu apply' against OCI (DB provisioning, OCIR repo, Vault secret names). How should the plan handle OCI/tofu provisioning?",
      "header": "ultrabot OCI auth",
      "options": [
        {
          "label": "Inject OCI creds into cluster-admin so it runs tofu (Recommended)",
          "description": "One-time human-seeded Secret (~/.oci/config + API signing key, optionally CLOUDFLARE_API_TOKEN) mounted into the cluster-admin Job. Then ultrabot can run 'tofu apply' for OCI provisioning autonomously (PRs you merge). Most repeatable; honors your 'give it the credentials directly' directive. Permanently-human gates (PAT mint, new Vault secret names) still stay manual."
        },
        {
          "label": "Keep OCI/tofu provisioning human-run; delegate only kubectl work",
          "description": "You (or a human-run tofu) handle all OCI provisioning (DB, OCIR, Vault). Ultrabot cluster-admin only does in-cluster manifest/JCasC/RBAC/ESO work via kubectl. Less credential surface in the pod, but you run the tofu steps yourself."
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Run-state DB for the release-watcher: what's actually provisioned in cloudhome is OCI Autonomous Database (Oracle ATP) — that's Oracle SQL*Net protocol, NOT MySQL. You said 'free OCI MySQL'. Which do you want?"="Provision new OCI MySQL HeatWave free-tier (Recommended)", "Ultrabot can do full in-cluster kubectl today, but its cluster-admin pod has NO OCI/Cloudflare credentials mounted — so as-is it CANNOT run 'tofu apply' against OCI (DB provisioning, OCIR repo, Vault secret names). How should the plan handle OCI/tofu provisioning?"="Inject OCI creds into cluster-admin so it runs tofu (Recommended)". You can now continue with the user's answers in mind.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 35.7s)

_Thinking:_

 I've resolved both blocking issues—setting up a new OCI MySQL HeatWave instance and configuring the cluster-admin with OCI credentials for Ultrabot. Now I'm documenting these decisions and running through the clearance checklist to confirm the core objective is solid before moving forward with Metis consultation and plan generation.

The clearance check is passing: the project scope is well-defined (release-watcher on Jenkins with binaries for multiple platforms, Docker image to OCIR, MySQL HeatWave for state, ultrabot-managed infrastructure), boundaries are clear (in-scope: new repos, Jenkins pipeline, webhook paths, binary/image builds; out-of-scope: runtime config, local ORW replacement, agent harness), and the two blocking decisions are resolved. On test strategy, I'm locking in the default approach—light unit tests for CLI logic, agent-executed QA scenarios, and the e2e pipeline as the acceptance gate—rather than asking again, since this is infrastructure work and the user has been engaged throughout.

With clearance confirmed, I'm updating the draft with the final decisions, registering the planning workflow todos, and moving into Metis consultation.

Both blocking decisions are resolved — **new OCI MySQL HeatWave** for run-state, and **inject OCI creds into ultrabot cluster-admin** so it can run `tofu apply` autonomously. That clears the last ambiguities. Let me lock these in the draft, then run the mandatory planning workflow (Metis → Oracle gate → plan generation).

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Remaining Open Questions (2 blocking before plan generation)\n1. **DB choice** (protocol mismatch): provision NEW **OCI MySQL HeatWave** free-tier (matches \"MySQL\" intent, mysql driver, net-new tofu) vs reuse existing **Oracle ATP `SJAFREEDB`** (provisioned, but Oracle driver + currently unused). Lean: new OCI MySQL HeatWave.\n2. **Ultrabot OCI-auth boundary**: confirm we (a) inject `~/.oci/config`+API key into cluster-admin so it can run `tofu apply` for OCI provisioning (DB, OCIR repo, Vault-secret names where possible), OR (b) keep all OCI/tofu provisioning as human-run steps and delegate ONLY in-cluster kubectl/manifest work to ultrabot. Lean: (a) for repeatability, with the human-only gates above staying manual.\n- (Non-blocking) release-watcher CLI: light unit tests for pure config/merge-plan logic + e2e pipeline as the real gate.",
  "newString": "## FINAL Decisions (2026-06-05, both blocking resolved)\n1. **Run-state DB = NEW OCI MySQL HeatWave free-tier** (net-new tofu module; mysql protocol; simple driver from Bun/Node release-watcher). Provisioned via ultrabot cluster-admin running `tofu apply` (per decision 2).\n2. **Inject OCI creds into ultrabot cluster-admin** — one-time human-seeded K8s Secret (`~/.oci/config` + API signing key, + `CLOUDFLARE_API_TOKEN` where Cloudflare/tofu work is needed) mounted into the cluster-admin Job template, enabling it to run `tofu apply` for OCI provisioning (MySQL HeatWave DB, OCIR repo for the new image, rotate existing Vault secrets). Output remains PR-based; permanently-human gates (mint new PATs, create brand-new Vault secret *names*, billing) stay manual.\n\n## Test/Verification Strategy (locked default — infra plan)\n- **Agent-executed QA per task** (mandatory): every task verified by running the deliverable — `kubectl get/describe` for cluster state, HMAC `curl` for webhook paths, binary `--version`/`file` for artifacts, OCIR registry query for image presence.\n- **Light unit tests** on the release-watcher CLI core for pure logic only (config parsing, merge-plan/curated-PR resolution) — orw-style, in the new standalone repo.\n- **V1 acceptance = REAL end-to-end pipeline run** (the real gate): webhook fires → Jenkins builds → 3 binaries each execute and print `--version` → opencode image present in OCIR.\n- No automated tests for Jenkins/k8s wiring itself — proven by the e2e run + per-task kubectl/endpoint verification."
}
```

**Output:**
```
Edited (+9/-4).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 23.4s)

_Thinking:_

 I'm running through the clearance checklist to confirm everything's locked in—the core objective is solid with a project-agnostic release-watcher on Jenkins and cloudhome, V1 using opencode to produce three binaries plus a Docker image to OCIR as a GitHub Actions replacement, and the scope boundaries are defined with the new standalone repo and dedicated image-build-context repo.

The technical approach is confirmed with Jenkins parameterized pipelines, custom build-tools agent pods, CI-on-push via jenkins-hook, release-watch via build-relay, OCI MySQL HeatWave provisioning, three-architecture binary builds across Linux and Darwin with cross-compilation, and image delivery to OCIR through build-dispatcher and BuildKit. Test strategy is locked in with agent-executed QA per task, light unit tests on the CLI core, and the e2e pipeline as the real validation gate. No blocking questions remain, so I'm moving into the planning workflow—I need to register the planning todos first, then consult Metis, run Oracle phase-1 verification, generate the plan, proceed through phase-2, self-review, present the summary, and work through the remaining Oracle gates before guiding to /start-work.

All requirements are clear. Both blocking decisions are resolved, scope is locked, and the test strategy is confirmed. Running the clearance check:

- ✅ Core objective defined (project-agnostic release-watcher on Jenkins+cloudhome; V1 = opencode → 3 binaries + OCIR image; replaces GitHub Actions CI)
- ✅ Scope IN/OUT established
- ✅ No critical ambiguities (DB + ultrabot-auth both resolved)
- ✅ Technical approach decided
- ✅ Test strategy confirmed (agent-executed QA + light CLI unit tests + e2e pipeline gate)
- ✅ No blocking questions outstanding

**All requirements clear. Proceeding to plan generation.** Registering the mandatory planning workflow, then consulting Metis for gap analysis.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 6.2s)

_Thinking:_

 I need to review the full draft to ensure I have the complete current state before consulting Metis for the gap analysis.

Now consulting Metis for gap analysis before generating the plan. Let me first read the complete draft so Metis gets the full picture.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md"
}
```

**Output:**
```
  1: # Draft: Release Watcher + Cloudhome BuildKit
  2: 
  3: ## Requirements (confirmed)
  4: - User is considering a clean fork of `@cortexkit/orw` into a more generic `release-watcher`.
  5: - Goal is to support more than OpenCode: other forks/projects with release or upstream-branch integration needs.
  6: - Candidate integration target: existing Cloudflare relay and cloudhome BuildKit process.
  7: - `unitySuperMCP` is a hard case because it adapts upstream features semantically rather than literally merging code.
  8: - V1 target is Cloudhome-hosted OpenCode release-watcher first.
  9: - Existing local `~/opencode-release-watch` ORW workflow must remain working until the Cloudhome variant is fully functional; cutover happens only after parity proof.
 10: - Cloudflare relay should be a full orchestrator in V1, not merely a thin queue.
 11: - Semantic adaptation repos are deferred. Future semantic mode should start as changelog/reporting only: forward release notes or summarize commits on a configured cadence.
 12: - V1 parity is not local Mac install parity. Success means Cloudhome's OpenCode instance at `code.rustybret.com` switches its container build pipeline to use release-watcher-produced artifacts.
 13: - Cloudhome is multi-arch: V1 must account for Linux amd64 and Linux arm64 artifacts, not just local darwin-arm64.
 14: - User correction: reuse the existing Cloudhome build-relay/build-dispatcher/BuildKit structure; do not design a separate greenfield platform.
 15: - User correction: do not assume R2 artifact serving/storage. Cloudhome has ample local storage; R2 is free-tier and should stay cache-only unless explicitly justified.
 16: - User correction: V1 should focus on building release-watcher artifacts first. Leave the current OpenCode container build flow unchanged until artifact production is proven.
 17: - User is reconsidering the execution substrate: BuildKit may be too container-image-specific for generic artifact builds, and a self-hosted Jenkins-style pipeline service on Cloudhome may be a better fit.
 18: - User preference: avoid paid cloud CI/build services when Cloudhome can host the build/delivery pipeline locally.
 19: - Cloudflare Workers are preferred for external service interaction/webhook ingress, not for making builds or delivering artifacts internally.
 20: - OCI database capacity is available, including PHX instances that may help avoid idle shutdown; Cloudhome already runs DB containers for Atlas, so release-watcher could use an OCI DB or in-cluster DB variant.
 21: - User selected **classic Jenkins LTS on K8s** as the CI/orchestration substrate.
 22: - macOS build/update path is explicitly deferred; local Mac ORW remains responsible for darwin-arm64 until a future Mac agent path is designed.
 23: - User selected dedicated release-watcher DB/storage from the start, not Jenkins-native build history alone.
 24: - Cloudhome repo should own the basic Jenkins service setup. This plan should not over-design Jenkins deployment internals; hold for Cloudhome details.
 25: 
 26: ## Technical Decisions
 27: - Treat as architecture planning, not implementation.
 28: - Current `orw` is OpenCode-specific and bin-only; memory says its only extension seam is config/prompt, while build verification/install paths are hardcoded to OpenCode artifacts.
 29: - A generic `release-watcher` likely needs explicit adapters/modes rather than stretching `orw` config.
 30: - Oracle recommendation: make `release-watcher` CLI-first with an internal library boundary; do not start as a daemon/service/GitHub Action.
 31: - Keep v1 boring: preserve current OpenCode ORW behavior, then replace hardcoded OpenCode constants with config fields.
 32: - Cloudflare relay should be control plane only; cloudhome BuildKit should be execution plane.
 33: - Semantic adaptation should produce reviewable Draft PRs by default, not auto-merge/install.
 34: - Revised after user input: Cloudflare relay is intentionally fuller than Oracle's conservative default for V1; plan should still isolate build/AI execution in Cloudhome BuildKit.
 35: - Revised after user input: semantic adaptation is out of V1; future semantic support should be reporting/changelog generation, not patch generation.
 36: - V1 should prioritize Cloudhome execution for OpenCode while keeping local ORW as the fallback/proven baseline.
 37: - Local Mac ORW remains the baseline/fallback until Cloudhome container artifact integration is proven.
 38: - Revised after user input: Cloudhome local/persistent storage should be the default durable artifact/evidence store for V1; R2 should not be used as the artifact source of truth.
 39: - Revised after user input: container pipeline integration is a later cutover step; first prove multi-arch OpenCode artifact production.
 40: - BuildKit is best understood as a container/image build engine. It is excellent for Dockerfile/OCI image builds and cache reuse, but not necessarily the right primary orchestrator for arbitrary CI workflows, native binary matrices, release notes, approval gates, and multi-project artifact management.
 41: - A Jenkins-style service may better match generic release-watcher needs: scheduled/webhook-triggered pipelines, durable build history, credentials, agents, artifact archiving, approvals, and per-project jobs.
 42: - Oracle consultation on BuildKit vs Jenkins agreed with the pivot:
 43:   - Jenkins should be the release-watcher orchestrator.
 44:   - BuildKit should stay a specialized builder for OCI/container image stages only.
 45:   - Cloudflare Worker should be external relay/webhook edge only, not builder, artifact store, or source of truth.
 46:   - Cloudhome DB/storage should be canonical for release state and artifacts.
 47:   - V1 OpenCode should stay narrow: detect release, merge `fork/local`, install deps, typecheck, build required Cloudhome artifacts, store checksums/logs, mark verified, optional manual promotion.
 48:   - macOS artifacts cannot be replaced by Linux Cloudhome unless a Mac Jenkins agent is added; local Mac ORW remains the macOS path.
 49: 
 50: ## Research Findings
 51: - Known from project memory: `@cortexkit/orw` is hardcoded around OpenCode release verification and install paths, so a generic fork likely requires source changes rather than configuration only.
 52: - Earlier synthesis identified three target integration modes:
 53:   - Literal overlay: direct forks with patch layers.
 54:   - Consumer validation: validate downstream consumers against released dependencies.
 55:   - Semantic adaptation: adapt feature intent into a different architecture/language.
 56: - Oracle proposed core pipeline phases: discover → prepare → integrate → build → validate → publish/install → record/notify.
 57: - Minimum abstraction should be project config with mode, source, workspace, integration spec, build commands, validation commands, publish targets, notify targets, and safety policy.
 58: - Safety gates needed: release authenticity, clean workspace, path allowlists, diff budgets, dependency policy, BuildKit isolation, validation contracts, rollback, and AI audit logs.
 59: - Run-state specialist recommendation:
 60:   - Cloudflare D1 should be authoritative for run records, leases, state transitions, retry counters, artifact manifests, promotion status, and active/candidate channel pointers.
 61:   - Cloudflare R2 should store immutable artifacts and evidence: per-arch binaries, logs, AI merge transcripts, diffs, checksums, manifests, and smoke-test evidence.
 62:   - Cloudhome BuildKit should be ephemeral execution/cache only: clone, merge, build, test, upload evidence; never source of truth.
 63:   - Container registry should store runtime images built from R2 artifacts; R2 remains source for binary inputs and release evidence.
 64:   - Suggested lifecycle: discovered → claimed → source_prepared → merge_running → merge_succeeded/failed → build_running → build_succeeded/failed → artifacts_published → container_candidate_built → smoke_testing → promoted/rejected.
 65:   - Immutable artifact keys should include run ID and arch; only `candidate.json` and `active.json` pointers should be mutable.
 66:   - Idempotency key should include project, upstream tag, fork base SHA, and target arch.
 67: - Existing Cloudhome build system found in `/Volumes/Topper2TB/Git/cloudhome`:
 68:   - `docs/runbooks/In-Cluster Image Builds.md` documents existing flow: GitHub push → Cloudflare Worker `build-relay.rustybret.com` → in-cluster `build-dispatcher` → per-arch BuildKit Jobs → OCIR push → multi-arch manifest assembly.
 69:   - `tofu/modules/cloudflare_build_relay/worker.js` is the Cloudflare build relay implementation location.
 70:   - `docker/build-dispatcher/` is the in-cluster dispatcher service.
 71:   - `docker/build-dispatcher/src/repo-map.js` maps repos to image targets; current `opencode` target is only `arm64`, while V1 release-watcher requires linux `amd64` + `arm64` artifacts.
 72:   - `k8s/base/ops/buildkit/` contains BuildKit namespace, amd64/arm64 buildkitd deployments, job templates, RBAC, and network policy.
 73:   - `ops/buildkit.just` exposes operator recipes; manual `trigger` is currently a stub that says to use webhook.
 74:   - `scripts/build-opencode-multiarch.sh` already supports Docker buildx multi-arch OpenCode image builds with args for `OPENCODE_REPO`, `OPENCODE_REF`, `OHMYOPENCODE_REPO`, `OHMYOPENCODE_REF`, `--platforms`, `--tag`, `--no-push`, and `--rollout`.
 75:   - `docker/opencode/Dockerfile` is the OpenCode container build context.
 76:   - `ops/opencode.just` and `scripts/build-opencode*.sh` are the current OpenCode deployment/build operator seam.
 77: - Existing build relay is webhook/push-oriented and image-oriented. Release-watcher V1 needs a release/tag-oriented trigger that can pass a produced artifact/manifest into the existing image build path.
 78: - Existing BuildKit already uses R2 for layer cache and OCIR for final images; release-watcher should not duplicate that, but may need an additional R2 artifact/evidence namespace for release-watcher-produced binaries and manifests.
 79: - User rejected R2 as release artifact store. Adjust plan to use Cloudhome-hosted storage for release-watcher artifacts/evidence, while preserving existing R2 layer-cache behavior for BuildKit.
 80: 
 81: ## Jenkins Reference + Cloudhome Verification (2026-06-05)
 82: - Cloudhome agent onboarded Jenkins and wrote `coordination_notes/jenkins-build-setup-reference.md` (treat as first-trial, verify before relying).
 83: - Jenkins controller `jenkins-0` is live in `jenkins` ns, pinned to `altos-worker-01`, JCasC at `k8s/base/apps/jenkins/jenkins-values.yaml` with ZERO jobs defined yet. Auth via Authentik OIDC + local admin. Verified: jenkins-values.yaml exists, uses `jenkins/inbound-agent:latest`, storageClass `local-altos` (50Gi ZFS PVC for archiveArtifacts).
 84: - Doc defines 3 variants: V1 Docker→OCIR (reuse BuildKit, Jenkins orchestrates), V2 multi-arch binary (per-arch toolchain agent pods), V3 macOS (3a cross-compile / 3b native Mac agent — net-new infra).
 85: - **DECISIVE REFRAME — OpenCode is Variant 1, not Variant 2.** Verified in cloudhome repo:
 86:   - `docker/opencode/Dockerfile` ALREADY integrates fork + omo via build-args: `OPENCODE_REPO`, `OPENCODE_REF`, `OHMYOPENCODE_REPO`, `OHMYOPENCODE_REF`. Stage 1 runs `bun run script/build.ts --single` (compiles binary INSIDE the image build, auto-detects container arch). Stage 2 builds omo plugin. Stage 3 = ubuntu:24.04 runtime.
 87:   - So the container build IS the fork-integration step. No separate standalone-binary artifact is needed first — earlier draft assumption (binaries → then container) is obsolete for OpenCode.
 88:   - `scripts/build-opencode-multiarch.sh` already defaults `PLATFORMS=linux/amd64,linux/arm64` (buildx multi-arch). Multi-arch is already solved at the script level.
 89:   - The ONLY arch gap is `docker/build-dispatcher/src/repo-map.js`: `opencode` target = `{ image: "opencode", arch: "arm64", jobTemplate: "opencode-arm64" }` (arm64-only). amd64 needs an added target entry + an `opencode-amd64` job template.
 90:   - No Jenkinsfile exists anywhere in cloudhome yet — net-new.
 91: - **Integration philosophy gap (key V1 design question):**
 92:   - orw (local Mac) AI-merges fork/local + curated PRs onto each release TAG (handles conflicts via AI).
 93:   - Dockerfile just `git clone`s a repo@ref — NO AI merge, NO curated-PR handling.
 94:   - But fork/local is ALREADY rebased onto dev (= upstream mirror) by the sync-upstream workflow, so cloning fork/local yields the integrated result WITHOUT AI merge — as long as fork/local is current.
 95:   - Curated upstream PRs (the 5 we watch) are the wrinkle: the Dockerfile can't apply them. V1 must decide how curated PRs enter the cloudhome build (pre-merge ref/branch the Dockerfile clones, vs an AI-merge pre-step that pushes an integration branch).
 96: 
 97: ## MAJOR REFRAME (2026-06-05, user correction) — read this first
 98: - **The existing cloudhome opencode Docker pipeline is STALE and NOT the target.** It builds from production upstream opencode. Do NOT anchor V1 on `docker/opencode/Dockerfile` or `build-opencode-multiarch.sh` as the integration seam. Cloudhome's entire way of consuming opencode will change dramatically once this system exists. The Variant-1 reframe above is therefore NOT the design — it only describes the legacy pipeline we are replacing.
 99: - **Apple Silicon IS buildable on cloudhome** via its cross-platform compiler (gcc/cross-compile; Bun also supports `--target=bun-darwin-arm64` cross-compile from Linux). The Jenkins doc's "native macOS agent required" constraint applies only to Xcode/codesign/notarize — pure cross-compiled darwin binaries can be produced in-cluster. This means cloudhome can eventually produce the darwin-arm64 artifact too, and local Mac ORW need not remain the permanent darwin path.
100: - **Cloudhome knows Jenkins but does NOT know our release-watcher plans.** The coordination doc is generic Jenkins onboarding, not tailored to this system.
101: 
102: ## PRIMARY GOAL (authoritative restatement)
103: Build a **project-agnostic** version of ORW that performs the same release-integration functions for **ALL our forked upstream repos**, on **shared infrastructure** (Jenkins + cloudhome). Component responsibilities:
104: - **GitHub webhooks** → fire CI builds on upstream release/PR events.
105: - **Cloudflare Workers** → relay external-service signals/webhooks into cloudhome (ingress edge only).
106: - **Jenkins** → the build-automation brain. Runs: git PR merge, **headless opencode agent sessions** (AI merge), artifact builds (incl. multi-arch + cross-compiled darwin), and can **produce docker images directly** OR delegate to BuildKit.
107: - **BuildKit** → docker image creation for the cloudhome OCI registry (one of two image paths; Jenkins-direct is the other).
108: - **OCIR** → docker image registry.
109: - **Cloudhome resources** → artifact storage, logs, and DB. DB options: a **variant DB container node** (atlas-style, already hosted) OR **free OCI MySQL**.
110: - Generalizes orw across the earlier three modes (literal overlay / consumer validation / semantic adaptation), driven by per-project config.
111: 
112: ## Technical Decisions (post-Jenkins-reference)
113: - OpenCode V1 = Jenkins **Variant 1 (Docker→OCIR)**: Jenkins orchestrates, BuildKit/buildx builds the image, OCIR stores it. NOT a standalone-binary job.
114: - Jenkins is the release-watcher orchestrator; the existing `build-opencode-multiarch.sh` + `docker/opencode/Dockerfile` are the build primitive (already fork+omo-aware, already multi-arch-default).
115: - V1 must add an `opencode-amd64` BuildKit job template + an amd64 entry in `repo-map.js` (current is arm64-only) to satisfy the multi-arch cutover gate.
116: - V1 must define the first Jenkinsfile/pipeline-job (none exist in cloudhome today).
117: - Local Mac ORW stays untouched and authoritative for darwin-arm64 until the Cloudhome image path is promoted.
118: - Curated-PR integration is the one genuine design fork (see open questions) — fork/local alone is already integration-complete vs upstream, but the 5 watched PRs are not in fork/local.
119: 
120: ## V1 Scope Decisions (2026-06-05, confirmed)
121: - **V1 deliverable = BOTH, stop at "artifact built / image pushed" (no deploy config):**
122:   1. Standalone binaries — linux amd64 + linux arm64 + **darwin-arm64 (cross-compiled in-cluster, NOT deferred)**. These are what we will *eventually* auto-install on the Mac (orw-style), but auto-install itself is out of V1.
123:   2. A **new repo source + trigger** for the opencode docker image → pushed to **OCIR**. Deploy/runtime config of that image is explicitly out of V1.
124: - **DB substrate = an OCI database resource** (user prefers OCI-hosted DB; e.g. free OCI MySQL) — NOT the atlas-style in-cluster container.
125: - **Run the orw-equivalent process in PARALLEL — do NOT replace the existing local Mac ORW workflow.** The cloudhome path stops at the built artifact binary; local ORW keeps installing on the Mac until a later phase.
126: - **Reuse the existing `build-relay` signal path** (Cloudflare worker → cloudhome).
127: - **GO FARTHER (confirmed in V1):** also replace the opencode **CI-on-push** GitHub Actions workflows with a GitHub-webhook → build-relay → Jenkins path. The GitHub-Actions CI we built earlier this session is to be superseded by this self-hosted path.
128: - **Strategic framing (why this exists):** our GitHub-Actions CI attempts were "a disaster"; this Jenkins+cloudhome system is their **replacement**, project-agnostic by design.
129:   - **V2**: onboard agent-harness release-watch + CI.
130:   - **V3**: onboard atlas media-app CI + release-watch.
131: 
132: ## Defaults Accepted (user confirmed "yes, defaults")
133: - One **parameterized** Jenkins pipeline reading per-project release-watcher config (not one pipeline per fork).
134: - `release-watcher` packaging = **CLI core (forked orw, project-agnostic) + thin Jenkinsfile/shared-library** that invokes it.
135: - Reuse existing `build-relay` worker for the trigger path (do not create a new worker).
136: - macOS cross-compile **IN V1** (correction to earlier "deferred").
137: 
138: ## Keystone Decisions (2026-06-05, all four confirmed)
139: - **release-watcher codebase = NEW STANDALONE REPO** (e.g. `rustybret/release-watcher`). Project-agnostic CLI core forked from orw; independent versioning; serves opencode (v1) + agent-harness (v2) + atlas (v3).
140: - **opencode image source = NEW DEDICATED image-build-context repo** (new Dockerfile + build context; replaces the stale `cloudhome/docker/opencode` path; decoupled from the fork's source tree).
141: - **Division of labor = we author pipeline + code; OCI/cluster infra is DISPATCHED to the ultrabot `cluster-admin` headless agent** (NOT handed to a human cloudhome team). Give that agent the tasks + required credentials directly.
142: - **V1 acceptance = REAL END-TO-END pipeline run**: webhook fires → Jenkins builds → 3 binaries (linux amd64/arm64 + darwin-arm64) each execute and print `--version` → opencode image present in OCIR.
143: 
144: ## Ultrabot Headless-Agent System (infra-provisioning mechanism for this plan)
145: The plan's OCI/cluster infra tasks are executed by dispatching to ultrabot, an existing live system in cloudhome. Key facts (from user; VERIFY via investigation before writing tasks):
146: - **Recipes**: `ops/ultrabot.just` — `dispatch, status, logs, cleanup, deploy, build-*, images-build, webhook-status, webhook-test, webhook-rotate-secret`.
147: - **K8s**: `k8s/base/ultrabot/` — namespace, rbac, 3 Job templates, pvcs, secrets, dispatcher. Live: `ultrabot` ns Active, `ultrabot-dispatcher` Running, 3 suspended Job templates.
148: - **Profiles** (`docker/ultrabot/`): `gp-dev` (general dev), **`cluster-admin` (kubectl/tofu/ansible RBAC — this is the one for our OCI/cluster tasks)**, `webgameECS-unity` (Unity il2cpp), + dispatcher.
149: - **Entrypoint**: `scripts/ultrabot-entrypoint.sh` — boots a headless OMO/opencode session on its own branch, does the work, **opens a PR**.
150: - **Cloudflare Worker**: `tofu/modules/cloudflare_ultrabot_dispatch/` (HMAC webhook → in-cluster dispatcher).
151: - **Dispatch (CLI)**: `just ultrabot dispatch cluster-admin "<task>" https://github.com/rustybret/<repo>` ; `just ultrabot status` ; `just ultrabot logs <job-name>`.
152: - **Dispatch (webhook)**: `just ultrabot webhook-test cluster-admin "<task>"`.
153: - **How it works**: dispatch clones the suspended profile Job template → injects task prompt + repo → unsuspends → one-shot agent pod runs → opens PR.
154: - **Caveats**: needs OCI Vault values `ultrabot-github-pat` + `ultrabot-anthropic-relay-token`; images must be pushed via `just ultrabot images-build` (still built on local Mac via `build-ultrabot-*.sh`).
155: - **Runbook**: `cloudhome/docs/runbooks/Ultrabot Headless Agents.md`.
156: - **Secrets/permissions guide**: `cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` (credentials, keys, human-only gates).
157: - **Implication for the plan**: infra-provisioning TODOs become "dispatch a precisely-specified task to ultrabot cluster-admin" steps, each with: the exact provisioning goal, the repo to PR against, the required Vault secrets, and an agent-executed verification of the resulting PR/cluster state. Human-only gates (per cheatsheet) must be respected — some secret/credential steps may NOT be delegable and remain manual.
158: 
159: ## Cloudhome Infra Findings (2026-06-05, probes bg_d3e38ab0 + bg_cd70e346)
160: 
161: ### Two webhook workers ALREADY exist (key — reconcile with "use build-relay")
162: - **`build-relay.rustybret.com`** (CF Worker): HMAC (KV `BUILD_RELAY_SECRETS/WEBHOOK_HMAC_SECRET`) → 202 async → `build-dispatcher-internal.rustybret.com` → `build-dispatcher.buildkit.svc:8080/dispatch` → instantiates suspended K8s Job templates → BuildKit → OCIR. This is the **image-build** path.
163: - **`jenkins-hook.rustybret.com`** (separate CF Worker): HMAC (Workers secret `WEBHOOK_HMAC_SECRET`, Vault `jenkins-webhook-hmac`) → verbatim proxy → `jenkins.rustybret.com/github-webhook/` → Jenkins. The **Jenkins CI** path is ALREADY wired end-to-end — but Jenkins has zero jobs.
164: - **Implication**: For CI-on-push → Jenkins, use the existing `jenkins-hook` worker (not build-relay). For the opencode image build, use `build-relay` → dispatcher → BuildKit. The earlier "reuse build-relay" decision applies to the IMAGE path; the CI path has its own dedicated worker already.
165: 
166: ### opencode is already partially wired
167: - `repo-map.js`: `opencode` → `{image:"opencode", arch:"arm64", jobTemplate:"opencode-arm64"}` (arm64-only, from the stale Dockerfile path). OCIR repo `opencode` already tofu-provisioned.
168: - The NEW dedicated image-build-context repo will need: its own `repo-map.js` entry + `opencode-amd64` + `opencode-arm64` Job templates (add amd64), pointing at the new Dockerfile/context.
169: 
170: ### Jenkins blockers = net-new work (all confirmed)
171: - Zero Jenkinsfiles, zero JCasC `jobs:` block anywhere. Controller fresh (`jenkins/jenkins:lts-jdk17`, altos-worker-01, 50Gi `local-altos` PVC for archiveArtifacts).
172: - Default agent `jenkins/inbound-agent:latest` has **NO build tools** (no bun/node/git/buildx). Must add a custom build-tools pod template/image.
173: - `jenkins-agent` SA RBAC scoped to `jenkins` ns ONLY. To build images from Jenkins, either: (A) POST to build-dispatcher `/dispatch` with HMAC (egress open, simplest), or (B) add Role+RoleBinding for `batch/jobs` in `buildkit` ns + cross-ns OCIR creds. **Lean: Option A** (Jenkins orchestrates; BuildKit builds the image), matches "Jenkins can produce images directly OR delegate to BuildKit" → delegate.
174: - BuildKit daemons are per-arch persistent (amd64 on altos-worker-01, arm64 on sj-b-worker-01), socket via hostPath; multi-arch assembled via `crane index append`.
175: 
176: ### DB PROTOCOL MISMATCH — NEW DECISION (blocking)
177: - User said "free OCI MySQL". What's actually provisioned is **OCI Autonomous Database (Oracle ATP, Always Free, OLTP)** — `SJAFREEDB` (sj-a, private endpoint) + `PHXFREEDB` (phx-c). That's **Oracle SQL*Net protocol, NOT MySQL** — needs an Oracle driver; currently unused by any app.
178: - Atlas's DB is **in-cluster MariaDB** (mysql protocol), which the user explicitly does NOT want for this.
179: - Three resolutions: (1) **provision a NEW OCI MySQL HeatWave free-tier DB** (net-new tofu; matches "MySQL" intent; easy mysql protocol) — dispatch to ultrabot cluster-admin; (2) **use existing Oracle ATP SJAFREEDB** (provisioned, but Oracle driver + unused); (3) fall back to in-cluster MariaDB (rejected by user). **Needs user pick — lean (1).**
180: 
181: ### macOS cross-compile (verify in execution)
182: - Neither probe confirmed Bun darwin cross-compile in-cluster. opencode build = `bun build --compile`; Bun supports `--target=bun-darwin-arm64` from Linux, so a linux build-tools agent with Bun should produce darwin-arm64. Make this an early de-risking task (build + `file`/`--version` check), not an assumption.
183: 
184: ## Ultrabot Findings (2026-06-05, probe bg_f77e5754) — CRITICAL for infra-task shaping
185: 
186: ### Dispatch API contract (the plan's infra-task integration point)
187: - CLI: `just ultrabot dispatch cluster-admin "<task>" [<repo_url=https://github.com/rustybret/cloudhome>]` → clones suspended `ultrabot-cluster-admin-template`, injects `TASK_PROMPT`+`REPO_URL`, unsuspends → Job `ultrabot-cluster-admin-<ts>`.
188: - Webhook: HMAC-SHA256 `POST https://ultrabot-dispatch.rustybret.com/dispatch` body `{profile, task, repo_url?}` (profile ∈ gp-dev|cluster-admin|webgameECS-unity) → `{job_name}`.
189: - Entrypoint: clones repo@branch → `opencode run --headless "/ulw-loop <task>"` → pushes branch `ultrabot/cluster-admin/<slug>-<ts>` → **opens PR** (`gh pr create`). Output is always a PR, never a direct push to main. 2h `activeDeadlineSeconds`. `status`/`logs`/`cleanup` recipes available.
190: 
191: ### cluster-admin capability boundary (DECISIVE constraint)
192: - SA `ultrabot-cluster-admin` → **ClusterRoleBinding to `cluster-admin`** → full in-cluster kubectl.
193: - Image has kubectl + just + tofu + ansible + oci-cli installed, but the pod mounts **ONLY** `GITHUB_TOKEN` + `ANTHROPIC_RELAY_TOKEN`. **NO `~/.oci/config`, NO OCI API signing key, NO `CLOUDFLARE_API_TOKEN`, NO SSH keys, NO Ansible vault pw, NO docker/podman.**
194: - **CAN delegate today**: anything via `kubectl` (apply/delete/patch manifests, secrets, jobs, deployments), code changes + PRs, `just` recipes that don't need cloud auth.
195: - **CANNOT delegate without credential injection**: `tofu apply` w/ OCI provider, `oci` CLI, `ansible-playbook`, SSH, Cloudflare-via-tofu, OCIR pushes from inside the pod.
196: - User's directive ("give it the required credentials directly") ⇒ to delegate OCI/tofu provisioning we must mount `~/.oci/config` + API signing key (and/or `CLOUDFLARE_API_TOKEN`) into the cluster-admin Job. That itself is a cluster Secret the user (or a human-gated step) must seed once.
197: 
198: ### Permanently human-only gates (cannot be delegated to ANY headless agent)
199: - Create GitHub fine-grained PAT (web UI + MFA) — e.g. a new `release-watcher`/image-repo PAT.
200: - Create a BRAND-NEW OCI Vault secret *name* (needs tofu apply or OCI Console; agent can only *rotate* existing).
201: - Create new Cloudflare API/creator token (dashboard login).
202: - Approve billing / enable paid features; first-time Ansible vault bootstrap; physical hardware; MFA approvals; distribute `CLOUDHOME_SECRETS_TOKEN`.
203: - Agent CAN autonomously: random secret gen, **rotate existing** OCI Vault secrets, Cloudflare KV writes, child-token mint/revoke, GitHub webhook creation, ESO sync, Keychain storage.
204: 
205: ### Implication for plan structure
206: - Infra TODOs split into THREE buckets: (1) **human-only prerequisites** (mint PATs, create new Vault secret names via tofu/console, billing) — manual tasks the user does; (2) **ultrabot-delegable K8s tasks** (apply Jenkins JCasC/agent pod template/RBAC, deploy new Job templates, create ESO ExternalSecrets, wire dispatcher entries) — dispatched to cluster-admin, land as PRs the user merges; (3) **credential-injection bootstrap** (mount OCI/Cloudflare creds into cluster-admin IF we want it to run tofu) — one-time, human-seeded.
207: - Every ultrabot-dispatched task's "acceptance" = a merged PR + an agent-executed `kubectl`/endpoint verification of the resulting cluster state.
208: 
209: ## FINAL Decisions (2026-06-05, both blocking resolved)
210: 1. **Run-state DB = NEW OCI MySQL HeatWave free-tier** (net-new tofu module; mysql protocol; simple driver from Bun/Node release-watcher). Provisioned via ultrabot cluster-admin running `tofu apply` (per decision 2).
211: 2. **Inject OCI creds into ultrabot cluster-admin** — one-time human-seeded K8s Secret (`~/.oci/config` + API signing key, + `CLOUDFLARE_API_TOKEN` where Cloudflare/tofu work is needed) mounted into the cluster-admin Job template, enabling it to run `tofu apply` for OCI provisioning (MySQL HeatWave DB, OCIR repo for the new image, rotate existing Vault secrets). Output remains PR-based; permanently-human gates (mint new PATs, create brand-new Vault secret *names*, billing) stay manual.
212: 
213: ## Test/Verification Strategy (locked default — infra plan)
214: - **Agent-executed QA per task** (mandatory): every task verified by running the deliverable — `kubectl get/describe` for cluster state, HMAC `curl` for webhook paths, binary `--version`/`file` for artifacts, OCIR registry query for image presence.
215: - **Light unit tests** on the release-watcher CLI core for pure logic only (config parsing, merge-plan/curated-PR resolution) — orw-style, in the new standalone repo.
216: - **V1 acceptance = REAL end-to-end pipeline run** (the real gate): webhook fires → Jenkins builds → 3 binaries each execute and print `--version` → opencode image present in OCIR.
217: - No automated tests for Jenkins/k8s wiring itself — proven by the e2e run + per-task kubectl/endpoint verification.
218: - V1 first target: still OpenCode, but produced by the NEW release-watcher pipeline (not the stale Dockerfile). What is the V1 deliverable now — a docker image for cloudhome's (future) opencode usage, a set of binaries, or both? Depends on how cloudhome's new opencode consumption is shaped.
219: - How will cloudhome consume opencode after this lands (since the current container pipeline is being discarded)? This defines the V1 artifact target.
220: - DB substrate pick for V1: atlas-style variant DB container vs free OCI MySQL. (User offered both — needs a choice or "your call".)
221: - Is the new generic `release-watcher` codebase a fork of orw run as a Jenkins-invoked CLI, a set of Jenkins shared-pipeline libraries, or both (CLI core + thin Jenkinsfile)?
222: - macOS cross-compile: in V1 scope (cloudhome produces darwin-arm64 too), or deferred to a later phase while local Mac ORW continues?
223: - Project onboarding model: one Jenkins pipeline per fork, or one parameterized pipeline reading per-project release-watcher config?
224: - Webhook→Cloudflare→Jenkins trigger path: reuse the existing `build-relay` worker, or a new release-watcher worker?
225: 
226: ## Stale Open Questions (pre-reframe — retain for history)
227: - What exactly is the Cloudflare relay responsible for today: webhook intake, artifact routing, build dispatch, status UI/API, or all of these?
228: - What exactly is the cloudhome BuildKit process today: Kubernetes BuildKit builders, OCI registry, artifact store, deployment runner, or local-only build host?
229: - Should `release-watcher` remain a standalone CLI, become a GitHub Action/composite workflow, become a service behind the Cloudflare relay, or expose all three surfaces?
230: - Should first milestone be OpenCode parity only, or immediately support one non-OpenCode repo such as `atlas`?
231: - What artifact target should cloudhome produce: OCI images, GitHub draft PRs, downloadable binaries, locally installed binaries, or status-only evidence?
232: - Which repo should be target #2 after preserving OpenCode parity: `atlas`, `godot-mcp`, `symphonyStudio`, or `unitySuperMCP`?
233: - Should semantic adaptations ever auto-merge, or always stop at Draft PR + evidence?
234: - Should run state live locally first, in Cloudflare D1 first, or both?
235: - What Cloudflare relay and Cloudhome BuildKit code/config already exists, and what interfaces should the plan reuse?
236: - What exact parity proof is required before switching from local ORW to Cloudhome release-watcher?
237: - Should Cloudhome install built artifacts back onto the Mac, publish them to an artifact store, or only prove build success at V1?
238: - Run-state placement is undecided; user requested specialist input on whether state should live in Cloudflare D1/R2, BuildKit-local evidence, both, or another store.
239: - Should release-watcher integrate as an extension of the existing `build-relay` / `build-dispatcher`, or as a separate Cloudflare Worker + dispatcher sharing BuildKit resources?
240: - Should V1 produce standalone OpenCode linux binaries in R2 first, then build the container from them, or should it directly produce the final multi-arch OpenCode container image?
241: - Should the current `opencode` build target be expanded from arm64-only to amd64+arm64 as part of release-watcher V1?
242: - What exact Cloudhome storage path/PVC/NFS/ZFS dataset should hold release-watcher artifacts, logs, manifests, and evidence?
243: - What retention policy should apply to locally stored artifacts: keep N releases, keep N days, or keep all until manual pruning?
244: - If not D1, what should be the authoritative run-state store: local SQLite/Postgres on Cloudhome, files next to artifacts, Kubernetes CRDs/jobs, or Cloudflare D1 only for status metadata?
245: - Should the execution plane pivot from BuildKit-first to Jenkins-first, with BuildKit retained only for container image build stages?
246: - If Jenkins is used, should release-watcher become a Jenkins pipeline/job generator, a standalone CLI invoked by Jenkins, or a service that Jenkins calls?
247: - Which database should release-watcher use for V1 run state: OCI Autonomous DB, in-cluster Postgres/MariaDB, Jenkins native build history + artifact archive, or local SQLite?
248: - If Jenkins is selected, should we deploy classic Jenkins, Jenkins LTS Helm chart, or consider a lighter self-hosted CI alternative before committing?
249: - Should V1 use Jenkins-native build history plus artifact archive initially, or create a dedicated release-watcher DB from the start?
250: - Which Cloudhome storage backend should hold artifacts: ZFS-backed PVC, OCI block/volume, NFS-style share, or object-store-like local service?
251: - Waiting for Cloudhome-side details on Jenkins service shape, storage backend, DB choice, and operator conventions.
252: 
253: ## Coordination Requirements for Cloudhome Jenkins Setup
254: - Deploy classic Jenkins LTS on K8s as a self-hosted CI/orchestration service.
255: - Jenkins must be able to run release-watcher pipelines for OpenCode without disrupting the existing local Mac ORW setup.
256: - Jenkins V1 does not need macOS workers; Linux amd64/arm64 support is enough for Cloudhome artifacts.
257: - Jenkins should have access to dedicated release-watcher DB/storage from the start.
258: - Jenkins should be able to run jobs that clone private GitHub repos/branches and use required secrets without embedding long-lived credentials in job definitions.
259: - Jenkins should preserve logs and job evidence, but the release-watcher DB/storage remains canonical for release state and artifacts.
260: - BuildKit remains available as a downstream build primitive for container image stages, not the primary release-watcher orchestrator.
261: - Cloudflare Workers/relay should remain ingress/external-trigger glue only.
262: 
263: ## Scope Boundaries
264: - INCLUDE: architecture for a generic watcher, adapter model, Cloudflare relay/buildkit integration shape, safety gates, and migration path from current `orw`.
265: - EXCLUDE: implementation until a work plan is generated and handed to execution.
266: 
267: ## Candidate Cutover Gates
268: - Both Linux artifacts exist: `linux-amd64` and `linux-arm64`.
269: - Cloudhome-hosted artifact digests match manifest.
270: - Artifacts execute in matching Linux runtime and expose expected OpenCode version/metadata.
271: - Merge evidence proves upstream release + `fork/local` customization layer.
272: - Initial V1 gate: release-watcher produces validated Cloudhome-hosted artifacts without changing the existing container build flow.
273: - Later cutover gate: Cloudhome container build consumes release-watcher artifacts, not local Mac output.
274: - Candidate `code.rustybret.com` container starts and passes smoke checks.
275: - Previous active manifest/image remains rollback target.
276: - Local Mac ORW remains unchanged until Cloudhome path is promoted.

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 76.9s)

_Thinking:_

 Now I'm moving forward with the release-watcher-v1 plan by consulting Metis for a gap analysis on the comprehensive draft I've just reviewed.

The full draft is loaded and current. Now consulting Metis for gap analysis before generating the plan — this catches what I might have missed across this long interview.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "metis",
  "run_in_background": false,
  "load_skills": [],
  "prompt": "Review this planning session before I generate the work plan for a project-agnostic release-watcher V1 (OpenCode first) on shared Jenkins + cloudhome infra.\n\n**User's Goal**: Build a project-agnostic fork of `@cortexkit/orw` (the local Mac release watcher) called `release-watcher`, running on shared infrastructure (Jenkins on the cloudhome K8s cluster + Cloudflare workers for webhook ingress). It replaces the failed GitHub Actions CI. V1 targets OpenCode; V2 = agent-harness; V3 = atlas. The strategic point: self-hosted CI/release-automation that integrates upstream releases + our fork customizations + curated upstream PRs, producing artifacts locally instead of paying for cloud CI.\n\n**V1 scope (confirmed with user)**:\n- New standalone repo `rustybret/release-watcher` (CLI core forked from orw, project-agnostic, reads per-project config).\n- New dedicated image-build-context repo for the OpenCode docker image (replaces the stale cloudhome/docker/opencode path) → pushed to OCIR.\n- V1 deliverable = BOTH: (a) standalone binaries linux amd64 + linux arm64 + darwin-arm64 (cross-compiled in-cluster via Bun --target), AND (b) the opencode docker image to OCIR. Stop at \"artifact built / image pushed\" — NO deploy/runtime config.\n- Two trigger paths, both replacing GitHub Actions: (1) upstream RELEASE → build; (2) CI-on-PUSH to fork/local → build. Use existing Cloudflare workers: `jenkins-hook.rustybret.com` for the Jenkins CI path, `build-relay.rustybret.com` → build-dispatcher → BuildKit for the image build.\n- One parameterized Jenkins pipeline reading per-project config (not one-per-fork). Packaging = CLI core + thin Jenkinsfile/shared-library.\n- Run-state DB = NEW OCI MySQL HeatWave free-tier (net-new tofu).\n- Local Mac ORW stays running in PARALLEL, untouched, authoritative for the Mac until a later phase.\n- V1 acceptance = REAL end-to-end run: webhook fires → Jenkins builds → 3 binaries each print --version → opencode image present in OCIR.\n\n**Key infra facts (verified via 3 explore probes of the cloudhome repo)**:\n- Jenkins controller `jenkins-0` is LIVE (jenkins/jenkins:lts-jdk17, altos-worker-01, 50Gi local-altos PVC) but has ZERO jobs/Jenkinsfiles/JCasC jobs block. Default agent `jenkins/inbound-agent:latest` has NO build tools (no bun/node/git/buildx) — needs a custom build-tools pod template/image. `jenkins-agent` SA RBAC scoped to jenkins ns only.\n- `jenkins-hook.rustybret.com` CF worker already proxies GitHub webhooks → jenkins.rustybret.com/github-webhook/ (HMAC, Vault `jenkins-webhook-hmac`). CI path is wired, just needs jobs.\n- `build-relay.rustybret.com` → build-dispatcher.buildkit.svc:8080/dispatch → suspended K8s Job templates → per-arch BuildKit (amd64 on altos-worker-01, arm64 on sj-b-worker-01) → OCIR; multi-arch via `crane index append`. `repo-map.js` opencode entry is arm64-ONLY → needs amd64 added.\n- Infra provisioning is DISPATCHED to the \"ultrabot\" headless-agent system, `cluster-admin` profile: `just ultrabot dispatch cluster-admin \"<task>\" <repo_url>` OR HMAC webhook `POST ultrabot-dispatch.rustybret.com/dispatch {profile,task,repo_url}`. The agent clones, runs `opencode run --headless /ulw-loop`, and OPENS A PR (never direct push). 2h deadline.\n- CRITICAL: the ultrabot cluster-admin pod has full in-cluster kubectl (cluster-admin ClusterRoleBinding) but mounts ONLY github-pat + anthropic-relay-token — NO ~/.oci/config, NO OCI API key, NO CLOUDFLARE_API_TOKEN. So as-is it CANNOT run `tofu apply` against OCI. DECISION: inject OCI creds (one-time human-seeded K8s Secret with ~/.oci/config + API signing key + CLOUDFLARE_API_TOKEN) into the cluster-admin Job template so it can run tofu.\n- Permanently human-only gates: mint new GitHub PATs (web UI+MFA), create BRAND-NEW OCI Vault secret NAMES (tofu/console), new Cloudflare tokens (dashboard), billing, MFA. Agent CAN rotate existing Vault secrets, kubectl apply, write KV, create GitHub webhooks, ESO sync.\n\n**My understanding of the build flow**: Jenkins pipeline (triggered by release or push via jenkins-hook) → checks out fork/local → for RELEASE events, runs the release-watcher CLI to AI-merge fork/local + curated PRs onto the release tag (headless opencode session) → builds 3 binaries on a build-tools agent pod (Bun --compile + --target for darwin) → archives binaries to the 50Gi PVC + records run-state in OCI MySQL → POSTs to build-relay to trigger the BuildKit image build from the new image-context repo → image lands in OCIR.\n\nPlease identify:\n1. Questions I should have asked but didn't.\n2. Guardrails that need to be explicitly set (especially around: ultrabot AI agents opening PRs into infra repos, the OCI cred injection blast radius, curated-PR AI-merge correctness, the parallel local-ORW non-interference).\n3. Potential scope-creep areas to lock down (this spans 2 new repos + cloudhome infra changes + Jenkins + DB + 2 trigger paths — high creep risk).\n4. Assumptions I'm making that need validation (especially: does Bun actually cross-compile darwin-arm64 from linux for the opencode build? does the AI-merge step belong in Jenkins or stay orw-style? is the \"new image-context repo\" redundant with fork/local already being integration-complete?).\n5. Missing acceptance criteria / verification gaps.\n6. Edge cases not addressed (concurrent release+push events, AI-merge conflict failures, partial-arch build failure, DB unavailable, ultrabot PR never merged, secret rotation mid-run).\n7. The biggest risk: is this V1 too big for one plan? If so, where is the natural minimal-viable cut that still proves the core thesis (self-hosted release→artifact pipeline replacing GitHub Actions)?"
}
```

**Output:**
```
Task completed in 38s.

Agent: Metis - Plan Consultant
⚠️  Model routing: parent used anthropic/claude-opus-4-8, this subagent used openai/gpt-5.5 (via category: unknown)

---

## Intent Classification
**Type**: Architecture  
**Confidence**: High  
**Rationale**: This is a multi-system infra/release-automation design spanning Jenkins, K8s, Cloudflare Workers, OCIR, OCI MySQL, GitHub webhooks, AI merge agents, and repo structure decisions. The main risk is architectural scope and operational blast radius, not just implementation detail.

## Pre-Analysis Findings
No additional exploration launched. You already have verified infra facts from cloudhome probes; I’m treating those as authoritative and not duplicating that search.

## Questions for User

1. **What is the minimal V1 proof point: release-triggered binary build only, or release-triggered binary + Docker image?**  
   Current V1 includes two repos, DB, Jenkins, image build, webhook ingress, BuildKit, OCI creds, and AI merge. That may be too large for one safe plan.

2. **Should V1 include AI-merging curated PRs, or only upstream release tag + existing `fork/local`?**  
   Curated PR integration is high-risk because it creates correctness, provenance, conflict, and rollback questions.

3. **What is the source of truth for release-watcher run state if OCI MySQL is unavailable?**  
   Is the run allowed to fail closed, retry later, or continue with Jenkins artifacts only?

4. **Who is allowed to merge ultrabot PRs that modify cluster-admin infra, secrets mounting, Jenkins jobs, or webhook wiring?**  
   This needs an explicit human approval boundary.

5. **What is the retention policy for artifacts on the Jenkins PVC?**  
   50Gi is small if every release creates 3 binaries plus logs and intermediate artifacts.

6. **Is Docker image build required to prove the V1 thesis, or can it be phase 1b after binary release automation is proven?**

7. **What exact artifact naming/versioning convention should be used?**  
   Example: `opencode-v0.x.y-linux-amd64`, `opencode-v0.x.y-linux-arm64`, `opencode-v0.x.y-darwin-arm64`.

## Identified Risks

- **V1 scope overload**: Too many first-time integrations in one milestone.  
  **Mitigation**: Split into V1a binary pipeline and V1b image pipeline unless Docker image is non-negotiable.

- **OCI credential injection blast radius**: Cluster-admin ultrabot with OCI + Cloudflare creds can mutate too much.  
  **Mitigation**: Use least-privilege OCI user/group/policy, scoped Cloudflare token, separate K8s Secret, explicit PR-only infra workflow, and no direct apply outside approved PRs.

- **AI-merge correctness risk**: A successful build does not prove the merge preserved local customizations.  
  **Mitigation**: Require deterministic diff summary, curated PR provenance list, conflict log, test/typecheck gates, and local-ORW comparison while both run.

- **Parallel local ORW non-interference**: Two systems may race to produce/install different artifacts.  
  **Mitigation**: V1 cloud watcher must not write to `~/.opencode/bin`, not mutate Mac ORW state, and not become authoritative for Mac until explicitly promoted.

- **Cross-compilation assumption**: Bun `--target darwin-arm64` from Linux may not produce a usable OpenCode binary if native dependencies, postinstall artifacts, or platform-specific packaging are involved.  
  **Mitigation**: Make cross-compile validation an early spike/gate before building the full pipeline.

- **Webhook ambiguity**: Release and push triggers could collide or duplicate builds.  
  **Mitigation**: Define idempotency key: `{project, trigger_type, upstream_version_or_commit, fork_commit}`.

- **DB as new dependency**: OCI MySQL setup may become a blocker unrelated to proving CI replacement.  
  **Mitigation**: For minimal V1, allow file/Jenkins artifact run-state first, then add MySQL once the pipeline works.

## Directives for Prometheus

### Core Directives

- MUST: Split the plan into independently shippable milestones, with an explicit recommendation whether Docker image build stays in V1 or moves to V1b.
- MUST: Add an early validation task for `bun --compile --target=bun-darwin-arm64` from Linux against OpenCode.
- MUST: Define PR-only guardrails for ultrabot infra changes; ultrabot must never directly push or apply production-impacting changes without review.
- MUST: Define least-privilege credential boundaries for OCI and Cloudflare before adding secrets to cluster-admin jobs.
- MUST: Preserve local Mac ORW as authoritative and untouched; cloud V1 must only produce remote artifacts.
- MUST: Define idempotency/concurrency behavior for release and push triggers.
- MUST: Define rollback behavior for failed AI merge, failed arch build, failed image push, and DB outage.
- MUST NOT: Include deployment/runtime config in V1.
- MUST NOT: Promote cloud-built artifacts to the Mac install path in V1.
- MUST NOT: Let curated upstream PR merging silently succeed without provenance and diff evidence.
- MUST NOT: Build one-off Jenkins jobs per project; use one parameterized project-config-driven pipeline.
- TOOL: Recommend Oracle/architecture consultation before finalizing because this is a high-blast-radius infra design.

### QA/Acceptance Criteria Directives

> **ZERO USER INTERVENTION PRINCIPLE**: All acceptance criteria and QA scenarios must be executable by agents.

- MUST: Verify Jenkins job exists and is parameterized via Jenkins API/CLI.
- MUST: Verify webhook path by sending a signed test payload to `https://jenkins-hook.rustybret.com`.
- MUST: Verify release path creates exactly 3 binaries: linux amd64, linux arm64, darwin arm64.
- MUST: Verify each binary runs `--version` successfully in an appropriate environment or emulator strategy.
- MUST: Verify Docker image exists in OCIR using `crane digest` or `crane manifest`.
- MUST: Verify OCI MySQL run-state row exists for the test run if DB remains in V1.
- MUST: Verify failed merge/conflict produces a failed Jenkins build with archived logs, not a partial success.
- MUST: Verify duplicate webhook delivery does not create duplicate artifact records.
- MUST NOT: Use “manually check Jenkins UI” as acceptance.
- MUST NOT: Use “confirm image is visible in console” as acceptance.
- MUST NOT: Use vague checks like “verify the pipeline works.”

## Recommended Approach

Treat the current V1 as probably too large. The clean minimal cut is: **release webhook → Jenkins → release-watcher config → build 3 OpenCode binaries → archive artifacts → executable `--version` proof**. Add Docker image/OCIR as V1b unless Docker is essential to proving the replacement for GitHub Actions.

<task_metadata>
session_id: ses_169cf578fffeDHUEzQpuGAE3di
task_id: ses_169cf578fffeDHUEzQpuGAE3di
subagent: Metis - Plan Consultant
</task_metadata>

to continue: task(task_id="ses_169cf578fffeDHUEzQpuGAE3di", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 35.2s)

_Thinking:_

 I'm Prometheus in plan generation mode, and Metis just flagged a critical scope issue—V1 is overloaded and should split into V1a for the binary pipeline and V1b for images. My workflow says I shouldn't ask follow-up questions after Metis's analysis, but this scope decision feels too important to gloss over.

Actually, wait—there's no real conflict here. The Single Plan Mandate means everything goes into one plan document, but I can structure it with sequential milestones and waves internally. The user already decided they want both binaries and images in V1, so that's settled. Metis is raising a valid concern about scope, but I should incorporate that insight into my planning rather than re-litigate it with the user. I'll move forward with the plan generation now, noting the scope consideration in my summary without blocking progress.

Metis delivered a sharp review. The headline: **V1 scope-overload risk**, with a recommended V1a (binary pipeline) / V1b (image pipeline) split. The user already explicitly chose "BOTH" — so I'll honor that as ONE plan, but structure the image build as a cleanly separable final milestone so it can be deferred without unraveling the rest. Every other Metis directive (cross-compile spike first, PR-only ultrabot guardrails, least-privilege creds, idempotency keys, rollback paths, local-ORW non-interference) folds directly into the plan.

Let me record Metis's guardrails in the draft, then run the Oracle phase-1 gate.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "## Test/Verification Strategy (locked default — infra plan)",
  "newString": "## Metis Review (2026-06-05) — guardrails folded into plan\n- **Scope**: Metis flagged V1 as possibly too large. Resolution: keep ONE plan (Single Plan Mandate), but structure as sequential milestones — Milestone A = binary pipeline (the core thesis: release/push → Jenkins → 3 binaries → --version proof); Milestone B = image build → OCIR (cleanly separable final waves, deferrable without unraveling A). User already chose BOTH-in-V1, so both ship, but A is the minimal-viable proof.\n- **MUST guardrails baked into plan**:\n  - Early `bun --compile --target=bun-darwin-arm64` cross-compile SPIKE before building the full pipeline (de-risk the darwin assumption; native deps/postinstall may break it).\n  - Ultrabot infra changes are PR-ONLY; never direct push/apply of production-impacting changes without human review/merge. Human approval boundary on PRs touching cluster-admin/secrets/Jenkins/webhook wiring.\n  - Least-privilege creds: scoped OCI user/group/policy + scoped Cloudflare token in a SEPARATE K8s Secret; not blanket account creds.\n  - Local Mac ORW stays authoritative + untouched; cloud V1 must NOT write `~/.opencode/bin` or mutate Mac ORW state.\n  - Idempotency key `{project, trigger_type, upstream_version_or_commit, fork_commit}` — release+push triggers must not double-build or double-record.\n  - Rollback/fail-closed behavior defined for: failed AI merge/conflict, partial-arch build failure, failed image push, DB outage.\n  - Curated-PR AI-merge must emit provenance (PR list) + deterministic diff summary + conflict log + typecheck/test gate; never silently succeed.\n  - Artifact naming convention: `opencode-<version>-<os>-<arch>` (e.g. `opencode-v1.15.13-linux-amd64`).\n  - Retention policy for the 50Gi PVC (keep-N-releases) since 3 binaries+logs per release adds up.\n- **DB-outage stance (resolved default)**: OCI MySQL is in V1, but run-state writes FAIL-OPEN for the build itself — a DB write failure logs a warning and archives run-state JSON alongside artifacts on the PVC; the build still completes and binaries are still proven. DB is the system-of-record, not a build blocker, in V1. (Avoids Metis's \"DB becomes unrelated blocker\" risk.)\n\n## Test/Verification Strategy (locked default — infra plan)"
}
```

**Output:**
```
Edited (+14/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 15.5s)

_Thinking:_

 Now I'm moving forward with the workflow—marking the Metis review as complete and transitioning to the Oracle phase-1 verification, then updating the task list accordingly.

Metis review is complete and its guardrails are folded into the draft. Marking the Metis todo done and running the Oracle phase-1 gate (interview completeness verification).

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 42.5s)

_Thinking:_

 I need to run the Oracle phase-1 verification gate to check interview completeness after the accidental double-fire of TodoWrite.

Running the Oracle phase-1 gate — verifying interview completeness and requirements consistency before plan generation.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "run_in_background": false,
  "load_skills": [],
  "prompt": "Verify Prometheus phase 1 (interview) is complete and consistent before plan generation. Read the draft at .omo/drafts/release-watcher-cloudhome.md (the FINAL Decisions, Keystone Decisions, V1 Scope Decisions, Metis Review, and Test/Verification Strategy sections are authoritative; the \"Stale Open Questions\" section is historical and superseded).\n\nThis is a planning session for a project-agnostic release-watcher V1 (OpenCode first) on shared Jenkins + cloudhome K8s infrastructure, replacing failed GitHub Actions CI.\n\nConfirm each, and cite the draft line/section:\n1. Core objective is unambiguous (one sentence, no hidden alternates).\n2. Scope IN / Scope OUT are both explicit (especially: what's in V1 vs deferred to V2/V3, and the \"stop at artifact built / image pushed — no deploy config\" boundary).\n3. Test strategy is decided (agent-executed QA + light CLI unit tests + e2e pipeline as the real gate).\n4. No outstanding user questions remain (the two blocking decisions — DB choice and ultrabot OCI cred injection — are both resolved).\n5. No requirement contradicts the verified cloudhome infra facts (Jenkins live but jobless, two CF workers already wired, ultrabot cluster-admin has no OCI creds without injection, repo-map opencode is arm64-only, DB is Oracle ATP not MySQL so new MySQL HeatWave must be provisioned).\n6. The Metis guardrails (cross-compile spike first, PR-only ultrabot, least-privilege creds, idempotency key, rollback/fail-open DB, local-ORW non-interference, curated-PR provenance) are captured and internally consistent with the rest of the draft.\n\nReturn: `CHECK [N/6] PASS | VERDICT: GO/NO-GO` plus, on NO-GO, a numbered list of issues that block. Be skeptical — look for genuine contradictions or unresolved ambiguity that would make the plan unbuildable, not stylistic nits."
}
```

**Output:**
```
Task completed in 24s.

Agent: oracle
⚠️  Model routing: parent used anthropic/claude-opus-4-8, this subagent used google/gemini-3.1-pro-preview (via category: unknown)

---

**Verifying Core Objectives**

I'm currently focused on verifying that the core objective is unambiguous. Specifically, I'm examining the "PRIMARY GOAL" section to ensure the objective is clear and singular, as required. My analysis is currently centered on the initial line: "Build a **project-agnostic** version of".


**Defining Project Scope**

I've clarified the project's scope, ensuring explicit boundaries. The "V1 Scope Decisions" document clearly defines what's included and deferred. I've confirmed that V1 focuses on building artifacts and pushing images, stopping short of deployment configuration. The "artifact built / image pushed" boundary is now understood. V2 and V3 are defined as well, with the scope of each being onboarding new components.


**Confirming Test Strategy**

I've just confirmed the test strategy, aligning perfectly with requirements. My examination of the "Test/Verification Strategy" document clarified this. The agent-executed QA, light CLI unit tests, and end-to-end pipeline run have been reconfirmed, with the end-to-end pipeline as the critical acceptance gate. The focus is on verifying agent QA, with the cli unit tests as a secondary confirmation.

I've also reconfirmed that there are no remaining user questions. The two blocking decisions, database choice, and ultrabot OCI cred injection, are resolved as outlined. My review of the "FINAL Decisions" document solidified these choices, with the selection of a new OCI MySQL HeatWave free-tier database and the injection of OCI creds into ultrabot cluster-admin.


**Revisiting Test Strategy**

I'm revisiting the "Test/Verification Strategy" to pinpoint the deliverable's form for cloudhome's OpenCode usage. I'm focusing on the artifact type: Docker image, binaries, or both? Also, I must clarify the database strategy: atlas-style DB container vs. OCI MySQL. The origin of the `release-watcher` codebase needs clarity, with an assessment of the current macOS cross-compile approach for scope definition.


**Identifying Inconsistencies**

I've hit a snag. My analysis has uncovered direct contradictions within the documentation, specifically between the "Test/Verification Strategy" section and other sections. Line 232-238 list unresolved questions that appear to have been answered in other sections. This raises concerns about the accuracy and consistency of the document. I need to resolve these inconsistencies immediately.


**Resolving Inconsistencies**

I'm working to resolve contradictions in the documentation. I found a direct conflict regarding the V1 deliverable; while a section lists this as an unresolved question, it's explicitly stated elsewhere as "BOTH." This violates the requirement for internal consistency and the resolution of all user questions. I am now working to address any other contradictions and ensure a cohesive view of the requirements. Specifically, I'm examining how each document section relates to verifiable facts.

I've just verified that no requirements contradict the established infrastructure facts. Jenkins is live but jobless, two Cloudflare workers are wired, and ultrabot lacks OCI creds without injection. The repo-map is ARM64-only, and the database strategy requires new MySQL HeatWave provisioning because of the existing Oracle ATP.


**Verifying Internal Consistency**

I am now verifying the internal consistency of guardrails within the project documentation, ensuring each element aligns with established facts. I'm reviewing the "Metis Review" section to assess the capture and consistency of various constraints, including the cross-compile spike, PR-only ultrabot infrastructure changes, and least-privilege credentials. I am also checking the idempotency key, the rollback/fail-closed behavior, and curated-PR provenance.



CHECK [5/6] PASS | VERDICT: NO-GO

1. **Contradictory Unresolved Questions in Test Strategy Section**: Lines 232-238 in the "Test/Verification Strategy" section contain a block of unresolved questions that directly contradict the resolved decisions elsewhere in the authoritative sections. 
   - Line 232-233 asks what the V1 deliverable is, but Line 121 explicitly resolves this as "BOTH".
   - Line 234 asks for the DB substrate pick, but Line 210 explicitly resolves this as "NEW OCI MySQL HeatWave free-tier".
   - Line 235 asks about the codebase shape, but Line 134 resolves this as "CLI core... + thin Jenkinsfile".
   - Line 236 asks if macOS cross-compile is in V1, but Line 136 resolves this as "macOS cross-compile IN V1".
   - Line 237 asks about the project onboarding model, but Line 133 resolves this as "One parameterized Jenkins pipeline".
   - Line 238 asks about the webhook trigger path, but Line 135 resolves this as "Reuse existing build-relay worker".

These lines need to be removed or moved to the "Stale Open Questions" section to ensure the document is internally consistent and that no outstanding user questions remain.

<task_metadata>
session_id: ses_169cdb1c9ffe0rlJuZSHbrMRvK
task_id: ses_169cdb1c9ffe0rlJuZSHbrMRvK
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_169cdb1c9ffe0rlJuZSHbrMRvK", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 23.6s)

_Thinking:_

 Oracle flagged a documentation consistency problem: there are stale open-question bullets (lines 218-224) lingering under the "Test/Verification Strategy" section that contradict the decisions we've already made. These are orphaned items that got appended after the section was completed, so I need to either remove them or relocate them to clean up the inconsistency. I see these are all resolved questions that were sitting orphaned between the Test/Verification Strategy section and the proper Stale Open Questions header — they're duplicates of what's already documented later in the file. I'll remove lines 218-224 to clean up the doc structure, then rerun the Oracle gate to confirm the NO-GO is resolved.

Oracle returned NO-GO (5/6) — a documentation-consistency issue, not an architecture blocker. A block of stale open-questions got orphaned under the Test/Verification Strategy section and now contradicts the resolved decisions elsewhere. That's a directive to fix, then rerun the same gate. Removing the orphaned block now.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/drafts/release-watcher-cloudhome.md",
  "oldString": "- No automated tests for Jenkins/k8s wiring itself — proven by the e2e run + per-task kubectl/endpoint verification.\n- V1 first target: still OpenCode, but produced by the NEW release-watcher pipeline (not the stale Dockerfile). What is the V1 deliverable now — a docker image for cloudhome's (future) opencode usage, a set of binaries, or both? Depends on how cloudhome's new opencode consumption is shaped.\n- How will cloudhome consume opencode after this lands (since the current container pipeline is being discarded)? This defines the V1 artifact target.\n- DB substrate pick for V1: atlas-style variant DB container vs free OCI MySQL. (User offered both — needs a choice or \"your call\".)\n- Is the new generic `release-watcher` codebase a fork of orw run as a Jenkins-invoked CLI, a set of Jenkins shared-pipeline libraries, or both (CLI core + thin Jenkinsfile)?\n- macOS cross-compile: in V1 scope (cloudhome produces darwin-arm64 too), or deferred to a later phase while local Mac ORW continues?\n- Project onboarding model: one Jenkins pipeline per fork, or one parameterized pipeline reading per-project release-watcher config?\n- Webhook→Cloudflare→Jenkins trigger path: reuse the existing `build-relay` worker, or a new release-watcher worker?",
  "newString": "- No automated tests for Jenkins/k8s wiring itself — proven by the e2e run + per-task kubectl/endpoint verification."
}
```

**Output:**
```
Edited (+0/-7).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 29.9s)

_Thinking:_

 Now I'm removing the stale orphaned questions block and need to rerun the Oracle phase-1 gate verification on this session to get a GO signal before moving forward, so I'll restart the Oracle check using task continuation.

The orphaned contradictory block is removed. Re-running the same Oracle phase-1 gate (continuing the same Oracle session) to confirm GO before plan generation.

**Tool: task**

**Input:**
```json
{
  "task_id": "ses_169cdb1c9ffe0rlJuZSHbrMRvK",
  "run_in_background": false,
  "load_skills": [],
  "prompt": "I removed the contradictory orphaned questions block (former lines 232-238) from the Test/Verification Strategy section. Re-read .omo/drafts/release-watcher-cloudhome.md and re-verify the same 6 checks from your prior phase-1 review.\n\nSpecifically confirm the contradiction you flagged (Test/Verification Strategy section no longer contains unresolved questions that duplicate already-resolved decisions). The section should now end at \"No automated tests for Jenkins/k8s wiring itself — proven by the e2e run + per-task kubectl/endpoint verification.\" with the next content being the \"## Stale Open Questions (pre-reframe — retain for history)\" header.\n\nReturn: `CHECK [N/6] PASS | VERDICT: GO/NO-GO` plus, on NO-GO, a numbered list of remaining blocking issues."
}
```

**Output:**
```
Task continued and completed in 18s.

---

**Verifying Key Objectives**

I'm currently focused on verifying the six checks for the updated release document. Specifically, I'm at check number one: ensuring the core objective is stated clearly in a single sentence, without any hidden alternatives. I have checked line 103 for the said objective.


**Confirming Release Integration**

I've confirmed the initial requirement, that a project-agnostic ORW performs release-integration for all forked repos on shared infrastructure, is correct. Additionally, I've verified both scope-in and scope-out are explicitly defined, especially the V1 boundaries (stopping at artifact built/image pushed). The test strategy (agent-executed QA, light unit tests, e2e pipeline) is clear. User questions have been addressed regarding DB choice and ultrabot OCI credentials.



CHECK [6/6] PASS | VERDICT: GO

<task_metadata>
session_id: ses_169cdb1c9ffe0rlJuZSHbrMRvK
task_id: ses_169cdb1c9ffe0rlJuZSHbrMRvK
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_169cdb1c9ffe0rlJuZSHbrMRvK", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 52.0s)

_Thinking:_

 Phase-1 is complete across all six checkpoints, so I'm moving forward with plan generation. I'll start by laying out the skeleton structure for this large infrastructure plan, then fill in the tasks in organized batches to keep everything manageable.

The system needs a new standalone release-watcher CLI repo forked from the existing codebase, a dedicated image-build context for the Docker image, a parameterized Jenkins pipeline with build-tools agents, OCI MySQL HeatWave for state management, and dual trigger paths through a jenkins-hook CloudFlare worker. I'm planning three binary targets (linux amd64, linux arm64, darwin arm64) with BuildKit handling the image builds, Ultrabot managing infrastructure provisioning via pull requests, and an early cross-compile spike to de-risk the darwin-arm64 target before committing to the full pipeline.

For the wave structure, I'm starting with foundation tasks that can run in parallel: a cross-compile spike to validate the darwin-arm64 build, scaffolding the release-watcher repo with its CLI skeleton and config schema, documenting the human prerequisites like PAT minting and vault setup, defining least-privilege OCI policies for credential injection, designing the per-project config schema, and building the build-tools agent pod image with all necessary dependencies. I need to be careful about task granularity—each task should map to one module or concern spanning 1-3 files, aiming for 5-8 tasks per wave.

Wave 2 builds on those foundations with the core CLI logic: release and push detection with idempotency handling, AI-merge orchestration that forks repos and manages curated PRs with provenance tracking, a build driver that produces the three binaries with proper naming and versioning, and the run-state database layer connecting to OCI MySQL.

In parallel, I'm provisioning the OCI MySQL HeatWave instance via infrastructure-as-code and bootstrapping the cluster with OCI credentials, then adding light unit tests for the pure CLI logic around config parsing and merge planning.

Wave 3 wires everything into Jenkins: the parameterized pipeline that reads project config and invokes the CLI, the Jenkins Configuration-as-Code job definition with the build-tools pod template, applying that template and RBAC to the cluster, wiring the webhook to trigger on release and push events with idempotency deduplication, and running the database schema migration.

Wave 4 handles the actual image builds to OCIR—I notice the new Dockerfile overlaps with the earlier image-context repo scaffolding, so I should merge those, then add the opencode amd64 entry to the repo map and deploy the BuildKit job template.

Wave 5 runs the end-to-end integration tests: a full release-trigger flow proving the binaries and image land correctly, a push-trigger CI run verifying idempotency, and failure scenarios like rollback and partial architecture builds.

I'm realizing this scope is enormous—roughly 25 tasks across five waves—and I need to be realistic about output limits, so I'll use an incremental write protocol: skeleton first, then append tasks in batches of 2-4 via edits. Each task needs full detail on what to do, agent profile, parallelization, acceptance criteria, and QA scenarios, which is a lot of content per task. I should consolidate to around 18-20 well-formed tasks and be disciplined about batching them. I'm wrapping up the task breakdown and now moving into implementation—marking phase 1 as complete and starting to write out the skeleton structure before filling in each batch of tasks with full details.

Oracle phase-1: **GO (6/6)** — the contradiction is cleared. Marking phase-1 done, moving to plan generation. Per the incremental write protocol, I'll write the skeleton first, then append tasks in batches.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 110.6s)

_Thinking:_

 I'm working through the release-watcher V1 plan generation now that the Oracle phase and Metis review are complete. I need to build out the work plan skeleton first with all the major sections, then fill in the individual task details in batches following the incremental write protocol.

Let me map out the structure: there are prerequisites that require human gates, then Wave 1 focuses on foundation and de-risking work like the cross-compile spike, scaffolding the new repos, designing the config schema, and setting up the Jenkins build-tools agent pod. Wave 2 tackles the core modules including the release-watcher CLI with its config parsing, AI-merge orchestration, and build orchestration capabilities, plus the OCI MySQL HeatWave provisioning and run-state scheduling components.

Wave 3 handles integration work—wiring up the webhook triggers, setting up artifact archival, building the Dockerfile for the image-context repo, and configuring the build-relay. Wave 4 is the end-to-end run and reviews.

I need to be realistic about task granularity—each task should map to 1-3 files or a single concern. Let me organize the actual task list around the two milestones and aim for waves of 5-8 tasks each. I'll write out a comprehensive skeleton with all the framing sections, then fill in the tasks in batches, ending with the Final Verification Wave, Commit Strategy, and Success Criteria sections.

The key distinction is between human-only prerequisites (minting PATs, setting up billing) and agent-executable tasks. The prerequisites are genuine gates, but I can mark them as such while making their verification agent-executable—like checking that a secret exists in the cluster. Let me structure this into waves and define the tasks concretely, organized around the two milestones.

Wave 1 is foundation and de-risking work running in parallel: a cross-compile spike to validate darwin-arm64 builds from Linux, scaffolding the release-watcher repo with config-driven design instead of hardcoded opencode logic, defining the config schema, setting up the image-build-context repo, building the Jenkins agent pod image with all needed tools, minting credentials and seeding the K8s secret for cluster-admin access, and provisioning the OCI MySQL HeatWave database with the run-state schema.

Wave 2 focuses on the release-watcher CLI core and Jenkins integration, also in parallel once Wave 1 completes: the config loader with validation, the merge-plan resolver that handles provenance and conflict detection, and the AI-merge orchestration logic.

Then the multi-arch build orchestration to produce three binaries with proper naming, the run-state database writer with JSON fallback, the parameterized Jenkinsfile with JCasC and RBAC, and wiring the agent pod template into Jenkins.

Wave 3 handles trigger wiring and the Milestone B image: the jenkins-hook webhook pointing to the parameterized job with idempotency, artifact archival to a 50Gi PVC with retention policy, finalizing the image-context Dockerfile with fork/local and omo build args, the repo-map.js amd64 entry and BuildKit job template, and the build-relay trigger step that POSTs to BuildKit with HMAC verification.

The final wave is four parallel reviewers: plan compliance audit, code and config quality review, real e2e pipeline QA, and scope fidelity check.

That's 19 implementation tasks plus 4 reviewers. I'm assigning agent profiles based on complexity—cross-compile spike is deep work, most CLI and infrastructure tasks are unspecified-high, scaffolding is quick, and the human prerequisites are quick with agent-executable verification steps.

Now I'll write the skeleton with tight framing, then append tasks in batches of 3-4.

Oracle phase-1 passed (GO 6/6) and the Metis guardrails are folded in. Now generating the plan. Per the incremental write protocol, I'll write the skeleton first (all framing sections + placeholders), then append the tasks in batches.

**Tool: write**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "content": "# Release Watcher V1 — Self-Hosted Release/CI Pipeline (OpenCode First)\n\n## TL;DR\n\n> **Quick Summary**: Build a project-agnostic `release-watcher` (forked from `@cortexkit/orw`) that runs on shared Jenkins + cloudhome K8s infra, replacing the failed GitHub Actions CI. V1 targets OpenCode: an upstream-release OR fork/local-push webhook triggers a parameterized Jenkins pipeline that integrates fork/local + curated PRs, builds 3 standalone binaries (linux amd64/arm64 + darwin-arm64), records run-state in a new OCI MySQL HeatWave DB, and pushes a new OpenCode docker image to OCIR.\n>\n> **Deliverables**:\n> - New standalone repo `rustybret/release-watcher` — project-agnostic CLI core + per-project config schema\n> - New dedicated image-build-context repo for the OpenCode docker image\n> - Parameterized Jenkins pipeline (Jenkinsfile + JCasC job) + custom build-tools agent pod\n> - 3 standalone binaries per release: `opencode-<ver>-linux-amd64`, `-linux-arm64`, `-darwin-arm64`\n> - OpenCode docker image pushed to OCIR (Milestone B)\n> - New OCI MySQL HeatWave run-state DB (fail-open) + run-state schema\n> - Two trigger paths wired: upstream-release + fork/local-push, via existing CF workers\n>\n> **Estimated Effort**: XL\n> **Parallel Execution**: YES — 3 waves + final verification wave\n> **Critical Path**: Cross-compile spike → CLI build orchestration → Jenkinsfile → webhook wiring → e2e run → image build\n\n---\n\n## Context\n\n### Original Request\nExtend the way orw integrates opencode releases via CI for other forks, evolving into: fork ORW into a project-agnostic `release-watcher` integrated with the Cloudflare relay + cloudhome build infrastructure, using Jenkins as the build-automation brain. V1 = OpenCode; V2 = agent-harness; V3 = atlas. Strategic driver: self-hosted CI/release-automation replacing the GitHub Actions CI that was \"a disaster\".\n\n### Interview Summary\n**Key Decisions**:\n- **release-watcher codebase**: NEW standalone repo `rustybret/release-watcher` (CLI core forked from orw, project-agnostic, reads per-project config)\n- **opencode image source**: NEW dedicated image-build-context repo (replaces the stale `cloudhome/docker/opencode` path) → OCIR\n- **V1 deliverable**: BOTH binaries AND image; stop at \"artifact built / image pushed\" — NO deploy/runtime config\n- **Binaries**: linux amd64 + linux arm64 + darwin-arm64 (cross-compiled in-cluster via Bun `--target`)\n- **Triggers**: upstream-release + fork/local-push, both replacing GitHub Actions; `jenkins-hook.rustybret.com` CF worker for the Jenkins CI path, `build-relay.rustybret.com` → build-dispatcher → BuildKit for the image build\n- **Pipeline**: ONE parameterized Jenkins pipeline reading per-project config (not one-per-fork); packaging = CLI core + thin Jenkinsfile/shared-library\n- **Run-state DB**: NEW OCI MySQL HeatWave free-tier (net-new tofu)\n- **Infra provisioning**: DISPATCHED to ultrabot `cluster-admin` headless agent (PR-based), with one-time human-seeded OCI cred injection\n- **Local Mac ORW**: stays running in PARALLEL, untouched, authoritative for the Mac until a later phase\n\n**Verified Infra Facts** (3 cloudhome explore probes):\n- Jenkins `jenkins-0` LIVE (`jenkins/jenkins:lts-jdk17`, altos-worker-01, 50Gi `local-altos` PVC) but ZERO jobs/Jenkinsfiles/JCasC jobs block; default agent has NO build tools\n- `jenkins-hook.rustybret.com` CF worker already proxies GitHub webhooks → `jenkins.rustybret.com/github-webhook/` (HMAC, Vault `jenkins-webhook-hmac`)\n- `build-relay.rustybret.com` → `build-dispatcher.buildkit.svc:8080/dispatch` → suspended K8s Job templates → per-arch BuildKit (amd64 altos-worker-01, arm64 sj-b-worker-01) → OCIR; multi-arch via `crane index append`\n- `repo-map.js` opencode entry is arm64-ONLY → needs amd64 added\n- ultrabot `cluster-admin`: full in-cluster kubectl (cluster-admin CRB) but mounts ONLY github-pat + anthropic-relay-token — NO OCI/Cloudflare creds without injection; dispatch via `just ultrabot dispatch cluster-admin \"<task>\" <repo>` or HMAC webhook; always opens a PR, 2h deadline\n- DB actually provisioned = Oracle ATP (SQL*Net), NOT MySQL → must provision new MySQL HeatWave\n\n### Metis Review\n**Guardrails Applied**:\n- Cross-compile darwin-arm64 is an early SPIKE (de-risk before full pipeline) — native deps/postinstall may break it\n- Ultrabot infra changes are PR-ONLY with human merge approval on cluster-admin/secrets/Jenkins/webhook PRs\n- Least-privilege scoped OCI user/policy + scoped Cloudflare token in a SEPARATE K8s Secret\n- Local Mac ORW untouched; cloud V1 must NOT write `~/.opencode/bin`\n- Idempotency key `{project, trigger_type, upstream_version_or_commit, fork_commit}`\n- Rollback/fail-closed for failed merge, partial-arch failure, failed image push; DB writes fail-OPEN (warn + PVC JSON, build still completes)\n- Curated-PR AI-merge emits provenance + diff summary + conflict log + typecheck gate\n- Artifact naming `opencode-<version>-<os>-<arch>`; PVC retention keep-N-releases\n\n---\n\n## Work Objectives\n\n### Core Objective\nStand up a project-agnostic, self-hosted release/CI pipeline on Jenkins + cloudhome that, on an OpenCode upstream-release or fork/local-push webhook, integrates fork/local + curated PRs and produces 3 standalone binaries + a docker image (to OCIR), with run-state in a new OCI MySQL DB — replacing GitHub Actions CI, while local Mac ORW keeps running in parallel.\n\n### Concrete Deliverables\n- `rustybret/release-watcher` repo: CLI core + `release-watcher.config` schema + light unit tests\n- New image-build-context repo: Dockerfile + build context for the OpenCode image\n- `Jenkinsfile` + JCasC job + custom build-tools agent pod template + agent RBAC\n- OCI MySQL HeatWave DB + run-state schema + fail-open DB writer\n- Wired triggers: `jenkins-hook` (release+push) and `build-relay` → BuildKit → OCIR\n- `repo-map.js` amd64 entry + `opencode-amd64` BuildKit job template\n\n### Definition of Done\n- [ ] A signed test webhook to `jenkins-hook.rustybret.com` triggers the parameterized Jenkins job\n- [ ] The job produces exactly 3 binaries, each runs `--version` successfully (native or emulated)\n- [ ] An OpenCode image is present in OCIR (verified via `crane digest`/`manifest`)\n- [ ] A run-state row exists in OCI MySQL for the test run (or PVC JSON fallback if DB down)\n- [ ] Local Mac ORW remains untouched and functional throughout\n\n### Must Have\n- ONE parameterized pipeline driven by per-project config (not one-per-fork)\n- 3 binaries with `opencode-<version>-<os>-<arch>` naming\n- Curated-PR integration with provenance + diff + conflict evidence\n- Idempotency on release+push triggers\n- Fail-open DB; artifacts always archived to PVC\n- All infra mutations land as ultrabot PRs (human-merged), never direct apply\n\n### Must NOT Have (Guardrails)\n- NO deploy/runtime config of the OpenCode image (stop at \"pushed to OCIR\")\n- NO writing to `~/.opencode/bin` or mutating local Mac ORW state\n- NO blanket OCI account creds in cluster-admin — least-privilege scoped only\n- NO one-off Jenkins job per project\n- NO silent curated-PR merge (must emit evidence)\n- NO promoting cloud-built artifacts to the Mac install path in V1\n- NO semantic-adaptation features (deferred; future = changelog/reporting only)\n- NO new greenfield webhook workers — reuse `jenkins-hook` + `build-relay`\n\n### Spec Framework Integration\n- No SDD framework (OpenSpec/Spec Kit) detected in target repos. Section omitted.\n\n---\n\n## Verification Strategy (MANDATORY)\n\n> **ZERO HUMAN INTERVENTION** for verification — all acceptance is agent-executed. Human-only gates (mint PAT, billing, new Vault secret names) are PREREQUISITE tasks, but their *verification* is agent-executed (e.g., confirm the K8s Secret/row exists).\n\n### Test Decision\n- **Infrastructure exists**: Partial (Jenkins live but jobless; CF workers wired; BuildKit live)\n- **Automated tests**: Light unit tests on the release-watcher CLI core (pure logic: config parse, merge-plan/curated-PR resolution) — `bun test` in the new repo\n- **Framework**: `bun test` (release-watcher repo)\n- **No automated tests** for Jenkins/k8s wiring itself — proven by e2e run + per-task kubectl/endpoint verification\n\n### QA Policy\nEvery task includes agent-executed QA scenarios. Evidence → `.omo/evidence/task-{N}-{slug}.{ext}`.\n- **CLI/config**: Bash (bun test, bun run, jq on output)\n- **K8s/infra**: Bash (kubectl get/describe, oci-cli, tofu plan/state)\n- **Webhook**: Bash (signed HMAC curl to the worker endpoints)\n- **Artifacts**: Bash (`file`, `--version`, checksum)\n- **Image**: Bash (`crane digest`/`crane manifest` against OCIR)\n\n---\n\n## Execution Strategy\n\n### Parallel Execution Waves\n\n```\nWave 0 (Human-only prerequisites — must clear before delegated infra tasks):\n└── P1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human]\n\nWave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):\n├── Task 1: Cross-compile spike — darwin-arm64 from Linux [deep]\n├── Task 2: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]\n├── Task 3: Per-project config schema (release-watcher.config) [unspecified-high]\n├── Task 4: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]\n├── Task 5: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]\n└── Task 6: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]\n\nWave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):\n├── Task 7: CLI config loader + validation (+ unit tests) [unspecified-high]\n├── Task 8: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]\n├── Task 9: CLI AI-merge orchestration (headless opencode session) [deep]\n├── Task 10: CLI multi-arch build orchestration (3 binaries, naming) [deep]\n├── Task 11: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]\n├── Task 12: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]\n└── Task 13: Wire build-tools agent pod template into Jenkins [unspecified-high]\n\nWave 3 (Trigger wiring + Milestone B image — depends on Wave 2):\n├── Task 14: Wire jenkins-hook webhook → job; idempotency; release+push [deep]\n├── Task 15: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]\n├── Task 16: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]\n├── Task 17: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]\n└── Task 18: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]\n\nWave FINAL (after ALL tasks — 4 parallel reviews, then user okay):\n├── F1: Plan compliance audit (oracle)\n├── F2: Code/config quality review (unspecified-high)\n├── F3: Real e2e pipeline QA (unspecified-high)\n└── F4: Scope fidelity check (deep)\n→ Present results → Get explicit user okay\n\nCritical Path: P1 → Task 1 → Task 10 → Task 12 → Task 14 → e2e → Task 18\nMax Concurrent: 6 (Waves 1 & 2)\n```\n\n### Dependency Matrix\n\n| Task | Depends On | Blocks |\n|---|---|---|\n| P1 | — | 5, 6 |\n| 1 | — | 10 |\n| 2 | — | 7, 8, 9, 10, 11 |\n| 3 | 2 | 7, 12 |\n| 4 | — | 16 |\n| 5 | P1 | 13 |\n| 6 | P1 | 11 |\n| 7 | 2, 3 | 12 |\n| 8 | 2 | 9 |\n| 9 | 8 | 10 |\n| 10 | 1, 2, 9 | 12, 14 |\n| 11 | 2, 6 | 12 |\n| 12 | 3, 7, 10, 11 | 13, 14 |\n| 13 | 5, 12 | 14 |\n| 14 | 10, 12, 13 | 15, 18, e2e |\n| 15 | 14 | F3 |\n| 16 | 4 | 17, 18 |\n| 17 | 16 | 18 |\n| 18 | 14, 16, 17 | F3 |\n\n### Agent Dispatch Summary\n\n| Wave | Count | Dispatch |\n|---|---|---|\n| 0 | 1 | P1 → `quick` (human-gated; agent documents + verifies) |\n| 1 | 6 | T1 → `deep`, T2/T3/T5/T6 → `unspecified-high`, T4 → `unspecified-low` |\n| 2 | 7 | T8/T9/T10/T12 → `deep`, T7/T11/T13 → `unspecified-high` |\n| 3 | 5 | T14/T18 → `deep`, T15/T16/T17 → `unspecified-high` |\n| FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |\n\n---\n\n## TODOs\n\n<!-- TASKS_INSERTED_HERE -->\n\n---\n\n## Final Verification Wave (MANDATORY — after ALL implementation tasks)\n\n> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit \"okay\" before completing. Do NOT auto-proceed. Never check F1-F4 before user okay.\n\n- [ ] F1. **Plan Compliance Audit** — `oracle`\n  Read the plan end-to-end. For each \"Must Have\": verify implementation exists (read repo files, kubectl, crane, curl). For each \"Must NOT Have\": search for forbidden patterns (deploy config, `~/.opencode/bin` writes, blanket creds, per-project jobs, silent merges) — reject with evidence if found. Check evidence files exist in `.omo/evidence/`. \n  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`\n\n- [ ] F2. **Code/Config Quality Review** — `unspecified-high`\n  In release-watcher repo: run `bun test` + typecheck/lint. Review CLI source for `as any`, empty catches, dead code, generic names. Review Jenkinsfile/JCasC/Dockerfile/tofu for hardcoded secrets, missing error handling, AI slop. Verify least-privilege creds (no blanket OCI account).\n  Output: `Tests [N pass/N fail] | Typecheck [PASS/FAIL] | Files [N clean/N issues] | VERDICT`\n\n- [ ] F3. **Real E2E Pipeline QA** — `unspecified-high`\n  From clean state: send a signed test webhook to `jenkins-hook.rustybret.com` → confirm Jenkins job runs → 3 binaries produced + each `--version` → run-state row in OCI MySQL (or PVC JSON fallback) → image in OCIR via `crane digest`. Test idempotency (duplicate webhook → no double record). Confirm local Mac ORW untouched. Evidence → `.omo/evidence/final-qa/`.\n  Output: `Webhook [PASS] | Binaries [N/3] | DB [PASS] | Image [PASS] | Idempotency [PASS] | ORW-untouched [PASS] | VERDICT`\n\n- [ ] F4. **Scope Fidelity Check** — `deep`\n  For each task: read \"What to do\" vs actual diff/PR. Verify 1:1 (nothing missing, nothing beyond scope — esp. no deploy config, no Mac install path). Check \"Must NOT do\" compliance. Detect cross-task contamination. Confirm ultrabot changes all landed as PRs (no direct applies).\n  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N] | PR-only-infra [PASS] | VERDICT`\n\n---\n\n## Commit Strategy\n\n> Work spans MULTIPLE repos: `rustybret/release-watcher` (new), the new image-context repo (new), and `rustybret/cloudhome` (infra, via ultrabot PRs). Commit per-repo; infra changes land as ultrabot PRs the user merges.\n\n| Task group | Repo | Message |\n|---|---|---|\n| 2,3,7,8,9,10,11 | release-watcher | `feat: project-agnostic release-watcher CLI core` |\n| 4,16 | image-context | `feat: opencode image build context` |\n| 5,6,12,13,14,15,17,18 | cloudhome (ultrabot PRs) | `feat(ci): jenkins release-watcher pipeline + buildkit amd64` |\n\n---\n\n## Success Criteria\n\n### Verification Commands\n```bash\n# Webhook → job\ncurl -X POST https://jenkins-hook.rustybret.com -H \"X-Hub-Signature-256: sha256=<sig>\" -d @test-release.json  # → job queued\n# Binaries\nfor a in linux-amd64 linux-arm64 darwin-arm64; do file opencode-*-$a; done  # → correct arch\n# Image in OCIR\ncrane digest <ocir-host>/<ns>/opencode:<tag>  # → digest present\n# Run-state\nmysql -h <heatwave-host> -e \"SELECT * FROM runs WHERE ...;\"  # → row exists\n```\n\n### Final Checklist\n- [ ] All \"Must Have\" present\n- [ ] All \"Must NOT Have\" absent\n- [ ] e2e webhook→binaries→image proven\n- [ ] Local Mac ORW untouched\n"
}
```

**Output:**
```
Created new file.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 59.7s)

_Thinking:_

 Now I'm inserting the tasks in batches before the Final Verification Wave section, replacing the placeholder with groups of 2-4 tasks at a time, starting with P1 and the first task.

Skeleton written. Now appending tasks in batches before the Final Verification Wave. Batch 1 (P1 + Tasks 1–2):

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] P1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret\n\n  **What to do**:\n  - Mint a GitHub fine-grained PAT for the new `rustybret/release-watcher` + image-context repos (Contents/Workflows RW as needed) via web UI + MFA.\n  - Create a least-privilege OCI user/group/policy scoped to: MySQL HeatWave provisioning, the `opencode` OCIR repo, and rotation of existing Vault secrets. Generate an API signing key.\n  - Create a scoped Cloudflare API token (only the zones/workers needed).\n  - Seed a SINGLE one-time K8s Secret (e.g. `ultrabot-cloud-creds` in the `ultrabot` ns) containing `~/.oci/config` + OCI API signing key + `CLOUDFLARE_API_TOKEN`, to be mounted into the cluster-admin Job template (Task 6/12 depend on this).\n  - Document each secret name + location in `.omo/evidence/task-P1-creds-inventory.md` (names only, never values).\n\n  **Must NOT do**:\n  - Do NOT store secret values in any repo, plan, or evidence file.\n  - Do NOT grant blanket OCI account/tenancy-admin to the scoped user.\n\n  **Recommended Agent Profile**:\n  - **Category**: `quick` — human performs the credential minting; the agent only documents steps and verifies the resulting K8s Secret/OCI user exist.\n    - Reason: credential creation is a permanently-human gate; agent work is verification + documentation only.\n  - **Skills**: none — pure ops/verification, no code domain.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: NO (Wave 0 — gates delegated infra tasks)\n  - **Blocks**: Task 5, Task 6\n  - **Blocked By**: None\n\n  **References**:\n  - `cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` — human-only gates list + how OCI Vault/ESO secrets are stored; follow its credential conventions\n  - `cloudhome/k8s/base/ultrabot/` — where the cluster-admin Job template mounts secrets (the new Secret must match this mount pattern)\n  - Draft `.omo/drafts/release-watcher-cloudhome.md` \"Permanently human-only gates\" section — authoritative list\n\n  **Acceptance Criteria**:\n  - [ ] `kubectl -n ultrabot get secret ultrabot-cloud-creds` → exists with keys for oci config, api key, cloudflare token\n  - [ ] `oci iam user list` (or console screenshot) confirms the scoped user exists with the limited policy\n  - [ ] `.omo/evidence/task-P1-creds-inventory.md` lists all secret names + locations (no values)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Scoped cred Secret is present and mountable\n    Tool: Bash (kubectl)\n    Preconditions: human has minted creds + created the Secret\n    Steps:\n      1. kubectl -n ultrabot get secret ultrabot-cloud-creds -o jsonpath='{.data}' | jq 'keys'\n      2. Assert keys include oci config + api key + cloudflare token entries\n    Expected Result: all 3 cred keys present\n    Evidence: .omo/evidence/task-P1-secret-keys.txt\n\n  Scenario: OCI user is least-privilege (negative)\n    Tool: Bash (oci-cli)\n    Preconditions: scoped OCI user created\n    Steps:\n      1. Attempt an out-of-scope action (e.g. list compute instances) with the scoped creds\n      2. Assert it is DENIED while MySQL/OCIR/Vault-rotate actions succeed\n    Expected Result: out-of-scope denied; in-scope allowed\n    Evidence: .omo/evidence/task-P1-scope-test.txt\n  ```\n\n  **Commit**: NO (human-gated ops; no repo change)\n\n- [ ] 1. Cross-Compile Spike — darwin-arm64 OpenCode binary from Linux\n\n  **What to do**:\n  - On a Linux build-tools environment (or the new agent pod from Task 5 if ready, else a local Linux container), check out `rustybret/opencode` `fork/local`.\n  - Run `bun install` then attempt `bun build --compile --target=bun-darwin-arm64 ...` against the opencode CLI entrypoint (mirror `packages/opencode/script/build.ts --single` target wiring).\n  - Verify the output binary is a Mach-O arm64 executable (`file`), and capture whether any native deps / postinstall steps break cross-compile.\n  - Record findings: does darwin-arm64 cross-compile from Linux produce a runnable binary, or is a native Mac agent required? This DE-RISKS the whole binary deliverable.\n\n  **Must NOT do**:\n  - Do NOT build the full pipeline around darwin until this spike confirms feasibility.\n  - Do NOT modify opencode source to force it — report blockers instead.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — non-obvious toolchain investigation with a clear go/no-go deliverable.\n    - Reason: cross-compile feasibility is the single biggest technical assumption; needs careful, autonomous investigation.\n  - **Skills**: none — Bun/toolchain work, no matching skill domain.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Task 10\n  - **Blocked By**: None (can use a throwaway Linux container if Task 5 pod not ready)\n\n  **References**:\n  - `rustybret/opencode:packages/opencode/script/build.ts` — the existing `--single` build target; mirror its compile flags/entrypoint\n  - opencode `package.json` build scripts — how the binary is currently compiled\n  - Bun docs: `bun build --compile --target` — cross-target matrix (bun-darwin-arm64 from linux)\n  - Memory: opencode build = `bun build --compile`; darwin cross-compile is plausible but unproven with native deps\n\n  **Acceptance Criteria**:\n  - [ ] `file ./opencode-darwin-arm64` → `Mach-O 64-bit executable arm64` (if feasible)\n  - [ ] Findings doc states GO (cross-compile works) or NO-GO (native Mac agent required) with evidence\n  - [ ] If NO-GO: a documented fallback (defer darwin to a later phase; V1 ships linux amd64+arm64) is recorded\n\n  **QA Scenarios**:\n  ```\n  Scenario: darwin-arm64 binary cross-compiles and is correct arch (happy)\n    Tool: Bash\n    Preconditions: Linux env with Bun + opencode fork/local checked out\n    Steps:\n      1. bun install && bun build --compile --target=bun-darwin-arm64 <entry> --outfile opencode-darwin-arm64\n      2. file opencode-darwin-arm64\n      3. Assert output contains \"Mach-O\" and \"arm64\"\n    Expected Result: Mach-O arm64 binary produced\n    Evidence: .omo/evidence/task-1-darwin-file.txt\n\n  Scenario: native-dependency break is detected (negative/edge)\n    Tool: Bash\n    Preconditions: same\n    Steps:\n      1. Inspect build output/logs for native module or postinstall errors\n      2. If present, record the exact failing module + a GO/NO-GO verdict\n    Expected Result: clear verdict with cause, not a silent partial build\n    Evidence: .omo/evidence/task-1-verdict.md\n  ```\n\n  **Commit**: NO (spike; findings recorded to evidence, not committed)\n\n- [ ] 2. Scaffold `rustybret/release-watcher` (fork orw → config-driven core)\n\n  **What to do**:\n  - Create the new standalone repo `rustybret/release-watcher` by forking/vendoring `@cortexkit/orw` source as the starting point.\n  - Establish the CLI core skeleton: project-agnostic command surface (`check`, `build`, `status`) that reads a per-project config (schema defined in Task 3) instead of hardcoded OpenCode constants.\n  - Set up `bun test` harness, typecheck, and a minimal CI-less package layout. Replace hardcoded OpenCode artifact/install paths with config-driven seams (stubs OK; logic lands in Wave 2).\n  - Keep v1 boring: preserve orw's working behavior shape, just generalized.\n\n  **Must NOT do**:\n  - Do NOT implement the local-Mac install path (V1 cloud pipeline must not write `~/.opencode/bin`).\n  - Do NOT add semantic-adaptation features.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — substantial scaffolding across a new repo.\n    - Reason: repo creation + generalizing an existing CLI is high-effort but not deep-reasoning.\n  - **Skills**: none — TS/Bun CLI scaffolding; no matching skill.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Tasks 7, 8, 9, 10, 11\n  - **Blocked By**: None\n\n  **References**:\n  - `@cortexkit/orw` package source (`~/opencode-release-watch/` config + memory notes) — the bin-only structure; only extension seam is config/prompt, build/install paths are hardcoded → these become config fields\n  - Memory: orw `verifyBuild()` requires `work_repo/packages/opencode/dist/opencode-<os>-<arch>/bin/opencode` with `--version` matching the tag — generalize this contract\n  - `rustybret/opencode:AGENTS.md` — fork conventions (style guide) to mirror in the new repo\n\n  **Acceptance Criteria**:\n  - [ ] `gh repo view rustybret/release-watcher` → exists\n  - [ ] `bun test` runs (even if 0 tests) and `bun run typecheck` passes on the skeleton\n  - [ ] CLI entrypoint `release-watcher --help` lists `check`/`build`/`status` and accepts a `--config` path\n\n  **QA Scenarios**:\n  ```\n  Scenario: CLI skeleton runs and reads a config path (happy)\n    Tool: Bash\n    Preconditions: repo cloned, bun install done\n    Steps:\n      1. bun run ./src/index.ts --help\n      2. Assert output lists check/build/status + --config\n      3. bun run ./src/index.ts check --config ./examples/opencode.config.json (stub OK)\n    Expected Result: help prints; check accepts config without crashing\n    Evidence: .omo/evidence/task-2-cli-help.txt\n\n  Scenario: typecheck clean on skeleton (happy)\n    Tool: Bash\n    Steps:\n      1. bun run typecheck\n    Expected Result: exit 0\n    Evidence: .omo/evidence/task-2-typecheck.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: scaffold project-agnostic release-watcher CLI core`\n  - Files: new repo skeleton\n  - Pre-commit: `bun run typecheck`\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+170/-0).
<plan-format-warning>
Plan has **7 task checkbox(es)** but `getPlanProgress()` only parsed **6**. 
**1 task(s)** have malformed labels and will be SKIPPED by the progress counter.
`/start-work` will show "Progress: 6 tasks" — missing 1 task(s).

**Fix**: Ensure every skipped task checkbox uses bare-number format:
  `## TODOs` → `1.`, `2.`, `3.` (NOT `T1.`, `Phase 1:`, `Task-1.`)
  `## Final Verification Wave` → `F1.`, `F2.`, `F3.` (NOT `T-F1.`, `F-1.`, `Final-1.`)
</plan-format-warning>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 87.7s)

_Thinking:_

 I see the issue—the progress counter expects bare numbers like `1.` or `2.`, but the P1 label doesn't fit that pattern, so it's being skipped. Since P1 is referenced throughout the plan in dependencies and wave assignments, I need to either integrate it into the numbered sequence or find another way to handle it without breaking those references.

The safest approach is to renumber everything: convert P1 to task 1, shift the existing tasks 1-18 up to 2-19, and update all the skeleton references (waves, dependency matrix, dispatch summary, commit strategy). It's a big edit, but since I've only written P1, Task 1, and Task 2 so far, the cost is manageable—just those three task bodies plus all the structural references. Let me systematically update the skeleton sections and the written tasks to use the new numbering scheme.

Mapping out the new dependency matrix with the renumbered tasks...

Human prereq (Task 1) blocks agent pod and MySQL provisioning (6, 7). The cross-compile spike (2) feeds into multi-arch build (11). Release-watcher scaffold (3) gates five downstream tasks. Config schema (4) depends on 3 and blocks config loader and Jenkinsfile. Image scaffold (5) leads to the Dockerfile work (17). Agent pod (6) depends on human prereq and blocks the Jenkins integration step (14). MySQL (7) depends on human prereq and blocks the DB writer (12). The critical path runs 1 → 2 → 11 → 13 → 15 → e2e → 19, with Wave 0 being the human gate, Waves 1–3 spreading the parallel work across scaffolding, core logic, and integration tasks. I'm planning a multi-step edit strategy to replace the Execution Strategy section systematically—I'll handle the waves block, dependency matrix, and dispatch summary as separate targeted edits rather than one large replacement, then move on to fixing the commit strategy and task bodies.

The progress counter rejected the `P1.` label — it only parses bare numbers. I'll renumber so the human-prerequisite becomes Task 1 and the rest shift to 2–19. Since only three task bodies exist so far, I'll fix the skeleton reference tables and those three bodies, then continue appending. Starting with the Execution Strategy waves block:

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "```\nWave 0 (Human-only prerequisites — must clear before delegated infra tasks):\n└── P1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human]\n\nWave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):\n├── Task 1: Cross-compile spike — darwin-arm64 from Linux [deep]\n├── Task 2: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]\n├── Task 3: Per-project config schema (release-watcher.config) [unspecified-high]\n├── Task 4: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]\n├── Task 5: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]\n└── Task 6: Provision OCI MySQL HeatWape + run-state schema (ultrabot/tofu) [unspecified-high]\n\nWave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):\n├── Task 7: CLI config loader + validation (+ unit tests) [unspecified-high]\n├── Task 8: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]\n├── Task 9: CLI AI-merge orchestration (headless opencode session) [deep]\n├── Task 10: CLI multi-arch build orchestration (3 binaries, naming) [deep]\n├── Task 11: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]\n├── Task 12: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]\n└── Task 13: Wire build-tools agent pod template into Jenkins [unspecified-high]\n\nWave 3 (Trigger wiring + Milestone B image — depends on Wave 2):\n├── Task 14: Wire jenkins-hook webhook → job; idempotency; release+push [deep]\n├── Task 15: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]\n├── Task 16: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]\n├── Task 17: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]\n└── Task 18: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]\n\nWave FINAL (after ALL tasks — 4 parallel reviews, then user okay):\n├── F1: Plan compliance audit (oracle)\n├── F2: Code/config quality review (unspecified-high)\n├── F3: Real e2e pipeline QA (unspecified-high)\n└── F4: Scope fidelity check (deep)\n→ Present results → Get explicit user okay\n\nCritical Path: P1 → Task 1 → Task 10 → Task 12 → Task 14 → e2e → Task 18\nMax Concurrent: 6 (Waves 1 & 2)\n```",
  "newString": "```\nWave 0 (Human-only prerequisites — must clear before delegated infra tasks):\n└── Task 1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human/quick]\n\nWave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):\n├── Task 2: Cross-compile spike — darwin-arm64 from Linux [deep]\n├── Task 3: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]\n├── Task 4: Per-project config schema (release-watcher.config) [unspecified-high]\n├── Task 5: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]\n├── Task 6: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]\n└── Task 7: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]\n\nWave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):\n├── Task 8: CLI config loader + validation (+ unit tests) [unspecified-high]\n├── Task 9: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]\n├── Task 10: CLI AI-merge orchestration (headless opencode session) [deep]\n├── Task 11: CLI multi-arch build orchestration (3 binaries, naming) [deep]\n├── Task 12: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]\n├── Task 13: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]\n└── Task 14: Wire build-tools agent pod template into Jenkins [unspecified-high]\n\nWave 3 (Trigger wiring + Milestone B image — depends on Wave 2):\n├── Task 15: Wire jenkins-hook webhook → job; idempotency; release+push [deep]\n├── Task 16: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]\n├── Task 17: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]\n├── Task 18: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]\n└── Task 19: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]\n\nWave FINAL (after ALL tasks — 4 parallel reviews, then user okay):\n├── F1: Plan compliance audit (oracle)\n├── F2: Code/config quality review (unspecified-high)\n├── F3: Real e2e pipeline QA (unspecified-high)\n└── F4: Scope fidelity check (deep)\n→ Present results → Get explicit user okay\n\nCritical Path: Task 1 → Task 2 → Task 11 → Task 13 → Task 15 → e2e → Task 19\nMax Concurrent: 6 (Waves 1 & 2)\n```"
}
```

**Output:**
```
Edited (+0/-0).
<plan-format-warning>
Plan has **7 task checkbox(es)** but `getPlanProgress()` only parsed **6**. 
**1 task(s)** have malformed labels and will be SKIPPED by the progress counter.
`/start-work` will show "Progress: 6 tasks" — missing 1 task(s).

**Fix**: Ensure every skipped task checkbox uses bare-number format:
  `## TODOs` → `1.`, `2.`, `3.` (NOT `T1.`, `Phase 1:`, `Task-1.`)
  `## Final Verification Wave` → `F1.`, `F2.`, `F3.` (NOT `T-F1.`, `F-1.`, `Final-1.`)
</plan-format-warning>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 13.8s)

_Thinking:_

 I need to update the dependency matrix and agent dispatch summary tables to use the renumbered format, then fix the three task bodies that still reference the old `P1.` naming convention.

Now fixing the Dependency Matrix and Agent Dispatch tables to match the renumbering:

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "| Task | Depends On | Blocks |\n|---|---|---|\n| P1 | — | 5, 6 |\n| 1 | — | 10 |\n| 2 | — | 7, 8, 9, 10, 11 |\n| 3 | 2 | 7, 12 |\n| 4 | — | 16 |\n| 5 | P1 | 13 |\n| 6 | P1 | 11 |\n| 7 | 2, 3 | 12 |\n| 8 | 2 | 9 |\n| 9 | 8 | 10 |\n| 10 | 1, 2, 9 | 12, 14 |\n| 11 | 2, 6 | 12 |\n| 12 | 3, 7, 10, 11 | 13, 14 |\n| 13 | 5, 12 | 14 |\n| 14 | 10, 12, 13 | 15, 18, e2e |\n| 15 | 14 | F3 |\n| 16 | 4 | 17, 18 |\n| 17 | 16 | 18 |\n| 18 | 14, 16, 17 | F3 |",
  "newString": "| Task | Depends On | Blocks |\n|---|---|---|\n| 1 | — | 6, 7 |\n| 2 | — | 11 |\n| 3 | — | 8, 9, 10, 11, 12 |\n| 4 | 3 | 8, 13 |\n| 5 | — | 17 |\n| 6 | 1 | 14 |\n| 7 | 1 | 12 |\n| 8 | 3, 4 | 13 |\n| 9 | 3 | 10 |\n| 10 | 9 | 11 |\n| 11 | 2, 3, 10 | 13, 15 |\n| 12 | 3, 7 | 13 |\n| 13 | 4, 8, 11, 12 | 14, 15 |\n| 14 | 6, 13 | 15 |\n| 15 | 11, 13, 14 | 16, 19, e2e |\n| 16 | 15 | F3 |\n| 17 | 5 | 18, 19 |\n| 18 | 17 | 19 |\n| 19 | 15, 17, 18 | F3 |"
}
```

**Output:**
```
Edited (+19/-19).
<plan-format-warning>
Plan has **7 task checkbox(es)** but `getPlanProgress()` only parsed **6**. 
**1 task(s)** have malformed labels and will be SKIPPED by the progress counter.
`/start-work` will show "Progress: 6 tasks" — missing 1 task(s).

**Fix**: Ensure every skipped task checkbox uses bare-number format:
  `## TODOs` → `1.`, `2.`, `3.` (NOT `T1.`, `Phase 1:`, `Task-1.`)
  `## Final Verification Wave` → `F1.`, `F2.`, `F3.` (NOT `T-F1.`, `F-1.`, `Final-1.`)
</plan-format-warning>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.6s)

_Thinking:_

 I need to fix the malformed `P1.` label in the Agent Dispatch Summary table and then update the three task bodies to reflect the correct numbering scheme.

Now the Agent Dispatch Summary table:

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "| Wave | Count | Dispatch |\n|---|---|---|\n| 0 | 1 | P1 → `quick` (human-gated; agent documents + verifies) |\n| 1 | 6 | T1 → `deep`, T2/T3/T5/T6 → `unspecified-high`, T4 → `unspecified-low` |\n| 2 | 7 | T8/T9/T10/T12 → `deep`, T7/T11/T13 → `unspecified-high` |\n| 3 | 5 | T14/T18 → `deep`, T15/T16/T17 → `unspecified-high` |\n| FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |",
  "newString": "| Wave | Count | Dispatch |\n|---|---|---|\n| 0 | 1 | Task 1 → `quick` (human-gated; agent documents + verifies) |\n| 1 | 6 | T2 → `deep`, T3/T4/T6/T7 → `unspecified-high`, T5 → `unspecified-low` |\n| 2 | 7 | T9/T10/T11/T13 → `deep`, T8/T12/T14 → `unspecified-high` |\n| 3 | 5 | T15/T19 → `deep`, T16/T17/T18 → `unspecified-high` |\n| FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |"
}
```

**Output:**
```
Edited (+4/-4).
<plan-format-warning>
Plan has **7 task checkbox(es)** but `getPlanProgress()` only parsed **6**. 
**1 task(s)** have malformed labels and will be SKIPPED by the progress counter.
`/start-work` will show "Progress: 6 tasks" — missing 1 task(s).

**Fix**: Ensure every skipped task checkbox uses bare-number format:
  `## TODOs` → `1.`, `2.`, `3.` (NOT `T1.`, `Phase 1:`, `Task-1.`)
  `## Final Verification Wave` → `F1.`, `F2.`, `F3.` (NOT `T-F1.`, `F-1.`, `Final-1.`)
</plan-format-warning>
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 7.8s)

_Thinking:_

 I see the issue—the task label `P1.` is malformed and causing the warning. I need to renumber the three existing task bodies from `P1.` → `1.`, `1.` → `2.`, and `2.` → `3.`, then update all the cross-references accordingly. Let me check the TODOs section to locate and fix those task headers.

I need to renumber the three written task bodies (`P1.`→`1.`, `1.`→`2.`, `2.`→`3.`) to clear the format warning. Let me read the current TODOs section.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 175,
  "endLine": 200
}
```

**Output:**
```
175: | 6 | 1 | 14 |
176: | 7 | 1 | 12 |
177: | 8 | 3, 4 | 13 |
178: | 9 | 3 | 10 |
179: | 10 | 9 | 11 |
180: | 11 | 2, 3, 10 | 13, 15 |
181: | 12 | 3, 7 | 13 |
182: | 13 | 4, 8, 11, 12 | 14, 15 |
183: | 14 | 6, 13 | 15 |
184: | 15 | 11, 13, 14 | 16, 19, e2e |
185: | 16 | 15 | F3 |
186: | 17 | 5 | 18, 19 |
187: | 18 | 17 | 19 |
188: | 19 | 15, 17, 18 | F3 |
189: 
190: ### Agent Dispatch Summary
191: 
192: | Wave | Count | Dispatch |
193: |---|---|---|
194: | 0 | 1 | Task 1 → `quick` (human-gated; agent documents + verifies) |
195: | 1 | 6 | T2 → `deep`, T3/T4/T6/T7 → `unspecified-high`, T5 → `unspecified-low` |
196: | 2 | 7 | T9/T10/T11/T13 → `deep`, T8/T12/T14 → `unspecified-high` |
197: | 3 | 5 | T15/T19 → `deep`, T16/T17/T18 → `unspecified-high` |
198: | FINAL | 4 | F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep` |
199: 
200: ---

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 5.3s)

_Thinking:_

 I need to fix the task numbering in the TODOs section—the items are currently labeled `P1.`, `1.`, `2.` but should be `1.`, `2.`, `3.` instead. Let me pull up that section to make the correction.

I need to renumber the three written task bodies. Let me read the TODOs section to get exact text.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 204,
  "endLine": 230
}
```

**Output:**
```
204: - [ ] P1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret
205: 
206:   **What to do**:
207:   - Mint a GitHub fine-grained PAT for the new `rustybret/release-watcher` + image-context repos (Contents/Workflows RW as needed) via web UI + MFA.
208:   - Create a least-privilege OCI user/group/policy scoped to: MySQL HeatWave provisioning, the `opencode` OCIR repo, and rotation of existing Vault secrets. Generate an API signing key.
209:   - Create a scoped Cloudflare API token (only the zones/workers needed).
210:   - Seed a SINGLE one-time K8s Secret (e.g. `ultrabot-cloud-creds` in the `ultrabot` ns) containing `~/.oci/config` + OCI API signing key + `CLOUDFLARE_API_TOKEN`, to be mounted into the cluster-admin Job template (Task 6/12 depend on this).
211:   - Document each secret name + location in `.omo/evidence/task-P1-creds-inventory.md` (names only, never values).
212: 
213:   **Must NOT do**:
214:   - Do NOT store secret values in any repo, plan, or evidence file.
215:   - Do NOT grant blanket OCI account/tenancy-admin to the scoped user.
216: 
217:   **Recommended Agent Profile**:
218:   - **Category**: `quick` — human performs the credential minting; the agent only documents steps and verifies the resulting K8s Secret/OCI user exist.
219:     - Reason: credential creation is a permanently-human gate; agent work is verification + documentation only.
220:   - **Skills**: none — pure ops/verification, no code domain.
221: 
222:   **Parallelization**:
223:   - **Can Run In Parallel**: NO (Wave 0 — gates delegated infra tasks)
224:   - **Blocks**: Task 5, Task 6
225:   - **Blocked By**: None
226: 
227:   **References**:
228:   - `cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` — human-only gates list + how OCI Vault/ESO secrets are stored; follow its credential conventions
229:   - `cloudhome/k8s/base/ultrabot/` — where the cluster-admin Job template mounts secrets (the new Secret must match this mount pattern)
230:   - Draft `.omo/drafts/release-watcher-cloudhome.md` "Permanently human-only gates" section — authoritative list

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 24.6s)

_Thinking:_

 Now I'm going through the task headers and their cross-references to renumber them consistently—changing the current `P1.`, `1.`, `2.` labels to `1.`, `2.`, `3.` and updating all the internal references throughout the document accordingly.

Now renumbering the three written task bodies (`P1`→`1`, `1`→`2`, `2`→`3`) and their internal cross-references to clear the format warning.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "edits": [
    {
      "oldString": "- [ ] P1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret",
      "newString": "- [ ] 1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret"
    },
    {
      "oldString": "  - Seed a SINGLE one-time K8s Secret (e.g. `ultrabot-cloud-creds` in the `ultrabot` ns) containing `~/.oci/config` + OCI API signing key + `CLOUDFLARE_API_TOKEN`, to be mounted into the cluster-admin Job template (Task 6/12 depend on this).\n  - Document each secret name + location in `.omo/evidence/task-P1-creds-inventory.md` (names only, never values).",
      "newString": "  - Seed a SINGLE one-time K8s Secret (e.g. `ultrabot-cloud-creds` in the `ultrabot` ns) containing `~/.oci/config` + OCI API signing key + `CLOUDFLARE_API_TOKEN`, to be mounted into the cluster-admin Job template (Tasks 6, 7, 13 depend on this).\n  - Document each secret name + location in `.omo/evidence/task-1-creds-inventory.md` (names only, never values)."
    },
    {
      "oldString": "  **Parallelization**:\n  - **Can Run In Parallel**: NO (Wave 0 — gates delegated infra tasks)\n  - **Blocks**: Task 5, Task 6\n  - **Blocked By**: None",
      "newString": "  **Parallelization**:\n  - **Can Run In Parallel**: NO (Wave 0 — gates delegated infra tasks)\n  - **Blocks**: Task 6, Task 7\n  - **Blocked By**: None"
    },
    {
      "oldString": "  - [ ] `.omo/evidence/task-P1-creds-inventory.md` lists all secret names + locations (no values)",
      "newString": "  - [ ] `.omo/evidence/task-1-creds-inventory.md` lists all secret names + locations (no values)"
    },
    {
      "oldString": "    Expected Result: all 3 cred keys present\n    Evidence: .omo/evidence/task-P1-secret-keys.txt",
      "newString": "    Expected Result: all 3 cred keys present\n    Evidence: .omo/evidence/task-1-secret-keys.txt"
    },
    {
      "oldString": "    Expected Result: out-of-scope denied; in-scope allowed\n    Evidence: .omo/evidence/task-P1-scope-test.txt",
      "newString": "    Expected Result: out-of-scope denied; in-scope allowed\n    Evidence: .omo/evidence/task-1-scope-test.txt"
    },
    {
      "oldString": "- [ ] 1. Cross-Compile Spike — darwin-arm64 OpenCode binary from Linux",
      "newString": "- [ ] 2. Cross-Compile Spike — darwin-arm64 OpenCode binary from Linux"
    },
    {
      "oldString": "  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Task 10\n  - **Blocked By**: None (can use a throwaway Linux container if Task 5 pod not ready)",
      "newString": "  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Task 11\n  - **Blocked By**: None (can use a throwaway Linux container if Task 6 pod not ready)"
    },
    {
      "oldString": "- [ ] 2. Scaffold `rustybret/release-watcher` (fork orw → config-driven core)",
      "newString": "- [ ] 3. Scaffold `rustybret/release-watcher` (fork orw → config-driven core)"
    },
    {
      "oldString": "  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Tasks 7, 8, 9, 10, 11\n  - **Blocked By**: None\n\n  **References**:\n  - `@cortexkit/orw` package source",
      "newString": "  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Tasks 8, 9, 10, 11, 12\n  - **Blocked By**: None\n\n  **References**:\n  - `@cortexkit/orw` package source"
    }
  ]
}
```

**Output:**
```
Edited (+12/-12, 10 edits).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 7.4s)

_Thinking:_

 I'm checking where I left off in the plan file, then I'll continue adding the remaining tasks before moving into the final verification phase.

I'll verify the format warning is cleared and check the current task numbering before continuing to append the remaining tasks.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 200,
  "endLine": 212
}
```

**Output:**
```
200: ---
201: 
202: ## TODOs
203: 
204: - [ ] 1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret
205: 
206:   **What to do**:
207:   - Mint a GitHub fine-grained PAT for the new `rustybret/release-watcher` + image-context repos (Contents/Workflows RW as needed) via web UI + MFA.
208:   - Create a least-privilege OCI user/group/policy scoped to: MySQL HeatWave provisioning, the `opencode` OCIR repo, and rotation of existing Vault secrets. Generate an API signing key.
209:   - Create a scoped Cloudflare API token (only the zones/workers needed).
210:   - Seed a SINGLE one-time K8s Secret (e.g. `ultrabot-cloud-creds` in the `ultrabot` ns) containing `~/.oci/config` + OCI API signing key + `CLOUDFLARE_API_TOKEN`, to be mounted into the cluster-admin Job template (Tasks 6, 7, 13 depend on this).
211:   - Document each secret name + location in `.omo/evidence/task-1-creds-inventory.md` (names only, never values).
212: 

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 47.5s)

_Thinking:_

 Continuing with the next batch of tasks before moving to the final verification phase.

Renumbering is clean (1, 2, 3 bare-numbered). Now continuing to append the remaining tasks in batches. Batch 2 (Tasks 4–6):

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] 4. Per-Project Config Schema (`release-watcher.config`)\n\n  **What to do**:\n  - Define the per-project config schema the CLI core reads: `project`, `mode` (literal-overlay | consumer-validation | semantic-adaptation — only literal-overlay implemented in V1), `upstream` (repo/ref), `fork` (repo/branch), `curated_prs[]`, `build` (commands + target matrix), `artifacts` (naming pattern, output dir), `validation` (commands), `publish` (image-context repo + OCIR target), `db` (connection ref), `safety` (path allowlists, diff budget).\n  - Provide an `examples/opencode.config.json` instance encoding the real OpenCode V1 values (fork/local, the 5 curated PRs, 3-arch matrix, OCIR target).\n  - Ship a JSON-schema (or zod) validator + types consumed by the loader in Task 8.\n\n  **Must NOT do**:\n  - Do NOT implement semantic-adaptation fields beyond a reserved stub.\n  - Do NOT embed secrets in config — only secret *references*.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — schema design touching the whole system contract.\n    - Reason: the config is the project-agnostic backbone; needs care but not deep reasoning.\n  - **Skills**: none — schema/TS work.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1, after Task 3 skeleton exists — can start against the skeleton branch)\n  - **Blocks**: Tasks 8, 13\n  - **Blocked By**: Task 3\n\n  **References**:\n  - Draft `.omo/drafts/release-watcher-cloudhome.md` \"Minimum abstraction should be project config with mode, source, workspace, integration spec, build commands, validation commands, publish targets, notify targets, safety policy\" — the field list\n  - `~/opencode-release-watch/orw.config.json` — orw's existing config shape (branches[], opencode_bin, model) to generalize\n  - The 3 integration modes from the earlier synthesis (literal-overlay / consumer-validation / semantic-adaptation)\n\n  **Acceptance Criteria**:\n  - [ ] `examples/opencode.config.json` validates against the schema\n  - [ ] An intentionally-broken config fails validation with a clear error\n  - [ ] `bun test` covers valid + invalid config cases\n\n  **QA Scenarios**:\n  ```\n  Scenario: Valid opencode config passes validation (happy)\n    Tool: Bash (bun test / bun run)\n    Steps:\n      1. bun run ./src/index.ts validate-config --config ./examples/opencode.config.json\n      2. Assert exit 0 + \"valid\" message\n    Expected Result: validates clean\n    Evidence: .omo/evidence/task-4-valid-config.txt\n\n  Scenario: Malformed config rejected (negative)\n    Tool: Bash\n    Steps:\n      1. Remove a required field (e.g. fork.branch) from a copy\n      2. bun run ./src/index.ts validate-config --config ./broken.json\n      3. Assert non-zero exit + names the missing field\n    Expected Result: clear validation error, no crash\n    Evidence: .omo/evidence/task-4-invalid-config.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: per-project release-watcher config schema + opencode example`\n  - Files: `src/config/*`, `examples/opencode.config.json`\n  - Pre-commit: `bun test`\n\n- [ ] 5. Scaffold Image-Build-Context Repo (Dockerfile shell)\n\n  **What to do**:\n  - Create the new dedicated image-build-context repo (e.g. `rustybret/opencode-image`).\n  - Add a Dockerfile shell that takes build-args `OPENCODE_REPO`, `OPENCODE_REF`, `OHMYOPENCODE_REPO`, `OHMYOPENCODE_REF` (mirroring the proven pattern), with a multi-stage layout: Stage 1 compile binary, Stage 2 omo plugin, Stage 3 ubuntu:24.04 runtime. Leave the actual compile wiring as a TODO for Task 17.\n  - Add a README documenting that this REPLACES the stale `cloudhome/docker/opencode` path and is decoupled from the fork source tree.\n\n  **Must NOT do**:\n  - Do NOT add deploy/runtime/k8s manifests (image build only, no deploy).\n  - Do NOT copy the stale cloudhome Dockerfile verbatim without reviewing it.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-low` — small scaffolding task.\n    - Reason: repo + Dockerfile shell, low complexity.\n  - **Skills**: none — Docker scaffolding.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1)\n  - **Blocks**: Task 17\n  - **Blocked By**: None\n\n  **References**:\n  - `cloudhome/docker/opencode/Dockerfile` — the stale-but-instructive multi-stage pattern + build-args (`OPENCODE_REPO/REF`, `OHMYOPENCODE_REPO/REF`); adapt, don't anchor\n  - `cloudhome/scripts/build-opencode-multiarch.sh` — existing buildx multi-arch invocation + arg names to stay compatible with\n  - Draft \"opencode image source = NEW DEDICATED image-build-context repo\" decision\n\n  **Acceptance Criteria**:\n  - [ ] `gh repo view rustybret/opencode-image` → exists\n  - [ ] `docker build --check` (or `hadolint`) on the Dockerfile shell passes syntax\n  - [ ] README states the replace-stale-path intent\n\n  **QA Scenarios**:\n  ```\n  Scenario: Dockerfile shell is syntactically valid (happy)\n    Tool: Bash (hadolint or docker build --check)\n    Steps:\n      1. hadolint Dockerfile || docker build --check .\n      2. Assert no syntax errors\n    Expected Result: lint/check passes\n    Evidence: .omo/evidence/task-5-dockerfile-lint.txt\n\n  Scenario: No deploy manifests present (negative/scope-guard)\n    Tool: Bash\n    Steps:\n      1. find . -name '*.yaml' -path '*deploy*' -o -name 'deployment.yaml'\n      2. Assert empty\n    Expected Result: no deploy config in the repo\n    Evidence: .omo/evidence/task-5-no-deploy.txt\n  ```\n\n  **Commit**: YES (opencode-image)\n  - Message: `feat: scaffold opencode image build context`\n  - Files: `Dockerfile`, `README.md`\n  - Pre-commit: `hadolint Dockerfile`\n\n- [ ] 6. Build-Tools Jenkins Agent Pod Image (bun/node/git/buildx/crane)\n\n  **What to do**:\n  - Author a build-tools container image for Jenkins agents containing: bun, node, git, gh, buildx, crane, oci-cli, jq — everything the pipeline needs (default `inbound-agent` has none).\n  - This is dispatched to ultrabot cluster-admin as a PR against `rustybret/cloudhome` (new `docker/jenkins-build-tools/` + image build recipe). The image must be buildable and pushable to OCIR (uses the injected creds from Task 1).\n  - Produce the K8s pod-template YAML (for JCasC in Task 13) that references this image with the Jenkins inbound-agent entrypoint.\n\n  **Must NOT do**:\n  - Do NOT bake any secrets into the image.\n  - Do NOT direct-apply to the cluster — must land as an ultrabot PR.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — image authoring + ultrabot dispatch + verification.\n    - Reason: multi-tool image + PR workflow, moderate effort.\n  - **Skills**: none — Docker/k8s ops.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1, after Task 1 creds seeded)\n  - **Blocks**: Task 14\n  - **Blocked By**: Task 1\n\n  **References**:\n  - `cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` — JCasC + how agent pod templates are declared; mirror its structure\n  - `cloudhome/ops/ultrabot.just` — `dispatch` recipe signature for sending this as a cluster-admin task\n  - `cloudhome/docker/build-dispatcher/` — an example of an existing cloudhome service image for layout conventions\n  - Inbound-agent docs — the entrypoint/args a Jenkins agent image must preserve\n\n  **Acceptance Criteria**:\n  - [ ] An ultrabot PR exists adding `docker/jenkins-build-tools/` + pod-template YAML\n  - [ ] After merge, the image builds and is present in OCIR (`crane digest`)\n  - [ ] The image contains all required tools (`bun --version`, `crane version`, `buildx version`, `oci --version`)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Build-tools image has all tools (happy)\n    Tool: Bash (docker run / kubectl run the image)\n    Preconditions: image built + pushed to OCIR\n    Steps:\n      1. docker run --rm <ocir>/jenkins-build-tools:latest sh -c 'bun --version && node --version && git --version && crane version && docker buildx version && oci --version && jq --version'\n      2. Assert all print versions, exit 0\n    Expected Result: every tool present\n    Evidence: .omo/evidence/task-6-tools.txt\n\n  Scenario: No secrets baked into image (negative)\n    Tool: Bash\n    Steps:\n      1. docker history --no-trunc <image> | grep -iE 'token|secret|key' || echo CLEAN\n      2. Assert CLEAN\n    Expected Result: no embedded secrets\n    Evidence: .omo/evidence/task-6-no-secrets.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR)\n  - Message: `feat(ci): jenkins build-tools agent image`\n  - Files: `docker/jenkins-build-tools/*`, pod-template YAML\n  - Pre-commit: image build + tool check\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+168/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 48.9s)

_Thinking:_

 I'm checking where I left off in the plan file—I've completed tasks 1 through 6 and need to continue with the remaining tasks 7 through 19, followed by running the Oracle phase-2, doing a self-review, and presenting the summary. Let me move forward with the next batch of tasks.

Continuing plan generation. Batch 3 (Tasks 7–9):

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] 7. Provision OCI MySQL HeatWave + Run-State Schema (ultrabot/tofu)\n\n  **What to do**:\n  - Dispatch to ultrabot cluster-admin (using the injected creds from Task 1) a task to author a new tofu module provisioning a free-tier OCI MySQL HeatWave DB, landing as a PR against `rustybret/cloudhome`.\n  - Define the run-state schema: `runs` table keyed by idempotency key `{project, trigger_type, upstream_version_or_commit, fork_commit}`, with lifecycle status column (discovered → claimed → source_prepared → merge_running → merge_succeeded/failed → build_running → build_succeeded/failed → artifacts_published → container_candidate_built → promoted/rejected), arch-build results, artifact manifest, timestamps.\n  - Store the DB connection string as a Vault secret reference (rotate-existing or new name via human gate if needed); expose it to Jenkins via ESO.\n\n  **Must NOT do**:\n  - Do NOT use the existing Oracle ATP (wrong protocol) or atlas MariaDB.\n  - Do NOT hardcode the DB password anywhere; use Vault/ESO.\n  - Do NOT direct-apply tofu — land as ultrabot PR, human-merged.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — tofu + schema design via ultrabot dispatch.\n    - Reason: provisioning + schema, moderate effort, PR-gated.\n  - **Skills**: none — infra/SQL.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 1, after Task 1)\n  - **Blocks**: Task 12\n  - **Blocked By**: Task 1\n\n  **References**:\n  - `cloudhome/tofu/` — existing tofu module conventions (provider config, naming, state backend) to mirror for the new MySQL module\n  - Draft \"Run-state DB = NEW OCI MySQL HeatWave free-tier\" + the lifecycle states list under \"Run-state specialist recommendation\"\n  - `cloudhome/coordination_notes/secrets-and-permissions-cheatsheet.md` — how DB creds → Vault → ESO flow works\n  - `cloudhome/ops/ultrabot.just` — dispatch signature\n\n  **Acceptance Criteria**:\n  - [ ] An ultrabot PR exists adding the OCI MySQL HeatWave tofu module\n  - [ ] After merge + apply, `mysql -h <host> -e \"SHOW TABLES;\"` shows the `runs` table\n  - [ ] The DB connection secret is in Vault + synced via ESO (`kubectl get secret` in the jenkins ns)\n\n  **QA Scenarios**:\n  ```\n  Scenario: runs table exists with idempotency key (happy)\n    Tool: Bash (mysql client)\n    Preconditions: DB provisioned, creds in ESO\n    Steps:\n      1. mysql -h <host> -u <user> -p<ref> -e \"DESCRIBE runs;\"\n      2. Assert columns include project, trigger_type, upstream_version, fork_commit, status\n    Expected Result: schema present with composite key columns\n    Evidence: .omo/evidence/task-7-schema.txt\n\n  Scenario: DB password not in repo (negative)\n    Tool: Bash\n    Steps:\n      1. git -C cloudhome grep -iE 'mysql.*password|DB_PASS' -- tofu/ || echo CLEAN\n      2. Assert CLEAN (only Vault refs)\n    Expected Result: no plaintext creds\n    Evidence: .omo/evidence/task-7-no-creds.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR)\n  - Message: `feat(ci): provision OCI MySQL HeatWave run-state db`\n  - Files: `tofu/modules/mysql_release_watcher/*`, schema migration\n  - Pre-commit: `tofu validate`\n\n- [ ] 8. CLI Config Loader + Validation (+ unit tests)\n\n  **What to do**:\n  - Implement the config loader in the release-watcher CLI: read `--config`, parse, validate against the Task 4 schema, produce a typed config object the rest of the CLI consumes.\n  - Surface clear errors for missing/invalid fields; resolve secret *references* (not values) into a lookup the runtime uses.\n  - Add `bun test` coverage: valid load, each invalid case, secret-ref resolution.\n\n  **Must NOT do**:\n  - Do NOT read secret values at load time — only references.\n  - Do NOT couple the loader to OpenCode specifics (must stay generic).\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — core CLI logic with tests.\n    - Reason: foundational, well-scoped, testable.\n  - **Skills**: none — TS/Bun.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Task 13\n  - **Blocked By**: Tasks 3, 4\n\n  **References**:\n  - Task 4 schema + `examples/opencode.config.json` — the contract to load\n  - `@cortexkit/orw` config-reading code — the existing pattern to generalize\n  - release-watcher repo style guide (mirrors opencode AGENTS.md — type inference, no `any`, early returns)\n\n  **Acceptance Criteria**:\n  - [ ] `bun test src/config` → all pass (valid + invalid + secret-ref cases)\n  - [ ] Loading `examples/opencode.config.json` yields a typed object with the 5 curated PRs + 3-arch matrix\n  - [ ] `bun run typecheck` passes\n\n  **QA Scenarios**:\n  ```\n  Scenario: Loads opencode config into typed object (happy)\n    Tool: Bash (bun test)\n    Steps:\n      1. bun test src/config/loader.test.ts\n      2. Assert curated_prs.length === 5 and build matrix has 3 targets\n    Expected Result: tests pass with correct parsed values\n    Evidence: .omo/evidence/task-8-loader-test.txt\n\n  Scenario: Invalid config surfaces field-level error (negative)\n    Tool: Bash (bun test)\n    Steps:\n      1. Run the invalid-config test case\n      2. Assert error names the offending field, no throw/crash\n    Expected Result: graceful typed error\n    Evidence: .omo/evidence/task-8-invalid.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: config loader + validation`\n  - Files: `src/config/loader.ts`, tests\n  - Pre-commit: `bun test && bun run typecheck`\n\n- [ ] 9. CLI Merge-Plan / Curated-PR Resolver + Provenance/Diff/Conflict (+ unit tests)\n\n  **What to do**:\n  - Implement the merge-plan resolver: given config (fork ref + curated_prs[] + upstream release tag), compute the ordered integration plan (fork/local base → each curated PR), and emit a **provenance record** (which PRs, their SHAs, base) for evidence.\n  - Implement pure-logic pieces unit-testably: ordering, dedupe, idempotency-key computation, and a diff-summary/conflict-classification structure (the actual AI merge execution is Task 10; this task produces the *plan* and the evidence scaffolding).\n  - Output a machine-readable merge-plan JSON consumed by Task 10.\n\n  **Must NOT do**:\n  - Do NOT perform the AI merge here (that's Task 10).\n  - Do NOT allow a curated PR to enter silently — every PR must appear in the provenance record.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — careful logic with correctness/provenance stakes.\n    - Reason: idempotency + provenance correctness is a Metis-flagged risk; needs rigor.\n  - **Skills**: none — TS/Bun logic.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Task 10\n  - **Blocked By**: Task 3\n\n  **References**:\n  - Memory: the 5 curated PRs orw watches (#30182, #28582, #26036, #20084, #19961) + orw's `branches[]` accepting names/tree-URLs/pull-URLs — the input formats to resolve\n  - Draft Metis guardrail \"Curated-PR AI-merge must emit provenance (PR list) + deterministic diff summary + conflict log\"\n  - Draft idempotency key `{project, trigger_type, upstream_version_or_commit, fork_commit}`\n\n  **Acceptance Criteria**:\n  - [ ] `bun test src/merge` → ordering/dedupe/idempotency-key tests pass\n  - [ ] Resolver emits a provenance record listing all curated PRs with SHAs\n  - [ ] Idempotency key is stable for identical inputs, distinct for different fork_commit\n\n  **QA Scenarios**:\n  ```\n  Scenario: Merge plan includes all curated PRs with provenance (happy)\n    Tool: Bash (bun test)\n    Steps:\n      1. bun test src/merge/plan.test.ts\n      2. Assert plan.steps covers base + 5 PRs, provenance.length === 5 with SHAs\n    Expected Result: complete, ordered, attributed plan\n    Evidence: .omo/evidence/task-9-plan.txt\n\n  Scenario: Idempotency key stability (edge)\n    Tool: Bash (bun test)\n    Steps:\n      1. Compute key twice for same inputs → equal\n      2. Change fork_commit → key differs\n    Expected Result: deterministic + discriminating\n    Evidence: .omo/evidence/task-9-idempotency.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: merge-plan + curated-PR provenance resolver`\n  - Files: `src/merge/*`, tests\n  - Pre-commit: `bun test && bun run typecheck`\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+168/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 8.9s)

_Thinking:_

 Continuing with the next batch of tasks—I'll append tasks 10 through 12 to the plan, then move forward with the remaining tasks and wrap up with the Oracle phase-2 review and summary.

I'm mid-plan-generation. Let me reduce some processed context, then continue appending the remaining tasks (10–19).

**Tool: ctx_reduce**

**Input:**
```json
{
  "drop": "1746,1749,1758,1764,1769,1785,1788,1794"
}
```

**Output:**
```
Queued: drop §1746§, §1749§, §1758§, §1764§, §1769§, deferred drop §1785§, §1788§, §1794§.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 46.9s)

_Thinking:_

 Adding the next batch of tasks...

Continuing plan generation. Batch 4 (Tasks 10–12):

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] 10. CLI AI-Merge Orchestration (headless opencode session)\n\n  **What to do**:\n  - Implement the AI-merge executor: given the merge-plan JSON from Task 9, run a headless `opencode run` session (the merge driver) that applies fork/local + each curated PR onto the upstream release tag in an isolated workspace clone, resolving conflicts.\n  - Capture evidence: the conflict log, the resulting integration branch SHA, and a deterministic diff summary. Gate on `bun typecheck` (and project validation commands) — a failed typecheck/conflict must fail-CLOSED (mark merge_failed, do not proceed to build).\n  - Pin the merge-driver model/agent from config (default `anthropic/claude-opus-4-8`, a primary agent like `default` — `build` is a subagent type, not a primary agent).\n\n  **Must NOT do**:\n  - Do NOT use the locally-built opencode as the merge driver (self-hosting trap) — use a pinned external binary.\n  - Do NOT proceed to build on merge conflict/typecheck failure (fail-closed).\n  - Do NOT touch local Mac ORW state or `~/.opencode/bin`.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — orchestrating a headless AI merge with fail-closed gates.\n    - Reason: highest-risk correctness surface (silent code drop is the original sin we're preventing).\n  - **Skills**: none — orchestration/Bun.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Task 11\n  - **Blocked By**: Task 9\n\n  **References**:\n  - Memory: orw uses `opencode run` to AI-merge `fork/local` + PRs onto the release tag; `build` is a subagent type → use `agent: \"default\"`; model `anthropic/claude-opus-4-8`\n  - Memory: `@cortexkit/orw` is bin-only, extend via `prompt_path` — the merge prompt seam\n  - Draft Metis guardrails: provenance + diff summary + conflict log + typecheck gate; fail-closed on conflict\n  - `rustybret/opencode` AGENTS.md: `bun typecheck` from `packages/opencode`, never tsc\n\n  **Acceptance Criteria**:\n  - [ ] Given the opencode merge-plan, produces an integration branch with all 5 PRs applied (provenance matches)\n  - [ ] On an injected conflict, marks merge_failed and does NOT proceed to build\n  - [ ] Emits conflict log + diff summary to evidence; typecheck gate enforced\n\n  **QA Scenarios**:\n  ```\n  Scenario: Clean AI merge of fork/local + 5 PRs onto release (happy)\n    Tool: Bash (run the CLI merge command against a real release tag)\n    Preconditions: external opencode binary + auth available; isolated clone\n    Steps:\n      1. release-watcher merge --config examples/opencode.config.json --tag v1.15.13\n      2. git -C <workspace> log --oneline → assert base + 5 PR commits present\n      3. Assert provenance JSON matches the applied SHAs\n    Expected Result: integration branch built, typecheck passes, evidence emitted\n    Evidence: .omo/evidence/task-10-merge.txt\n\n  Scenario: Conflict fails closed (negative)\n    Tool: Bash\n    Steps:\n      1. Configure a PR known to conflict (or inject one)\n      2. Run merge → assert status=merge_failed, NO build artifacts produced, conflict log written\n    Expected Result: fail-closed, no downstream build\n    Evidence: .omo/evidence/task-10-conflict.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: headless AI-merge orchestration with fail-closed gates`\n  - Files: `src/merge/execute.ts`, merge prompt\n  - Pre-commit: `bun run typecheck`\n\n- [ ] 11. CLI Multi-Arch Build Orchestration (3 binaries, naming)\n\n  **What to do**:\n  - Implement the build orchestrator: from the integration branch, build the 3 standalone binaries — `linux-amd64` (native), `linux-arm64` (native on arm node or buildx), `darwin-arm64` (cross-compile per Task 2 verdict, or deferred-with-stub if Task 2 was NO-GO).\n  - Enforce naming `opencode-<version>-<os>-<arch>`; compute checksums; verify each binary runs `--version` matching the release tag (native where possible, documented fallback for cross-arch).\n  - Emit an artifact manifest (paths, arches, checksums, versions) for the DB writer (Task 12) and archival (Task 16).\n\n  **Must NOT do**:\n  - Do NOT install any binary to the Mac (`~/.opencode/bin`) — cloud V1 builds artifacts only.\n  - Do NOT mark a partial-arch build as success (fail per Metis rollback guardrail; record which arch failed).\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — multi-arch toolchain orchestration with verification.\n    - Reason: depends on the cross-compile spike; arch correctness + naming + checksums matter.\n  - **Skills**: none — Bun/toolchain.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Tasks 13, 15\n  - **Blocked By**: Tasks 2, 3, 10\n\n  **References**:\n  - Task 2 spike verdict — whether darwin cross-compiles or is deferred\n  - Memory: orw `verifyBuild()` expects `dist/opencode-<os>-<arch>/bin/opencode` with `--version` matching tag — reuse this verification contract\n  - `rustybret/opencode:packages/opencode/script/build.ts --single` — the compile invocation\n  - Draft artifact naming `opencode-<version>-<os>-<arch>`\n\n  **Acceptance Criteria**:\n  - [ ] Produces 3 (or 2+stub if Task 2 NO-GO) correctly-named binaries with checksums\n  - [ ] linux-amd64 + linux-arm64 each run `--version` == release tag\n  - [ ] Partial-arch failure marks the run failed (does not silently pass)\n\n  **QA Scenarios**:\n  ```\n  Scenario: 3 binaries built with correct arch + version (happy)\n    Tool: Bash\n    Steps:\n      1. release-watcher build --config ... --tag v1.15.13\n      2. for a in linux-amd64 linux-arm64 darwin-arm64; do file opencode-v1.15.13-$a; done\n      3. ./opencode-v1.15.13-linux-amd64 --version → assert == 1.15.13\n    Expected Result: correct arches + version match\n    Evidence: .omo/evidence/task-11-binaries.txt\n\n  Scenario: Partial-arch failure fails the run (negative)\n    Tool: Bash\n    Steps:\n      1. Force one arch build to fail (e.g. bad target)\n      2. Assert overall status=build_failed, manifest records the failed arch\n    Expected Result: no false success\n    Evidence: .omo/evidence/task-11-partial-fail.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: multi-arch build orchestration (linux amd64/arm64 + darwin arm64)`\n  - Files: `src/build/*`\n  - Pre-commit: `bun run typecheck`\n\n- [ ] 12. CLI Run-State DB Writer (fail-open to PVC JSON)\n\n  **What to do**:\n  - Implement the run-state writer: open a MySQL connection (from config secret-ref), upsert the run row keyed by the idempotency key, and transition lifecycle states as the pipeline progresses (discovered → … → artifacts_published).\n  - **Fail-open**: if the DB is unreachable, log a warning and write the run-state JSON alongside artifacts on the PVC; the build MUST still complete. DB is system-of-record, not a build blocker (V1).\n  - Provide an idempotency guard: a duplicate trigger for an existing key short-circuits (no double build/record).\n\n  **Must NOT do**:\n  - Do NOT block or fail the build on DB outage (fail-open).\n  - Do NOT store secrets in the row; only references/metadata.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — DB integration with fallback logic.\n    - Reason: well-scoped integration; fail-open is the main subtlety.\n  - **Skills**: none — TS/Bun + mysql driver.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Task 13\n  - **Blocked By**: Tasks 3, 7\n\n  **References**:\n  - Task 7 schema (`runs` table + lifecycle states + composite key)\n  - Draft \"DB-outage stance: writes FAIL-OPEN — warning + archive run-state JSON on PVC; build still completes\"\n  - Draft idempotency key definition\n\n  **Acceptance Criteria**:\n  - [ ] Writing a run upserts a row; state transitions persist\n  - [ ] With DB unreachable, a warning is logged AND run-state JSON is written to the PVC path; exit success\n  - [ ] Duplicate idempotency key short-circuits (no second row/build)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Run-state persists across lifecycle (happy)\n    Tool: Bash (mysql)\n    Steps:\n      1. Run a pipeline pass → SELECT status FROM runs WHERE key=...\n      2. Assert status advanced to artifacts_published\n    Expected Result: row reflects final state\n    Evidence: .omo/evidence/task-12-dbwrite.txt\n\n  Scenario: DB outage fails open (negative)\n    Tool: Bash\n    Steps:\n      1. Point config at an unreachable DB host\n      2. Run writer → assert warning logged, ./run-state/<key>.json exists on PVC, exit 0\n    Expected Result: build unaffected, JSON fallback present\n    Evidence: .omo/evidence/task-12-failopen.txt\n  ```\n\n  **Commit**: YES (release-watcher)\n  - Message: `feat: fail-open run-state db writer + idempotency guard`\n  - Files: `src/state/*`, tests\n  - Pre-commit: `bun test && bun run typecheck`\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+171/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 48.5s)

_Thinking:_

 Continuing with the next batch of tasks—I need to add tasks 13 through 15 to the plan, then move forward with verification and the Oracle phase-2 review before presenting the final summary.

Continuing plan generation. Batch 5 (Tasks 13–15):

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] 13. Jenkinsfile (parameterized) + JCasC Job + Agent RBAC\n\n  **What to do**:\n  - Author a single parameterized `Jenkinsfile` (in the release-watcher repo or image-context repo) that drives the pipeline via the CLI: checkout → resolve config → AI-merge (Task 10) → multi-arch build (Task 11) → run-state write (Task 12) → archive (Task 16) → trigger image build (Task 19). Parameters: `project`, `trigger_type`, `ref/tag`.\n  - Author the JCasC `jobs:` block defining ONE pipeline job (multibranch or pipeline-from-SCM) reading per-project config — NOT one job per fork.\n  - Define the minimal `jenkins-agent` RBAC additions needed (stay in jenkins ns; image build delegated to BuildKit via HMAC, so no cross-ns RBAC). Land as an ultrabot PR against cloudhome.\n\n  **Must NOT do**:\n  - Do NOT create one job per project (must be parameterized).\n  - Do NOT grant the agent cross-namespace cluster rights (delegate image build to dispatcher instead).\n  - Do NOT direct-apply — ultrabot PR.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — pipeline-as-code wiring multiple stages with correctness stakes.\n    - Reason: the Jenkinsfile is the orchestration spine; needs careful stage/gating design.\n  - **Skills**: none — Groovy/JCasC.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 2)\n  - **Blocks**: Tasks 14, 15\n  - **Blocked By**: Tasks 4, 8, 11, 12\n\n  **References**:\n  - `cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` — JCasC structure, how to add a `jobs:` block + agent pod templates (currently none exist)\n  - Draft \"ONE parameterized Jenkins pipeline reading per-project config\"\n  - Draft Jenkins findings: agent SA RBAC scoped to jenkins ns; delegate image build to dispatcher via HMAC (Option A)\n  - `cloudhome/docker/build-dispatcher/` — the `/dispatch` contract Task 19 will call\n\n  **Acceptance Criteria**:\n  - [ ] An ultrabot PR adds the Jenkinsfile + JCasC job + any RBAC\n  - [ ] After merge, the job appears in Jenkins and accepts `project`/`trigger_type`/`ref` params\n  - [ ] A manual job run reaches the build stage (full e2e proven in Task 15/F3)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Parameterized job exists and is single (happy)\n    Tool: Bash (Jenkins REST / kubectl)\n    Preconditions: JCasC applied\n    Steps:\n      1. curl -u <auth> https://jenkins.rustybret.com/api/json?tree=jobs[name] | jq\n      2. Assert exactly one release-watcher pipeline job (not per-project)\n      3. Assert it declares project/trigger_type/ref params\n    Expected Result: single parameterized job present\n    Evidence: .omo/evidence/task-13-job.txt\n\n  Scenario: Agent has no cross-ns rights (negative/scope)\n    Tool: Bash (kubectl auth can-i)\n    Steps:\n      1. kubectl -n buildkit auth can-i create jobs --as=system:serviceaccount:jenkins:jenkins-agent\n      2. Assert \"no\"\n    Expected Result: least-privilege preserved\n    Evidence: .omo/evidence/task-13-rbac.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR + Jenkinsfile in release-watcher)\n  - Message: `feat(ci): parameterized jenkins release-watcher pipeline`\n  - Files: `Jenkinsfile`, `jenkins-values.yaml` jobs block, RBAC\n  - Pre-commit: `tofu/kubectl validate` where applicable\n\n- [ ] 14. Wire Build-Tools Agent Pod Template into Jenkins\n\n  **What to do**:\n  - Add the Task 6 build-tools image as a Jenkins Kubernetes pod template (via JCasC) so pipeline stages run on an agent that actually has bun/git/buildx/crane/oci-cli.\n  - Ensure the pod template mounts the ESO-synced creds (DB ref, OCIR creds, the HMAC secret for dispatcher calls) as env/volumes — least privilege, no blanket creds.\n  - Land as an ultrabot PR against cloudhome; verify a test pod launches with the tools available.\n\n  **Must NOT do**:\n  - Do NOT mount the broad cluster-admin cred Secret into build agents (only the scoped secrets the build needs).\n  - Do NOT direct-apply — ultrabot PR.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — JCasC pod-template wiring + verification.\n    - Reason: configuration integration, moderate effort.\n  - **Skills**: none — k8s/JCasC.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3)\n  - **Blocks**: Task 15\n  - **Blocked By**: Tasks 6, 13\n\n  **References**:\n  - Task 6 pod-template YAML + image\n  - `cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` — Kubernetes plugin pod-template declaration format\n  - `cloudhome` ESO/ExternalSecret patterns — how to mount synced secrets into the pod\n  - Draft least-privilege guardrail\n\n  **Acceptance Criteria**:\n  - [ ] An ultrabot PR wires the build-tools pod template into JCasC\n  - [ ] A test job runs ON that agent and `bun`/`crane`/`buildx` are available in-pod\n  - [ ] Only scoped secrets are mounted (not the cluster-admin cred Secret)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Pipeline runs on tool-equipped agent (happy)\n    Tool: Bash (Jenkins job log)\n    Steps:\n      1. Trigger a no-op pipeline that runs `bun --version && crane version` on the agent\n      2. Assert both print versions in the build log\n    Expected Result: tools available on the agent\n    Evidence: .omo/evidence/task-14-agent-tools.txt\n\n  Scenario: Broad creds NOT mounted (negative)\n    Tool: Bash (kubectl describe the agent pod template / job pod)\n    Steps:\n      1. Inspect mounted secrets on the build pod\n      2. Assert ultrabot-cloud-creds (cluster-admin creds) is NOT mounted\n    Expected Result: only scoped build secrets present\n    Evidence: .omo/evidence/task-14-scoped-secrets.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR)\n  - Message: `feat(ci): jenkins build-tools agent pod template`\n  - Files: `jenkins-values.yaml` pod template, ESO refs\n  - Pre-commit: kubectl/JCasC validate\n\n- [ ] 15. Wire jenkins-hook Webhook → Job; Idempotency; Release+Push Triggers\n\n  **What to do**:\n  - Wire the two trigger sources through the existing `jenkins-hook.rustybret.com` CF worker → `jenkins.rustybret.com/github-webhook/`: (a) upstream-release event for OpenCode, (b) `fork/local` push event. Map each to a job run with the right `trigger_type` + ref/tag params.\n  - Enforce idempotency at job entry using the Task 9 key (duplicate webhook for the same key → no double build).\n  - Configure the GitHub webhooks on the relevant repos (delegable to ultrabot — webhook creation is agent-allowed) pointing at the worker with the HMAC secret.\n\n  **Must NOT do**:\n  - Do NOT create a new webhook worker (reuse `jenkins-hook`).\n  - Do NOT let duplicate deliveries double-build.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — multi-source trigger wiring + idempotency correctness.\n    - Reason: webhook→job mapping + dedupe is integration-critical and easy to get subtly wrong.\n  - **Skills**: none — CI/webhook ops.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3)\n  - **Blocks**: Tasks 16, 19, e2e\n  - **Blocked By**: Tasks 11, 13, 14\n\n  **References**:\n  - Draft \"jenkins-hook.rustybret.com CF worker already proxies GitHub webhooks → jenkins …/github-webhook/ (HMAC, Vault jenkins-webhook-hmac)\"\n  - Draft \"Triggers: upstream-release + fork/local-push, both replacing GitHub Actions\"\n  - Task 9 idempotency key\n  - `cloudhome` ultrabot allowed action: \"GitHub webhook creation\"\n\n  **Acceptance Criteria**:\n  - [ ] A signed release webhook triggers the job with trigger_type=release\n  - [ ] A signed push webhook triggers the job with trigger_type=push\n  - [ ] A duplicate delivery does NOT start a second build (idempotency)\n\n  **QA Scenarios**:\n  ```\n  Scenario: Release + push webhooks each trigger a build (happy)\n    Tool: Bash (signed HMAC curl)\n    Steps:\n      1. curl signed release payload → assert job queued with trigger_type=release\n      2. curl signed push payload → assert job queued with trigger_type=push\n    Expected Result: both paths trigger correctly\n    Evidence: .omo/evidence/task-15-triggers.txt\n\n  Scenario: Duplicate webhook is idempotent (negative)\n    Tool: Bash\n    Steps:\n      1. Send the same signed release payload twice\n      2. Assert only one build runs / one run row for that key\n    Expected Result: no double build\n    Evidence: .omo/evidence/task-15-idempotency.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR for webhook config)\n  - Message: `feat(ci): wire release+push webhooks to jenkins with idempotency`\n  - Files: webhook config, job trigger mapping\n  - Pre-commit: signed-curl smoke\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+171/-0).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 54.8s)

_Thinking:_

 Continuing with the final batch of tasks 16-19, then I'll verify everything, run the Oracle phase-2 check, do a self-review, and present the summary.

I'm mid plan-generation — Tasks 1–15 are written. Let me append the final batch (Tasks 16–19) before the Final Verification Wave.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "<!-- TASKS_INSERTED_HERE -->",
  "newString": "- [ ] 16. Artifact Archival to 50Gi PVC + Retention (keep-N)\n\n  **What to do**:\n  - Implement the archival step (Jenkins stage + CLI helper): copy the 3 binaries + checksums + provenance + run-state JSON + conflict/diff logs to the 50Gi `local-altos` PVC under a per-release path `artifacts/opencode/<version>/`.\n  - Implement a retention policy: keep the most recent N releases (default N=5), prune older release directories. 3 binaries + logs per release add up — this protects the PVC.\n  - Emit an archival manifest the run-state row references.\n\n  **Must NOT do**:\n  - Do NOT delete the current/in-progress release during prune.\n  - Do NOT archive to R2 (cloudhome storage only, per user).\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — archival + retention logic.\n    - Reason: well-scoped storage task with a prune edge case.\n  - **Skills**: none — Bun/fs + k8s volume.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3)\n  - **Blocks**: F3\n  - **Blocked By**: Task 15\n\n  **References**:\n  - Draft \"50Gi `local-altos` PVC for archiveArtifacts\" + \"Retention policy keep-N-releases\"\n  - Artifact naming `opencode-<version>-<os>-<arch>` (Task 11 manifest)\n  - Jenkins `archiveArtifacts` conventions / PVC mount path in jenkins-values\n\n  **Acceptance Criteria**:\n  - [ ] After a run, `artifacts/opencode/<version>/` on the PVC holds 3 binaries + checksums + logs\n  - [ ] With >N releases present, the oldest is pruned, newest N kept\n  - [ ] In-progress release is never pruned\n\n  **QA Scenarios**:\n  ```\n  Scenario: Artifacts archived under versioned path (happy)\n    Tool: Bash (kubectl exec into a pod mounting the PVC)\n    Steps:\n      1. ls artifacts/opencode/v1.15.13/\n      2. Assert 3 binaries + .sha256 + provenance.json + run-state.json present\n    Expected Result: complete archive\n    Evidence: .omo/evidence/task-16-archive.txt\n\n  Scenario: Retention prunes oldest, keeps newest N (edge)\n    Tool: Bash\n    Steps:\n      1. Seed N+2 fake release dirs + run prune (N=5)\n      2. Assert exactly newest 5 remain, oldest 2 removed, none in-progress\n    Expected Result: correct retention\n    Evidence: .omo/evidence/task-16-retention.txt\n  ```\n\n  **Commit**: YES (release-watcher + cloudhome Jenkinsfile stage)\n  - Message: `feat: artifact archival to PVC with keep-N retention`\n  - Files: `src/archive/*`, Jenkinsfile stage\n  - Pre-commit: `bun test`\n\n- [ ] 17. Image-Context Dockerfile Finalize (fork/local + omo build-args)\n\n  **What to do**:\n  - Finalize the Task 5 Dockerfile: Stage 1 clones `OPENCODE_REPO@OPENCODE_REF` (default fork/local) and compiles the binary (`bun ... build.ts --single`); Stage 2 builds the oh-my-opencode plugin from `OHMYOPENCODE_REPO@OHMYOPENCODE_REF`; Stage 3 assembles an `ubuntu:24.04` runtime image with the binary + plugin.\n  - Parameterize via build-args so the same Dockerfile serves the parameterized pipeline. Ensure it builds for both amd64 and arm64 (buildx).\n  - Verify a local/buildx build produces a runnable image whose `opencode --version` matches the target.\n\n  **Must NOT do**:\n  - Do NOT bake secrets or auth into the image.\n  - Do NOT add runtime/deploy config (image build only).\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — multi-stage Dockerfile authoring.\n    - Reason: real build wiring, moderate effort.\n  - **Skills**: none — Docker.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3)\n  - **Blocks**: Tasks 18, 19\n  - **Blocked By**: Task 5\n\n  **References**:\n  - `cloudhome/docker/opencode/Dockerfile` — the proven multi-stage + build-arg pattern (adapt into the new repo)\n  - `cloudhome/scripts/build-opencode-multiarch.sh` — buildx multi-arch invocation + arg names\n  - Task 5 Dockerfile shell + README\n  - `rustybret/opencode:packages/opencode/script/build.ts` — compile entrypoint\n\n  **Acceptance Criteria**:\n  - [ ] `docker buildx build --platform linux/amd64,linux/arm64 --build-arg OPENCODE_REF=fork/local ...` succeeds\n  - [ ] Resulting image `opencode --version` matches the built tag\n  - [ ] No secrets in image history\n\n  **QA Scenarios**:\n  ```\n  Scenario: Multi-arch image builds and runs (happy)\n    Tool: Bash (buildx)\n    Steps:\n      1. docker buildx build --platform linux/amd64,linux/arm64 --build-arg OPENCODE_REPO=... --build-arg OPENCODE_REF=fork/local -t opencode:test .\n      2. docker run --rm opencode:test opencode --version\n    Expected Result: builds both arches, prints version\n    Evidence: .omo/evidence/task-17-image-build.txt\n\n  Scenario: No secrets in image (negative)\n    Tool: Bash\n    Steps:\n      1. docker history --no-trunc opencode:test | grep -iE 'token|secret' || echo CLEAN\n    Expected Result: CLEAN\n    Evidence: .omo/evidence/task-17-no-secrets.txt\n  ```\n\n  **Commit**: YES (opencode-image)\n  - Message: `feat: finalize opencode multi-stage image build`\n  - Files: `Dockerfile`\n  - Pre-commit: `hadolint Dockerfile`\n\n- [ ] 18. repo-map.js amd64 Entry + opencode-amd64 BuildKit Job Template\n\n  **What to do**:\n  - Extend `cloudhome/docker/build-dispatcher/src/repo-map.js`: add/repoint the `opencode` entry to the NEW image-context repo and add an `opencode-amd64` variant (current entry is arm64-only). Map both to their per-arch BuildKit Job templates.\n  - Author the `opencode-amd64` suspended K8s Job template (mirroring the existing `opencode-arm64` one) targeting the amd64 BuildKit daemon (altos-worker-01).\n  - Land as an ultrabot PR; verify the dispatcher recognizes both arch targets.\n\n  **Must NOT do**:\n  - Do NOT remove/break the existing arm64 path.\n  - Do NOT direct-apply — ultrabot PR.\n\n  **Recommended Agent Profile**:\n  - **Category**: `unspecified-high` — dispatcher map + job template authoring.\n    - Reason: config + manifest, moderate effort.\n  - **Skills**: none — JS/k8s.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3)\n  - **Blocks**: Task 19\n  - **Blocked By**: Task 17\n\n  **References**:\n  - Draft \"`repo-map.js`: opencode → {arch:arm64, jobTemplate:opencode-arm64} … needs amd64 added\"\n  - `cloudhome/k8s/base/ops/buildkit/` — per-arch BuildKit daemons (amd64 altos-worker-01, arm64 sj-b-worker-01) + existing Job templates to mirror\n  - `cloudhome/docker/build-dispatcher/src/repo-map.js` — the entry format\n\n  **Acceptance Criteria**:\n  - [ ] An ultrabot PR adds the amd64 entry + `opencode-amd64` Job template, preserving arm64\n  - [ ] Dispatcher `/dispatch` accepts both `opencode-amd64` and `opencode-arm64` targets\n  - [ ] Each maps to the correct per-arch BuildKit daemon\n\n  **QA Scenarios**:\n  ```\n  Scenario: Both arch targets dispatch (happy)\n    Tool: Bash (signed HMAC curl to dispatcher)\n    Steps:\n      1. POST /dispatch {image:opencode, arch:amd64} → assert job template opencode-amd64 instantiated\n      2. POST /dispatch {image:opencode, arch:arm64} → assert opencode-arm64 still works\n    Expected Result: both arches dispatch to correct daemons\n    Evidence: .omo/evidence/task-18-dispatch.txt\n\n  Scenario: arm64 path unbroken (negative/regression)\n    Tool: Bash\n    Steps:\n      1. Diff repo-map before/after → assert arm64 entry intact\n    Expected Result: no regression\n    Evidence: .omo/evidence/task-18-arm64-intact.txt\n  ```\n\n  **Commit**: YES (cloudhome via ultrabot PR)\n  - Message: `feat(ci): add opencode amd64 buildkit target`\n  - Files: `repo-map.js`, `opencode-amd64` job template\n  - Pre-commit: dispatcher config validate\n\n- [ ] 19. build-relay Trigger Step from Jenkins (HMAC /dispatch) → OCIR\n\n  **What to do**:\n  - Add the final Jenkins stage (Milestone B): after binaries are built+archived and the integration ref is pushed, POST a signed HMAC request to `build-relay.rustybret.com` (or directly to `build-dispatcher` per Task 13's Option A) to build the OpenCode image from the Task 17 context for both arches, assemble the multi-arch manifest (`crane index append`), and push to the OCIR `opencode` repo.\n  - Update run-state to `container_candidate_built`. Verify the image+manifest are present in OCIR. STOP here — no deploy/promotion in V1.\n\n  **Must NOT do**:\n  - Do NOT deploy or update any running service (stop at OCIR push).\n  - Do NOT promote to the Mac install path.\n\n  **Recommended Agent Profile**:\n  - **Category**: `deep` — the integrating final stage tying Jenkins → BuildKit → OCIR.\n    - Reason: cross-system trigger with verification; the capstone of Milestone B.\n  - **Skills**: none — CI/registry ops.\n\n  **Parallelization**:\n  - **Can Run In Parallel**: YES (Wave 3, last)\n  - **Blocks**: F3\n  - **Blocked By**: Tasks 15, 17, 18\n\n  **References**:\n  - Draft \"build-relay → build-dispatcher → BuildKit → OCIR; multi-arch via `crane index append`\"\n  - Task 13 Option A (Jenkins POSTs HMAC `/dispatch`)\n  - Task 18 amd64+arm64 targets\n  - Draft \"V1 stops at artifact built / image pushed — NO deploy config\"\n\n  **Acceptance Criteria**:\n  - [ ] Jenkins stage triggers the image build for both arches and pushes a multi-arch manifest to OCIR\n  - [ ] `crane manifest <ocir>/opencode:<tag>` shows amd64 + arm64\n  - [ ] Run-state advances to container_candidate_built; NO deploy occurs\n\n  **QA Scenarios**:\n  ```\n  Scenario: Multi-arch image pushed to OCIR (happy)\n    Tool: Bash (crane)\n    Preconditions: full pipeline ran\n    Steps:\n      1. crane digest <ocir>/<ns>/opencode:<tag> → assert present\n      2. crane manifest <ocir>/<ns>/opencode:<tag> | jq '.manifests[].platform.architecture' → assert amd64 + arm64\n    Expected Result: multi-arch image in OCIR\n    Evidence: .omo/evidence/task-19-ocir.txt\n\n  Scenario: No deploy side-effect (negative/scope-guard)\n    Tool: Bash (kubectl)\n    Steps:\n      1. kubectl get deploy -A -o jsonpath compare image refs before/after the run\n      2. Assert no running deployment image changed\n    Expected Result: build-only, no deploy\n    Evidence: .omo/evidence/task-19-no-deploy.txt\n  ```\n\n  **Commit**: YES (cloudhome Jenkinsfile stage via ultrabot PR)\n  - Message: `feat(ci): trigger opencode image build to OCIR (milestone B)`\n  - Files: Jenkinsfile final stage\n  - Pre-commit: signed-curl smoke + `crane` verify\n\n<!-- TASKS_INSERTED_HERE -->"
}
```

**Output:**
```
Edited (+220/-0).

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 7.2s)

_Thinking:_

 Now I'm cleaning up that placeholder and double-checking the task count to make sure the plan is complete before running the Oracle phase-2 verification.

All 19 tasks are written. Let me remove the leftover placeholder and verify plan completeness before Oracle phase-2.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "  - Pre-commit: signed-curl smoke + `crane` verify\n\n<!-- TASKS_INSERTED_HERE -->",
  "newString": "  - Pre-commit: signed-curl smoke + `crane` verify"
}
```

**Output:**
```
Edited (+0/-2).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 7.6s)

_Thinking:_

 I'm verifying that all the task headers are in place and properly formatted before moving forward with the Oracle phase-2 execution.

**Tool: bash**

**Input:**
```json
{
  "command": "grep -nE '^- \\[ \\] [0-9F]+\\.' .omo/plans/release-watcher-v1.md",
  "description": "List all task headers in plan"
}
```

**Output:**
```
204:- [ ] 1. Human-Only Prerequisites — mint PAT(s) + seed scoped cred Secret
260:- [ ] 2. Cross-Compile Spike — darwin-arm64 OpenCode binary from Linux
317:- [ ] 3. Scaffold `rustybret/release-watcher` (fork orw → config-driven core)
374:- [ ] 4. Per-Project Config Schema (`release-watcher.config`)
430:- [ ] 5. Scaffold Image-Build-Context Repo (Dockerfile shell)
485:- [ ] 6. Build-Tools Jenkins Agent Pod Image (bun/node/git/buildx/crane)
542:- [ ] 7. Provision OCI MySQL HeatWave + Run-State Schema (ultrabot/tofu)
600:- [ ] 8. CLI Config Loader + Validation (+ unit tests)
655:- [ ] 9. CLI Merge-Plan / Curated-PR Resolver + Provenance/Diff/Conflict (+ unit tests)
710:- [ ] 10. CLI AI-Merge Orchestration (headless opencode session)
769:- [ ] 11. CLI Multi-Arch Build Orchestration (3 binaries, naming)
826:- [ ] 12. CLI Run-State DB Writer (fail-open to PVC JSON)
881:- [ ] 13. Jenkinsfile (parameterized) + JCasC Job + Agent RBAC
940:- [ ] 14. Wire Build-Tools Agent Pod Template into Jenkins
996:- [ ] 15. Wire jenkins-hook Webhook → Job; Idempotency; Release+Push Triggers
1052:- [ ] 16. Artifact Archival to 50Gi PVC + Retention (keep-N)
1107:- [ ] 17. Image-Context Dockerfile Finalize (fork/local + omo build-args)
1162:- [ ] 18. repo-map.js amd64 Entry + opencode-amd64 BuildKit Job Template
1216:- [ ] 19. build-relay Trigger Step from Jenkins (HMAC /dispatch) → OCIR
1278:- [ ] F1. **Plan Compliance Audit** — `oracle`
1282:- [ ] F2. **Code/Config Quality Review** — `unspecified-high`
1286:- [ ] F3. **Real E2E Pipeline QA** — `unspecified-high`
1290:- [ ] F4. **Scope Fidelity Check** — `deep`

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 11.1s)

_Thinking:_

 All 19 tasks and the four final-wave reviewers are accounted for and properly formatted. The plan generation is done, so I'm marking that todo as complete and moving into the Oracle phase-2 verification.

All 19 tasks + 4 final-wave reviewers are present and correctly formatted (bare numbers 1–19, F1–F4). Plan generation is complete. Marking plan-generation done and running Oracle phase-2 verification.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 55.9s)

_Thinking:_

 Now I'm running the Oracle phase-2 verification to validate the saved plan.

Running Oracle phase-2 verification on the saved plan.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "description": "Oracle phase-2 plan verification",
  "run_in_background": false,
  "prompt": "Verify Prometheus phase 2 (plan generation). Read /Volumes/Topper2TB/Git/opencode/.omo/plans/release-watcher-v1.md end to end. Confirm:\n  1. Every TODO item carries acceptance criteria with concrete success conditions.\n  2. Each task has a recommended agent profile and a Wave assignment.\n  3. Parallelism is maximized (waves contain 3-8 tasks except where dependencies force fewer).\n  4. Must Have / Must NOT Have lists exist and are consistent with the interview record.\n  5. No task requires assumptions about business logic without cited evidence.\n  6. Plan path is .omo/plans/, not docs/ or plans/.\n  7. All TODO task labels use bare-number format (\"1. xxx\"), NOT \"T1.\", \"Phase 1:\", \"Task-1.\" etc. All Final Wave labels use bare-number format with \"F\" prefix: \"F1. xxx\", \"F2. xxx\".\n\nContext on the plan: it builds a project-agnostic `release-watcher` (forked from @cortexkit/orw) running on Jenkins + cloudhome K8s infra, replacing failed GitHub Actions CI. V1 targets OpenCode: webhook → parameterized Jenkins pipeline → AI-merge fork/local + 5 curated PRs → build 3 binaries (linux amd64/arm64 + darwin-arm64) → run-state in new OCI MySQL HeatWave → push opencode image to OCIR. Infra changes dispatched to an \"ultrabot\" headless cluster-admin agent as PRs. Local Mac ORW stays untouched in parallel.\n\nKey constraints to check the plan honors:\n- ONE parameterized pipeline (not one job per project)\n- Stop at \"artifact built / image pushed to OCIR\" — NO deploy/runtime config\n- NO writes to ~/.opencode/bin or mutation of local Mac ORW\n- Least-privilege creds (no blanket OCI account in cluster-admin)\n- All infra mutations land as ultrabot PRs (human-merged), never direct apply\n- Fail-open DB; cross-compile darwin is an early de-risk spike\n- Idempotency on release+push triggers; curated-PR merge emits provenance/diff/conflict evidence\n\nReturn: `CHECK [N/7] PASS | VERDICT: GO/NO-GO` plus, on NO-GO, file:line citations for each blocking issue."
}
```

**Output:**
```
Task completed in 38s.

Agent: oracle
⚠️  Model routing: parent used anthropic/claude-opus-4-8, this subagent used google/gemini-3.1-pro-preview (via category: unknown)

---

**Verifying the Plan's Integrity**

I've begun the validation process and can confirm the presence of acceptance criteria for Task 1, meeting the first critical condition. I'm moving through the plan systematically.


**Confirming All Acceptance Criteria**

I've successfully identified acceptance criteria for all remaining tasks: Task 2 through Task 12. Each task includes specific deliverables and validations, such as file outputs, repository views, test results, and even interactions with external tools like Ultrabot and Vault. I've noted aspects like partial-arch failures and conflict handling in those criteria as well. Now I'm preparing to evaluate the content of each task.


**Validating Remaining Task Criteria**

I've verified the presence of acceptance criteria for Tasks 13 through 19. Each has well-defined validations involving Ultrabot, test jobs, webhooks, and artifact management. While reviewing the final verification wave (F1-F4), I'm clarifying if their "Output" formats constitute acceptance criteria since they lack an explicit "Acceptance Criteria" block. I'll need to check if these are technically TODO items.


**Analyzing Task Properties**

I'm now investigating task metadata, and I've confirmed that each numbered task (1-19) includes a recommended agent profile and a wave assignment for parallelization. This data point offers insights into how we may optimize execution.


**Confirming Parallelization Structure**

I've just confirmed the task wave structure maximizes parallelism, fitting the 3-8 task per wave criteria. Wave assignments and blocking dependencies are validated as per the plan, with specific task counts in each wave. I've noted that the initial and final waves are appropriately sized.

I'm now checking the must-have and must-not-have lists to ensure they reflect the interview record.


**Verifying Source References**

I've just confirmed that no task makes assumptions about business logic without explicit evidence. Each task ties into a specific file, prior work, or defined draft decisions, as demonstrated by the provided references. This is a critical indicator of plan integrity. I've now validated the entire interview record against the plan.


**Confirming File and Label Consistency**

I've confirmed that tasks 15 through 19 each reference external resources, like specific URLs, PVCs and file paths, providing verifiable evidence. The file path for the plan is correct, and I've verified the consistent use of the bare-number format for TODO labels and the F-prefix for Final Wave labels.


**Confirming Constraints Adherence**

I've just finished reviewing the constraints. The pipeline is indeed parameterized as required. Task 13 specifically addresses the "one pipeline job" constraint. I'm satisfied that the plan is designed to stop at "artifact built/image", meeting this constraint as well. I've noted that the labels adhere perfectly to the format guidelines. I'm now looking at dependencies.



CHECK [7/7] PASS | VERDICT: GO

<task_metadata>
session_id: ses_169c2127bffeAKly1tp6Izoue6
task_id: ses_169c2127bffeAKly1tp6Izoue6
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_169c2127bffeAKly1tp6Izoue6", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.8s)

_Thinking:_

 Oracle phase-2 came back with a GO across all seven checks, so I'm moving forward with the self-review phase and then wrapping up with a summary presentation. Let me update my task list and work through the self-review.

Oracle phase-2: **GO (7/7)**. Marking phase-2 done and moving to self-review.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 15.5s)

_Thinking:_

 Both Oracle gates cleared successfully, so now I'm running through my self-review checklist to identify any gaps. The critical decisions all got resolved during the interview—database choice, authentication, binaries, images, and execution strategy are all locked in. The only ambiguous item is the darwin cross-compile question, which the Task 2 spike will settle anyway.

For the defaults I've applied: N=5 retention, fail-open database behavior, and shipping both Milestone A and B together. Now I'll present the summary and ask the high-accuracy question.

Self-review complete against the checklist:

- ✅ All 19 tasks have concrete acceptance criteria + QA scenarios (happy + negative)
- ✅ All file references cite real cloudhome/opencode paths or draft decisions
- ✅ No business-logic assumptions without evidence (Oracle confirmed 7/7)
- ✅ Metis guardrails incorporated (cross-compile spike, PR-only infra, least-privilege, fail-open, idempotency, provenance)
- ✅ Scope boundaries explicit (Must NOT: deploy config, Mac install path, blanket creds, per-project jobs)
- ✅ Zero acceptance criteria require human intervention (human-only prereqs are Task 1, but verified agent-side)
- ✅ All labels bare-number format (1–19, F1–F4)

No critical gaps requiring user input — every major decision was resolved during the interview. Defaults applied are all override-able.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 5902.9s)

_Thinking:_

 Now I'm ready to present the summary since both Oracle phases passed, and I'll lay out the plan with the available options.

## Plan Generated: `release-watcher-v1`

Plan saved to `.omo/plans/release-watcher-v1.md` — both Oracle gates passed (phase-1 6/6, phase-2 7/7), Metis guardrails folded in.

**Key Decisions Made:**
- **Project-agnostic `release-watcher`** forked from orw into a new standalone repo — config-driven CLI core, V1 implements only literal-overlay mode
- **Jenkins = orchestration brain**, BuildKit = container-build primitive only, Cloudflare = ingress relay only
- **NEW OCI MySQL HeatWave** run-state DB (fail-open); infra provisioned via **ultrabot cluster-admin PRs** with one-time human-seeded scoped creds
- **Both deliverables**: 3 binaries (linux amd64/arm64 + darwin-arm64) AND opencode image → OCIR; structured as Milestone A (binaries) → Milestone B (image)

**Scope:**
- IN: webhook→Jenkins→AI-merge(fork/local + 5 PRs)→3 binaries→MySQL run-state→OCIR image
- OUT: deploy/runtime config, Mac install path, semantic-adaptation, new webhook workers

**Guardrails Applied (Metis + Oracle):**
- Cross-compile darwin = early de-risk spike (Task 2); NO-GO fallback documented
- All infra mutations = ultrabot PRs (human-merged), never direct apply
- Least-privilege scoped creds (no blanket OCI account); local Mac ORW untouched
- Idempotency on release+push; curated-PR merge emits provenance/diff/conflict; fail-closed on merge conflict, fail-open on DB outage

**Auto-Resolved:**
- Renumbered task labels (`P1.`→`1.`) so the `/start-work` progress counter parses all 19 tasks

**Defaults Applied (override if needed):**
- PVC retention keep-N=5; merge-driver agent `default` + `anthropic/claude-opus-4-8`; DB fail-open (build completes even if MySQL down)

**Structure:** 19 tasks across 3 waves + Wave-0 human prereq + 4-reviewer final wave. Critical path: Task 1 → 2 (spike) → 11 (build) → 13 (Jenkinsfile) → 15 (webhook) → e2e → 19 (image).

No decisions outstanding — the long interview resolved everything. One final choice:

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Plan is ready (both Oracle gates passed). How would you like to proceed?",
      "header": "Next Step",
      "options": [
        {
          "label": "Start Work",
          "description": "Execute now with /start-work release-watcher-v1. Plan is solid and verified."
        },
        {
          "label": "High Accuracy Review",
          "description": "Have Momus rigorously verify every task, reference, and acceptance criterion before execution. Adds a review loop but maximizes precision for this XL multi-repo plan."
        }
      ]
    }
  ]
}
```

**Output:**
```
User has answered your questions: "Plan is ready (both Oracle gates passed). How would you like to proceed?"="High Accuracy Review". You can now continue with the user's answers in mind.
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 12.5s)

_Thinking:_

 The user selected High Accuracy Review, so I need to follow the workflow sequence—Oracle phase-3 runs first, then the Momus loop. Let me update the task list and execute the Oracle phase-3 verification before moving into the Momus loop.

You chose **High Accuracy Review**. Per the workflow, Oracle phase-3 (execution readiness) runs before the Momus loop. Updating todos and running phase-3 now.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 83.3s)

_Thinking:_

 Moving on to verify the Oracle phase-3 results, then I'll shift into the Momus high-accuracy review cycle.

Running Oracle phase-3 verification (plan readiness for execution).

**Tool: task**

**Input:**
```json
{
  "subagent_type": "oracle",
  "description": "Oracle phase-3 readiness verification",
  "run_in_background": false,
  "prompt": "Verify the plan at /Volumes/Topper2TB/Git/opencode/.omo/plans/release-watcher-v1.md is ready for execution by /start-work. Confirm:\n  1. Any decisions surfaced in the user summary have been resolved and reflected in the plan (the user had NO outstanding decisions — confirm the plan has no unresolved [DECISION NEEDED] placeholders).\n  2. The final-wave reviewer set (F1-F4) is present and addressable.\n  3. Commit strategy and verification commands are stated.\n  4. The plan is internally consistent after the most recent edits (task numbering 1-19 sequential, dependency matrix references valid task numbers, agent dispatch table matches task profiles).\n  5. High-accuracy mode was selected by the user, so the Momus loop will run next — confirm the plan is in a state ready to hand to Momus (no placeholders, no TODO stubs, all 19 tasks fully specified).\n\nContext: This is an XL multi-repo infra plan (release-watcher CLI repo + image-context repo + cloudhome infra via ultrabot PRs). It builds a project-agnostic release-watcher on Jenkins+cloudhome replacing GitHub Actions CI; V1 targets OpenCode.\n\nReturn: `CHECK [N/5] PASS | VERDICT: GO/NO-GO` plus, on NO-GO, what to fix."
}
```

**Output:**
```
Task completed in 1m 5s.

Agent: oracle
⚠️  Model routing: parent used anthropic/claude-opus-4-8, this subagent used google/gemini-3.1-pro-preview (via category: unknown)

---

**Analyzing Plan Compliance**

I'm now focused on verifying that the current plan comprehensively addresses all decisions outlined in the user's summary. I'm actively searching the plan for any lingering `[DECISION NEEDED]` placeholders to ensure complete resolution and alignment. I need to confirm the plan is fully compliant.


**Confirming Strategy Alignment**

I've confirmed that no `[DECISION NEEDED]` markers remain, and the "Key Decisions" are resolved within the Interview Summary. The final verification wave, including all reviewers (F1-F4), is present and addressable, as per the specified section. I've also verified the presence of the commit strategy and verification commands, as stated in the plan.


**Enumerating Task Steps**

I've enumerated the tasks, and I'm currently cross-referencing this ordered list with the agent dispatch table to ensure proper matching with the relevant task profiles. I am focused on validating each task's placement. This involves comparing the requirements of the individual steps to the capabilities of available agents to ensure optimal task assignment.


**Validating Dependency Relationships**

I'm now diving into the dependency matrix and comparing it against the agent dispatch table. The goal is to make sure the relay trigger step from Jenkins is correctly mapped and the dependencies align perfectly. I am also carefully cross-referencing task descriptions with the dependency matrix to ensure proper execution order and that tasks correctly block the necessary downstream steps.


**Verifying Blocking Relationships**

I'm now cross-referencing the task dependency matrix to ensure correct blocking. I'm confirming that each block relationship, like Task 8 blocking Task 13, is accurately reflected in the dispatch table, and that no dependency is missed. I've also validated each task is blocked by the tasks specified in the matrix. I'm focusing on ensuring all the tasks are correctly mapped to their respective wave and agent profile.


**Matching Task Profiles**

I've checked the task profiles and cross-referenced them with the agent dispatch summary. The profiles for all tasks, including the "deep" and "unspecified-high" categories, accurately reflect the agent requirements in the dispatch table. I've focused on verifying this alignment for each task, especially in Wave 2. The mapping appears correct, and I'm confident in the overall accuracy.


**Mapping Task Placement**

I am now comparing Wave 3, as defined in the "Parallel Execution Waves" tree, against the complete list of tasks. There's a discrepancy: the tree specifies five tasks in Wave 3, yet the full task list includes 19 tasks. I'm focusing on reconciling this difference, ensuring each task's wave assignment is accurate and that no tasks are omitted or incorrectly placed. I'm also examining the dependencies between Wave 2 and Wave 3, ensuring this discrepancy doesn't indicate a timing conflict.


**Reconciling Task Discrepancies**

I'm now focused on reconciling the task list with the "Parallel Execution Waves" tree, which I thought had a discrepancy. I've re-examined the tree structure and I see the root of the issue: the plan's 19 tasks do indeed map to the tree's 18, and I was missing Task 14 when comparing. I now see the correct matching of all 19 tasks against the defined waves, confirming each task is accurately assigned. I've confirmed all tasks in Wave 3, now. I will continue to make sure all tasks are accurately placed.


**Correcting Task Assignments**

I've discovered a critical discrepancy; the plan mislabeled and omitted tasks. Specifically, the task list shows Task 18 as "repo-map.js amd64 Entry + opencode-amd64 BuildKit Job Template," while the plan's tree labeled the same entry as "build-relay trigger step." Also, Task 19 is missing from the tree. This needs correction in the parallel execution waves tree to accurately reflect all tasks, especially their respective agents. I'm cross-referencing this now.


**Clarifying Task Placement**

I'm now identifying a misalignment in task assignments within the parallel execution waves. I see inconsistencies in the task assignments, specifically regarding the agent-dispatch summary against the parallel execution waves tree. My current focus is to carefully cross-reference the dependencies and definitions to determine accurate placement, resolving this critical discrepancy for Task 14, and Task 7, and how they relate to tasks 6 and 13.


**Refining Task Sequencing**

I'm now diving deeper into the task dependencies and sequencing, focusing specifically on how the newly added tasks, Task 1 through 5, interact with the existing flow. I'm carefully cross-referencing these against the dispatch table and parallel execution waves tree, particularly assessing impact on Tasks 14 and 7, and the placement of Tasks 1 through 5.


**Validating Tree Alignment**

I'm now comparing the task list with the parallel execution waves tree, as there was an issue in the previous wave assignments. I've located the mismatch, specifically in the root: tasks 1 through 5, and the initial wave is actually wave 1, but tasks 1-5 are misaligned in the tree. I need to re-align them within the tree and make sure this is accurate. I'm focusing on ensuring accurate and complete mapping.


**Aligning Task Numbering**

I'm now focused on reconciling discrepancies between the task numbers in the parallel execution waves tree and the actual task numbers used elsewhere. I've pinpointed the source of the misalignment; the tree omits Task 1, and the numbering is out of sync. This requires careful remapping and alignment. I will make sure all dependencies are correct.


**Verifying Dependency Mapping**

I'm now carefully re-examining the dependency matrix to validate its consistency. I've confirmed that the "Depends On" and "Blocks" relationships align with the actual task descriptions, especially for Tasks 1, 2, and 3. I am focusing on all dependencies for Tasks 1, 2, 3, 4, 5, 6, 7 and their corresponding tasks. I'm verifying each dependency and block for accuracy, and that the matrix matches the plan.


**Validating Dependency Matrix**

I am now thoroughly reviewing the dependency matrix and comparing against the dispatch table, focusing on the new additions and existing tasks. I've pinpointed and will be correcting the critical misalignment in dependencies for tasks 11 and 12, to accurately reflect their respective requirements. I will verify that task 12 depends on 3 and 7, and blocks 13.


**Confirming Wave Assignments**

I'm now cross-referencing the dependency matrix and actual task assignments against the "Parallel Execution Waves" tree and "Agent Dispatch Summary." I've confirmed that the dependency matrix perfectly aligns with the 1-19 tasks. However, I am still pinpointing misalignments between the "Parallel Execution Waves" tree (P1, 1-18) and the agent dispatch summary. I will re-validate the wave assignments. I see a discrepancy in Wave 1: the summary assigns six tasks (T2-T7), while the tree is misaligned.


**Verifying Dispatch Alignment**

I'm now confirming the agent dispatch summary against the parallel execution waves, specifically Wave 1. I've re-examined and confirmed the correct matching of T4, T5, T6, and T7 in Wave 1. I've confirmed that T4 is unspecified-high, T5 is unspecified-low, T6 is unspecified-high, and T7 is unspecified-high. I'm focusing on the agent assignments. I'm confirming alignment across all waves.


**Flagging Inconsistency**

I've determined that Criterion 4 is not met, due to an inconsistency between the visual tree's task numbering (P1 + 1-18) and the overall task list (1-19). This misalignment means the plan isn't fully consistent, so I've flagged this as a NO-GO, despite all other criteria being met.


**Confirming Plan Completeness**

I'm now methodically verifying each of the 19 tasks to ensure they're fully specified. So far, tasks 1 through 15 are fully detailed, with no placeholders or TODO stubs. The plan is moving closer to being ready for Momus, and I'll continue checking the remaining tasks. This is to ensure accuracy.


**Verifying Plan Completion**

I've now confirmed that the plan's tasks are complete, with no lingering placeholders or omissions. Tasks 16 through 19 are fully specified, and I've verified the shell command abbreviations do not hide missing details. The data required, and execution steps, are present for each of the 19 tasks. The tasks themselves are fully specified with What to do, Must NOT do, Agent Profile, Parallelization, References, Acceptance Criteria, QA Scenarios, Commit.


**Flagging Inconsistency Resolution**

I've determined I can now override the NO-GO, as the previous inconsistency has been resolved by aligning the visual tree task numbering (P1 + 1-18) with the 1-19 task list. I've re-validated all criteria and confirmed the plan is now internally consistent, and I will proceed with Momus. All criteria are met.


**Resolving Tree Misalignment**

I've determined that the numbering inconsistency that caused the previous NO-GO is resolvable, and I've updated the plan's ASCII tree. The task list, dependency matrix, and agent dispatch table are all in sync, so I have the correct task assignments. The Momus loop can now run.



CHECK [4/5] PASS | VERDICT: NO-GO

**What to fix:**
The plan fails Criterion 4 (Internal Consistency). While the actual TODO list, Dependency Matrix, and Agent Dispatch Summary correctly use sequential tasks 1 through 19, the ASCII tree under `### Parallel Execution Waves` is out of sync. It lists `P1` followed by `Task 1` through `Task 18`. 

You must update the `### Parallel Execution Waves` tree to use the correct `Task 1` through `Task 19` numbering so it matches the rest of the document before handing it off to Momus.

<task_metadata>
session_id: ses_16966889affeK436gECqyRJx1a
task_id: ses_16966889affeK436gECqyRJx1a
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_16966889affeK436gECqyRJx1a", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 12.6s)

_Thinking:_

 Oracle phase-3 rejected the submission because the ASCII tree for parallel execution waves still references the old task numbering scheme—it shows Task 1-18 instead of the updated Task 1-19. I need to update that tree structure and resubmit it through the same gate.

Looking back at my earlier edit, I thought I'd already fixed this in section 1775, changing it from the old P1 + Task 1-18 format to Task 1-19. But the Oracle's feedback suggests the tree still shows the outdated numbering. Let me check what the current state of the tree actually contains.

Oracle phase-3: **NO-GO** on Criterion 4 — the ASCII "Parallel Execution Waves" tree is flagged as out of sync. Let me read the current tree to see its actual state before fixing.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 100,
  "endLine": 145
}
```

**Output:**
```
100: 
101: ---
102: 
103: ## Verification Strategy (MANDATORY)
104: 
105: > **ZERO HUMAN INTERVENTION** for verification — all acceptance is agent-executed. Human-only gates (mint PAT, billing, new Vault secret names) are PREREQUISITE tasks, but their *verification* is agent-executed (e.g., confirm the K8s Secret/row exists).
106: 
107: ### Test Decision
108: - **Infrastructure exists**: Partial (Jenkins live but jobless; CF workers wired; BuildKit live)
109: - **Automated tests**: Light unit tests on the release-watcher CLI core (pure logic: config parse, merge-plan/curated-PR resolution) — `bun test` in the new repo
110: - **Framework**: `bun test` (release-watcher repo)
111: - **No automated tests** for Jenkins/k8s wiring itself — proven by e2e run + per-task kubectl/endpoint verification
112: 
113: ### QA Policy
114: Every task includes agent-executed QA scenarios. Evidence → `.omo/evidence/task-{N}-{slug}.{ext}`.
115: - **CLI/config**: Bash (bun test, bun run, jq on output)
116: - **K8s/infra**: Bash (kubectl get/describe, oci-cli, tofu plan/state)
117: - **Webhook**: Bash (signed HMAC curl to the worker endpoints)
118: - **Artifacts**: Bash (`file`, `--version`, checksum)
119: - **Image**: Bash (`crane digest`/`crane manifest` against OCIR)
120: 
121: ---
122: 
123: ## Execution Strategy
124: 
125: ### Parallel Execution Waves
126: 
127: ```
128: Wave 0 (Human-only prerequisites — must clear before delegated infra tasks):
129: └── P1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human]
130: 
131: Wave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):
132: ├── Task 1: Cross-compile spike — darwin-arm64 from Linux [deep]
133: ├── Task 2: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]
134: ├── Task 3: Per-project config schema (release-watcher.config) [unspecified-high]
135: ├── Task 4: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]
136: ├── Task 5: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]
137: └── Task 6: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]
138: 
139: Wave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):
140: ├── Task 7: CLI config loader + validation (+ unit tests) [unspecified-high]
141: ├── Task 8: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]
142: ├── Task 9: CLI AI-merge orchestration (headless opencode session) [deep]
143: ├── Task 10: CLI multi-arch build orchestration (3 binaries, naming) [deep]
144: ├── Task 11: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]
145: ├── Task 12: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 14.4s)

_Thinking:_

 I'm noticing that my earlier edit to the waves block didn't actually take effect — the read-back still shows the old task numbering, even though the edit reported zero changes, which suggests either the replacement string matched the original exactly or the pattern didn't match at all.

The core issue is that the tree is using the old numbering scheme where the human prerequisite was labeled "P1" and tasks were numbered 1-18, but the actual TODO bodies have shifted to a 1-19 scheme where Task 1 is now the human prerequisites and the cross-compile spike moved to Task 2. I need to pull the full tree structure and rewrite it to align with the new 1-19 numbering.

Oracle correctly flagged it — the ASCII tree still uses the OLD numbering (P1 + Task 1–18), while the renumber edit at  reported +0/-0 (it never applied). Let me read the full tree, then rewrite it to match the actual 1–19 task bodies.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 127,
  "endLine": 178
}
```

**Output:**
```
127: ```
128: Wave 0 (Human-only prerequisites — must clear before delegated infra tasks):
129: └── P1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human]
130: 
131: Wave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):
132: ├── Task 1: Cross-compile spike — darwin-arm64 from Linux [deep]
133: ├── Task 2: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]
134: ├── Task 3: Per-project config schema (release-watcher.config) [unspecified-high]
135: ├── Task 4: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]
136: ├── Task 5: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]
137: └── Task 6: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]
138: 
139: Wave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):
140: ├── Task 7: CLI config loader + validation (+ unit tests) [unspecified-high]
141: ├── Task 8: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]
142: ├── Task 9: CLI AI-merge orchestration (headless opencode session) [deep]
143: ├── Task 10: CLI multi-arch build orchestration (3 binaries, naming) [deep]
144: ├── Task 11: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]
145: ├── Task 12: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]
146: └── Task 13: Wire build-tools agent pod template into Jenkins [unspecified-high]
147: 
148: Wave 3 (Trigger wiring + Milestone B image — depends on Wave 2):
149: ├── Task 14: Wire jenkins-hook webhook → job; idempotency; release+push [deep]
150: ├── Task 15: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]
151: ├── Task 16: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]
152: ├── Task 17: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]
153: └── Task 18: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]
154: 
155: Wave FINAL (after ALL tasks — 4 parallel reviews, then user okay):
156: ├── F1: Plan compliance audit (oracle)
157: ├── F2: Code/config quality review (unspecified-high)
158: ├── F3: Real e2e pipeline QA (unspecified-high)
159: └── F4: Scope fidelity check (deep)
160: → Present results → Get explicit user okay
161: 
162: Critical Path: P1 → Task 1 → Task 10 → Task 12 → Task 14 → e2e → Task 18
163: Max Concurrent: 6 (Waves 1 & 2)
164: ```
165: 
166: ### Dependency Matrix
167: 
168: | Task | Depends On | Blocks |
169: |---|---|---|
170: | 1 | — | 6, 7 |
171: | 2 | — | 11 |
172: | 3 | — | 8, 9, 10, 11, 12 |
173: | 4 | 3 | 8, 13 |
174: | 5 | — | 17 |
175: | 6 | 1 | 14 |
176: | 7 | 1 | 12 |
177: | 8 | 3, 4 | 13 |
178: | 9 | 3 | 10 |

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 54.8s)

_Thinking:_

 I see that my earlier edit to fix the wave tree numbering didn't take effect—the file still shows the old P1 + Task 1-18 structure, but the actual task bodies are numbered 1-19. I need to rewrite the entire ASCII tree block to align the numbering with what's actually there.

Now I'm mapping each old task to its new number and organizing them back into the correct waves based on the dependency matrix. The tasks flow from Wave 0 (human prereqs) through Wave 1 (cross-compile spike and initial scaffolding) and continue through the remaining waves...

Verifying the wave assignments against the parallelization labels in each task body to ensure everything aligns correctly. I'm noticing a conflict between the dispatch table and the task body for Task 14 — the table places it in Wave 2 with 7 tasks, but Task 14's dependencies show it depends on Task 13 (Wave 2), which means it must belong in Wave 3. I need to correct this: Wave 2 should contain Tasks 8-13 (6 tasks) and Wave 3 should contain Tasks 14-19 (6 tasks).

Now I'm also updating the critical path to match the new task numbering — the original path traced through the old task IDs, so I need to map those to the new ones and verify the sequence still holds.

Oracle correctly caught it — my earlier renumber edit to the ASCII tree never actually applied (it reported +0/-0). The tree still shows the old `P1 + Task 1–18` numbering while the task bodies use `1–19`. Rewriting the tree, critical path, and reconciling the Wave 2/3 split (Task 14 depends on Task 13, so it must be Wave 3) now.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "Wave 0 (Human-only prerequisites — must clear before delegated infra tasks):\n└── P1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [human]\n\nWave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):\n├── Task 1: Cross-compile spike — darwin-arm64 from Linux [deep]\n├── Task 2: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]\n├── Task 3: Per-project config schema (release-watcher.config) [unspecified-high]\n├── Task 4: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]\n├── Task 5: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]\n└── Task 6: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]\n\nWave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):\n├── Task 7: CLI config loader + validation (+ unit tests) [unspecified-high]\n├── Task 8: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]\n├── Task 9: CLI AI-merge orchestration (headless opencode session) [deep]\n├── Task 10: CLI multi-arch build orchestration (3 binaries, naming) [deep]\n├── Task 11: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]\n├── Task 12: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]\n└── Task 13: Wire build-tools agent pod template into Jenkins [unspecified-high]\n\nWave 3 (Trigger wiring + Milestone B image — depends on Wave 2):\n├── Task 14: Wire jenkins-hook webhook → job; idempotency; release+push [deep]\n├── Task 15: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]\n├── Task 16: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]\n├── Task 17: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]\n└── Task 18: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]\n\nWave FINAL (after ALL tasks — 4 parallel reviews, then user okay):\n├── F1: Plan compliance audit (oracle)\n├── F2: Code/config quality review (unspecified-high)\n├── F3: Real e2e pipeline QA (unspecified-high)\n└── F4: Scope fidelity check (deep)\n→ Present results → Get explicit user okay\n\nCritical Path: P1 → Task 1 → Task 10 → Task 12 → Task 14 → e2e → Task 18\nMax Concurrent: 6 (Waves 1 & 2)",
  "newString": "Wave 0 (Human-only prerequisites — must clear before delegated infra tasks):\n└── Task 1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [quick]\n\nWave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):\n├── Task 2: Cross-compile spike — darwin-arm64 from Linux [deep]\n├── Task 3: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]\n├── Task 4: Per-project config schema (release-watcher.config) [unspecified-high]\n├── Task 5: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]\n├── Task 6: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]\n└── Task 7: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]\n\nWave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):\n├── Task 8: CLI config loader + validation (+ unit tests) [unspecified-high]\n├── Task 9: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]\n├── Task 10: CLI AI-merge orchestration (headless opencode session) [deep]\n├── Task 11: CLI multi-arch build orchestration (3 binaries, naming) [deep]\n├── Task 12: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]\n└── Task 13: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]\n\nWave 3 (Agent wiring + Trigger wiring + Milestone B image — depends on Wave 2):\n├── Task 14: Wire build-tools agent pod template into Jenkins [unspecified-high]\n├── Task 15: Wire jenkins-hook webhook → job; idempotency; release+push [deep]\n├── Task 16: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]\n├── Task 17: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]\n├── Task 18: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]\n└── Task 19: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]\n\nWave FINAL (after ALL tasks — 4 parallel reviews, then user okay):\n├── F1: Plan compliance audit (oracle)\n├── F2: Code/config quality review (unspecified-high)\n├── F3: Real e2e pipeline QA (unspecified-high)\n└── F4: Scope fidelity check (deep)\n→ Present results → Get explicit user okay\n\nCritical Path: Task 1 → Task 2 → Task 11 → Task 13 → Task 15 → e2e → Task 19\nMax Concurrent: 6 (Waves 1 & 2)"
}
```

**Output:**
```
Edited (+21/-21).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 11.6s)

_Thinking:_

 I'm in the middle of fixing an ASCII tree consistency issue that Oracle flagged, and I've just applied the necessary edit. Now I need to verify the fix worked correctly by re-running the Oracle phase-3 verification on the same session before moving forward to the next loop.

I fixed the ASCII tree (the earlier renumber edit had silently no-op'd). Let me verify the tree now matches the task bodies, then re-run the same Oracle phase-3 gate to confirm GO before the Momus loop.

**Tool: read**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "startLine": 127,
  "endLine": 164
}
```

**Output:**
```
127: ```
128: Wave 0 (Human-only prerequisites — must clear before delegated infra tasks):
129: └── Task 1: Human gates — mint GitHub PAT(s), seed scoped OCI+Cloudflare cred K8s Secret [quick]
130: 
131: Wave 1 (Foundation, de-risk spikes, scaffolding — MAX PARALLEL):
132: ├── Task 2: Cross-compile spike — darwin-arm64 from Linux [deep]
133: ├── Task 3: Scaffold rustybret/release-watcher (fork orw → config-driven) [unspecified-high]
134: ├── Task 4: Per-project config schema (release-watcher.config) [unspecified-high]
135: ├── Task 5: Scaffold image-build-context repo (Dockerfile shell) [unspecified-low]
136: ├── Task 6: Build-tools Jenkins agent pod image (bun/node/git/buildx/crane) [unspecified-high]
137: └── Task 7: Provision OCI MySQL HeatWave + run-state schema (ultrabot/tofu) [unspecified-high]
138: 
139: Wave 2 (release-watcher CLI core + Jenkins — depends on Wave 1):
140: ├── Task 8: CLI config loader + validation (+ unit tests) [unspecified-high]
141: ├── Task 9: CLI merge-plan/curated-PR resolver + provenance/diff/conflict (+ unit tests) [deep]
142: ├── Task 10: CLI AI-merge orchestration (headless opencode session) [deep]
143: ├── Task 11: CLI multi-arch build orchestration (3 binaries, naming) [deep]
144: ├── Task 12: CLI run-state DB writer (fail-open to PVC JSON) [unspecified-high]
145: └── Task 13: Jenkinsfile (parameterized) + JCasC job + agent RBAC [deep]
146: 
147: Wave 3 (Agent wiring + Trigger wiring + Milestone B image — depends on Wave 2):
148: ├── Task 14: Wire build-tools agent pod template into Jenkins [unspecified-high]
149: ├── Task 15: Wire jenkins-hook webhook → job; idempotency; release+push [deep]
150: ├── Task 16: Artifact archival to 50Gi PVC + retention keep-N [unspecified-high]
151: ├── Task 17: Image-context Dockerfile finalize (fork/local + omo build-args) [unspecified-high]
152: ├── Task 18: repo-map.js amd64 entry + opencode-amd64 BuildKit job template [unspecified-high]
153: └── Task 19: build-relay trigger step from Jenkins (HMAC /dispatch) → OCIR [deep]
154: 
155: Wave FINAL (after ALL tasks — 4 parallel reviews, then user okay):
156: ├── F1: Plan compliance audit (oracle)
157: ├── F2: Code/config quality review (unspecified-high)
158: ├── F3: Real e2e pipeline QA (unspecified-high)
159: └── F4: Scope fidelity check (deep)
160: → Present results → Get explicit user okay
161: 
162: Critical Path: Task 1 → Task 2 → Task 11 → Task 13 → Task 15 → e2e → Task 19
163: Max Concurrent: 6 (Waves 1 & 2)
164: ```

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 22.8s)

_Thinking:_

 Now I'm checking whether the wave structure aligns with the dependency matrix and the parallelization details in each task description. I'm noticing the agent dispatch summary table is now out of sync with the corrected dependency tree. The summary still shows the old wave assignments—Wave 2 with 7 tasks and Wave 3 with 5 tasks—but the tree I just fixed has Wave 2 with 6 tasks (T8-T13) and Wave 3 with 6 tasks (T14-T19). I need to update that dispatch table to match the corrected structure.

The tree is now correct. But moving Task 14 into Wave 3 means the **Agent Dispatch Summary** table (which still groups T14 under Wave 2) is now out of sync. Fixing that before re-running Oracle.

**Tool: edit**

**Input:**
```json
{
  "filePath": ".omo/plans/release-watcher-v1.md",
  "oldString": "| 0 | 1 | Task 1 → `quick` (human-gated; agent documents + verifies) |\n| 1 | 6 | T2 → `deep`, T3/T4/T6/T7 → `unspecified-high`, T5 → `unspecified-low` |\n| 2 | 7 | T9/T10/T11/T13 → `deep`, T8/T12/T14 → `unspecified-high` |\n| 3 | 5 | T15/T19 → `deep`, T16/T17/T18 → `unspecified-high` |",
  "newString": "| 0 | 1 | Task 1 → `quick` (human-gated; agent documents + verifies) |\n| 1 | 6 | T2 → `deep`, T3/T4/T6/T7 → `unspecified-high`, T5 → `unspecified-low` |\n| 2 | 6 | T9/T10/T11/T13 → `deep`, T8/T12 → `unspecified-high` |\n| 3 | 6 | T15/T19 → `deep`, T14/T16/T17/T18 → `unspecified-high` |"
}
```

**Output:**
```
Edited (+2/-2).
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 42.0s)

_Thinking:_

 I'm re-running the Oracle phase-3 gate now that I've corrected the ASCII tree and dispatch summary, continuing with the same Oracle session.

Tree and dispatch summary are now consistent with the 1–19 task bodies. Re-running the same Oracle phase-3 gate (continuing the same session) to confirm GO before the Momus loop.

**Tool: task**

**Input:**
```json
{
  "task_id": "ses_16966889affeK436gECqyRJx1a",
  "run_in_background": false,
  "prompt": "I fixed the Criterion 4 issue you flagged. The ASCII \"Parallel Execution Waves\" tree had silently retained the old `P1 + Task 1–18` numbering; I rewrote it to match the actual task bodies (Task 1–19). I also:\n- Moved Task 14 (Wire build-tools agent pod template) into Wave 3 (it depends on Task 13), so Wave 2 now has 6 tasks (8–13) and Wave 3 has 6 tasks (14–19).\n- Updated the Critical Path to `Task 1 → Task 2 → Task 11 → Task 13 → Task 15 → e2e → Task 19`.\n- Updated the Agent Dispatch Summary table: Wave 2 = 6 tasks (T8–T13), Wave 3 = 6 tasks (T14–T19, with T14/T16/T17/T18 → unspecified-high, T15/T19 → deep).\n\nRe-read /Volumes/Topper2TB/Git/opencode/.omo/plans/release-watcher-v1.md and re-verify all 5 criteria, with special attention to Criterion 4 (internal consistency: ASCII tree numbering, dependency matrix, agent dispatch table, and task bodies all aligned 1–19).\n\nReturn: `CHECK [N/5] PASS | VERDICT: GO/NO-GO` plus, on NO-GO, what to fix."
}
```

**Output:**
```
Task continued and completed in 25s.

---

**Verifying Placeholder Removal**

I've just finished a quick scan, and I'm happy to report that there are no remaining instances of `[DECISION NEEDED]` in the text. I've successfully verified that criterion number one has been met.


**Confirming Wave Completeness**

I've confirmed the final-wave reviewers are present, addressable, and verified that both the commit strategy and verification commands are explicitly stated. Furthermore, I've checked for internal consistency: task numbering is sequential, the dependency matrix checks out, and the agent dispatch table aligns with the task profiles across all waves.



CHECK [5/5] PASS | VERDICT: GO

**Verification Summary:**
1. **Decisions Resolved**: No `[DECISION NEEDED]` placeholders remain.
2. **Final-Wave Reviewers**: F1-F4 are correctly specified with their respective agent profiles.
3. **Commit & Verification**: Commit strategy maps task groups to repos/messages; verification commands are clearly defined.
4. **Internal Consistency**: The ASCII tree, dependency matrix, agent dispatch table, and task bodies are now perfectly aligned on Tasks 1–19. The wave groupings (1, 6, 6, 6) match across all sections.
5. **Momus Readiness**: The plan is fully specified with no stubs or placeholders. It is ready for execution.

<task_metadata>
session_id: ses_16966889affeK436gECqyRJx1a
task_id: ses_16966889affeK436gECqyRJx1a
subagent: oracle
</task_metadata>

to continue: task(task_id="ses_16966889affeK436gECqyRJx1a", load_skills=[], run_in_background=false, prompt="...")

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 13.2s)

_Thinking:_

 All three Oracle gates have cleared with phase-3 GO status, and since the user chose High Accuracy Review, I'm moving into the Momus loop now. Let me update the task list and push the plan over to Momus for processing.

Oracle phase-3: **GO (5/5)** — all three Oracle gates now pass. Marking phase-3 done and entering the Momus high-accuracy review loop.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "in_progress",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "pending",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "in_progress",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "pending",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 13.1s)

_Thinking:_

 I'm continuing with the Momus review process by submitting just the file path as the prompt.

Submitting the plan to Momus for high-accuracy review (prompt = file path only, per protocol).

**Tool: task**

**Input:**
```json
{
  "subagent_type": "momus",
  "description": "Momus high-accuracy plan review",
  "run_in_background": false,
  "prompt": ".omo/plans/release-watcher-v1.md"
}
```

**Output:**
```
invalid temperature: only 1 is allowed for this model

to continue: task(task_id="ses_16962b4bbffei15dA22tjYmqkG", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 11.4s)

_Thinking:_

 The Momus task hit a configuration issue with the temperature parameter — it's a model routing problem rather than anything wrong with the plan itself, so I'll resubmit it.

The Momus invocation hit a model-config error (`invalid temperature: only 1 is allowed for this model`) — a routing issue, not a plan problem. Retrying the submission.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "momus",
  "description": "Momus high-accuracy plan review",
  "run_in_background": false,
  "prompt": ".omo/plans/release-watcher-v1.md"
}
```

**Output:**
```
invalid temperature: only 1 is allowed for this model

to continue: task(task_id="ses_169628780ffef0tNuc1M5q80pi", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.8s)

_Thinking:_

 The Momus task is hitting the same model configuration error again—it's a constraint issue, not a planning problem. Since this has failed twice with the same error, I should retry once more, but if it persists, I'll surface this to the user and suggest finalizing on the three Oracle gates instead, which all passed their checks.

Retrying now.

Momus failed twice with the same model-config error (`invalid temperature: only 1 is allowed`) — this is an infrastructure/routing issue with the Momus agent's model, not anything about the plan. Let me try once more before deciding how to proceed.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "momus",
  "description": "Momus high-accuracy plan review",
  "run_in_background": false,
  "prompt": ".omo/plans/release-watcher-v1.md"
}
```

**Output:**
```
invalid temperature: only 1 is allowed for this model

to continue: task(task_id="ses_169625c01ffe9IJiQi9uiVoAds", load_skills=[], run_in_background=false, prompt="...")
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 147.5s)

_Thinking:_

 The Momus agent keeps hitting the same temperature configuration error—this is an infrastructure problem, not an issue with the plan itself. I've seen this pattern before with the orw-integration plan, where retrying didn't help and we ended up finalizing through the Oracle gates instead. Since the plan has already passed all three Oracle gates, I should stop attempting retries and move forward with finalization.

Momus has now failed **three consecutive times** with the identical error: `invalid temperature: only 1 is allowed for this model`. This is an infrastructure/model-routing issue with the Momus agent's configuration — it never even got to read the plan. It's not a plan problem, and retrying again will just reproduce the same error.

This is the same Momus failure pattern we hit on the `orw-integration` plan, where you chose to finalize on the Oracle gates.

**Where the plan stands — strongly verified despite Momus being unavailable:**

| Gate | Result |
|---|---|
| Oracle phase-1 (interview completeness) | ✅ GO 6/6 |
| Oracle phase-2 (plan compliance/parallelism/acceptance) | ✅ GO 7/7 |
| Oracle phase-3 (execution readiness) | ✅ GO 5/5 |
| Metis gap analysis | ✅ applied (cross-compile spike, PR-only infra, least-privilege, fail-open, idempotency, provenance) |
| Momus high-accuracy review | ⛔ blocked — model-config error, 3/3 attempts |

The plan is internally consistent (tree/matrix/dispatch/bodies all aligned 1–19), every task has acceptance criteria + happy/negative QA scenarios, and the one consistency defect Oracle caught (stale ASCII tree numbering) is fixed.

How would you like to proceed?

**Tool: question**

**Input:**
```json
{
  "questions": [
    {
      "question": "Momus high-accuracy review is blocked by a model-config error (invalid temperature) after 3 attempts. The plan passed all 3 Oracle gates + Metis. How do you want to proceed?",
      "header": "Momus Blocked",
      "options": [
        {
          "label": "Finalize on Oracle gates",
          "description": "Accept the plan as-is (3 Oracle gates + Metis passed), skip Momus. Delete draft, hand off to /start-work release-watcher-v1."
        },
        {
          "label": "Retry Momus once more",
          "description": "Try the Momus review one more time in case the model-routing error has cleared."
        },
        {
          "label": "Hold",
          "description": "Keep the plan staged but do not finalize or hand off yet — you want to review or adjust something first."
        }
      ]
    }
  ]
}
```

**Error:**
```
The user dismissed this question
```

---

## User

try momus ahain, it should work now

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 171.3s)

_Thinking:_

 The user wants me to resubmit the plan for Momus.

Retrying Momus now.

**Tool: task**

**Input:**
```json
{
  "subagent_type": "momus",
  "description": "Momus high-accuracy plan review",
  "run_in_background": false,
  "prompt": ".omo/plans/release-watcher-v1.md"
}
```

**Output:**
```
Task completed in 2m 41s.

Agent: Momus - Plan Critic
⚠️  Model routing: parent used anthropic/claude-opus-4-8, this subagent used moonshotai/kimi-k2.6 (via category: unknown)

---

The `--single` flag exists (line 20). Good.

Let me verify if there are any other potential blockers.

Looking at the plan more carefully, I see that it references:
- `cloudhome/docker/opencode/Dockerfile` — doesn't exist in this workspace, but the plan says it's "stale" and a NEW dedicated repo should be created
- `cloudhome/scripts/build-opencode-multiarch.sh` — doesn't exist here
- `cloudhome/k8s/base/apps/jenkins/jenkins-values.yaml` — doesn't exist here

These are all in the `cloudhome` repo. The plan explicitly states this is a multi-repo effort. A developer executing this plan would need access to `rustybret/cloudhome`. The plan assumes they have it or will get it. The context section says "3 cloudhome explore probes" were done, establishing that the infrastructure exists.

Is the lack of `cloudhome` in the current workspace a blocker? No, because:
1. The plan explicitly says work spans multiple repos
2. The developer is told to dispatch infra changes via ultrabot to `rustybret/cloudhome`
3. The references to cloudhome files are guidance for what to look for in that repo

Similarly, the `.omo/drafts/` files don't exist, but they are labeled as "Draft" and contain supplementary context. The plan is self-contained enough without them.

Now, let me think about whether there are any tasks that are impossible to start:

- Task 1: Human gates — clear instructions on what to do
- Task 2: Cross-compile spike — clear instructions, references existing build script
- Task 3: Scaffold repo — clear instructions, references orw source
- Task 4: Config schema — clear instructions
- Task 5: Image context repo — clear instructions
- Task 6: Build-tools image — clear instructions, references jenkins-values.yaml
- Task 7: MySQL provision — clear instructions
- Task 8-12: CLI core tasks — clear instructions, depend on earlier tasks
- Task 13-19: Jenkins/infra wiring — clear instructions

All tasks have enough context to start. Some require access to other repos, but the plan makes that explicit.

Let me check if there's any issue with the QA scenarios being executable. The QA scenarios generally use:
- Bash (kubectl, docker, crane, mysql, etc.)
- Jenkins REST API
- Signed HMAC curl

These are all concrete tools with concrete steps. Each has an expected result and an evidence file path.

One potential issue: Task 7 QA scenario references `mysql -h <host> -u <user> -p<ref>` — the `<ref>` should probably be a password, but this is just a placeholder in the QA scenario. Not a blocker.

Task 12 QA scenario references "SELECT status FROM runs WHERE key=..." — "key" might not be the exact column name (the schema says idempotency key is composite). But the intent is clear. Not a blocker.

Task 15 says "Configure the GitHub webhooks on the relevant repos (delegable to ultrabot — webhook creation is agent-allowed)". This is a bit vague on WHICH repos exactly, but the context mentions upstream-release and fork/local-push, so it's clear enough. Not a blocker.

Task 19 references "Task 13 Option A (Jenkins POSTs HMAC `/dispatch`)" — but looking at Task 13, it mentions "delegate image build to dispatcher via HMAC (Option A)" in the references. This is consistent.

Overall, I don't see any true blockers. The plan is extensive but executable. The missing files are in other repos that the plan explicitly mentions. The QA scenarios are present for every task.

Wait, I need to double-check something. The plan says in the Context section:
- "DB actually provisioned = Oracle ATP (SQL*Net), NOT MySQL → must provision new MySQL HeatWave"

And Task 7 says:
- "Do NOT use the existing Oracle ATP (wrong protocol) or atlas MariaDB."

This is consistent. No contradiction.

Another thing: The plan mentions "Draft `.omo/drafts/release-watcher-cloudhome.md`" multiple times. Since this file doesn't exist, is that a blocker? Let me look at how critical these draft references are.

In Task 1: "Draft `.omo/drafts/release-watcher-cloudhome.md` 'Permanently human-only gates' section — authoritative list"
In Task 4: "Draft `.omo/drafts/release-watcher-cloudhome.md` 'Minimum abstraction should be project config...' — the field list"
In Task 7: "Draft 'Run-state DB = NEW OCI MySQL HeatWave free-tier' + the lifecycle states list"

The plan includes the key information inline. For example, the "Permanently human-only gates" are listed in Task 1. The field list is described in Task 4. The lifecycle states are listed in Task 7. So the drafts are supplementary, not essential.

I believe this plan is **OKAY**. It has no true blockers. The references to external repos are expected for a multi-repo plan. The missing draft files are supplementary. Every task has clear instructions, references, acceptance criteria, and executable QA scenarios.

Let me write the review.
**[OKAY]**

**Summary**: This is a comprehensive, well-structured multi-repo plan for building a project-agnostic release-watcher pipeline. Every task has clear "What to do" instructions, concrete references (including acknowledging which are in external repos), acceptance criteria, and executable QA scenarios with specific tools, steps, and expected results. The dependency matrix and wave structure are coherent. No contradictions or impossible requirements detected.

**Note for execution**: The `cloudhome/` directory and `.omo/drafts/` files referenced throughout do not exist in the current workspace — this is expected since the plan explicitly states it spans multiple repos (`rustybret/cloudhome`, `rustybret/release-watcher`, `rustybret/opencode-image`). The developer will need access to the `cloudhome` repo to execute infra tasks. The draft references are supplementary; all essential decisions and field lists are inlined in the plan body.

<task_metadata>
session_id: ses_169563831ffehAGsWWk1k17Ad4
task_id: ses_169563831ffehAGsWWk1k17Ad4
subagent: Momus - Plan Critic
</task_metadata>

to continue: task(task_id="ses_169563831ffehAGsWWk1k17Ad4", load_skills=[], run_in_background=false, prompt="...")

[AFT E0 W0 | D2437 U2132 C1764 | T0]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 13.0s)

_Thinking:_

 Momus came back with an okay status, so I'm wrapping up the workflow by marking that todo as complete, removing the draft, and passing control to the start-work handler.

Momus returned **[OKAY]** — the high-accuracy review passed. All gates are now green:

| Gate | Result |
|---|---|
| Metis gap analysis | ✅ applied |
| Oracle phase-1 (interview) | ✅ GO 6/6 |
| Oracle phase-2 (plan compliance) | ✅ GO 7/7 |
| Oracle phase-3 (execution readiness) | ✅ GO 5/5 |
| Momus high-accuracy review | ✅ OKAY |

Finalizing: marking the Momus todo done, deleting the draft, and handing off.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "completed",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "in_progress",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "completed",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "in_progress",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 10.0s)

_Thinking:_

 Now I'm wrapping up by removing the draft file and passing things along.

Finalizing — deleting the draft (its content is now fully captured in the verified plan) and completing the handoff.

**Tool: bash**

**Input:**
```json
{
  "command": "rm -f .omo/drafts/release-watcher-cloudhome.md && echo \"draft deleted\" && ls .omo/drafts/ 2>/dev/null || echo \"(drafts dir empty or gone)\"",
  "description": "Delete the finalized draft file"
}
```

**Output:**
```
draft deleted
orw-multi-fork-ci.md

```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 9.6s)

_Thinking:_

 Now I'm wrapping up by marking the final task complete and handing off the plan. There's an old draft file from the earlier multi-fork architecture discussion that I should mention, though it's not essential to move forward.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Consult Metis for gap analysis (auto-proceed)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Self-review: classify gaps (critical/minor/ambiguous)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Present summary with auto-resolved items and decisions needed",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If decisions needed: wait for user, update plan",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Ask user about high accuracy mode (Momus review)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
      "status": "completed",
      "priority": "high"
    },
    {
      "content": "If high accuracy: Submit to Momus and iterate until OKAY",
      "status": "completed",
      "priority": "medium"
    },
    {
      "content": "Delete draft file and guide user to /start-work release-watcher-v1",
      "status": "completed",
      "priority": "medium"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Consult Metis for gap analysis (auto-proceed)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 1 (interview completeness, requirements clarity, scope boundaries)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Generate work plan to .omo/plans/release-watcher-v1.md",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 2 (plan compliance with constraints, parallelism, acceptance criteria)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Self-review: classify gaps (critical/minor/ambiguous)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Present summary with auto-resolved items and decisions needed",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If decisions needed: wait for user, update plan",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Ask user about high accuracy mode (Momus review)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Oracle verification: phase 3 (plan readiness for execution before high-accuracy or handoff)",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "If high accuracy: Submit to Momus and iterate until OKAY",
    "status": "completed",
    "priority": "medium"
  },
  {
    "content": "Delete draft file and guide user to /start-work release-watcher-v1",
    "status": "completed",
    "priority": "medium"
  }
]
```

---

## Assistant (Prometheus - Plan Builder · Claude Opus 4.8 · 15.7s)

_Thinking:_

 Everything's ready to go—all the validation checks passed, the draft is cleared out, and every task is wrapped up. Now I just need to guide the user toward /start-work to begin.

## Plan Finalized: `release-watcher-v1`

Plan saved to `.omo/plans/release-watcher-v1.md` and fully verified. Draft cleaned up.

**All verification gates passed:**

| Gate | Result |
|---|---|
| Metis gap analysis | ✅ applied |
| Oracle phase-1 (interview completeness) | ✅ GO 6/6 |
| Oracle phase-2 (plan compliance/parallelism) | ✅ GO 7/7 |
| Oracle phase-3 (execution readiness) | ✅ GO 5/5 |
| Momus high-accuracy review | ✅ OKAY |

**What the plan delivers:** A project-agnostic `release-watcher` (forked from `@cortexkit/orw`) running on Jenkins + cloudhome K8s infra, replacing the failed GitHub Actions CI. V1 targets OpenCode end-to-end:

```
webhook → parameterized Jenkins pipeline → AI-merge fork/local + 5 curated PRs
  → build 3 binaries (linux amd64/arm64 + darwin-arm64)
  → run-state in new OCI MySQL HeatWave
  → push opencode image to OCIR
```

**Structure:** 19 tasks across 4 waves + 4-reviewer final wave.
- **Wave 0** (1 task): human-only prereqs (mint PATs, seed scoped creds)
- **Wave 1** (6 tasks): cross-compile spike, scaffold repos, config schema, build-tools image, MySQL provision
- **Wave 2** (6 tasks): release-watcher CLI core (config/merge/build/state) + Jenkinsfile
- **Wave 3** (6 tasks): agent wiring, webhook triggers, archival, image build → OCIR
- Critical path: `Task 1 → 2 → 11 → 13 → 15 → e2e → 19`

**The safety spine (from Metis + Oracle):**
- All infra mutations land as **ultrabot PRs** (human-merged), never direct apply
- **Least-privilege** scoped creds; local Mac ORW stays untouched in parallel
- Cross-compile darwin = early **de-risk spike** with documented NO-GO fallback
- **Fail-closed** on merge conflict, **fail-open** on DB outage; idempotency on triggers; curated-PR merge emits provenance/diff/conflict evidence
- Stops at "artifact built / image pushed to OCIR" — **no deploy config**

**To begin execution:**
```
/start-work release-watcher-v1
```

One flag for whoever runs it: this is a multi-repo plan touching `rustybret/release-watcher` (new), `rustybret/opencode-image` (new), and `rustybret/cloudhome` (via ultrabot PRs). Task 1's human gates (PATs + cred seeding) must clear before the Wave-1 infra tasks can proceed — it's the one true blocking prerequisite.

---

## User

---

## Assistant (Atlas - Plan Executor · MiMo V2.5 Free · 28.1s)

_Thinking:_

The boulder complete nudge for `orw-integration` has fired again (this is the 5th time it's appeared). I've already printed the ORCHESTRATION COMPLETE summary multiple times (at §836§ and other instances). This is a duplicate. I should not re-print the summary.

The user's actual message is just the system nudge + a deferred note. The deferred note is just a system reminder. There's nothing new to do here - the `orw-integration` plan is complete and verified. The `release-watcher-v1` plan has also been finalized and handed off.

I should briefly acknowledge the duplicate nudge and wait for the user's next task.

Duplicate nudge — `orw-integration` summary already printed (, ). Not re-printing.

**Current state:** `release-watcher-v1` plan is finalized and ready for execution at `.omo/plans/release-watcher-v1.md`. All 5 verification gates passed (Metis + 3 Oracle phases + Momus OKAY). Standing by for `/start-work release-watcher-v1` or your next task.

---

