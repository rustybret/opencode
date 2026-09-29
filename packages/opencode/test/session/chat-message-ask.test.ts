import { ConfigV1 } from "@opencode-ai/core/v1/config/config"
import { SessionV1 } from "@opencode-ai/core/v1/session"
import { Database } from "@opencode-ai/core/database/database"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
import { SessionProjector } from "@opencode-ai/core/session/projector"
import { eq } from "drizzle-orm"
import { EventV2Bridge } from "@/event-v2-bridge"
import { expect } from "bun:test"
import { Cause, Deferred, Duration, Effect, Exit, Fiber, Layer } from "effect"
import { Agent as AgentSvc } from "../../src/agent/agent"
import { BackgroundJob } from "@/background/job"
import { Command } from "../../src/command"
import { Config } from "@/config/config"
import { LSP } from "@/lsp/lsp"
import { MCP } from "../../src/mcp"
import { Permission } from "../../src/permission"
import { Plugin } from "../../src/plugin"
import { Provider as ProviderSvc } from "@/provider/provider"
import { Env } from "../../src/env"
import { Git } from "../../src/git"
import { Image } from "../../src/image/image"
import { Question } from "../../src/question"
import { Todo } from "../../src/session/todo"
import { Session } from "@/session/session"
import { SessionMessageTable } from "@opencode-ai/core/session/sql"
import { LLM } from "../../src/session/llm"
import { MessageV2 } from "../../src/session/message-v2"
import { FSUtil } from "@opencode-ai/core/fs-util"
import { SessionCompaction } from "../../src/session/compaction"
import { SessionSummary } from "../../src/session/summary"
import { Instruction } from "../../src/session/instruction"
import { SessionProcessor } from "../../src/session/processor"
import { SessionPrompt } from "../../src/session/prompt"
import { SessionRevert } from "../../src/session/revert"
import { SessionRunState } from "../../src/session/run-state"
import { MessageID, PartID, SessionID } from "../../src/session/schema"
import { SessionStatus } from "../../src/session/status"
import { Skill } from "../../src/skill"
import { SystemPrompt } from "../../src/session/system"
import { Snapshot } from "../../src/snapshot"
import { ToolRegistry } from "@/tool/registry"
import { Truncate } from "@/tool/truncate"
import { CrossSpawnSpawner } from "@opencode-ai/core/cross-spawn-spawner"
import { Ripgrep } from "@opencode-ai/core/ripgrep"
import { Format } from "../../src/format"
import { TestInstance } from "../fixture/fixture"
import { pollWithTimeout, testEffect } from "../lib/effect"
import { RuntimeFlags } from "@/effect/runtime-flags"
import { PermissionV1 } from "@opencode-ai/core/v1/permission"
import { InstanceRef } from "@/effect/instance-ref"

import { InstanceBootstrap } from "../../src/project/bootstrap"
import { InstanceStore } from "../../src/project/instance-store"
import { AppNodeBuilder } from "@opencode-ai/core/effect/app-node-builder"

const noopBootstrap = Layer.succeed(InstanceBootstrap.Service, InstanceBootstrap.Service.of({ run: Effect.void }))

const summary = Layer.succeed(
  SessionSummary.Service,
  SessionSummary.Service.of({
    summarize: () => Effect.void,
    diff: () => Effect.succeed([]),
    computeDiff: () => Effect.succeed([]),
  }),
)

const lsp = Layer.succeed(
  LSP.Service,
  LSP.Service.of({
    init: () => Effect.void,
    status: () => Effect.succeed([]),
    hasClients: () => Effect.succeed(false),
    touchFile: () => Effect.void,
    diagnostics: () => Effect.succeed({}),
    hover: () => Effect.succeed(undefined),
    definition: () => Effect.succeed([]),
    references: () => Effect.succeed([]),
    implementation: () => Effect.succeed([]),
    documentSymbol: () => Effect.succeed([]),
    workspaceSymbol: () => Effect.succeed([]),
    prepareCallHierarchy: () => Effect.succeed([]),
    incomingCalls: () => Effect.succeed([]),
    outgoingCalls: () => Effect.succeed([]),
  }),
)

const mcp = Layer.succeed(
  MCP.Service,
  MCP.Service.of({
    status: () => Effect.succeed({}),
    clients: () => Effect.succeed({}),
    instructions: () => Effect.succeed([]),
    tools: () => Effect.succeed({}),
    prompts: () => Effect.succeed({}),
    resources: () => Effect.succeed({}),
    resourceTemplates: () => Effect.succeed({}),
    add: () => Effect.succeed({ status: { status: "disabled" as const } }),
    connect: () => Effect.void,
    disconnect: () => Effect.void,
    getPrompt: () => Effect.succeed(undefined),
    readResource: () => Effect.succeed(undefined),
    startAuth: () => Effect.die("unexpected MCP auth"),
    authenticate: () => Effect.die("unexpected MCP auth"),
    finishAuth: () => Effect.die("unexpected MCP auth"),
    removeAuth: () => Effect.void,
    supportsOAuth: () => Effect.succeed(false),
    hasStoredTokens: () => Effect.succeed(false),
    getAuthStatus: () => Effect.succeed("not_authenticated" as const),
  }),
)

const runtimeFlags = RuntimeFlags.layer({ experimentalEventSystem: true })

const promptRoot = LayerNode.group([
  SessionPrompt.node,
  Session.node,
  SessionProjector.node,
  MessageV2.node,
  Snapshot.node,
  LLM.node,
  Env.node,
  AgentSvc.node,
  Command.node,
  Permission.node,
  Plugin.node,
  Config.node,
  ProviderSvc.node,
  LSP.node,
  MCP.node,
  FSUtil.node,
  BackgroundJob.node,
  SessionStatus.node,
  SessionRunState.node,
  Database.node,
  EventV2Bridge.node,
  Question.node,
  Todo.node,
  ToolRegistry.node,
  Skill.node,
  Git.node,
  Ripgrep.node,
  Format.node,
  Truncate.node,
  SessionProcessor.node,
  Image.node,
  SessionCompaction.node,
  SessionRevert.node,
  Instruction.node,
  SystemPrompt.node,
  CrossSpawnSpawner.node,
  RuntimeFlags.node,
  InstanceStore.node,
])

const replacements = [
  [SessionSummary.node, summary],
  [LSP.node, lsp],
  [MCP.node, mcp],
  [RuntimeFlags.node, runtimeFlags],
  [InstanceStore.bootstrapNode, noopBootstrap],
] as const

const env = AppNodeBuilder.build(promptRoot, replacements as any)
const it = testEffect(env)

const waitForPending = (count: number) =>
  Effect.gen(function* () {
    const permission = yield* Permission.Service
    return yield* pollWithTimeout(
      Effect.gen(function* () {
        const list = yield* permission.list()
        return list.length === count ? list : undefined
      }),
      `timed out waiting for ${count} pending permission request(s)`,
      "3 seconds",
    )
  })

const cfg = {
  provider: {
    test: {
      name: "Test",
      id: "test",
      env: [],
      npm: "@ai-sdk/openai-compatible",
      models: {
        "test-model": {
          id: "test-model",
          name: "Test Model",
          attachment: false,
          reasoning: false,
          temperature: false,
          tool_call: true,
          release_date: "2025-01-01",
          limit: { context: 100000, output: 10000 },
          cost: { input: 0, output: 0 },
          options: {},
        },
      },
      options: {
        apiKey: "test-key",
        baseURL: "http://localhost:1/v1",
      },
    },
  },
}

it.instance(
  "chat.message hook receives awaitable ask and handles reply=once",
  () =>
    Effect.gen(function* () {
      const prompt = yield* SessionPrompt.Service
      const sessions = yield* Session.Service
      const permission = yield* Permission.Service
      const plugin = yield* Plugin.Service

      const inst = yield* InstanceRef
      console.error("IN TEST, inst is:", inst?.directory)

      const chat = yield* sessions.create({
        title: "Test Chat",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      let askCallCount = 0
      const hooks = yield* plugin.list()
      hooks.push({
        "chat.message": async (input, output) => {
          console.error("HOOK CALLED, ask is:", typeof (input as any).ask)
          askCallCount++
          expect(input.sessionID).toBe(chat.id)
          expect(typeof (input as any).ask).toBe("function")
          try {
            console.error("CALLING ASK")
            await (input as any).ask({
              permission: "plugin_gate",
              patterns: ["config_check"],
              always: ["config_check"],
              metadata: { check: "valid" },
            })
            console.error("ASK RESOLVED")
          } catch (err) {
            console.error("ASK REJECTED:", err)
          }
        },
      })

      // 1. First prompt starts; hook calls ask() and stays pending
      const fiber1 = yield* prompt
        .prompt({
          sessionID: chat.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "prompt 1" }],
        })
        .pipe(
          Effect.tapCause((c) => Effect.sync(() => console.error("PROMPT DEFECT:", Cause.pretty(c)))),
          Effect.forkScoped,
        )

      const pending1 = yield* waitForPending(1)
      expect(pending1[0].permission).toBe("plugin_gate")
      expect(pending1[0].patterns).toEqual(["config_check"])
      expect(pending1[0].sessionID).toBe(chat.id)

      // Reply once -> resolves fiber1
      yield* permission.reply({ requestID: pending1[0].id, reply: "once" })
      const msg1 = yield* Fiber.join(fiber1)
      expect(msg1.info.role).toBe("user")
      expect(askCallCount).toBe(1)

      // 2. Second prompt in same session must ask again because reply was "once"
      const fiber2 = yield* prompt
        .prompt({
          sessionID: chat.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "prompt 2" }],
        })
        .pipe(Effect.forkScoped)

      const pending2 = yield* waitForPending(1)
      expect(pending2[0].permission).toBe("plugin_gate")
      expect(askCallCount).toBe(2)

      yield* permission.reply({ requestID: pending2[0].id, reply: "once" })
      yield* Fiber.join(fiber2)
    }),
  { git: true, config: cfg },
)

it.instance(
  "chat.message hook reply=reject fails pre-save and prevents saving user message",
  () =>
    Effect.gen(function* () {
      const prompt = yield* SessionPrompt.Service
      const sessions = yield* Session.Service
      const permission = yield* Permission.Service
      const plugin = yield* Plugin.Service
      const database = yield* Database.Service

      const chat = yield* sessions.create({
        title: "Test Reject",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      const hooks = yield* plugin.list()
      hooks.push({
        "chat.message": async (input) => {
          await (input as any).ask({
            permission: "plugin_gate",
            patterns: ["deny_check"],
            always: ["deny_check"],
            metadata: {},
          })
        },
      })

      const fiber = yield* prompt
        .prompt({
          sessionID: chat.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "should not be saved" }],
        })
        .pipe(Effect.forkScoped)

      const pending = yield* waitForPending(1)
      yield* permission.reply({ requestID: pending[0].id, reply: "reject" })

      const exit = yield* Fiber.await(fiber)
      expect(Exit.isFailure(exit)).toBe(true)

      // Verify no message was saved in database
      const { db } = yield* Database.Service
      const savedMessages = yield* db
        .select()
        .from(SessionMessageTable)
        .where(eq(SessionMessageTable.session_id, chat.id))
      expect(savedMessages).toHaveLength(0)
    }),
  { git: true },
)

it.instance(
  "chat.message hook reply=always isolates to session (same session auto-allows, new session asks again)",
  () =>
    Effect.gen(function* () {
      const prompt = yield* SessionPrompt.Service
      const sessions = yield* Session.Service
      const permission = yield* Permission.Service
      const plugin = yield* Plugin.Service

      const sessionA = yield* sessions.create({
        title: "Session A",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      const sessionB = yield* sessions.create({
        title: "Session B",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      let askedCount = 0
      const hooks = yield* plugin.list()
      hooks.push({
        "chat.message": async (input) => {
          askedCount++
          await (input as any).ask({
            permission: "plugin_isolated",
            patterns: ["pattern_a"],
            always: ["pattern_a"],
            metadata: {},
          })
        },
      })

      // 1. Session A prompt 1 -> asks, reply always
      const fiberA1 = yield* prompt
        .prompt({
          sessionID: sessionA.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "A1" }],
        })
        .pipe(Effect.forkScoped)

      const pendingA = yield* waitForPending(1)
      expect(pendingA[0].sessionID).toBe(sessionA.id)
      yield* permission.reply({ requestID: pendingA[0].id, reply: "always" })
      yield* Fiber.join(fiberA1)
      expect(askedCount).toBe(1)

      // 2. Session A prompt 2 -> should be auto-approved (does NOT ask again)
      const msgA2 = yield* prompt.prompt({
        sessionID: sessionA.id,
        agent: "build",
        noReply: true,
        parts: [{ type: "text", text: "A2" }],
      })
      expect(msgA2.info.role).toBe("user")
      // Hook ran (askedCount became 2), but ask() resolved immediately without adding to pending list
      expect(askedCount).toBe(2)
      const listAfterA2 = yield* permission.list()
      expect(listAfterA2).toHaveLength(0)

      // 3. Session B prompt 1 -> MUST ASK AGAIN (session isolation)!
      const fiberB1 = yield* prompt
        .prompt({
          sessionID: sessionB.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "B1" }],
        })
        .pipe(Effect.forkScoped)

      const pendingB = yield* waitForPending(1)
      expect(pendingB[0].sessionID).toBe(sessionB.id)
      expect(askedCount).toBe(3)

      yield* permission.reply({ requestID: pendingB[0].id, reply: "once" })
      yield* Fiber.join(fiberB1)
    }),
  { git: true },
)

it.instance(
  "chat.message cancellation cleans up pending permission request",
  () =>
    Effect.gen(function* () {
      const prompt = yield* SessionPrompt.Service
      const sessions = yield* Session.Service
      const permission = yield* Permission.Service
      const plugin = yield* Plugin.Service

      const chat = yield* sessions.create({
        title: "Test Cancel",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      const hooks = yield* plugin.list()
      hooks.push({
        "chat.message": async (input) => {
          await (input as any).ask({
            permission: "plugin_cancel_test",
            patterns: ["cancel_pattern"],
            always: ["cancel_pattern"],
            metadata: {},
          })
        },
      })

      const fiber = yield* prompt
        .prompt({
          sessionID: chat.id,
          agent: "build",
          noReply: true,
          parts: [{ type: "text", text: "will be cancelled" }],
        })
        .pipe(Effect.forkScoped)

      const pending = yield* waitForPending(1)
      expect(pending[0].sessionID).toBe(chat.id)

      // Cancel the session
      yield* prompt.cancel(chat.id)

      // Pending permission should be cleaned up / rejected, not left orphaned
      const remaining = yield* permission.list()
      expect(remaining.filter((p) => p.sessionID === chat.id)).toHaveLength(0)

      const exit = yield* Fiber.await(fiber)
      expect(Exit.isFailure(exit)).toBe(true)
    }),
  { git: true },
)

it.instance(
  "existing chat.message hook ignoring ask maintains pre-save hook ordering and payload",
  () =>
    Effect.gen(function* () {
      const prompt = yield* SessionPrompt.Service
      const sessions = yield* Session.Service
      const plugin = yield* Plugin.Service

      const chat = yield* sessions.create({
        title: "Test Compatibility",
        permission: [{ permission: "*", pattern: "*", action: "allow" }],
      })

      let observedSessionID: string | undefined
      let observedPartText: string | undefined
      const hooks = yield* plugin.list()
      hooks.push({
        // Existing plugin hook: doesn't know about ask, mutates parts
        "chat.message": async (input, output) => {
          observedSessionID = input.sessionID
          observedPartText = (output.parts[0] as any)?.text
          // Pre-save transformation
          output.parts.push({
            id: PartID.ascending(),
            sessionID: input.sessionID,
            messageID: input.messageID ?? MessageID.ascending(),
            type: "text",
            text: "appended by plugin",
          } as any)
        },
      })

      const result = yield* prompt.prompt({
        sessionID: chat.id,
        agent: "build",
        noReply: true,
        parts: [{ type: "text", text: "original text" }],
      })

      expect(observedSessionID).toBe(chat.id)
      expect(observedPartText).toBe("original text")
      expect(result.parts.some((p) => (p as any).text === "appended by plugin")).toBe(true)
    }),
  { git: true },
)
