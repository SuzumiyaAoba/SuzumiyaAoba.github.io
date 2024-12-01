import { highlight, Pre, RawCode } from "codehike/code";

export async function Code({ codeblock }: { codeblock: RawCode }) {
  const highlighted = await highlight(codeblock, "github-light");
  return (
    <div className="code-hike codeblock">
      <div>{highlighted.meta}</div>
      <Pre code={highlighted} />
    </div>
  );
}
