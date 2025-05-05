import { FC, PropsWithChildren, memo } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const messageVariants = cva("my-8 px-4 rounded-md border", {
  variants: {
    variant: {
      info: "border-sky-400 bg-sky-50",
      success: "border-green-400 bg-green-50",
      warning: "border-amber-400 bg-amber-50",
      error: "border-red-400 bg-red-50",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const iconVariants = cva("mr-2 text-2xl", {
  variants: {
    variant: {
      info: "i-mdi-info text-sky-800",
      success: "i-mdi-check-circle text-green-800",
      warning: "i-mdi-alert text-amber-800",
      error: "i-mdi-alert-circle text-red-800",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export interface MessageProps
  extends PropsWithChildren,
    VariantProps<typeof messageVariants> {
  /** メッセージのタイトル */
  title?: string;
  /** 追加のクラス名 */
  className?: string;
  /** アイコンを表示するかどうか */
  showIcon?: boolean;
}

export const Message: FC<MessageProps> = memo(
  ({ title, children, variant, className, showIcon = true }) => {
    return (
      <details
        className={cn(
          messageVariants({ variant }),
          className,
          "open:ring",
          "group"
        )}
      >
        <summary className="flex items-center cursor-pointer">
          {showIcon && <p className={iconVariants({ variant })} />}
          <p className="font-bold">{title}</p>
          <span className="ml-auto transform transition-transform rotate-90 group-open:rotate-0 mr-2">
            ▼
          </span>
        </summary>

        <div className="prose prose-sm max-w-none">{children}</div>
      </details>
    );
  }
);

Message.displayName = "Message";
