---
title: Claude Code の AGENTS.md 対応
date: 2025-09-16
category: "Claude Code"
tags: ["Claude Code", "AGENTS.md"]
amazonAssociate: true
amazonProductIds:
  - "実践Claude Code入門"
  - "Claude CodeによるAI駆動開発"
---

## TL;DL

2025-09-24 現在においては [AGENTS.md](https://agents.md/) 推奨のシンボリックリンクが無難。

```shell
ln -s AGENTS.md CLAUDE.md
```

### 2025-11-06 追記

https://code.claude.com/docs/en/claude-code-on-the-web#best-practices

> **Document requirements**: Clearly specify dependencies and commands in your `CLAUDE.md` file. If you have an `AGENTS.md` file, you can source it in your CLAUDE.md using `@AGENTS.md` to maintain a single source of truth.

Claude Code の公式ドキュメントは `CLAUDE.md` 内で `@AGENTS.md` を使って参照させる方式推し。

```md CLAUDE.md
@AGENTS.md
```

## AGENTS.md

OpenAI が 2025/08/20 に [AGENTS.md](https://agents.md/) を公開した。
このサイトでは、コーディングエージェント向けの標準フォーマットの普及を目的としている。

フォーマットといっても決まっていることとしては、

- `AGENTS.md` というファイル名
- 拡張子から明らかであるが Markdown 形式で記述

の 2 点だけのように見える。

## 対応ソフトウェア

`AGENTS.md` に 2025/08/20 時点で対応している AI コーディングエージェント、ツールは以下の通り。

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

## Anthropic の不在

現時点における AGENTS.md エコシステムの問題点は、最もユーザが多いと思われる CLI ツールである [Claude Code](https://docs.claude.com/ja/docs/claude-code/overview) を開発している Anthropic の不在だろう。
Claude Code では `CLAUDE.md` に `AGENTS.md` 相当のドキュメントを記述する。
Gemini CLI も同様に `GEMINI.md` だけを見ていたが、AGENTS.md に対応した。
しかし、Claude Code は現時点では `AGENTS.md` に対応するような動きは見られない。

## Claude Code の AGENTS.md 対応

[Feature Request: Support AGENTS.md. · Issue #6235 · anthropics/claude-code](https://github.com/anthropics/claude-code/issues/6235) で議論されているが、
対応に向けた動きは見られない。

## ワークアラウンド

Issue では 3 つのワークアラウンドが紹介されている。

- [`AGENTS.md` を読む指示の追加](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3217884068)
- [シンボリックリンク](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3274586171)
- [フックの利用](https://github.com/anthropics/claude-code/issues/6235#issuecomment-3218728961)

Issue のコメントを見てもらえればそれぞれ難しいことをしているわけではないので直ぐに実践できると思うが、それぞれの方法について解説する。

### `AGENTS.md` を読むように指示する

Claude Code は `@` の後にファイルパスを書くとそのファイルを参照してくれる機能がある。
これを利用して `CLAUDE.md` に以下のように記述しておくことで `AGENTS.md` を参照させる。

```markdown CLAUDE.md
@AGENTS.md
```

- [Common workflows - Claude Docs](https://docs.claude.com/en/docs/claude-code/common-workflows#reference-files-and-directories)

### シンボリックリンク

`CLAUDE.md` を `AGENTS.md` にリネームしてシンボリックリンクを張る。

```shell
mv CLAUDE.md AGENTS.md && ln -s AGENTS.md CLAUDE.md
```

この対応方法は AGENTS.md の公式サイトでも紹介されている。

### フック

Claude Code には[フック](https://docs.claude.com/ja/docs/claude-code/hooks)と呼ばれる機能がある。
これは、Claude Code の起動時やツールの利用やファイルの編集の前後といったタイミングで任意の処理を実行するための機能となっている。

フックの活用例としては、

- リンター、コードフォーマッターの実行
- テストの実行
- 特定のコマンドの禁止
- 通知のカスタマイズ
- Claude Code のログ記録

がよく見られる。

- [Claude CodeのHooksは設定したほうがいい - じゃあ、おうちで学べる](https://syu-m-5151.hatenablog.com/entry/2025/07/14/105812)
- [Claude Code hooksについて解説してみる | DevelopersIO](https://dev.classmethod.jp/articles/claude-code-hooks-basic-usage/)
- [Claude Code の Hooks で作業が終わった後にフォーマッターを実行する](https://azukiazusa.dev/blog/claude-code-hooks-run-formatter/)
- [Claude Code の Hooks でタスクの完了をデスクトップ通知する](https://zenn.dev/hashiiiii/articles/11e4ab6b357481)

今回はこのフックを使って Claude Code が起動したタイミングでコンテキストに `AGENTS.md` を含めるようにする。

最初に `.claude/settings.json` に次の設定を追加する。

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

このフックでは Claude Code 起動時にプロジェクトのディレクトリにある `.claude/hooks/append_agentsmd_context.sh` を実行する。

`.claude/hooks/append_agentsmd_context.sh` には次のようなスクリプトを記述する。

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

これにより `AGENTS.md` ファイルが存在する場合は標準出力に、

```txt
--- FILE: AGENTS.md ---
<AGENTS.md の内容>
```

が出力されるため Claude Code のコンテキストに `AGENTS.md` を含めるという目的が達成できる。

## おわりに

この記事では 2025/09/17 現在において Claude Code で AGENTS.md を利用する方法を 3 つ紹介した。
フックを利用する方法はやりたいことに対してやらないといけないことが見合っていないように思えた。
Claude Code は `CLAUDE.md` を読み込むときに特別扱いしている場合（Claude Code のコードを読めばわかりそうだが…）、
フックを使う方法は恩恵が受けられない可能性が高い。

そのため、`CLAUDE.md` で `AGENTS.md` を読み込むように指示するか、リンクを作成するのが今のところは良さそうだ。

### 追記

`CLAUDE.md` に `@AGENTS.md` を書く対応は `/init` を実行したとき `CLAUDE.md` に指示内容を書いてしまうため、その度に `AGENTS.md` に変更を反映して `CLAUDE.md` を戻す作業が発生した。
`/init` を実行する頻度は高くないが、それでも手間ではあるのでシンボリックリンクを作る対応が無難に感じた。

## 参考文献

- [ここだめAGENTS.md](https://zenn.dev/tkithrta/articles/898bf6c84f8584)
- [AGENTS.md の概要｜npaka](https://note.com/npaka/n/nd1258df2853c)
