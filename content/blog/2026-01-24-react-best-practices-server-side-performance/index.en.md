---
title: Looking into react-best-practices (Server-Side Performance)
date: 2026-01-24
category: Programming
tags: ["Skills", "AI", "LLM", "React"]
thumbnail: iconify:devicon:react
amazonAssociate: true
amazonProductIds:
  - "これからはじめるReact実践入門 コンポーネントの基本からNext.jsによるアプリ開発まで"
  - "Reactハンズオンラーニング"
  - "プロを目指す人のためのTypeScript入門"
model: GPT-5.2-Codex
---

Following [Eliminating Waterfalls](../2026-01-16-react-best-practices/) and [Bundle Size Optimization](../2026-01-17-react-best-practices-bundle-size-optimization/), this article looks at Server-Side Performance.
About a week has passed since the skill was published, and new rules have already been added that weren't in the initial table.
More rules will likely continue to appear, so I'll review the rules that existed at release and then look at the differences later.

## Rule table

| Category (English)       | Category (Japanese)          | Rule (English)                                     | Rule (Japanese)                                |
| ------------------------ | ---------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| Server-Side Performance  | サーバーサイドパフォーマンス | Cross-Request LRU Caching                         | リクエスト間で LRU キャッシュする              |
|                          |                              | Minimize Serialization at RSC Boundaries          | RSC 境界でのシリアライズを最小化する           |
|                          |                              | Parallel Data Fetching with Component Composition | コンポーネント合成でデータフェッチを並列化する |
|                          |                              | Per-Request Deduplication with React.cache()      | React.cache() でリクエスト内の重複を排除する   |
|                          |                              | Use after() for Non-Blocking Operations           | after() で非ブロッキングに後処理を実行する     |

### Cross-Request LRU Caching

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-cache-lru.md

> `React.cache()` is only effective within a single request. For data shared across multiple requests, use an LRU cache.

`React.cache()` is effective when the same data is fetched multiple times within a single request, but it does not help much across requests.
In that case, you need an in-process LRU cache and memory caching.
The rule mentions [isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache) and [Redis](https://redis.io/).

### Minimize Serialization at RSC Boundaries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-serialization.md

> The React server/client boundary serializes all props into the HTML response and RSC payload, so serialized data heavily impacts page weight and load time. Only pass fields actually used on the client.

Instead of passing a huge object to client components and picking fields there, keep props minimal and only send the data that client components need.

### Parallel Data Fetching with Component Composition

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-parallel-fetching.md

> React server components execute from top to bottom in the tree, so split data fetching into sibling components via composition to run in parallel.

These points may help:

- Don't `await` in the parent and then render children afterward.
- If the parent fetches data, create a `Promise`, pass it down, and `await` in the child.

### Per-Request Deduplication with React.cache()

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-cache-react.md

> Use `React.cache()` to memoize the results of the same async operation within a request.

Because `React.cache()` uses shallow comparison via `Object.is`, it won't cache unless you use it correctly.
When passing objects, references must be identical.
Also, Next.js `fetch` already caches requests automatically, so `React.cache()` is unnecessary there, but it still helps for DB access, heavy computation, auth, file ops, or any async work other than fetch.

### Use after() for Non-Blocking Operations

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/server-after-nonblocking.md

> Use `after()` for non-blocking operations.

For side effects unrelated to the response, such as log shipping, use Next.js [`after()`](https://nextjs.org/docs/app/api-reference/functions/after) so requests aren't blocked.

## Closing

I read the Server-Side Performance rules in react-best-practices.
Because this category is server-side performance, many of the rules are specific to Next.js and React rather than general best practices.
This is only the third category, so I'll keep going through the remaining five in the same way.
