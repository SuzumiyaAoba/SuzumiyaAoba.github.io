---
title: Looking into Spec-Driven Development
date: 2025-11-16
category: "Programming"
tags: ["AI", "Claude Code", "Codex", "Kiro", "Spec-Driven Development"]
---

I looked into spec-driven development, which I've been seeing on X (formerly Twitter), Qiita, and Zenn for a while.

## Spec-Driven Development

I’ve recently started seeing the term [Spec-Driven Development (SDD)](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html).
In today’s context, it refers to a development method where you use AI (LLMs) to create a specification and then generate code based on it.
Since traditional development is also based on specs, the name may be questionable, but it has stuck.

When developing with AI coding agents, you often encounter results that don't match your goals due to vague prompts.
To solve that, SDD proposes placing a clear specification at the center: rather than giving ambiguous prompts,
you provide concrete specs, reduce the AI’s need to infer intent,
increase the chance of generating intended code, and reduce trial-and-error and rework.

As a further development, people are exploring approaches where specs are formally described from LLM dialogues
and then combined with formal verification methods—especially in embedded software, where correctness is critical.

## Major plugins, IDEs, and services

Below is a list of plugins, editors, and services that claim "spec-driven development" as of 2025/11/16.

| Release | Plugin/Editor/Service                                   | Developer                                    |
| ------- | ------------------------------------------------------- | -------------------------------------------- |
| 2025/07 | [Kiro](https://kiro.dev/)                               | Amazon.com, Inc.                             |
| 2025/07 | [cc-sdd](https://github.com/gotalab/cc-sdd)             | [gotlab](https://github.com/gotalab) (solo)  |
| 2025/07 | [Tsumiki](https://github.com/classmethod/tsumiki)       | Classmethod, Inc.                            |
| 2025/09 | [Spec Kit](https://github.com/github/spec-kit)          | GitHub, Inc.                                 |
| 2025/09 | [Spec Workflow MCP](https://github.com/Pimzino/spec-workflow-mcp) | [Pimzino](https://github.com/Pimzino) (solo) |
| 2025/07 | [CodeBuddy](https://www.codebuddy.ai/)                  | Tencent Holdings Ltd.                        |
| 2025/09 | [Tessl](https://tessl.io/)                              | Tessl AI Ltd                                 |
| 2025/04 | [Acsim](https://ai.acsim.app/)                          | ROUTE06                                      |

There are other plugins not listed here, but I excluded those with unclear developers or very few GitHub stars.

## Kiro

[Kiro](https://kiro.dev/) is an editor developed by Amazon.
Like [Cursor](https://cursor.com/ja), it is based on VS Code, so the UI is familiar to VS Code users.
You can also install VS Code extensions, so it is a good option for VS Code users who want to try SDD.

A paid plan is likely required for full development, but the Free plan provides 50 credits per month (as of 2025/11/16).
So why not try it for now?
While writing this article, I already had Claude Code build one application for me.
I want to see how far 50 credits go and use the free quota each month to do requirements, spec definition, and task breakdown.

## cc-sdd

[cc-sdd](https://github.com/gotalab/cc-sdd) is developed by a Japanese developer.
When Kiro was announced, many people may have learned about SDD from a [Zenn article](https://zenn.dev/gotalab/articles/3db0621ce3d6d2).
It received many likes and even entered Zenn's popular article rankings.

cc-sdd is a Claude Code plugin that recreates Kiro's SDD experience.
There are probably more Claude Code users than Kiro users, and more Cursor users than VS Code users.
So if installing a new editor is a hassle or company rules prevent it, this is a good alternative.
For those on Claude Pro or Max, it’s also attractive because you can do SDD without extra cost.

## Spec Kit

[Spec Kit](https://github.com/github/spec-kit) is a toolkit for SDD published by GitHub.
It generates instructions, documents, and settings to drive SDD in existing AI coding agents (GitHub Copilot, Claude Code, Gemini CLI).
So you can keep using the tools you’re familiar with.
This is nice, but the development flow is not optimized for any particular tool, which may hurt the experience.
Since GitHub is behind it, I hope it will keep improving.

## Spec Workflow MCP

[Spec Workflow MCP](https://github.com/Pimzino/spec-workflow-mcp) provides MCP features to support the SDD process.
It also offers a dashboard, a web UI for spec management, and a VS Code plugin.
It appears to be a solo project but feels quite ambitious.
Development seems active, so I expect it to evolve not only the SDD flow but also the surrounding tools.

Because it's offered as MCP, it can be used regardless of which AI coding agent you choose, which is a plus.

## Code Buddy

[Code Buddy](https://www.codebuddy.ai/) is a VS Code-based editor published by Tencent.
It’s in the same category as Kiro.
The homepage has a character that reminds me of a game from a certain console.

Looking at pricing, there are Free and Pro plans.
From the wording for Free, it seems that after a two-week Pro trial and 250 credits are consumed,
only tab and next-edit suggestions remain.

Searching in Japanese yields almost no information.

## Tessl, Acsim

I don't expect to use Tessl or Acsim, so I’ll just mention them here.

## Conclusion

This is a memo of the SDD-supporting tools, editors, and services I currently know.
Regardless of whether I use these tools, I think the SDD flow and the techniques for building software with AI coding agents are worth learning.
Once my current work settles down, I want to explore workflow design and prompt writing as well.
