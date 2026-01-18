---
title: A Look at react-best-practices (Bundle Size Optimization)
date: 2026-01-17
category: Programming
tags: ["Skills", "AI", "LLM", "React"]
thumbnail: iconify:devicon:react
---

Following on from [the previous article](../2026-01-16-react-best-practices/), let's look at the contents of Vercel's [react-best-practices](https://vercel.com/blog/introducing-react-best-practices).
This time, we read the rules in the Bundle Size Optimization category.

| Category (English)       | Category (Japanese) | Rule (English)                          | Rule (Japanese)                                  |
| ------------------------ | ------------------- | --------------------------------------- | ------------------------------------------------ |
| Bundle Size Optimization | バンドルサイズ最適化 | Avoid Barrel File Imports               | バレルファイルのインポートを避ける               |
|                          |                     | Conditional Module Loading              | 条件付きでモジュールを読み込む                   |
|                          |                     | Defer Non-Critical Third-Party Libraries | 非クリティカルな外部ライブラリは後回しに読み込む |
|                          |                     | Dynamic Imports for Heavy Components    | 重いコンポーネントは動的インポートする           |
|                          |                     | Preload Based on User Intent            | ユーザー意図に基づいてプリロードする             |

## Avoid Barrel File Imports

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-barrel-imports.md

> Instead of importing from a barrel file, import directly from the source file.

If you import a barrel file (a file like `index.js` that contains code such as `export * from './module'`), module resolution and analysis become more expensive, and builds or startup can become slower by hundreds of milliseconds (or more in some cases).  
It's not that tree shaking is disabled; rather, the module graph analysis before tree shaking becomes heavy.

As the example suggests, you should be careful when using libraries that export a large number of items from the top level, such as icon libraries, UI libraries like MUI that ship many components, or utility libraries like `lodash` and `ramda`.
This is more noticeable for external libraries, but the same thing can happen if you create giant barrel files in internal code.

## Conditional Module Loading

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-conditional.md

> Large data or modules should be loaded only after the feature is enabled.

This is a general practice, not just for React: load large libraries lazily when they are only needed after a specific user action.

## Defer Non-Critical Third-Party Libraries

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-defer-third-party.md

> Load analytics, logging, and error tracking after hydration so they don't block user interaction.

That makes sense, but in Next.js, if you don't explicitly remove them from the critical path, they end up in the initial load.
So the idea is to push them to load later using `next/dynamic`, `next/script`, or `useEffect`.

## Dynamic Imports for Heavy Components

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-dynamic-imports.md

> Use `next/dynamic` to lazily load large components that aren't needed for the initial render.

This is also reasonable. It's the same claim as the previous two, but focused specifically on components.

## Preload Based on User Intent

https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/rules/bundle-preload.md

> Preload heavy bundles before they are needed, based on user intent.

If a feature behind a specific button requires a large bundle, don't wait until the button is pressed. Start loading on hover or focus.
`typeof window !== 'undefined'` is a guard to avoid running on the SSR side, preventing undefined `window` errors and unnecessary preloads on the server.

## Summary

As with the previous article, I went through each rule one by one.
The rules don't seem to be well received on X (formerly Twitter), but so far they only say obvious things.
For Avoid Barrel File Imports, it seems fine to consider it only after it gets bad enough to impact development.
Also, there are spots where the criteria say it's fine to let an LLM decide, which made me think it would be better to design the skill to confirm with the user via `AskUserQuestion` when applying it.

I'll continue reviewing the remaining best practices.
