import type { HighlightedCode } from "codehike/code";
import { Inline } from "codehike/code";

type InlineCodeProps = {
  codeblock: HighlightedCode;
};

export function InlineCode({ codeblock }: InlineCodeProps) {
  return <Inline code={codeblock} className="rounded bg-muted px-1.5 py-0.5 text-[0.85em]" />;
}
