import { HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./button";
import { lineNumbers } from "./line-numbers";
import clsx from "clsx";
import { hover } from "./code-mentions";
import { mark } from "./mark";
import { className as classNameHandler } from "./classname";

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
        className={clsx("!px-4", "!my-0", className)}
        code={code}
        handlers={[lineNumbers, hover, mark, classNameHandler]}
      />
    </>
  );
}
