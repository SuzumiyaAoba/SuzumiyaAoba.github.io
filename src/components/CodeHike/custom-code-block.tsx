import { HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./button";
import { lineNumbers } from "./line-numbers";

export async function CustomCodeBlock({ code }: { code: HighlightedCode }) {
  return (
    <div className="relative">
      <CopyButton text={code.code} />
      <Pre className="!px-4" code={code} handlers={[lineNumbers]} />
    </div>
  );
}
