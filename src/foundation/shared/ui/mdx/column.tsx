import type { PropsWithChildren } from "react";

import { cn } from "@/shared/lib/utils";

export type ColumnProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

/** 技術書のコラム欄。淡い地の上に「Column」の見出し札と題を置く。 */
export function Column({ title, children, className }: ColumnProps) {
  return (
    <aside className={cn("column-box", className)}>
      <p className="column-box-title">
        <span className="column-box-label" lang="en">
          Column
        </span>
        <span>{title}</span>
      </p>
      <div className="prose callout-body">{children}</div>
    </aside>
  );
}
