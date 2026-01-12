import type { HighlightedCode } from "codehike/code";

import { CustomCodeBlock } from "@/shared/ui/mdx/custom-code-block";
import { FootnoteNumber } from "@/shared/ui/mdx/codehike-handlers";

type CodeProps = {
  codeblock: HighlightedCode;
};

export function Code({ codeblock }: CodeProps) {
  const notes = codeblock.annotations
    .filter(({ name }) => name === "ref")
    .map(({ query }) => query);

  let noteIndex = 0;
  const annotations = codeblock.annotations.map((annotation) => {
    if (annotation.name !== "ref") {
      return annotation;
    }
    noteIndex += 1;
    return {
      ...annotation,
      data: { ...annotation.data, n: noteIndex },
    };
  });

  const normalizedCodeblock: HighlightedCode = {
    ...codeblock,
    annotations,
  };

  return (
    <div className="my-6">
      {codeblock.meta ? (
        <div className="flex items-center justify-between rounded-t-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <span className="truncate">{codeblock.meta}</span>
          <span className="text-[10px] uppercase tracking-[0.12em]">{codeblock.lang}</span>
        </div>
      ) : null}
      <CustomCodeBlock
        code={normalizedCodeblock}
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
