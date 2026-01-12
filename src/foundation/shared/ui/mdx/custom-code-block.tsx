import type { AnnotationHandler, HighlightedCode } from "codehike/code";
import { Pre } from "codehike/code";

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
  return (
    <Pre
      code={code}
      className={cn(
        "my-4 overflow-x-auto rounded-lg bg-muted px-4 py-3 text-sm leading-6",
        className,
      )}
      handlers={[
        ...handlers,
        lineNumbers,
        hover,
        mark,
        classNameHandler,
        diff,
        callout,
        collapse,
        collapseTrigger,
        collapseContent,
        footnotes,
      ]}
    />
  );
}
