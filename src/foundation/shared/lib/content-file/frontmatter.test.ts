import { describe, it, expect } from "vitest";
import { asString, asStringWithDefault, asDateString, asBoolean, asStringArray } from "./frontmatter";

describe("asString", () => {
  it("string値をそのまま返す", () => {
    expect(asString("hello")).toBe("hello");
  });

  it("string以外はundefinedを返す", () => {
    expect(asString(123)).toBeUndefined();
    expect(asString(undefined)).toBeUndefined();
    expect(asString(null)).toBeUndefined();
  });
});

describe("asStringWithDefault", () => {
  it("string値をそのまま返す", () => {
    expect(asStringWithDefault("hello", "fallback")).toBe("hello");
  });

  it("string以外はfallbackを返す", () => {
    expect(asStringWithDefault(undefined, "fallback")).toBe("fallback");
  });
});

describe("asDateString", () => {
  it("Dateインスタンスをyyyy-mm-dd形式に変換する", () => {
    expect(asDateString(new Date("2024-01-15T00:00:00.000Z"))).toBe("2024-01-15");
  });

  it("string値をそのまま返す", () => {
    expect(asDateString("2024-01-15")).toBe("2024-01-15");
  });

  it("Date/string以外はundefinedを返す", () => {
    expect(asDateString(undefined)).toBeUndefined();
    expect(asDateString(123)).toBeUndefined();
  });
});

describe("asBoolean", () => {
  it("boolean値をそのまま返す", () => {
    expect(asBoolean(true)).toBe(true);
    expect(asBoolean(false)).toBe(false);
  });

  it("boolean以外はundefinedを返す", () => {
    expect(asBoolean("true")).toBeUndefined();
    expect(asBoolean(undefined)).toBeUndefined();
  });
});

describe("asStringArray", () => {
  it("配列であればstring要素のみフィルタして返す", () => {
    expect(asStringArray(["a", "b", 1, null, "c"])).toEqual(["a", "b", "c"]);
  });

  it("空配列はそのまま空配列を返す", () => {
    expect(asStringArray([])).toEqual([]);
  });

  it("全要素がstring以外なら空配列を返す", () => {
    expect(asStringArray([1, 2, 3])).toEqual([]);
  });

  it("配列でなければundefinedを返す", () => {
    expect(asStringArray("not-an-array")).toBeUndefined();
    expect(asStringArray(undefined)).toBeUndefined();
  });
});
