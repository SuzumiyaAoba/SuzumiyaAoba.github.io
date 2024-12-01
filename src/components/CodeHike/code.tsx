import { highlight, RawCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-light");
  return (
    <div className="code-hike">
      {highlighted.meta ? (
        <div className="meta">{highlighted.meta}</div>
      ) : (
        <></>
      )}
      <CustomCodeBlock code={highlighted} />
    </div>
  );
}
