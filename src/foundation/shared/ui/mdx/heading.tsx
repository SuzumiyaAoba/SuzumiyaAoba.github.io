import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

function HeadingPrefix({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex select-none items-center text-[1em] font-semibold tracking-[0.12em] text-muted-foreground leading-none"
    >
      {children}
    </span>
  );
}

export function MdxH2({ className, children, ...props }: HeadingProps) {
  return (
    <h2 className={cn("mdx-heading flex flex-wrap items-baseline gap-2", className)} {...props}>
      <HeadingPrefix>##</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h2>
  );
}

export function MdxH3({ className, children, ...props }: HeadingProps) {
  return (
    <h3 className={cn("mdx-heading flex flex-wrap items-baseline gap-2", className)} {...props}>
      <HeadingPrefix>###</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h3>
  );
}

export function MdxH4({ className, children, ...props }: HeadingProps) {
  return (
    <h4 className={cn("mdx-heading flex flex-wrap items-baseline gap-2", className)} {...props}>
      <HeadingPrefix>####</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h4>
  );
}

export function MdxH5({ className, children, ...props }: HeadingProps) {
  return (
    <h5 className={cn("mdx-heading flex flex-wrap items-baseline gap-2", className)} {...props}>
      <HeadingPrefix>#####</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h5>
  );
}
