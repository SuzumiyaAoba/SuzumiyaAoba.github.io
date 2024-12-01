import { highlight, RawCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-light");
  return (
    <div className="relative code-hike my-4">
      {highlighted.meta ? (
        <div className="rounded-t bg-slate-100 text-center text-slate-500">
          {highlighted.meta}
        </div>
      ) : (
        <></>
      )}
      <CustomCodeBlock
        code={highlighted}
        className={highlighted.meta ? "!rounded-none !rounded-b" : ""}
      />
    </div>
  );
}
