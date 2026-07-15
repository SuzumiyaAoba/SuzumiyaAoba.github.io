import { describe, it, expect } from "vitest";
import { findAdjacentByIndex } from "./adjacent";

describe("findAdjacentByIndex", () => {
  const items = ["a", "b", "c", "d"];

  it("既定のoffsetで前後を返す(降順リスト向け: prev=+1, next=-1)", () => {
    expect(findAdjacentByIndex(items, (item) => item === "b")).toEqual({
      prev: "c",
      next: "a",
    });
  });

  it("先頭要素はnextがnullになる", () => {
    expect(findAdjacentByIndex(items, (item) => item === "a")).toEqual({
      prev: "b",
      next: null,
    });
  });

  it("末尾要素はprevがnullになる", () => {
    expect(findAdjacentByIndex(items, (item) => item === "d")).toEqual({
      prev: null,
      next: "c",
    });
  });

  it("一致しない場合は両方nullになる", () => {
    expect(findAdjacentByIndex(items, (item) => item === "z")).toEqual({
      prev: null,
      next: null,
    });
  });

  it("逆順offset(昇順リスト向け: prev=-1, next=+1)を指定できる", () => {
    expect(
      findAdjacentByIndex(items, (item) => item === "b", { prevOffset: -1, nextOffset: 1 }),
    ).toEqual({
      prev: "a",
      next: "c",
    });
  });
});
