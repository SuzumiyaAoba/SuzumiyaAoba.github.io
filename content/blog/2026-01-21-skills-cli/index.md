---
title: Skills コマンド
date: 2026-01-21
category: プログラミング
tags: ["コーディングエージェント", "CLI", "Claude Code", "Codex", "GitHub Copilot"]
---

Anthropic が 2025/10/16 に [Skills を発表](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)し、
2025/12/18 に [Agent Skills](https://agentskills.io/home) としてオープンスタンダードな仕様として[公開](https://claude.com/blog/skills)された。

Claude Code へ Skills をインストールするには、次のようなコマンドで [Marketplace](https://code.claude.com/docs/en/plugin-marketplaces) を追加し、

```shell
/plugin marketplace add anthropics/skills
```

スキルを含むプラグインをインストールすることで使えるようになる。

```shell
/plugin install document-skills@anthropic-agent-skills
```

しかし、この方法が有効なのか Claude Code だけであり、オープンスタンダードとなった後に対応が発表された
GitHub Copilot ([2025/12/18](https://github.blog/changelog/2025-12-18-github-copilot-now-supports-agent-skills/)),
[Codex]([2025/12/05](https://github.com/openai/codex/releases/tag/rust-v0.65.0), [2025/12/20](https://x.com/OpenAIDevs/status/2002099762536010235?s=20))
では異なる方法で Skills をインストールしなければならない。

そのため、それらの差分を吸収するための CLI が登場するのは必然なわけだが当然の如く乱立し始めている。
ここに挙げたもの以外にもメジャーどころがあるかもしれないが、X (旧 Twitter) や Zenn、Qiita で見かけたものを載せている。

- [numman-ali/openskills: Universal skills loader for AI coding agents - npm i -g openskills](https://github.com/numman-ali/openskills)
- [vercel-labs/add-skill](https://github.com/vercel-labs/add-skill)
- [skills - npm](https://www.npmjs.com/package/skills)
- [gotalab/skillport: Bring Agent Skills to Any AI Agent and Coding Agent — via CLI or MCP. Manage once, serve anywhere.](https://github.com/gotalab/skillport)

Vercel が `add-skill` や `skills` という一般的な名称を抑えに来ているのが印象的だろう。
`skills` は[先日公開](https://x.com/rauchg/status/2012345679721771474)されたばかりだが、
現時点においてその実態は単なる `add-skill` コマンドのラッパーになっている。
何なら機能としては `add-skill` より[デグレ](https://www.npmjs.com/package/skills/v/1.0.10?activeTab=code)っている。

しかも、`v1.0.0` は 9 年前に公開されているので長期間放置されていた名前を Vercel が何らかの方法で取得し、
Agent Skills のためのコマンドとして今後は運用していくという魂胆だ。

Next.js を始めとして Vercel が強くなりすぎるのはどうなのかと思うが、
現時点で複数のコーディングエージェント向けに Skills を配布するのは面倒なのでデファクトスタンダードなツールが登場するのは歓迎すべきところ。

先ほど挙げたように現時点で普及の兆しがあるコマンドは大きく 3 つあると思うので、今後を見据えてどのフォーマットで配布するべきなのか判断していきたい。
