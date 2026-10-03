import { describe, expect, it } from "vite-plus/test";
import { estimateReadingMinutes } from "./reading-time";

describe("estimateReadingMinutes", () => {
  it("短い文章でも 1 分とする", () => {
    expect(estimateReadingMinutes("こんにちは")).toBe(1);
  });

  it("和文は 500 字で 1 分として数える", () => {
    expect(estimateReadingMinutes("あ".repeat(1500))).toBe(3);
  });

  it("欧文は 200 語で 1 分として数える", () => {
    expect(estimateReadingMinutes("word ".repeat(600))).toBe(3);
  });

  it("コードブロック・タグ・import 文・リンク先は数えない", () => {
    const source = [
      'import { Chart } from "./chart";',
      "```ts",
      "const ".repeat(2000),
      "```",
      '<Chart data="x" />',
      `[リンク](https://example.com/${"a".repeat(5000)})`,
      "あ".repeat(1000),
    ].join("\n");
    expect(estimateReadingMinutes(source)).toBe(2);
  });
});
