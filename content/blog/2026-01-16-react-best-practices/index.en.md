---
title: Looking into react-best-practices (Eliminating Waterfalls)
date: 2026-01-17
category: Programming
tags: ["Skills", "AI", "LLM", "React"]
---

Vercel published [react-best-practices](https://vercel.com/blog/introducing-react-best-practices) as a React Skill.
The GitHub repo is [skills/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices).
There are more than 40 rules as Markdown files.
It seems to be a collection of optimization-focused knowledge based on Vercel's React experience.

I'm curious, so I'll check the rules one by one.
There are many rules, so I'll split the article by category.

## Rule table

| Category (English)       | Category (Japanese)              | Rule (English)                                     | Rule (Japanese)                                  |
|--------------------------|----------------------------------|---------------------------------------------------|--------------------------------------------------|
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

This time I will look at Eliminating Waterfalls.

## Eliminating Waterfalls

The quoted parts are not direct translations of the skill; they are short paraphrased summaries.

The rest of the article follows this format:

```markdown
> [Skill summary]

Personal thoughts
```

### Defer Await Until Needed

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-defer-await.md

> Delay async work until it is truly needed.

This is not specific to React; unnecessary async work should be deferred in general.

### Dependency-Based Parallelization

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-dependencies.md

> For dependent async work, use [better-all](https://github.com/shuding/better-all) to start each task as early as possible.

This is my first time hearing about the better-all library.
When you need data from multiple APIs, you often need one API response to build requests for another.
If you try to do this with `async/await`, you must carefully order tasks that can run in parallel vs those that cannot.
Add latency concerns, and sometimes you end up needing to chain with `then` to be truly optimal.
The [README example](https://github.com/shuding/better-all/blob/main/README.md) explains what is problematic.

This made me feel that when you want `Promise.all()` or `Promise.allSettled()` but have dependencies,
better-all is a good choice.

### Prevent Waterfall Chains in API Routes

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-api-routes.md

> In API routes and server actions, start independent operations immediately and do not `await` them on the spot.

Again, not React-specific: if you need multiple independent async tasks, you should write it that way.

### Promise.all() for Independent Operations

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-parallel.md

> Sync independent async operations with `Promise.all()`.

Obvious.

### Strategic Suspense Boundaries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/async-suspense-boundaries.md

> Instead of waiting inside async components, show UI while data is loading by using Suspense boundaries.

This is React-specific.
With [<Suspense>](https://ja.react.dev/reference/react/Suspense), which became official in React 18,
you can specify a fallback component to show while async work in a component is running.
When data loading finishes, it automatically renders the async component result.
Using `<Suspense>` allows the screen to appear without waiting for some component's data.

However, it can cause layout shifts, so you must choose whether to prioritize faster initial rendering or reduce layout shift.

## Summary

This time I reviewed the Eliminating Waterfalls category of react-best-practices.
Everything in this category seems like a practice worth following.
I'll continue reviewing the remaining best practices.
