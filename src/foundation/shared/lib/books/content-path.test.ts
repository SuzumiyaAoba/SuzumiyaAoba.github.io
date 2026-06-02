import { describe, it, expect } from "vitest";

import { BOOKS_CONTENT_BASE, bookContentBasePath } from "./content-path";

describe("bookContentBasePath", () => {
  it("スラッグから /contents/books/<slug> を組み立てる", () => {
    expect(bookContentBasePath("java-abc")).toBe("/contents/books/java-abc");
  });

  it("前後のスラッシュを除去する", () => {
    expect(bookContentBasePath("/java-abc/")).toBe("/contents/books/java-abc");
    expect(bookContentBasePath("java-abc/")).toBe("/contents/books/java-abc");
  });

  it("ベースのプレフィックスを共有している", () => {
    expect(bookContentBasePath("any").startsWith(BOOKS_CONTENT_BASE)).toBe(true);
  });
});
