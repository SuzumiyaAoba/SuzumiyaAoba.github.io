import type { PropsWithChildren } from "react";

import { cn } from "@/shared/lib/utils";

export type MessageProps = PropsWithChildren<{
  title?: string;
  variant?: "info" | "success" | "warning" | "error";
  defaultOpen?: boolean;
  className?: string;
}>;

/**
 * 本文中の囲み記事。細い罫で囲み、種類は題の前の小さな角印の色だけで伝える。
 * 開閉の記号も ＋／－ の文字にして、アイコンの定型から離す。
 */
export function Message({
  title,
  children,
  variant = "info",
  defaultOpen = false,
  className,
}: MessageProps) {
  return (
    <details
      className={cn("callout", className)}
      data-variant={variant}
      open={defaultOpen}
    >
      {title ? (
        <summary className="callout-title">
          <span className="callout-mark" aria-hidden="true" />
          <span className="flex-1">{title}</span>
          <span className="callout-toggle" aria-hidden="true" />
        </summary>
      ) : null}
      <div className="prose callout-body">{children}</div>
    </details>
  );
}
