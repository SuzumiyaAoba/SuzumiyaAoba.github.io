import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  describe("基本的なクラス結合", () => {
    it("複数のクラス名を結合する", () => {
      const result = cn("foo", "bar");
      expect(result).toBe("foo bar");
    });

    it("単一のクラス名を返す", () => {
      const result = cn("foo");
      expect(result).toBe("foo");
    });

    it("空の入力で空文字列を返す", () => {
      const result = cn();
      expect(result).toBe("");
    });
  });

  describe("条件付きクラス", () => {
    it("真の条件でクラスを含める", () => {
      const result = cn("base", true && "active");
      expect(result).toBe("base active");
    });

    it("偽の条件でクラスを除外する", () => {
      const result = cn("base", false && "hidden");
      expect(result).toBe("base");
    });

    it("オブジェクト形式の条件を処理する", () => {
      const result = cn("base", { active: true, disabled: false });
      expect(result).toBe("base active");
    });
  });

  describe("Tailwind クラスの衝突解決", () => {
    it("後のパディングクラスが優先される", () => {
      const result = cn("p-4", "p-2");
      expect(result).toBe("p-2");
    });

    it("後のマージンクラスが優先される", () => {
      const result = cn("m-2", "m-4");
      expect(result).toBe("m-4");
    });

    it("異なる軸のクラスは両方保持される", () => {
      const result = cn("px-2", "py-4");
      expect(result).toBe("px-2 py-4");
    });

    it("背景色の衝突を解決する", () => {
      const result = cn("bg-red-500", "bg-blue-500");
      expect(result).toBe("bg-blue-500");
    });

    it("テキスト色の衝突を解決する", () => {
      const result = cn("text-white", "text-black");
      expect(result).toBe("text-black");
    });
  });

  describe("配列入力", () => {
    it("配列のクラス名を結合する", () => {
      const result = cn(["foo", "bar"]);
      expect(result).toBe("foo bar");
    });

    it("ネストした配列を処理する", () => {
      const result = cn(["foo", ["bar", "baz"]]);
      expect(result).toBe("foo bar baz");
    });
  });

  describe("falsy 値の処理", () => {
    it("null を無視する", () => {
      const result = cn("foo", null, "bar");
      expect(result).toBe("foo bar");
    });

    it("undefined を無視する", () => {
      const result = cn("foo", undefined, "bar");
      expect(result).toBe("foo bar");
    });

    it("空文字列を無視する", () => {
      const result = cn("foo", "", "bar");
      expect(result).toBe("foo bar");
    });

    it("0 を無視する", () => {
      const result = cn("foo", 0, "bar");
      expect(result).toBe("foo bar");
    });
  });
});
