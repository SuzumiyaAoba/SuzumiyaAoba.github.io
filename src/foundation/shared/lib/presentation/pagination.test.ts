import { describe, it, expect } from "vitest";
import { DEFAULT_PAGE_SIZE, getPageCount, paginate } from "./pagination";

describe("DEFAULT_PAGE_SIZE", () => {
  it("1ページあたり10件である", () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
  });
});

describe("getPageCount", () => {
  it("既定のページサイズでページ数を計算する", () => {
    expect(getPageCount(25)).toBe(3);
    expect(getPageCount(20)).toBe(2);
    expect(getPageCount(1)).toBe(1);
  });

  it("0件でも最低1ページを返す", () => {
    expect(getPageCount(0)).toBe(1);
  });

  it("カスタムページサイズを指定できる", () => {
    expect(getPageCount(10, 5)).toBe(2);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("既定のページサイズで1ページ目を切り出す", () => {
    expect(paginate(items, 1)).toEqual(items.slice(0, 10));
  });

  it("既定のページサイズで2ページ目を切り出す", () => {
    expect(paginate(items, 2)).toEqual(items.slice(10, 20));
  });

  it("最終ページは残り件数のみ返す", () => {
    expect(paginate(items, 3)).toEqual(items.slice(20, 25));
  });

  it("カスタムページサイズを指定できる", () => {
    expect(paginate(items, 2, 5)).toEqual(items.slice(5, 10));
  });
});
