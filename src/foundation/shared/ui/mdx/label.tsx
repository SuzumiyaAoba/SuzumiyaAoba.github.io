import type { PropsWithChildren } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type MdxLabelProps = PropsWithChildren<{
  variant?: "info" | "success" | "warning" | "error" | "note";
  className?: string;
}>;

const variantStyles: Record<NonNullable<MdxLabelProps["variant"]>, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950 dark:text-sky-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-200",
  error:
    "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950 dark:text-rose-200",
  note: "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
};

const variantIcons: Record<NonNullable<MdxLabelProps["variant"]>, string> = {
  info: "lucide:info",
  success: "lucide:check-circle-2",
  warning: "lucide:alert-triangle",
  error: "lucide:alert-circle",
  note: "lucide:info",
};

export function MdxLabel({ children, variant = "note", className }: MdxLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
    >
      <Icon icon={variantIcons[variant]} className="size-3.5" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
