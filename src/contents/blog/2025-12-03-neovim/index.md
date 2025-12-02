---
title: Emacs から Neovim へ
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
