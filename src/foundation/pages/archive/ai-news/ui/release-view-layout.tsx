import type { ReactNode } from "react";

export const releaseSelectClass =
  "h-10 min-w-0 rounded-lg border bg-background px-3 text-xs text-foreground shadow-none focus-visible:outline-2 focus-visible:outline-ring";

export const releaseActionClass = "h-10 rounded-lg px-3 text-xs shadow-none";

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
