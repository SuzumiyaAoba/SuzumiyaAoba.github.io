---
title: Astro を使ってブログを作成する
date: 2023-09-30
tags: ["Astro", "プログラミング"]
category: プログラミング
draft: false
---

## Astro v3

3回目の [Astro](https://astro.build/)。
Astro のバージョンが v3 になった。
そのため、3回目の挑戦。
1回目が v1、2回目は v2、そして今回。
いずれも記事一覧を表示したくらいで飽きてしまい、
そのままブログを更新することもなくなってしまった。

そもそも Astro は Markdown 内で画像を使おうとしたときに、
相対パスでの画像読み込みをするためには自前でスクリプトを書かねばならない問題がある。
これは Astro に限った話ではないかもしれないが、`public` ディレクトリ以外に置かれた
静的ファイルのパス解決をしてくれないのは静的サイトジェネレートとして如何なものだろうか？
と思ってしまい Astro を触る気力が無くなってしまった。

![How standards proliferate](./images/how-standards-proliferate.png)

しかし、v3 がリリースされたので流石に何かしらの改善がされただろうと思い、
改めてブログ構築に勤しんでいる。

上記の画像は `./images/how-standards-proliferate.png` といった相対パスでの読み込みができているのに加え、
webp による変換も行われているようだ。
加えてこの記事の執筆中に気がついたこととして CJK (Chinese、Japanese、Korean) などの言語を Markdown から HTML へ変換したときに、
改行後に余計なスペースが挿入される問題についてもデフォルトのままで発生しなくなっている。
以前までは、[purefun/remark-join-cjk-lines](https://github.com/purefun/remark-join-cjk-lines) のようなプラグインを使ってスペースを削除するようにしなければならなかったがそれが不要となった。

バージョンも 3 まで来たことで一般的なニーズには答えられるくらいは成熟したということだろう。
しかし、それでも今回の構築でやりたかったができなかったことがいくつかあった。

## 気になったライブラリ

今回のブログ作成で見つけて気になったが導入に失敗したライブラリをメモしておく。

### シンタックスハイライト

- [wooorm/starry-night](https://github.com/wooorm/starry-night)
- [Microflash/rehype-starry-night](https://github.com/Microflash/rehype-starry-night)
- [Code Hike](https://codehike.org/)

Code Hike は今回ではなく前回気になったライブラリ。
現時点でも Astro 対応していないようだったので採用は見送った。
starry-night は GitHub 社内のプロジェクトで開発されていたプロジェクトのオープンソース版とのこと。
プラグインもあるようで使えれば、ソースコードをいい感じに表示できるのだが `astro.config.mjs` でShiki を無効化し、
rehype プラグインとして追加したものの動作しなかった。
ブログ構築が一段落したら改めて挑戦したい。

## 感想

記事の一覧、コンテンツの表示をするところまで書いてデプロイした。
過去に少し触ったことがあるのに加えて、Astro は静的サイト生成をするだけであれば
覚えることも殆どないため半日程度でできた。

本当に最低限の機能だけを実装した状態なので記事を執筆しつつ、今後も機能を増やしていきたい。
