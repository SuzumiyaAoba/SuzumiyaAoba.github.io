import { describe, expect, it } from "vite-plus/test";

import { parseCodeMeta } from "./code-meta";

describe("parseCodeMeta", () => {
  it("未指定の場合は行番号を表示する", () => {
    expect(parseCodeMeta("index.ts")).toStrictEqual({
      displayMeta: "index.ts",
      showLineNumbers: true,
    });
  });

  it("line-numbers=false の場合は行番号を非表示にする", () => {
    expect(parseCodeMeta("index.ts line-numbers=false")).toStrictEqual({
      displayMeta: "index.ts",
      showLineNumbers: false,
    });
  });

  it("line-numbers=true の場合は行番号を表示する", () => {
    expect(parseCodeMeta("line-numbers=true index.ts")).toStrictEqual({
      displayMeta: "index.ts",
      showLineNumbers: true,
    });
  });

  it("不正な値はメタ情報として残す", () => {
    expect(parseCodeMeta("line-numbers=invalid")).toStrictEqual({
      displayMeta: "line-numbers=invalid",
      showLineNumbers: true,
    });
  });
});
