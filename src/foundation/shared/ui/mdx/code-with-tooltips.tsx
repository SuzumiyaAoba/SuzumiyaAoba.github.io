"use client";

import { highlight, type HighlightedCode, type RawCode } from "codehike/code";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";
import { FootnoteNumber } from "@/shared/ui/mdx/codehike-handlers";
import { tooltip } from "@/shared/ui/mdx/codehike-handlers";

type TooltipBlock = {
  title?: string;
  children?: ReactNode;
};

export function CodeWithTooltips({
  code,
  tooltips = [],
}: {
  code: RawCode;
  tooltips?: TooltipBlock[];
}) {
  const [highlighted, setHighlighted] = useState<HighlightedCode | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await highlight(code, "github-from-css");
      if (!cancelled) {
        setHighlighted(result);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!highlighted) {
    return (
      <div className="my-6 rounded-lg border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
        Loading code...
      </div>
    );
  }

  const notes = highlighted.annotations
    .filter(({ name }) => name === "ref")
    .map(({ query }) => query);

  let noteIndex = 0;
  const annotations = highlighted.annotations.map((annotation) => {
    if (annotation.name === "ref") {
      noteIndex += 1;
    }

    const match = tooltips.find((entry) => entry.title === annotation.query);
    const data = annotation.name === "ref" ? { ...annotation.data, n: noteIndex } : annotation.data;
    if (!match) {
      return { ...annotation, data };
    }
    return {
      ...annotation,
      data: { ...data, children: match.children },
    };
  });
  const normalizedCodeblock: HighlightedCode = {
    ...highlighted,
    annotations,
  };

  return (
    <div className="my-6">
      {highlighted.meta ? (
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">{highlighted.meta}</span>
          <span className="text-[10px] uppercase tracking-[0.12em]">{highlighted.lang}</span>
        </div>
      ) : null}
      <CustomCodeBlock
        code={normalizedCodeblock}
        handlers={[tooltip]}
        {...(normalizedCodeblock.meta ? { className: "rounded-t-none mt-0" } : {})}
      />
      {notes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {notes.map((note, index) => (
            <li key={`${note}-${index}`} className="flex items-start gap-2">
              <FootnoteNumber n={index + 1} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
