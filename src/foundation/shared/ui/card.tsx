import * as React from "react";

import { cn } from "@/shared/lib/utils";

/**
 * カードコンポーネントのルート
 */
function Card({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-xl border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * カードのヘッダー部分
 */
function CardHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-6", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * カードのタイトル
 */
function CardTitle({ className, children, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-none", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * カードの説明文
 */
function CardDescription({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * カードのメインコンテンツ部分
 */
function CardContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * カードのフッター部分
 */
function CardFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
