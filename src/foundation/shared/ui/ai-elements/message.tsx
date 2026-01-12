import type { HTMLAttributes } from "react";

import { Icon } from "@iconify/react";

import { cn } from "@/shared/lib/utils";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: "user" | "assistant";
  showAvatar?: boolean;
};

export function Message({ className, from, showAvatar = true, children, ...props }: MessageProps) {
  return (
    <div
      className={cn(
        "group flex w-full items-start gap-3",
        from === "user" ? "justify-end" : "justify-start",
        className,
      )}
      {...props}
    >
      {showAvatar ? (
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground",
            from === "user" ? "order-2" : "order-0",
          )}
          aria-hidden="true"
        >
          <Icon icon={from === "user" ? "lucide:user" : "lucide:bot"} className="size-4" />
        </div>
      ) : null}
      <div
        className={cn(
          "flex-1 min-w-0",
          from === "user" ? "order-0" : "order-1",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export type MessageContentProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "contained" | "flat";
  from?: "user" | "assistant";
};

export function MessageContent({
  className,
  variant = "contained",
  from = "assistant",
  ...props
}: MessageContentProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 text-sm leading-6",
        variant === "contained" ? "rounded-lg px-4 py-3" : "",
        from === "user"
          ? "bg-muted text-foreground"
          : "bg-card/50 text-foreground border border-border/60",
        className,
      )}
      {...props}
    />
  );
}
