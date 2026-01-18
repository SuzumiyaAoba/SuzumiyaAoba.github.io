---
title: Commands Not Running in Cursor
date: 2025-09-25
category: "Cursor"
tags: ["Cursor", "Terminal", "powerlevel10k", "Zellij"]
thumbnail: iconify:vscode-icons:file-type-cursorrules
model: GPT-5.2-Codex
---

While revisiting my terminal setup, I ran into an issue where commands wouldn't run in Cursor, so I’m recording the cause and fix.

## Symptoms

The Cursor terminal opens and displays normally, but when the AI agent tries to execute a command, nothing runs and it hangs.

## Cause

The issue appeared after switching the prompt from [starship](https://starship.rs/ja-JP/) to [powerlevel10k](https://github.com/romkatv/powerlevel10k).
I haven't confirmed it, but Zellij might also be involved.

There is also a topic about this on the Cursor forum.

- [Cursor Agent Terminal Doesn’t Work Well with Powerlevel10k + Oh-My-Zsh - Bug Reports - Cursor - Community Forum](https://forum.cursor.com/t/cursor-agent-terminal-doesn-t-work-well-with-powerlevel10k-oh-my-zsh/96808)

## Solution

The Cursor topic lists several approaches.
Here is the configuration that works in my environment at the moment.

It might include unnecessary settings; I haven't fully verified.

Since the cause seems to be powerlevel10k being enabled, I make sure powerlevel10k is not loaded when the Cursor AI agent runs commands by adding the following to my zsh config.

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

I use the `CURSOR_TRACE_ID` environment variable to detect whether the command is being run by Cursor's AI agent.

`${pkgs.zsh-powerlevel10k}` points to the package path because I manage my config with Nix, but you should adjust this to your environment.
