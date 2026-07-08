import type { AnnotationHandler, HighlightedCode } from "codehike/code";
import { Pre } from "codehike/code";

import { parseCodeMeta } from "@/shared/lib/mdx/code-meta";
import { cn } from "@/shared/lib/utils";
import {
  callout,
  classNameHandler,
  collapse,
  collapseContent,
  collapseTrigger,
  diff,
  footnotes,
  lineNumbers,
  mark,
} from "@/shared/ui/mdx/codehike-handlers";
import { hover } from "@/shared/ui/mdx/codehike-mentions";

export function CustomCodeBlock({
  code,
  className,
  handlers = [],
}: {
  code: HighlightedCode;
  className?: string;
  handlers?: AnnotationHandler[];
}) {
  const { displayMeta, showLineNumbers } = parseCodeMeta(code.meta);
  const normalizedCode = { ...code, meta: displayMeta };

  return (
    <Pre
      code={normalizedCode}
      className={cn(
        "my-4 overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm leading-6",
        className,
      )}
      handlers={[
        ...handlers,
        collapse,
        collapseTrigger,
        collapseContent,
        ...(showLineNumbers ? [lineNumbers] : []),
        hover,
        mark,
        classNameHandler,
        diff,
        callout,
        footnotes,
      ]}
    />
  );
}
