"use client";

import dynamic from "next/dynamic";

type MermaidLazyProps = {
  /** Mermaid.js の記法で記述されたコード */
  code: string;
  /** 追加のスタイルクラス */
  className?: string;
};

/**
 * mermaid 本体を読み込む遅延境界。
 *
 * この分割はクライアントコンポーネントの内側に置く必要がある。
 * サーバーコンポーネント側で next/dynamic を使うと、対象が
 * 「ルートのクライアント参照」として扱われ、Next.js が図を含まない記事でも
 * mermaid + d3（約 390KB gzip）を初期ロードに含めてしまう。
 *
 * mermaid は useEffect の中で描画するためサーバーでは空要素しか返らない。
 * よって ssr: false による表示上の差は無い。
 */
const Mermaid = dynamic(() => import("./mermaid").then((mod) => mod.Mermaid), {
  ssr: false,
});

/**
 * Mermaid 図を描画する。図を含む記事でのみ読み込まれる。
 */
export function MermaidLazy({ code, className }: MermaidLazyProps) {
  return <Mermaid code={code} {...(className === undefined ? {} : { className })} />;
}
