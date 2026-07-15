import { describe, it, expect } from "vitest";
import { parseSheetData } from "./parse-sheet-data";

const validSheet = {
  metadata: { title: "サンプル" },
  headers: ["年", "値"],
  series: [{ year: "2024", values: { 値: 100 } }],
};

describe("parseSheetData", () => {
  it("有効なシートデータをパースして返す", () => {
    const assetsData = { sheets: { "1": validSheet } };
    expect(parseSheetData(assetsData, "1")).toEqual(validSheet);
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
