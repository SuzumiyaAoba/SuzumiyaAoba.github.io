import { HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./button";
import { lineNumbers } from "./line-numbers";
import clsx from "clsx";

export async function CustomCodeBlock({
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
        handlers={[lineNumbers]}
      />
    </>
  );
}
