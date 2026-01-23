import { describe, it, expect } from "vitest";
import { getTocHeadings } from "./toc";

describe("getTocHeadings", () => {
  describe("ヘッダーの抽出", () => {
    it("h2 ヘッダーを抽出する", async () => {
      const source = `
# タイトル

## セクション1

本文

## セクション2

本文
`;
      const result = await getTocHeadings(source);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: "セクション1", text: "セクション1", level: 2 });
      expect(result[1]).toEqual({ id: "セクション2", text: "セクション2", level: 2 });
    });

    it("h3 ヘッダーを抽出する", async () => {
      const source = `
## 親セクション

### 子セクション1

### 子セクション2
`;
      const result = await getTocHeadings(source);

      expect(result).toHaveLength(3);
      expect(result[1]!.level).toBe(3);
      expect(result[2]!.level).toBe(3);
    });

    it("h1 と h4 以上は除外する", async () => {
      const source = `
# h1 タイトル

## h2 セクション

### h3 サブセクション

#### h4 詳細

##### h5 さらに詳細
`;
      const result = await getTocHeadings(source);

      expect(result).toHaveLength(2);
      expect(result.some((h) => h.text.includes("h1"))).toBe(false);
      expect(result.some((h) => h.text.includes("h4"))).toBe(false);
      expect(result.some((h) => h.text.includes("h5"))).toBe(false);
    });
  });

  describe("スラッグIDの生成", () => {
    it("英語テキストからスラッグを生成する", async () => {
      const source = `## Getting Started`;
      const result = await getTocHeadings(source);

      expect(result[0]!.id).toBe("getting-started");
    });

    it("日本語テキストからスラッグを生成する", async () => {
      const source = `## はじめに`;
      const result = await getTocHeadings(source);

      expect(result[0]!.id).toBe("はじめに");
    });

    it("重複するヘッダーに連番を付ける", async () => {
      const source = `
## セクション

## セクション

## セクション
`;
      const result = await getTocHeadings(source);

      expect(result[0]!.id).toBe("セクション");
      expect(result[1]!.id).toBe("セクション-1");
      expect(result[2]!.id).toBe("セクション-2");
    });
  });

  describe("idPrefix オプション", () => {
    it("プレフィックスをIDに追加する", async () => {
      const source = `## セクション`;
      const result = await getTocHeadings(source, { idPrefix: "user-content-" });

      expect(result[0]!.id).toBe("user-content-セクション");
    });

    it("プレフィックスなしではIDそのまま", async () => {
      const source = `## セクション`;
      const result = await getTocHeadings(source);

      expect(result[0]!.id).toBe("セクション");
    });
  });

  describe("インラインコードの処理", () => {
    it("インラインコードを含むヘッダーを正しく抽出する", async () => {
      const source = "## `console.log` の使い方";
      const result = await getTocHeadings(source);

      expect(result[0]!.text).toBe("console.log の使い方");
    });
  });

  describe("空のヘッダーの処理", () => {
    it("空のヘッダーは除外する", async () => {
      const source = `
## 有効なヘッダー

##

## もう一つの有効なヘッダー
`;
      const result = await getTocHeadings(source);

      expect(result).toHaveLength(2);
      expect(result[0]!.text).toBe("有効なヘッダー");
      expect(result[1]!.text).toBe("もう一つの有効なヘッダー");
    });
  });
});
