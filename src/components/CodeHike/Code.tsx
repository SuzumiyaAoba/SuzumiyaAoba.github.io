import { highlight, RawCode } from "codehike/code";
import { CustomCodeBlock } from "./CustomCodeBlock";

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-light");
  return (
    <div className="code-hike codeblock">
      <div>{highlighted.meta}</div>
      <CustomCodeBlock code={highlighted} />
    </div>
  );
}
