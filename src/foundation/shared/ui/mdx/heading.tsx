import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

type HeadingProps = HTMLAttributes<HTMLHeadingElement>;

function HeadingPrefix({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center text-[1em] leading-none font-semibold tracking-[0.12em] text-muted-foreground select-none"
    >
      {children}
    </span>
  );
}

/**
 * 記事本文中の `# 見出し` 用。記事タイトルが h1 を占有しているため、
 * 見出しレベルの二重付与を避けるべく HTML タグは h2 として出力する
 * (先頭の `#` 表示のみ h1 相当であることを示す)。
 */
export function MdxH1({ className, children, ...props }: HeadingProps) {
  return (
    <h2
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <HeadingPrefix>#</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h2>
  );
}

export function MdxH2({ className, children, ...props }: HeadingProps) {
  return (
    <h2
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <HeadingPrefix>##</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h2>
  );
}

export function MdxH3({ className, children, ...props }: HeadingProps) {
  return (
    <h3
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <HeadingPrefix>###</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h3>
  );
}

export function MdxH4({ className, children, ...props }: HeadingProps) {
  return (
    <h4
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <HeadingPrefix>####</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h4>
  );
}

export function MdxH5({ className, children, ...props }: HeadingProps) {
  return (
    <h5
      className={cn("flex flex-wrap items-baseline gap-2", className)}
      {...props}
    >
      <HeadingPrefix>#####</HeadingPrefix>
      <span className="min-w-0 flex-1">{children}</span>
    </h5>
  );
}
