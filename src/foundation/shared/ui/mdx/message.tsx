import type { PropsWithChildren } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type MessageProps = PropsWithChildren<{
  title?: string;
  variant?: "info" | "success" | "warning" | "error";
  defaultOpen?: boolean;
  className?: string;
}>;

const variantStyles: Record<NonNullable<MessageProps["variant"]>, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
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
      className={cn("my-6 rounded-md border px-4 py-3", variantStyles[variant], "group", className)}
      open={defaultOpen}
    >
      {title ? (
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
          <Icon icon={variantIcons[variant]} className="size-4" />
          <span className="flex-1">{title}</span>
          <Icon
            icon="lucide:chevron-down"
            className="size-4 transition-transform group-open:rotate-180"
          />
        </summary>
      ) : null}
      <div className={cn("prose prose-sm max-w-none font-sans", title ? "mt-2" : "")}>
        {children}
      </div>
    </details>
  );
}
