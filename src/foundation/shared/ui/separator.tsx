import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/shared/lib/utils";

/**
 * セパレーターのバリアント設定
 */
const separatorVariants = {
  default: "bg-border",
  muted: "bg-border/40",
} as const;

/**
 * セパレーター（区切り線）コンポーネント
 * @param props 向き（水平/垂直）、装飾目的かどうか、バリアント、その他のプロップス
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  variant = "default",
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root> & {
  variant?: keyof typeof separatorVariants;
}) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0",
        separatorVariants[variant],
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
