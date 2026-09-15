"use client";

import { annotationData } from "./annotation-data";

import type { HighlightedCode, RawCode } from "codehike/code";
import type { ReactNode } from "react";

import { useHighlightedCode } from "./use-highlighted-code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";
import { FootnoteNumber, tooltip } from "@/shared/ui/mdx/codehike-handlers";

type TooltipBlock = {
  title?: string;
  children?: ReactNode;
};

const DEFAULT_TOOLTIPS: TooltipBlock[] = [];

export function CodeWithTooltips({
  code,
  tooltips = DEFAULT_TOOLTIPS,
}: {
  code: RawCode;
  tooltips?: TooltipBlock[];
}) {
  const { blocks, hasError } = useHighlightedCode(code);
  const [highlighted] = blocks;

  if (!highlighted) {
    return (
      <div className="my-6 rounded-lg border border-border bg-muted px-4 py-6 text-sm text-muted-foreground">
        {hasError ? "Unable to highlight code." : "Loading code..."}
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
    const data =
      annotation.name === "ref"
        ? { ...annotationData(annotation.data), n: noteIndex }
        : annotationData(annotation.data);
    if (!match) {
      return { ...annotation, data };
    }
    return {
      ...annotation,
      data: { ...data, children: match.children },
    };
  });
  const { displayMeta } = parseCodeMeta(highlighted.meta);
  const normalizedCodeblock: HighlightedCode = {
    ...highlighted,
    annotations,
  };

  return (
    <div className="my-6">
      {displayMeta ? (
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">{displayMeta}</span>
          <span className="text-[10px] tracking-[0.12em] uppercase">
            {highlighted.lang}
          </span>
        </div>
      ) : null}
      <CustomCodeBlock
        code={normalizedCodeblock}
        handlers={[tooltip]}
        {...(displayMeta ? { className: "rounded-t-none mt-0" } : {})}
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
