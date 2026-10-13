import type { PropsWithChildren } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * MDX 内で使用されるラベルコンポーネントのプロパティ
 */
export type MdxLabelProps = PropsWithChildren<{
  /** ラベルの種類（角印の色に影響します） */
  variant?: "info" | "success" | "warning" | "error" | "note";
  /** 追加のスタイルクラス */
  className?: string;
}>;

/**
 * MDX コンテンツ内で強調表示や状態を示すラベル。
 * 細い罫の札に文字を刷り、種類は頭の小さな角印の色で示す。
 */
export function MdxLabel({
  children,
  variant = "note",
  className,
}: MdxLabelProps) {
  return (
    <span className={cn("inline-label", className)} data-variant={variant}>
      <span className="callout-mark" aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
