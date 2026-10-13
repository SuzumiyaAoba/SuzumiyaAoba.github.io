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
      <div className="code-placeholder">
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
    <div className="code-frame">
      {displayMeta ? (
        <div className="code-bar">
          <span className="code-bar-title">{displayMeta}</span>
          <span className="code-bar-lang">{highlighted.lang}</span>
        </div>
      ) : null}
      <CustomCodeBlock code={normalizedCodeblock} handlers={[tooltip]} />
      {notes.length > 0 ? (
        <ul className="code-notes">
          {notes.map((note, index) => (
            // 脚注は静的コンテンツで並び替え・途中挿入が起きない。
            // react-doctor-disable-next-line no-array-index-as-key
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
