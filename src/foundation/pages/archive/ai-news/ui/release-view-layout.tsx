import type { ComponentProps, ReactNode } from "react";

export const releaseSelectClass =
  "h-10 min-w-0 rounded-lg border bg-background px-3 text-xs text-foreground shadow-none focus-visible:outline-2 focus-visible:outline-ring";

export const releaseActionClass = "h-10 rounded-lg px-3 text-xs shadow-none";

/** ページの @container を基準に、スクロールバーを除く画面幅まで表示枠を広げる。 */
export function ReleaseScrollArea({ children, ...props }: ComponentProps<"div">) {
  return (
    <div className="mx-[calc(50%_-_50cqw)] w-[100cqw] border-y bg-background">
      <div {...props}>{children}</div>
    </div>
  );
}

/** すべての表示で、見出し・補足・操作を同じ位置に置く。 */
export function ReleaseViewHeader({
  title,
  description,
  descriptionId,
  aside,
  children,
}: {
  title: string;
  description: string;
  descriptionId?: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4 border-b px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p id={descriptionId} className="text-xs leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}
