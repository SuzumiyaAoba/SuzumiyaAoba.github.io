---
title: react-best-practices を覗く (Server-Side Performance)
date: 2026-01-24
category: プログラミング
tags: ["Skills", "AI", "LLM", "React"]
thumbnail: iconify:devicon:react
amazonAssociate: true
amazonProductIds:
  - "これからはじめるReact実践入門 コンポーネントの基本からNext.jsによるアプリ開発まで"
  - "Reactハンズオンラーニング"
  - "プロを目指す人のためのTypeScript入門"
---

[Eliminating Waterfalls](../2026-01-16-react-best-practices/)、[Bundle Size Optimization](../2026-01-17-react-best-practices-bundle-size-optimization/) に続いて
Server-Side Performance について確認する。
スキルが公開されて 1 週間ほど経過したが、既にルールが追加されているため最初に作成した表に載っていないルールが追加されている。
今後もルールが追加されていくと思うので公開時点であったルールを一通り見てから差分を振り返る。

## ルール表

| カテゴリー (英語)       | カテゴリー (日本語)          | ルール (英語)                                     | ルール (日本語)                                |
| ----------------------- | ---------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| Server-Side Performance | サーバーサイドパフォーマンス | Cross-Request LRU Caching                         | リクエスト間で LRU キャッシュする              |
|                         |                              | Minimize Serialization at RSC Boundaries          | RSC 境界でのシリアライズを最小化する           |
|                         |                              | Parallel Data Fetching with Component Composition | コンポーネント合成でデータフェッチを並列化する |
|                         |                              | Per-Request Deduplication with React.cache()      | React.cache() でリクエスト内の重複を排除する   |
|                         |                              | Use after() for Non-Blocking Operations           | after() で非ブロッキングに後処理を実行する     |

### Cross-Request LRU Caching

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-cache-lru.md

> `React.cache()` は一つのリクエストに対して有効。連続したリクエストで共有されるデータは LRU キャッシュを使う。

`React.cache()` ではサーバーに対する 1 リクエスト内で複数回同じ条件でのデータ取得に対しては有効だが、
リクエストを跨ぐような場合にキャッシュが効きにくい問題がある。
そういった場合はプロセス内に LRU キャッシュを導入し、メモリキャッシュを利用した対策をしないといけない。
ルールでは [isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache) や [Redis](https://redis.io/) が紹介されている。

### Minimize Serialization at RSC Boundaries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-serialization.md

> React サーバー/クライアント境界はすべてのプロパティを文字列にエンコードし、HTML のレスポンスと RSC サブシーケンスに埋め込むため、シリアライズされたデータがページを重さやロード時間に大きな影響を与える。
> クライアントで実際に使われるフィールドだけを渡すようにする。

クライアントサイドコンポーネントの Props で雑に大きなデータを受け取るようにし、その中から必要なデータにアクセスするような実装をするのではなく、
Props にはコンポーネントで必要な最低限のデータを記述し、サーバーサイドからクライアントサイドコンポーネントに渡すデータを最小限にするべきという主張。

### Parallel Data Fetching with Component Composition

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-parallel-fetching.md

> React サーバーコンポーネントは、ツリー内で上から順に実行するため、コンポーネント合成を使ってデータ取得を兄弟コンポーネントに分離し、並列に走る構造に組み替える

次のことを意識するのが有効かもしれない。

- 親で `await` してから子をレンダリングしない
- 親でデータ取得する場合は `Promise` を作り、子に渡して `await` する

### Per-Request Deduplication with React.cache()

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-cache-react.md

> `React.cache()` を使って同一リクエスト内の同じ非同期処理の結果をメモ化する。

`React.cache()` は `Object.is` を使った浅い比較で判定するため、正しい使い方をしないとキャッシュされない問題がある。
オブジェクトを渡す場合は参照が同じでなければならない。
また、Next.js の `fetch` API は自動的にリクエストのキャッシュをするため、`React.cache()` を使う必要はないが、
DB アクセス、重い処理、認証、ファイル操作、fetch 以外の非同期処理では依然として有効。

### Use after() for Non-Blocking Operations

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-after-nonblocking.md

> 非ブロッキング処理には `after()` を使う。

ログ送信のようなレスポンスに関係ない副作用は Next.js の [`after()`](https://nextjs.org/docs/app/api-reference/functions/after) を使ってリクエストをブロックしないように実装する。

## おわりに

react-best-practices の Server-Side Performance カテゴリーのルールを読んだ。
今回は Server-Side Performance ということもあり、一般的なプラクティスというよりは Next.js、React に特化したルールが多かった。
まだ 3 つ目なので残りの 5 つのカテゴリについてもこの調子で確認していく。
