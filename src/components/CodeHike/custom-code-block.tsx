import { HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./button";
import { lineNumbers } from "./line-numbers";
import clsx from "clsx";
import { hover } from "./code-mentions";
import { mark } from "./mark";
import { className as classNameHandler } from "./classname";
import { diff } from "./diff";
import { collapse, collapseContent, collapseTrigger } from "./collapse";

export function CustomCodeBlock({
  code,
  className,
}: {
  code: HighlightedCode;
  className?: string;
}) {
  return (
    <>
      <CopyButton text={code.code} />
      <Pre
        className={clsx("!px-4", "!my-0", "code-hike-no-line", className)}
        code={code}
        handlers={[
          lineNumbers,
          hover,
          mark,
          classNameHandler,
          diff,
          collapse,
          collapseTrigger,
          collapseContent,
        ]}
      />
    </>
  );
}
