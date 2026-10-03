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
      className={cn(
        "my-7 rounded-md border border-rule bg-column-surface px-5 py-4 text-[0.9375rem] leading-[1.85]",
        className
      )}
    >
      <div className="flex items-center gap-2 font-bold">
        <Icon icon="lucide:book-open" className="size-4 text-column-ink" />
        <span className="text-xs font-semibold tracking-wider text-column-ink">
          Column
        </span>
        <span className="flex-1">{title}</span>
      </div>
      <div className="prose mt-2 max-w-none text-[length:inherit]">
        {children}
      </div>
    </aside>
  );
}
