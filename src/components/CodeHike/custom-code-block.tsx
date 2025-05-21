import { AnnotationHandler, HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./button";
import { lineNumbers } from "./line-numbers";
import clsx from "clsx";
import { hover } from "./code-mentions";
import { mark } from "./mark";
import { className as classNameHandler } from "./classname";
import { diff } from "./diff";
import { collapse, collapseContent, collapseTrigger } from "./collapse";
import { callout } from "./callout";
import { footnotes } from "./footnote";

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
    <>
      <CopyButton text={code.code} />
      <Pre
        className={clsx("!px-4", "!my-0", "code-hike-no-line", className)}
        code={code}
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
    </>
  );
}
