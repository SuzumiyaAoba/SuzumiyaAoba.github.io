import { FC, PropsWithChildren, memo } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const messageVariants = cva("my-8 px-4 rounded-md border", {
  variants: {
    variant: {
      info: "border-info bg-info",
      success: "border-success bg-success",
      warning: "border-warning bg-warning",
      error: "border-error bg-error",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

const iconVariants = cva("mr-2 text-2xl", {
  variants: {
    variant: {
      info: "i-mdi-info text-info-icon",
      success: "i-mdi-check-circle text-success-icon",
      warning: "i-mdi-alert text-warning-icon",
      error: "i-mdi-alert-circle text-error-icon",
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
        style={{
          borderColor: `var(--${variant}-border)`,
          backgroundColor: `var(--${variant}-bg)`,
        }}
      >
        <summary className="flex items-center cursor-pointer">
          {showIcon && (
            <p
              className={iconVariants({ variant })}
              style={{ color: `var(--${variant}-icon)` }}
            />
          )}
          <p className="font-bold" style={{ color: `var(--${variant}-text)` }}>
            {title}
          </p>
          <span className="ml-auto transform transition-transform rotate-90 group-open:rotate-0 mr-2">
            ▼
          </span>
        </summary>

        <div
          className="prose prose-sm max-w-none"
          style={{ color: `var(--${variant}-text)` }}
        >
          {children}
        </div>
      </details>
    );
  }
);

Message.displayName = "Message";
