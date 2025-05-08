import { highlight, RawCode } from "codehike/code";
import { CustomCodeBlock } from "./custom-code-block";
import { LanguageIcon } from "./language-icon";

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-dark");
  return (
    <div className="relative my-4">
      {highlighted.meta ? (
        <div className="flex rounded-t bg-slate-100 text-center text-slate-500 border-b py-1">
          <div className="flex items-center pl-2 mx-auto">
            <LanguageIcon lang={highlighted.lang} className="mr-1" />
            {highlighted.meta}
          </div>
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
