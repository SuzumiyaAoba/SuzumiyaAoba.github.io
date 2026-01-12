import Link from "next/link";
import { Icon } from "@iconify/react";

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
    <nav className={cn("text-xs text-foreground/80", className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
              {index !== 0 ? (
                <Icon icon="lucide:chevron-right" className="size-3 text-foreground/60" />
              ) : null}
              {isLast ? (
                <span className="font-medium text-foreground">
                  {item.path === "/" ? <Icon icon="lucide:home" className="size-3.5" /> : item.name}
                </span>
              ) : item.path === "/" ? (
                <Link
                  href={item.path}
                  className="font-medium text-foreground/70 hover:text-foreground"
                  aria-label="Home"
                >
                  <Icon icon="lucide:home" className="size-3.5" />
                </Link>
              ) : (
                <Link
                  href={item.path}
                  className="font-medium text-foreground/70 hover:text-foreground"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
