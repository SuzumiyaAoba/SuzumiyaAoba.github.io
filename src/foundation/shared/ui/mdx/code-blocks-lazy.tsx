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
  async () => {
    const { CodeWithTabs: Component } = await import("./code-tabs");
    return Component;
  },
  { ssr: false },
);

export const CodeSwitcher = dynamic(
  async () => {
    const { CodeSwitcher: Component } = await import("./code-switcher");
    return Component;
  },
  { ssr: false },
);

export const CodeWithTooltips = dynamic(
  async () => {
    const { CodeWithTooltips: Component } = await import("./code-with-tooltips");
    return Component;
  },
  { ssr: false },
);
