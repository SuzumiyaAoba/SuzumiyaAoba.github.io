---
title: react-best-practices を覗く (Bundle Size Optimization)
date: 2026-01-17
category: プログラミング
tags: ["Skills", "AI", "LLM", "React"]
amazonAssociate: true
amazonProductIds:
  - "これからはじめるReact実践入門 コンポーネントの基本からNext.jsによるアプリ開発まで"
  - "Reactハンズオンラーニング"
  - "プロを目指す人のためのTypeScript入門"
---

[前回の記事](../2026-01-16-react-best-practices/)に続いて Vercel が公開した [react-best-practices](https://vercel.com/blog/introducing-react-best-practices) の内容を見ていこう。
今回は Bundle Size Optimization カテゴリーのルールを読む。

| カテゴリー (英語)        | カテゴリー (日本語)  | ルール (英語)                            | ルール (日本語)                                  |
| ------------------------ | -------------------- | ---------------------------------------- | ------------------------------------------------ |
| Bundle Size Optimization | バンドルサイズ最適化 | Avoid Barrel File Imports                | バレルファイルのインポートを避ける               |
|                          |                      | Conditional Module Loading               | 条件付きでモジュールを読み込む                   |
|                          |                      | Defer Non-Critical Third-Party Libraries | 非クリティカルな外部ライブラリは後回しに読み込む |
|                          |                      | Dynamic Imports for Heavy Components     | 重いコンポーネントは動的インポートする           |
|                          |                      | Preload Based on User Intent             | ユーザー意図に基づいてプリロードする             |

## Avoid Barrel File Imports

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-barrel-imports.md

> バレルファイルから import するのではなく、直接ソースファイルから import する

`index.js` で `export * from './module'` のようなコードが書かれているバレルファイル (Barrel File) を `import` すると、モジュール解決や解析のコストが増えて、ビルドや起動が数百 ms〜（場合によってはそれ以上）遅くなることがある、という話。
Tree Shaking 自体が無効というより、Tree Shaking をする前段の「モジュールグラフ解析が重い」みたいなやつだと思う。

例に書かれているように、アイコンを提供するライブラリや MUI のような多数のコンポーネントを提供するライブラリ、`lodash` や `ramda` のようなユーティリティを提供するライブラリといった「トップレベルから大量に export されているもの」を使うときに気をつけた方がいいということだろう。
外部ライブラリで目立ちやすい話だが、社内コードでも巨大バレルを作ると同じことが起こり得る。

## Conditional Module Loading

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-conditional.md

> 大きいデータやモジュールは、機能が有効になってから読み込む

これは React に限らず、特定のユーザーアクションの後に必要になるような巨大なライブラリは遅延して読み込むようにするという一般的なプラクティス。

## Defer Non-Critical Third-Party Libraries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-defer-third-party.md

> 解析、ログ、エラートラッキングがユーザーのインタラクションを阻害しないように、ハイドレーションの後に読み込む

これはその通りだが、Next.js だと「初期表示の経路から外す」ことをコードで明示しないと、普通に混ざってしまう。
`next/dynamic` や `next/script`、`useEffect` などで後から読み込む、という書き方に寄せろという話だろう。

## Dynamic Imports for Heavy Components

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-dynamic-imports.md

> 初期レンダリングで不要な巨大なコンポーネントは `next/dynamic` を使って遅延して読み込む

これもその通り。先の 2 つと主張は同じだが、視点として「コンポーネント」に焦点を当てている。

## Preload Based on User Intent

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-preload.md

> ユーザーの意図に基づき、必要になる前に重いバンドルを先読みする

特定のボタンを押したときに必要となる機能で大きいバンドルが必要となる場合、ボタンが押されてから読み込むのではなく、hover や focus の段階で読み込み処理を実行する。
`typeof window !== 'undefined'` は SSR 側で実行しないためのガードで、サーバーで `window` 未定義を踏んだり、無駄にプリロードを走らせたりするのを避ける意図だと思う。

## まとめ

前回に引き続きルールを一つずつ確認した。
X (旧 Twitter) を見ていると評判がよくないルールだが、今のところはあたり前のことしか言っていない。
Avoid Barrel File Imports は開発に影響が出るほど悪くなってから検討すればいいように感じた。
また、ところどころ LLM に判断させるのでいいのだろうか、という判断基準が書かれているのでスキル適用時は `AskUserQuestion` でユーザーへの確認を取るような作りにした方がいいのではないかと思った。

引き続き残りのベストベストプラクティスについても確認していく。
