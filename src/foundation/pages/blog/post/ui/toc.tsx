"use client";

import { useEffect, useMemo, useState } from "react";


import { cn } from "@/shared/lib/utils";
import { I18nText } from "@/shared/ui/i18n-text";
import type { TocHeading } from "@/shared/lib/mdx";

type TocProps = {
  headings: TocHeading[];
};

export function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const headingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

  useEffect(() => {
    if (headingIds.length === 0) {
      return;
    }

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const target = visible[0]?.target as HTMLElement | undefined;
        if (target?.id) {
          setActiveId(target.id);
        }
      },
      {
        rootMargin: "0px 0px -70% 0px",
        threshold: [0.1, 1],
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
      observer.disconnect();
    };
  }, [headingIds]);

  useEffect(() => {
    if (!activeId && headings.length > 0) {
      setActiveId(headings[0]?.id ?? null);
    }
  }, [activeId, headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-auto pr-2 text-sm">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        <I18nText ja="目次" en="Contents" />
      </div>
      <ol className="space-y-2 text-muted-foreground">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-5" : ""}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "group flex items-start gap-2 border-l border-transparent py-1 pl-2 text-sm transition-colors hover:text-foreground",
                activeId === heading.id
                  ? "border-foreground/70 text-foreground"
                  : "border-transparent text-muted-foreground",
              )}
            >
              <span className="min-w-0 flex-1">{heading.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
