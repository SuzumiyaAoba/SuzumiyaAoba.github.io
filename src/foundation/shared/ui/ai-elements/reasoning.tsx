import type { HTMLAttributes } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type ReasoningProps = HTMLAttributes<HTMLDetailsElement> & {
  defaultOpen?: boolean;
};

export function Reasoning({ className, defaultOpen = false, ...props }: ReasoningProps) {
  return (
    <details className={cn("group not-prose m-0", className)} open={defaultOpen} {...props} />
  );
}

export type ReasoningTriggerProps = HTMLAttributes<HTMLElement>;

export function ReasoningTrigger({ className, children, ...props }: ReasoningTriggerProps) {
  return (
    <summary
      className={cn(
        "cursor-pointer list-none text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        "flex items-center gap-2",
        className,
      )}
      {...props}
    >
      {children ?? (
        <>
          <Icon icon="lucide:brain" className="size-3.5" />
          <span>Reasoning</span>
          <Icon
            icon="lucide:chevron-down"
            className="ml-auto size-3.5 transition-transform group-open:rotate-180"
          />
        </>
      )}
    </summary>
  );
}

export type ReasoningContentProps = HTMLAttributes<HTMLDivElement>;

export function ReasoningContent({ className, ...props }: ReasoningContentProps) {
  return (
    <div
      className={cn(
        "mt-1 rounded-md px-0 py-2 text-xs text-muted-foreground",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    />
  );
}
