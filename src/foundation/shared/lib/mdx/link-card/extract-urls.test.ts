import { describe, expect, it } from "vite-plus/test";

import { extractLinkCardUrls } from "./extract-urls";

describe("extractLinkCardUrls", () => {
  it("LinkCard の url を、出現順・重複なしで返す", () => {
    const source = `
前置き

<LinkCard url="https://example.com/a" />

<LinkCard title="題" url='https://example.com/b' />
<LinkCard url="https://example.com/a" />
`;

    expect(extractLinkCardUrls(source)).toStrictEqual([
      "https://example.com/a",
      "https://example.com/b",
    ]);
  });

  it("式で渡された url や、ほかのコンポーネントの url は拾わない", () => {
    const source = `
<LinkCard url={link} />
<GitHubCodeLink url="https://github.com/o/r/blob/main/a.ts" />
`;

    expect(extractLinkCardUrls(source)).toStrictEqual([]);
  });

  it("属性値に > を含んでいても url を取り出す", () => {
    const source = `<LinkCard title="A > B" url="https://example.com/a" />`;

    expect(extractLinkCardUrls(source)).toStrictEqual([
      "https://example.com/a",
    ]);
  });

  it("data-url など url で終わる別名の属性や、別の属性値の中の url= は拾わない", () => {
    const source = `
<LinkCard data-url="https://wrong.example/" url="https://right.example/" />
<LinkCard title="url='https://wrong.example/2'" url="https://right.example/2" />
`;

    expect(extractLinkCardUrls(source)).toStrictEqual([
      "https://right.example/",
      "https://right.example/2",
    ]);
  });

  it("改行を含むタグでも url を取り出す", () => {
    const source = `<LinkCard
  title="題"
  url="https://example.com/a"
/>`;

    expect(extractLinkCardUrls(source)).toStrictEqual([
      "https://example.com/a",
    ]);
  });

  it("コードブロックとインラインコードの中の例示は拾わない", () => {
    const source = [
      "書き方の例:",
      "",
      "```mdx",
      '<LinkCard url="https://example.com/in-fence" />',
      "```",
      "",
      '`<LinkCard url="https://example.com/in-inline" />` のように書く。',
      "",
      '<LinkCard url="https://example.com/real" />',
    ].join("\n");

    expect(extractLinkCardUrls(source)).toStrictEqual([
      "https://example.com/real",
    ]);
  });
});
