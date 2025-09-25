---
title: Cursor でコマンド実行されない現象
date: 2025-09-25
category: "Cursor"
tags: ["Cursor", "Terminal", "powerlevel10k", "Zellij"]
---

ターミナル環境を見直していたところ Cursor でコマンド実行されない現象に遭遇したので原因と解決策を遺しておく。

## 現象

Cursor ターミナルを開くと正常に表示されるが AI エージェントがコマンド実行しようとするとコマンドが実行されず、ハングアップしてしまう現象が発生した。

## 原因

ターミナルのプロンプトを [starship](https://starship.rs/ja-JP/) から [powerlevel10k](https://github.com/romkatv/powerlevel10k) に移行したのが原因だった。
検証できていないが Zellij も影響している可能性がある。

Cursor の Forum にもこの問題のトピックが立っている。

- [Cursor Agent Terminal Doesn’t Work Well with Powerlevel10k + Oh-My-Zsh - Bug Reports - Cursor - Community Forum](https://forum.cursor.com/t/cursor-agent-terminal-doesn-t-work-well-with-powerlevel10k-oh-my-zsh/96808)

## 解決策

Cursor のトピックではいくつか解決方法が示されている。
ここでは、現時点で私の環境で上手く動いている設定を記す。

余計な設定が入っている気がする検証できていない。

```zsh
POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true
if [[ -n $CURSOR_TRACE_ID ]]; then
  ZSH_THEME=""
else
  ZSH_THEME="powerlevel10k/powerlevel10k"
fi

if [[ -n $CURSOR_TRACE_ID ]]; then
  PROMPT='%n@%m:%~%# '
  RPROMPT=""
else
  [[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
  source ${pkgs.zsh-powerlevel10k}/share/zsh-powerlevel10k/powerlevel10k.zsh-theme
fi
```

Cursor の AI エージェントから実行されているか否かは環境変数の `CURSOR_TRACE_ID` で判断できる。
VS Code でも同様の現象が発生する可能性があるため `TERM_PROGRAM` が `vscode` の場合も Cursor と同様の設定がされるようにしている。

`${pkgs.zsh-powerlevel10k}` は Nix で設定を管理しているためパスを `pkgs.zsh-powerlevel10k` で取得するようにしているが、自身の環境に合わせてパスを変える必要がある。

