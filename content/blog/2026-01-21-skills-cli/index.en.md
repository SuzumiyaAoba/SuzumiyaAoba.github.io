---
title: Skills CLI
date: 2026-01-21
category: Programming
tags: ["Coding Agents", "CLI", "Claude Code", "Codex", "GitHub Copilot"]
thumbnail: iconify:material-icon-theme:claude
model: GPT-5.2-Codex
---

Anthropic [announced Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) on 2025/10/16, and on 2025/12/18 it was released as the open standard [Agent Skills](https://agentskills.io/home) and [published](https://claude.com/blog/skills).

To install Skills for Claude Code, add the [Marketplace](https://code.claude.com/docs/en/plugin-marketplaces) with a command like this:

```shell
/plugin marketplace add anthropics/skills
```

Then install a plugin that contains skills:

```shell
/plugin install document-skills@anthropic-agent-skills
```

However, this method only works for Claude Code. After the open standard was announced, GitHub Copilot ([2025/12/18](https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/)) and [Codex]([2025/12/05](https://github.com/openai/codex/releases/tag/rust-v0.65.0), [2025/12/20](https://x.com/OpenAIDevs/status/2002099762536010235?s=20)) introduced support, but you have to install Skills in different ways.

Because of that, it was inevitable that CLIs would appear to normalize these differences, and unsurprisingly, many have started to pop up. There may be other major ones, but here are the ones I saw on X (formerly Twitter), Zenn, and Qiita.

- [numman-ali/openskills: Universal skills loader for AI coding agents - npm i -g openskills](https://github.com/numman-ali/openskills)
- [vercel-labs/add-skill](https://github.com/vercel-labs/add-skill)
- [skills - npm](https://www.npmjs.com/package/skills)
- [gotalab/skillport: Bring Agent Skills to Any AI Agent and Coding Agent — via CLI or MCP. Manage once, serve anywhere.](https://github.com/gotalab/skillport)

It's notable that Vercel grabbed generic names like `add-skill` and `skills`.
`skills` was only [just released](https://x.com/rauchg/status/2012345679721771474), but for now it looks like a thin wrapper around `add-skill`.
In fact, functionality-wise it's even a [regression](https://www.npmjs.com/package/skills/v/1.0.10?activeTab=code) compared to `add-skill`.

Also, since `v1.0.0` was published nine years ago, Vercel likely acquired a long-abandoned name and now intends to operate it as the command for Agent Skills.

I have mixed feelings about Vercel growing ever more dominant around Next.js and beyond, but distributing Skills for multiple coding agents is currently painful. A de facto standard tool would be welcome.

As mentioned above, there are probably three commands gaining traction right now, so I want to keep an eye on which distribution format will make the most sense going forward.
