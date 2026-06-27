import type { PropsWithChildren } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type ColumnProps = PropsWithChildren<{
  title: string;
  className?: string;
}>;

export function Column({ title, children, className }: ColumnProps) {
  return (
    <aside
      className={cn(
        "my-6 rounded-md bg-amber-50/60 px-4 py-3 dark:bg-amber-950/30",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
        <Icon icon="lucide:book-open" className="size-4" />
        <span className="text-xs uppercase tracking-wider">Column</span>
        <span className="flex-1">{title}</span>
      </div>
      <div className="prose prose-sm mt-2 max-w-none font-sans">{children}</div>
    </aside>
  );
}
