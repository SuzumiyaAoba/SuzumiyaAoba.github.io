---
title: react-best-practices を覗く (Eliminating Waterfalls)
date: 2026-01-17
category: プログラミング
tags: ["Skills", "AI", "LLM", "React"]
---

Vercel が React の Skills として [react-best-practices](https://vercel.com/blog/introducing-react-best-practices) を公開した。
GitHub のリポジトリは [skills/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) になっている。
内容を確認すると 40 以上のルールが Makrkdown ファイルとして置かれている。
Vercel のこれまでの React を使った開発の経験から最適化に焦点を当てたナレッジが詰め込まれているらしい。

気になるので、一つずつルールの中身を確認してみよう。
ルールの数が多いので記事としてはカテゴリーごとに分割する。

## ルール表

| カテゴリー (英語)         | カテゴリー (日本語)              | ルール (英語)                                     | ルール (日本語)                                  |
| ------------------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Eliminating Waterfalls    | 非同期ウォーターフォールの解消   | Defer Await Until Needed                          | 必要になるまで await を遅延する                  |
|                           |                                  | Dependency-Based Parallelization                  | 依存関係に基づいて並列化する                     |
|                           |                                  | Prevent Waterfall Chains in API Routes            | API ルートでのウォーターフォール連鎖を防ぐ       |
|                           |                                  | Promise.all() for Independent Operations          | 独立した処理は Promise.all() で並列実行する      |
|                           |                                  | Strategic Suspense Boundaries                     | 戦略的に Suspense 境界を配置する                 |
| Bundle Size Optimization  | バンドルサイズ最適化             | Avoid Barrel File Imports                         | バレルファイルのインポートを避ける               |
|                           |                                  | Conditional Module Loading                        | 条件付きでモジュールを読み込む                   |
|                           |                                  | Defer Non-Critical Third-Party Libraries          | 非クリティカルな外部ライブラリは後回しに読み込む |
|                           |                                  | Dynamic Imports for Heavy Components              | 重いコンポーネントは動的インポートする           |
|                           |                                  | Preload Based on User Intent                      | ユーザー意図に基づいてプリロードする             |
| Server-Side Performance   | サーバーサイドパフォーマンス     | Cross-Request LRU Caching                         | リクエスト間で LRU キャッシュする                |
|                           |                                  | Minimize Serialization at RSC Boundaries          | RSC 境界でのシリアライズを最小化する             |
|                           |                                  | Parallel Data Fetching with Component Composition | コンポーネント合成でデータフェッチを並列化する   |
|                           |                                  | Per-Request Deduplication with React.cache()      | React.cache() でリクエスト内の重複を排除する     |
|                           |                                  | Use after() for Non-Blocking Operations           | after() で非ブロッキングに後処理を実行する       |
| Client-Side Data Fetching | クライアントサイドデータフェッチ | Deduplicate Global Event Listeners                | グローバルイベントリスナーを重複登録しない       |
|                           |                                  | Use SWR for Automatic Deduplication               | SWR で自動的に重複排除する                       |
| Re-render Optimization    | 再レンダリング最適化             | Defer State Reads to Usage Point                  | 状態の読み取りを使用箇所まで遅延する             |
|                           |                                  | Extract to Memoized Components                    | メモ化したコンポーネントへ抽出する               |
|                           |                                  | Narrow Effect Dependencies                        | Effect の依存配列を絞る                          |
|                           |                                  | Subscribe to Derived State                        | 派生状態に購読する                               |
|                           |                                  | Use Functional setState Updates                   | setState は関数更新を使う                        |
|                           |                                  | Use Lazy State Initialization                     | useState の遅延初期化を使う                      |
|                           |                                  | Use Transitions for Non-Urgent Updates            | 緊急でない更新は Transition を使う               |
| Rendering Performance     | レンダリングパフォーマンス       | Animate SVG Wrapper Instead of SVG Element        | SVG 要素ではなくラッパーをアニメーションする     |
|                           |                                  | CSS content-visibility for Long Lists             | 長いリストに CSS content-visibility を使う       |
|                           |                                  | Hoist Static JSX Elements                         | 静的 JSX 要素をホイストする                      |
|                           |                                  | Optimize SVG Precision                            | SVG の精度（小数桁）を最適化する                 |
|                           |                                  | Prevent Hydration Mismatch Without Flickering     | ちらつきを起こさずにハイドレーション不一致を防ぐ |
|                           |                                  | Use Activity Component for Show/Hide              | 表示/非表示には Activity コンポーネントを使う    |
|                           |                                  | Use Explicit Conditional Rendering                | 明示的な条件レンダリングを使う                   |
| JavaScript Performance    | JavaScript パフォーマンス        | Batch DOM CSS Changes                             | DOM の CSS 変更をまとめて適用する                |
|                           |                                  | Build Index Maps for Repeated Lookups             | 繰り返し参照にはインデックス Map を作る          |
|                           |                                  | Cache Property Access in Loops                    | ループ内のプロパティアクセスをキャッシュする     |
|                           |                                  | Cache Repeated Function Calls                     | 繰り返し関数呼び出しをキャッシュする             |
|                           |                                  | Cache Storage API Calls                           | Storage API 呼び出しをキャッシュする             |
|                           |                                  | Combine Multiple Array Iterations                 | 配列の複数走査を統合する                         |
|                           |                                  | Early Length Check for Array Comparisons          | 配列比較はまず長さをチェックする                 |
|                           |                                  | Early Return from Functions                       | 関数は早期 return する                           |
|                           |                                  | Hoist RegExp Creation                             | RegExp の生成を外に出す（ホイストする）          |
|                           |                                  | Use Loop for Min/Max Instead of Sort              | min/max は sort ではなくループで求める           |
|                           |                                  | Use Set/Map for O(1) Lookups                      | O(1) 参照には Set/Map を使う                     |
|                           |                                  | Use toSorted() Instead of sort() for Immutability | イミュータブルのため toSorted() を使う           |
| Advanced Pattern          | 高度なパターン                   | Store Event Handlers in Refs                      | イベントハンドラを ref に保持する                |
|                           |                                  | useLatest for Stable Callback Refs                | 安定したコールバック参照のため useLatest を使う  |

今回は Eliminating Waterfalls を見ていこう。

## Eliminating Waterfalls

引用で書く部分は元のスキルの翻訳ではなく、スキルの概要を簡単に言い換えたものを載せた。

この後の文章は次のフォーマットで書いていく。

```markdown
> [スキルの要約]

個人的な感想
```

### Defer Await Until Needed

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-defer-await.md

> 非同期処理が本当に必要とされるまで遅延する。

これは React に限った話ではなく、すべての処理で不要な非同期処理は遅延されて然るべき。

### Dependency-Based Parallelization

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-dependencies.md

> 互いに依存する非同期処理は [better-all](https://github.com/shuding/better-all) ライブラリを仕様し、それぞれのタスクを可能な限り早く開始する。

better-all というライブラリの存在を初めて知ったが、複数の API から必要なデータを集めないといけないような処理を実装しないといけないとき、
多くの場合、ある API のレスポンスを使って他の API へのリクエストを組み立てることになる。
そういった処理を `async/await` で頑張ろうとすると、最適な順序でそれぞれの非同期処理が実行されるようにすると、
一斉に非同期で進めて問題ない処理とそうでない処理を記述するときの順番を意識してコードを書くことにある。
そこにレイテンシーの話も出てきて依存関係を整理した上で本当に効率のいいコードを書こうとすると `then` で処理を繋げないといけないところも出てくる。
この話は better-all の [README.md](https://github.com/shuding/better-all/blob/main/README.md) の例を見ると何が問題なのかわかると思う。

これを見ると `Promise.all()` や `Promise.allSettled()` が欲しい場面で、非同期処理間に依存関係があるのであれば better-all を使った方がいいと感じた。

### Prevent Waterfall Chains in API Routes

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-api-routes.md

> API ルートやサーバーアクションでは、独立した処理を即座に開始し、その場では `await` しない

これも React に限った話ではなく、独立した複数の非同期処理が必要となるのであればそのように書かれるべき。

### Promise.all() for Independent Operations

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-parallel.md

> 互いに依存していない `async` 処理は `Promise.all()` で同期しよう

これも当たり前。

### Strategic Suspense Boundaries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-suspense-boundaries.md

> 非同期コンポーネントでデータの読み込みを待つのではなく、サスペンスバウンダリを使ってデータを取得している間に UI を表示しよう

これは React 固有の話。
React 18 から正式な機能となった [\<Suspense\>](https://ja.react.dev/reference/react/Suspense) を使うと、
コンポーネント内の非同期処理が終わるまでの間に表示すべきコンポーネントを指定するとデータ取得が完了するまで代わりのコンポーネントを表示し、
完了すると自動で非同期コンポーネントをレンダリングした結果を表示してくれる機能だ。
`<Suspense>` を使うことで一部のコンポーネントで使うデータの取得を待たずに画面が表示されるようになる。

しかし、レイアウトシフトの問題が発生するため初期レンダリングを早めるか、レイアウトシフトを抑えるか、UI によって選ぶことになる。

## まとめ

今回は react-best-practices の Eliminating Waterfalls カテゴリーを確認した。
このカテゴリーで書かれている内容は、どれも従うべきプラクティスだと思った。
引き続き残りのベストプラクティスについても確認していく。
