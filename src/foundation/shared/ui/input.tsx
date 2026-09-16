import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * インプットのバリアント設定
 */
const inputVariants = {
  default: "",
  icon: "pl-10",
  search: "h-12 pr-14 pl-12 [&::-webkit-search-cancel-button]:appearance-none",
  underline:
    "rounded-none border-0 border-b border-border bg-transparent pl-7 focus-visible:border-ring focus-visible:ring-0",
} as const;

/**
 * インプットコンポーネント
 * @param props バリアント、標準的な input 要素のプロップス
 */
function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & {
  variant?: keyof typeof inputVariants;
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        inputVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Input };
