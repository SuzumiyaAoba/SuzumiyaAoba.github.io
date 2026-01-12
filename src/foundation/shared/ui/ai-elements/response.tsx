import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type ResponseProps = HTMLAttributes<HTMLDivElement>;

export function Response({ className, ...props }: ResponseProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none text-sm",
        "prose-headings:font-semibold prose-headings:text-foreground prose-a:text-foreground/80",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        "[&_code]:rounded [&_code]:bg-muted/70 [&_code]:px-1.5 [&_code]:py-0.5",
        "[&_pre]:bg-muted/70 [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-md",
        className,
      )}
      {...props}
    />
  );
}
