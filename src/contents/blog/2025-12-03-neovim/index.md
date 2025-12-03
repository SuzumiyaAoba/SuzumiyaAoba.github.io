---
title: Emacs から Neovim へ (1)
date: 2025-12-02
category: "Editor"
tags: ["Vim", "Emacs", "Editor"]
---

## Neovim へ

Emacs を使ってきたけど Neovim に移行したのでその過程をメモとして残していく。
過去にも何回か Neovim への移行を試みて結局 Emacs に戻ってきていたが、今回はこのまま Neovim で頑張っていけそう。

## Neovide

Neovim では GUI がいくつか開発されている。
今回はカーソルをぬるぬる動かしたいので [Neovide](https://neovide.dev/) を使う。
他にも次のような GUI が見つかった。

- [goneovim](https://github.com/akiyosi/goneovim)
- [VimR](https://github.com/qvacua/vimr)
- [Neovim Qt](https://github.com/equalsraf/neovim-qt)
- [NVUI](https://github.com/rohit-px2/nvui)
- [Neoray](https://github.com/hismailbulut/Neoray)
- [Nvy](https://github.com/RMichelsen/Nvy)

GitHub Star History で各リポジトリの人気について確認すると画像のようになっていた。

![GitHub Star History](./images/star-history-2025122.png)

グラフを見ると Neovide 一強のようだ。

## 設定ファイル

Neovim の設定ファイルは `~/.config/nvim` で管理する。
設定ファイルは Lua で書く。昔のように Vim Script という難解な言語を使わないで済むようになっている。
それでも個人的には Lua はゲームで使われていたという印象が強く、それ以外だと Redis 上で実行できるというくらいしか知らない。
設定ファイルで自由に動作を変えたくなるのは先のことなので当分の間は気にしなくてよいだろう。

Emacs の `init.el` に相当するファイルは `init.lua` になる。
`~/.config/nvim/init.lua` に設定を書いていけば起動時に読み込まれる。

## プラグイン管理

Emacs や Neovim を使う目的は、テキストエディタを自分好みにカスタマイズしていくのが醍醐味でもあり、時間の無駄にもなりやすい要素だ。
便利そうだと思って導入し、既存のプラグインの邪魔にならないように設定を弄ったり、キーバインドを悩んだりしても結局使わないというのは日常茶飯事。
そんなプラグインを管理するプラグイン（プラグインマネージャー）として今回は [lazy.nvim](https://lazy.folke.io/) を採用する。

- [vim-plug](https://github.com/junegunn/vim-plug)
- [packer.nvim](https://github.com/wbthomason/packer.nvim)
- [mini.nvim](https://github.com/nvim-mini/mini.nvim)

こちらも GitHub Star History を覗いてみると、

![GitHub Star History](./images/plugin-manager-star-history-2025122.png)

packer.nvim が昔からあるプラグインマネージャーのようで最もスターが多い。
次に比較的最近登場した lazy.nvim が人気のようだ。
mini.nvim の人気も少しづつ高まっているのも気になる。
しかし、今回は lazy.nvim で行くことにする。

## 初期設定

GUI とプラグインマネージャーが決まったので最低限の設定を入れる。
ここからは、先週から調べて入れていったプラグインを全てオフにして設定やプラグインの変更を改めて手元の環境で有効にしていく。
そのため、一時的に Emacs に帰省し、記事を書くのに十分な設定が入れ終わるまでは Emacs で執筆することにしよう。

## lazy.nvim

lazy.nvim の導入は簡単で [Installation](https://lazy.folke.io/installation) に従って設定する。
最初に `~/.config/nvim/init.lua` に `~/.config/nvim/lua/config/lazy.lua` を読み込む設定を書く。

```lua ~/.config/nvim/init.lua
require("config.lazy")
```

Lua や Neovim の設定のお作法はわからないが `require("xxx")` で `~/.config/nvim/lua/xxx` を読み込めるのだろう。

`~/.config/nvim/lua/config/lazy.lua` に次の設定を書く。

```lua ~/.config/nvim/lua/config/lazy.lua
-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

-- Make sure to setup `mapleader` and `maplocalleader` before
-- loading lazy.nvim so that mappings are correct.
-- This is also a good place to setup other settings (vim.opt)
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

-- Setup lazy.nvim
require("lazy").setup({
  spec = {
    -- import your plugins
    { import = "plugins" },
  },
  -- Configure any other settings here. See the documentation for more details.
  -- colorscheme that will be used when installing plugins.
  install = { colorscheme = { "habamax" } },
  -- automatically check for plugin updates
  checker = { enabled = true },
})
```

lazy.nvim のドキュメントに載っている設定をそのままコピーしている。
現時点では特にカスタマイズしないが、`<Leader>` や `<LocalLeader>` を変更したい場合は
lazy.nvim の読み込みよりも先に設定する必要があるようなのでこのファイルで設定しておかないといけないだろう。
また、lazy.nvim 自体のカスタマイズが必要な場合は `setup` の引数に [Configuration](https://lazy.folke.io/configuration) を参考に設定する。

ダミーのファイルを `~/.config/nvim/lua/plugins/` に置かないとエラーが発生したので空のファイル `~/.config/nvim/lua/plugins/init.lua` を置いておく。

```lua ~/.config/nvim/lua/plugins/init.lua
return {
}
```

さて、ターミナルから `neovide` コマンドを実行すると Neovim が立ち上がる。
この段階では lazy.nvim の設定を入れただけで何のプラグインもインストールしていないのでデフォルトの Neovim との違いはわからない。

## 基本的な設定

この記事では、プラグインに頼らない基本的な設定をするところまでを書く。

### コピー&ペースト

デフォルトの状態では OS のクリップボードと Neovim のクリップボードが共有されていないため、
Neovim 外でコピーしたテキストを貼り付けられないし、Neovim でコピーしたテキストを Neovim 外で貼り付けることもできない。
そのため、『[Vim/Neovim で OS のクリップボードを連動させる (clipboard, unnamed, unnamedplus) - まくまく Vim ノート](https://maku77.github.io/p/nnhefs3/)』を参考に次のように設定した。

```lua ~/.config/nvim/init.lua
vim.opt.clipboard:append({ "unnamed", "unnamedplus" })
```

### タブ・インデント

(Neo)vim も Emacs と同じようにデフォルトではインデントにタブ文字（`\t`）を使ってくれる。
昨今でインデントにタブ文字を使うような場面は Golang を使うときくらいではないだろうか。
インデントはスペース 2 文字派閥の人間なので次のような設定を追加する。

```lua ~/.config/nvim/init.lua
vim.o.expandtab = true
vim.o.tabstop = 2
vim.o.shiftwidth = 2
```

それぞれ意味合いとしては次のようになっているはず。

- タブの代わりにスペースを使う
- タブ幅をスペース 2 つ文にする
- インデントを 2 文字分にする

### 行番号

行番号を表示するか否か、相対行番号を使うかは好みが分かれるところではあるが、
普通の行番号を使いたいので次の設定を追加した。

```lua ~/.config/nvim/init.lua
vim.opt.number = true
```

(Neo)vim では相対的な行数指定で操作する場面があるので、相対的な行番号表示に慣れていった方がいいのかもしれない。
その段階まで (Neo)vim を使い熟せるようになったら次の設定を入れる。

```lua ~/.config/nvim/init.lua
vim.opt.relativenumber = true
```

### フォント

フォントは Cascadia Next を設定。

```lua ~/.config/nvim/init.lua
vim.o.guifont = "Cascadia Next JP:h14"
```

### ファイルエンコード

ファイルエンコーディングの設定は次のように設定した。

```lua ~/.config/nvim/init.lua
vim.opt.fileencoding = "utf-8"
vim.opt.fileencodings = { "ucs-bom", "utf-8", "euc-jp", "cp932" }
```

最適な設定はわからない。

### 改行コード

改行コードは `\n`、`\r\n` の優先順位で判定するように設定。

```lua ~/.config/nvim/init.lua
vim.opt.fileformats = { "unix", "dos" }
```

### カーソル

```lua ~/.config/nvim/init.lua
vim.opt.cursorline = true
vim.opt.virtualedit = "onemore"
```

### インデント

```lua ~/.config/nvim/init.lua
vim.opt.smartindent = true
```

### 視覚ベル

```lua ~/.config/nvim/init.lua
vim.opt.visualbell = true
```

### 括弧

```lua ~/.config/nvim/init.lua
vim.opt.showmatch = true
```

### コマンドライン補完

```lua ~/.config/nvim/init.lua
vim.opt.wildmode = { "list", "longest" }
```
