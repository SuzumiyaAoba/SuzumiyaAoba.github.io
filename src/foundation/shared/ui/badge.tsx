import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

/**
 * バッジのバリアント設定
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        muted:
          "border-transparent bg-muted text-label font-medium text-muted-foreground",
        mutedLink:
          "gap-1 border-transparent bg-muted text-label font-medium text-muted-foreground transition-colors hover:text-foreground",
        outlineSoft: "border-border/40 text-label font-medium text-foreground",
        outlineMuted:
          "border-muted-foreground/20 bg-transparent text-label text-muted-foreground",
        ghost:
          "font-noto rounded-sm border-transparent bg-transparent px-0 text-label font-medium text-muted-foreground",
        bare: "border-0 bg-transparent p-0 text-inherit [&>span]:min-w-0 [&>span]:break-words",
        bareLg: "border-0 bg-transparent p-0 text-sm font-medium text-inherit",
        toggle:
          "border-transparent bg-muted py-1 text-label font-medium text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground group-aria-pressed:bg-foreground group-aria-pressed:text-background [&>span]:min-w-0 [&>span]:break-words",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * バッジコンポーネント
 * @param props バリアント、その他のプロップス
 */

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
