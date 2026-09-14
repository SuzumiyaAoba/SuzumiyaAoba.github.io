import { describe, expect, it } from "vite-plus/test";
import { remark } from "remark";
import { remarkCollectHeadings, remarkMermaid, remarkUnwrapImages } from "./remark-plugins";
import type { TocHeading } from "./toc";

describe("remark plugins", () => {
  it("画像だけの段落はネスト内でも展開し、テキストを含む段落は維持する", () => {
    const processor = remark().use(remarkUnwrapImages);
    const tree = processor.runSync(
      processor.parse("> ![First](first.png) ![Second](second.png)\n\nText ![Inline](inline.png)"),
    );
    expect(tree).toMatchObject({
      children: [
        {
          type: "blockquote",
          children: [
            { type: "image", url: "first.png" },
            { type: "image", url: "second.png" },
          ],
        },
        {
          type: "paragraph",
          children: [
            { type: "text", value: "Text " },
            { type: "image", url: "inline.png" },
          ],
        },
      ],
    });
  });

  it("Mermaidフェンスだけを変換し、コード内容を保持する", () => {
    const processor = remark().use(remarkMermaid);
    const tree = processor.runSync(
      processor.parse(
        '> ```mermaid\n> graph TD; A["quoted"] --> B\n> ```\n\n```js\nconst x = 1;\n```',
      ),
    );
    expect(tree).toMatchObject({
      children: [
        {
          type: "blockquote",
          children: [
            {
              type: "mdxJsxFlowElement",
              name: "Mermaid",
              attributes: [{ name: "code", value: 'graph TD; A["quoted"] --> B' }],
            },
          ],
        },
        { type: "code", lang: "js", value: "const x = 1;" },
      ],
    });
  });

  it("同じprocessorを再利用しても見出しの重複番号を引き継がない", () => {
    const headings: TocHeading[] = [];
    const processor = remark().use(remarkCollectHeadings(headings));
    processor.runSync(processor.parse("## Intro\n\n## Intro"));
    processor.runSync(processor.parse("## Intro"));
    expect(headings.map((heading) => heading.id)).toStrictEqual(["intro", "intro-1", "intro"]);
  });
});
