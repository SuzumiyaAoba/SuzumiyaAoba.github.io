import type { PropsWithChildren } from "react";

import { Icon } from "@/shared/ui/icon";

import { cn } from "@/shared/lib/utils";

export type MessageProps = PropsWithChildren<{
  title?: string;
  variant?: "info" | "success" | "warning" | "error";
  defaultOpen?: boolean;
  className?: string;
}>;

/** 面は共通の落ち着いた色にし、種類は左の罫線とアイコンの色だけで伝える。 */
const variantStyles: Record<NonNullable<MessageProps["variant"]>, string> = {
  info: "border-l-callout-info",
  success: "border-l-callout-success",
  warning: "border-l-callout-warning",
  error: "border-l-callout-error",
};

const variantIconStyles: Record<
  NonNullable<MessageProps["variant"]>,
  string
> = {
  info: "text-callout-info",
  success: "text-callout-success",
  warning: "text-callout-warning",
  error: "text-callout-error",
};

const variantIcons: Record<NonNullable<MessageProps["variant"]>, string> = {
  info: "lucide:info",
  success: "lucide:check-circle-2",
  warning: "lucide:alert-triangle",
  error: "lucide:alert-circle",
};

export function Message({
  title,
  children,
  variant = "info",
  defaultOpen = false,
  className,
}: MessageProps) {
  return (
    <details
      className={cn(
        "my-7 rounded-l-none rounded-r-md border-y-0 border-r-0 border-l-[3px] bg-callout-surface px-5 py-4 text-[0.9375rem] leading-[1.85]",
        variantStyles[variant],
        "group",
        className
      )}
      open={defaultOpen}
    >
      {title ? (
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold">
          <Icon
            icon={variantIcons[variant]}
            className={cn("size-4", variantIconStyles[variant])}
          />
          <span className="flex-1">{title}</span>
          <Icon
            icon="lucide:chevron-down"
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </summary>
      ) : null}
      <div
        className={cn(
          "prose max-w-none text-[length:inherit]",
          title ? "mt-2" : ""
        )}
      >
        {children}
      </div>
    </details>
  );
}
