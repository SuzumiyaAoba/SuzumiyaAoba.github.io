import type { PropsWithChildren } from "react";

import { Icon } from "@/shared/ui/icon";

import { cn } from "@/shared/lib/utils";

export type ColumnProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

export function Column({ title, children, className }: ColumnProps) {
  return (
    <aside
      className={cn("my-6 rounded-md bg-column-surface px-4 py-3", className)}
    >
      <div className="flex items-center gap-2 font-semibold text-column-ink">
        <Icon icon="lucide:book-open" className="size-4" />
        <span className="text-xs tracking-wider uppercase">Column</span>
        <span className="flex-1">{title}</span>
      </div>
      <div className="prose mt-2 max-w-none font-serif">{children}</div>
    </aside>
  );
}
