"use client";

import dynamic from "next/dynamic";

/**
 * codehike の `highlight` を使うコードブロック群の遅延境界。
 *
 * `highlight` は Shiki のハイライタと TextMate 文法一式（約 256KB gzip）を
 * 引き込む。これらのコンポーネントを MDX 共通マップへ静的に載せると、
 * コード切り替え UI を使わない記事まで全て読み込むことになる。
 *
 * mermaid と同様、分割はクライアントコンポーネントの内側に置く必要がある。
 * サーバー側で next/dynamic を使うとルートのクライアント参照として
 * 登録され、初期ロードに含まれてしまう。
 */
export const CodeWithTabs = dynamic(
  () => import("./code-tabs").then((mod) => mod.CodeWithTabs),
  { ssr: false },
);

export const CodeSwitcher = dynamic(
  () => import("./code-switcher").then((mod) => mod.CodeSwitcher),
  { ssr: false },
);

export const CodeWithTooltips = dynamic(
  () => import("./code-with-tooltips").then((mod) => mod.CodeWithTooltips),
  { ssr: false },
);
