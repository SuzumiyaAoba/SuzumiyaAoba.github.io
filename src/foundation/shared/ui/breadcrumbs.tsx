import { Icon } from "@/shared/ui/icon";

import { cn } from "@/shared/lib/utils";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("text-[13px] text-muted-foreground", className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
              {index !== 0 ? (
                <Icon
                  icon="lucide:chevron-right"
                  className="size-3 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              {isLast ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {item.path === "/" ? <Icon icon="lucide:home" className="size-3.5" /> : item.name}
                </span>
              ) : item.path === "/" ? (
                <a
                  href={item.path}
                  className="inline-flex min-h-8 min-w-8 items-center rounded-sm font-medium transition-colors hover:text-foreground"
                  aria-label="Home"
                >
                  <Icon icon="lucide:home" className="size-3.5" />
                </a>
              ) : (
                <a
                  href={item.path}
                  className="inline-flex min-h-8 items-center rounded-sm font-medium transition-colors hover:text-foreground"
                >
                  {item.name}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
