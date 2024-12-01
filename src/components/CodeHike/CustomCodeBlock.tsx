import { HighlightedCode, Pre } from "codehike/code";
import { CopyButton } from "./Button";

export async function CustomCodeBlock({ code }: { code: HighlightedCode }) {
  return (
    <div className="relative">
      <CopyButton text={code.code} />
      <Pre code={code} />
    </div>
  );
}
