import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * インプットコンポーネント
 * @param props 標準的な input 要素のプロップス
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
