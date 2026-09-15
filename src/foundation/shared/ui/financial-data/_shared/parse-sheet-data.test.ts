import { describe, it, expect } from "vite-plus/test";
import { createSheetDataReader, parseSheetData } from "./parse-sheet-data";

const validSheet = {
  metadata: { title: "サンプル" },
  headers: ["年", "値"],
  series: [{ year: "2024", values: { 値: 100 } }],
};

describe("parseSheetData", () => {
  it("有効なシートデータをパースして返す", () => {
    const assetsData = { sheets: { "1": validSheet } };
    expect(parseSheetData(assetsData, "1")).toStrictEqual(validSheet);
  });

  it("指定したsheetKeyが存在しなければnullを返す", () => {
    const assetsData = { sheets: { "1": validSheet } };
    expect(parseSheetData(assetsData, "2")).toBeNull();
  });

  it("スキーマに合わないデータはnullを返す", () => {
    const assetsData = { sheets: { "1": { invalid: true } } };
    expect(parseSheetData(assetsData, "1")).toBeNull();
  });
});

describe("createSheetDataReader", () => {
  it("同じシートの参照を再利用し、異なるシートを混同しない", () => {
    const read = createSheetDataReader({
      sheets: {
        "1": validSheet,
        "2": { ...validSheet, metadata: { title: "別のシート" } },
      },
    });
    const first = read("1");
    expect(first).toStrictEqual(validSheet);
    expect(read("1")).toBe(first);
    expect(read("2")?.metadata.title).toBe("別のシート");
    expect(read("2")).not.toBe(first);
  });

  it("欠落・不正なシートはnullとし、有効なシートの読み込みを妨げない", () => {
    const read = createSheetDataReader({
      sheets: { valid: validSheet, invalid: {} },
    });
    expect(read("missing")).toBeNull();
    expect(read("invalid")).toBeNull();
    expect(read("valid")).toStrictEqual(validSheet);
    expect(read("invalid")).toBeNull();
  });

  it("別のデータセットに以前の解析結果を持ち越さない", () => {
    const first = createSheetDataReader({ sheets: { "1": validSheet } });
    const updated = {
      ...validSheet,
      series: [{ year: "2025", values: { 値: 200 } }],
    };
    const second = createSheetDataReader({ sheets: { "1": updated } });
    expect(first("1")).toStrictEqual(validSheet);
    expect(second("1")).toStrictEqual(updated);
    expect(second("1")).not.toBe(first("1"));
  });
});
