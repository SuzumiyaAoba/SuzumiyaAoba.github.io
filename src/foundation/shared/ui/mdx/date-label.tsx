import type { ComponentProps, PropsWithChildren } from "react";

import { Icon } from "@iconify/react";

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
export function MdxDateLabel({ date, children, className, ...props }: MdxDateLabelProps) {
  return (
    <time
      dateTime={date}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap border border-slate-200/80 bg-slate-50/80 px-2 py-0.5 text-sm font-semibold leading-none text-slate-700 align-middle dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300",
        className,
      )}
      {...props}
    >
      <Icon icon="lucide:calendar" className="size-3.5" aria-hidden />
      <span>{children ?? date}</span>
    </time>
  );
}
