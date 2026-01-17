---
title: AGENTS.md Support in Claude Code
date: 2025-09-16
category: "Claude Code"
tags: ["Claude Code", "AGENTS.md"]
amazonAssociate: true
amazonProductIds:
  - "実践Claude Code入門"
  - "Claude CodeによるAI駆動開発"
---

## TL;DR

As of 2025-09-24, the symbolic link recommended by [AGENTS.md](https://agents.md/) is the safest bet.

```shell
ln -s AGENTS.md CLAUDE.md
```

### Update on 2025-11-06

https://code.claude.com/docs/en/claude-code-on-the-web#best-practices

> **Document requirements**: Clearly specify dependencies and commands in your `CLAUDE.md` file. If you have an `AGENTS.md` file, you can source it in your CLAUDE.md using `@AGENTS.md` to maintain a single source of truth.

The official Claude Code docs recommend referencing `@AGENTS.md` inside `CLAUDE.md`.

```md CLAUDE.md
@AGENTS.md
```

## AGENTS.md

OpenAI published [AGENTS.md](https://agents.md/) on 2025/08/20.
The site aims to promote a standard format for coding-agent instructions.

As far as I can tell, the format only specifies:

- The filename is `AGENTS.md`
- It is Markdown (as the extension implies)

## Supported software

The AI coding agents and tools that support `AGENTS.md` as of 2025/08/20 are:

- [Codex from OpenAI](https://openai.com/ja-JP/codex/)
- [Amp](https://sourcegraph.com/amp)
- [Jules](https://jules.google/)
- [Cursor](https://cursor.com/ja)
- [Factory](https://www.factory.ai/)
- [RooCode](https://roocode.com/)
- [Aider](https://aider.chat/)
- [Gemini CLI](https://google-gemini.github.io/gemini-cli/)
- [Kilo Code](https://kilocode.ai/)
- [opencode](https://opencode.ai/)
- [Phoenix](https://www.phoenix-ai.com/)
- [Zed](https://zed.dev/)
- [Semgrep](https://semgrep.dev/)
- [Wrap](https://www.warp.dev/warp-ai)
- [Coding Agent from GitHub Copilot](https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-coding-agent)
- [VS Code](https://code.visualstudio.com/)
- [ONA](https://theona.ai/)
- [Devin from Cognition](https://devin.ai/)

## Anthropic's absence

A current problem in the AGENTS.md ecosystem is the absence of Anthropic,
which develops [Claude Code](https://docs.claude.com/ja/docs/claude-code/overview), arguably the most widely used CLI tool.
In Claude Code, instructions equivalent to AGENTS.md are written in `CLAUDE.md`.
Gemini CLI had also only read `GEMINI.md`, but it now supports AGENTS.md.
Claude Code, however, shows no signs of supporting AGENTS.md yet.

## AGENTS.md support in Claude Code

The feature request is discussed in [Feature Request: Support AGENTS.md. · Issue #6235 · anthropics/claude-code](https://github.com/anthropics/claude-code/issues/6235),
but there are no visible moves toward support.

## Workarounds

The issue lists three workarounds:

- [Add an instruction to read `AGENTS.md`](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3217884068)
- [Symbolic link](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3274586171)
- [Hooks](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3218728961)

They are easy to try, so here is a brief explanation of each.

### Instruct Claude Code to read `AGENTS.md`

Claude Code can reference a file by writing its path after `@`.
Use that in `CLAUDE.md` like this.

```markdown CLAUDE.md
@AGENTS.md
```

- [Common workflows - Claude Docs](https://docs.claude.com/en/docs/claude-code/common-workflows#reference-files-and-directories)

### Symbolic link

Rename `CLAUDE.md` to `AGENTS.md` and create a symlink.

```shell
mv CLAUDE.md AGENTS.md && ln -s AGENTS.md CLAUDE.md
```

This workaround is also listed on the official AGENTS.md site.

### Hooks

Claude Code has a feature called [hooks](https://docs.claude.com/ja/docs/claude-code/hooks).
It lets you run arbitrary actions on events such as startup, tool usage, or before/after file edits.

Common examples include:

- Running linters and code formatters
- Running tests
- Blocking specific commands
- Customizing notifications
- Logging Claude Code activity

- [You should configure Claude Code Hooks - Learn at Home](https://syu-m-5151.hatenablog.com/entry/2025/07/14/105812)
- [Explaining Claude Code hooks | DevelopersIO](https://dev.classmethod.jp/articles/claude-code-hooks-basic-usage/)
- [Run formatter after task completion with Claude Code Hooks](https://azukiazusa.dev/blog/claude-code-hooks-run-formatter/)
- [Send desktop notifications on task completion with Claude Code Hooks](https://zenn.dev/hashiiiii/articles/11e4ab6b357481)

Here we use hooks so that when Claude Code starts, it includes `AGENTS.md` in the context.

First, add the following to `.claude/settings.json`.

```json .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/append_agentsmd_context.sh"
          }
        ]
      }
    ]
  }
}
```

This hook runs `.claude/hooks/append_agentsmd_context.sh` in the project directory at startup.

Then create `.claude/hooks/append_agentsmd_context.sh` as follows.

```shell .claude/hooks/append_agentsmd_context.sh
#!/bin/bash

# Find all AGENTS.md files in current directory and subdirectories
# This is a temporay solution for case that Claude Code not satisfies with AGENTS.md usage case.
echo "=== AGENTS.md Files Found ==="
find "$CLAUDE_PROJECT_DIR" -name "AGENTS.md" -type f | while read -r file; do
    echo "--- File: $file ---"
    cat "$file"
    echo ""
done
```

This outputs the following to stdout whenever an `AGENTS.md` file exists:

```txt
--- FILE: AGENTS.md ---
<AGENTS.md content>
```

So the goal of including `AGENTS.md` in Claude Code's context is achieved.

## Conclusion

As of 2025/09/17, this article introduced three ways to use AGENTS.md with Claude Code.
Using hooks seems like too much work for the benefit.
Claude Code may be treating `CLAUDE.md` specially (you can probably tell by reading its code),
so the hook method may not get the same benefits.

Therefore, it seems best for now to either instruct `CLAUDE.md` to read `AGENTS.md` or create a symlink.

### Addendum

When using the `@AGENTS.md` approach in `CLAUDE.md`, running `/init` writes instructions into `CLAUDE.md`,
so you must reflect changes from `AGENTS.md` and then revert `CLAUDE.md` each time.
I don’t run `/init` often, but it’s still a hassle, so a symlink feels safer.

## References

- [This AGENTS.md is no good](https://zenn.dev/tkithrta/articles/898bf6c84f8584)
- [Overview of AGENTS.md｜npaka](https://note.com/npaka/n/nd1258df2853c)
