#!/usr/bin/env python3
"""
format-harmony.py

Converts sessions.jsonl (OpenAI chat format, from extract-session.ts) into
Harmony-encoded JSONL ready for Unsloth fine-tuning of gpt-oss-120b.

Usage:
    python3 format-harmony.py sessions.jsonl [options]

Options:
    --output <path>         Output JSONL (default: harmony-dataset.jsonl)
    --reasoning-effort <e>  low | medium | high (default: medium)
    --raw-text              Emit pre-rendered harmony text instead of messages array
    --max-tool-chars <n>    Truncate tool outputs to N chars (default: 4000)
    --system-prompt <path>  Path to custom system prompt file
    --help                  Show this help

Requirements:
    pip install unsloth_zoo datasets
"""

import json
import sys
import argparse
from pathlib import Path

def parse_args():
    p = argparse.ArgumentParser(add_help=False)
    p.add_argument("input", nargs="?", default="sessions.jsonl")
    p.add_argument("--output", default="harmony-dataset.jsonl")
    p.add_argument("--reasoning-effort", default="medium",
                   choices=["low", "medium", "high"])
    p.add_argument("--raw-text", action="store_true")
    p.add_argument("--max-tool-chars", type=int, default=4000)
    p.add_argument("--max-output-chars", type=int, default=131072)
    p.add_argument("--system-prompt", default=None)
    p.add_argument("--agent", action="append", metavar="NAME",
                   help="Include only sessions with this agent (repeatable)")
    p.add_argument("--exclude-agent", action="append", metavar="NAME",
                   help="Exclude sessions with this agent (repeatable)")
    p.add_argument("--model-family", action="append", metavar="PREFIX",
                   help="Include only sessions whose model starts with PREFIX (repeatable)")
    p.add_argument("--stats", action="store_true",
                   help="Print dataset stats by agent/model and exit without writing output")
    p.add_argument("--help", action="store_true")
    return p.parse_args()

DEFAULT_SYSTEM = (
    "You are Sisyphus, a powerful AI agent with orchestration capabilities from OhMyOpenCode. "
    "You are a Senior Software Engineer working on the OpenCode project and related tooling. "
    "You have deep expertise in TypeScript, Effect, Bun, shell scripting, "
    "GitHub Actions, Kubernetes, and system-level AI agent orchestration. "
    "You work autonomously, delegate to subagents, and maintain high code quality.\n\n"
    "# Reasoning effort\n"
    "Use reasoning_effort=medium\n\n"
    "# Valid channels: analysis, commentary, final"
)

def sanitize(text: str) -> str:
    return "".join(
        c for c in text.replace("\x00", "")
        if c >= " " or c in "\n\r\t"
    ).encode("utf-8", errors="replace").decode("utf-8", errors="replace")

def truncate_tool(content: str, max_chars: int) -> str:
    content = sanitize(content)
    if len(content) <= max_chars:
        return content
    half = max_chars // 2
    return content[:half] + f"\n... [truncated {len(content) - max_chars} chars] ...\n" + content[-half:]

def normalize_messages(messages: list[dict], max_tool_chars: int) -> list[dict]:
    out = []
    for m in messages:
        role = m.get("role", "")
        content = sanitize(str(m.get("content") or ""))

        if role == "system":
            out.append({"role": "system", "content": content})
            continue

        if role == "user":
            if content:
                out.append({"role": "user", "content": content})
            continue

        if role == "assistant":
            tool_calls = m.get("tool_calls")
            if tool_calls:
                for tc in tool_calls:
                    fn = tc.get("function", {})
                    out.append({
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [{
                            "id": tc.get("id", "call_unknown"),
                            "type": "function",
                            "function": {
                                "name": fn.get("name", "unknown_tool"),
                                "arguments": truncate_tool(str(fn.get("arguments", "")), max_tool_chars),
                            },
                        }],
                    })
            elif content:
                out.append({"role": "assistant", "content": truncate_tool(content, max_tool_chars)})
            continue

        if role == "tool":
            truncated = truncate_tool(content, max_tool_chars)
            entry: dict = {"role": "tool", "content": truncated}
            if m.get("tool_call_id"):
                entry["tool_call_id"] = m["tool_call_id"]
            if m.get("name"):
                entry["name"] = m["name"]
            out.append(entry)
            continue

    return out

def render_harmony_text(messages: list[dict], reasoning_effort: str = "medium") -> str:
    """
    Render messages into raw Harmony token format.
    Used when --raw-text is specified; otherwise use encode_conversations_with_harmony.

    Harmony token structure:
      <|start|>{role}[<|channel|>{channel}][ to={target}][<|constrain|>{constraint}]
      <|message|>{content}
      <|end|>  (stored)  OR  <|return|> (generation target on last assistant turn)
    """
    lines = []
    assistant_turns = [m for m in messages if m["role"] == "assistant"]
    last_assistant_idx = None
    for i, m in enumerate(messages):
        if m["role"] == "assistant":
            last_assistant_idx = i

    for i, m in enumerate(messages):
        role = m["role"]
        content = m.get("content", "")

        if role == "system":
            lines.append(f"<|start|>system<|message|>{content}<|end|>")

        elif role == "user":
            lines.append(f"<|start|>user<|channel|>final<|message|>{content}<|end|>")

        elif role == "assistant":
            tool_calls = m.get("tool_calls")
            if tool_calls:
                for tc in tool_calls:
                    fn = tc.get("function", {})
                    name = fn.get("name", "unknown_tool")
                    arguments = fn.get("arguments", "")
                    lines.append(f"<|start|>assistant<|channel|>commentary to=functions.{name} <|constrain|>json<|message|>{arguments}<|call|>")
            else:
                is_last = i == last_assistant_idx
                end_token = "<|return|>" if is_last else "<|end|>"
                lines.append(f"<|start|>assistant<|channel|>final<|message|>{content}{end_token}")

        elif role == "tool":
            name = m.get("name", "tool")
            lines.append(f"<|start|>functions.{name} to=assistant<|channel|>commentary<|message|>{content}<|end|>")

    return "\n".join(lines)

def format_session(session: dict, args) -> dict | None:
    messages = session.get("messages", [])
    if not messages:
        return None

    if not messages or messages[0].get("role") != "system":
        system_content = DEFAULT_SYSTEM
        if args.system_prompt:
            system_content = Path(args.system_prompt).read_text()
        messages = [{"role": "system", "content": system_content}] + messages

    clean = normalize_messages(messages, args.max_tool_chars)

    has_user = any(m["role"] == "user" for m in clean)
    has_asst = any(m["role"] == "assistant" for m in clean)
    if not has_user or not has_asst:
        return None

    if args.raw_text:
        text = render_harmony_text(clean, args.reasoning_effort)
        if len(text) > args.max_output_chars:
            return None
        return {"text": text}

    try:
        from unsloth_zoo import encode_conversations_with_harmony  # type: ignore
        encoded = encode_conversations_with_harmony(
            clean,
            reasoning_effort=args.reasoning_effort,
            add_generation_prompt=False,
        )
        if len(encoded) > args.max_output_chars:
            return None
        return {"text": encoded}
    except ImportError:
        return {"messages": clean}

def main() -> None:
    args = parse_args()

    if args.help:
        print(__doc__)
        sys.exit(0)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} not found", file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output)

    agent_include = set(args.agent) if args.agent else None
    agent_exclude = set(args.exclude_agent) if args.exclude_agent else set()
    model_prefixes = args.model_family or []

    if args.stats:
        from collections import Counter
        by_agent: Counter = Counter()
        by_model: Counter = Counter()
        total = 0
        for raw in input_path.open(encoding="utf-8"):
            if not raw.strip():
                continue
            s = json.loads(raw)
            by_agent[s.get("agent") or "unknown"] += 1
            by_model[s.get("model") or "unknown"] += 1
            total += 1
        print(f"Total sessions: {total}\n")
        print("By agent:")
        for k, v in by_agent.most_common():
            print(f"  {k or 'unknown':<35} {v}")
        print("\nBy model:")
        for k, v in by_model.most_common():
            print(f"  {k or 'unknown':<55} {v}")
        sys.exit(0)

    exported = 0
    skipped = 0

    with output_path.open("w") as out:
        for raw in input_path.open(encoding="utf-8"):
            if not raw.strip():
                continue
            session = json.loads(raw)

            agent = session.get("agent") or ""
            model = session.get("model") or ""

            if agent_include and agent not in agent_include:
                skipped += 1
                continue
            if agent in agent_exclude:
                skipped += 1
                continue
            if model_prefixes and not any(model.startswith(p) for p in model_prefixes):
                skipped += 1
                continue

            try:
                result = format_session(session, args)
            except Exception as e:
                print(f"\n  Warning: skipping session {session.get('session_id','?')}: {e}", file=sys.stderr)
                skipped += 1
                continue
            if result is None:
                skipped += 1
                continue
            try:
                out_line = json.dumps(result, ensure_ascii=True)
                out.write(out_line + "\n")
            except (TypeError, ValueError) as e:
                print(f"\n  Warning: JSON encode failed for session {session.get('session_id','?')}: {e}", file=sys.stderr)
                skipped += 1
                continue
            exported += 1
            print(f"\rConverted {exported} sessions ({skipped} skipped)...", end="", flush=True)

    print(f"\nDone. {exported} sessions → {output_path}")
    if skipped:
        print(f"  Skipped {skipped} sessions")
    print()
    print("To load in Unsloth:")
    print("  from datasets import load_dataset")
    print(f'  ds = load_dataset("json", data_files="{output_path}", split="train")')
    print("  # Then use standard Unsloth SFT trainer with the 'text' column")

if __name__ == "__main__":
    main()
