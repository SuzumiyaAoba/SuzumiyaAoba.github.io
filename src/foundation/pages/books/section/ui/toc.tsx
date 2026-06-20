"use client";

import { TOCProvider, TOCScrollArea, ClerkTOCItems } from "@/shared/ui/toc-crux";
import type { TocHeading } from "@/shared/lib/mdx";

type TocProps = {
  headings: TocHeading[];
};

export function Toc({ headings }: TocProps) {
  if (headings.length === 0) {
    return null;
  }

  const toc = headings.map((h) => ({
    title: h.text,
    url: `#${h.id}`,
    depth: h.level,
  }));

  return (
    <TOCProvider toc={toc}>
      <aside className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-hidden text-sm">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          目次
        </p>
        <TOCScrollArea className="min-h-0 flex-1">
          <ClerkTOCItems />
        </TOCScrollArea>
      </aside>
    </TOCProvider>
  );
}
