import type { ComponentProps, PropsWithChildren } from "react";

import { Icon } from "@/shared/ui/icon";

import { cn } from "@/shared/lib/utils";

/**
 * MDX 内で使用する日付ラベルのプロパティ
 */
export type MdxDateLabelProps = PropsWithChildren<{
  /** 日付を示す ISO 形式などの文字列（dateTime 属性に使用します） */
  date: string;
  /** 追加のスタイルクラス */
  className?: string;
}> &
  Omit<ComponentProps<"time">, "dateTime" | "children" | "className">;

/**
 * MDX コンテンツ内で日付を示すためのラベルコンポーネント。
 */
export function MdxDateLabel({
  date,
  children,
  className,
  ...props
}: MdxDateLabelProps) {
  return (
    <time
      dateTime={date}
      className={cn(
        "inline-flex items-center gap-1 border border-border/60 bg-muted/50 px-2 py-0.5 align-middle text-sm leading-none font-semibold whitespace-nowrap text-foreground",
        className
      )}
      {...props}
    >
      <Icon icon="lucide:calendar" className="size-3.5" aria-hidden />
      <span>{children ?? date}</span>
    </time>
  );
}
