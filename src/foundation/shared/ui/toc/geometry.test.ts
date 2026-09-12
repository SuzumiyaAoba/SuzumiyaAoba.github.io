// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { calcThumb, findTocLink } from "./geometry";

afterEach(() => {
  document.body.replaceChildren();
});

function containerWithLinks() {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientHeight", { value: 200 });
  for (const [id, top] of [
    ["first", 10],
    ['second"quoted', 50],
  ] as const) {
    const link = document.createElement("a");
    link.setAttribute("href", `#${id}`);
    link.style.padding = "2px 0 3px";
    Object.defineProperties(link, {
      offsetTop: { value: top },
      clientHeight: { value: 20 },
    });
    container.append(link);
  }
  document.body.append(container);
  return container;
}

describe("TOC geometry", () => {
  it("選択されたリンクの本文領域を囲む位置と高さを求める", () => {
    const container = containerWithLinks();
    expect(calcThumb(container, ["first", 'second"quoted'])).toEqual([12, 55]);
  });

  it("見つからないリンク・空の選択・非表示のコンテナはサイズ0になる", () => {
    const container = containerWithLinks();
    expect(calcThumb(container, ["missing"])).toEqual([0, 0]);
    expect(calcThumb(container, [])).toEqual([0, 0]);
    expect(calcThumb(document.createElement("div"), ["first"])).toEqual([0, 0]);
  });

  it("引用符を含むアンカーもセレクター構文として解釈せずに検索する", () => {
    const container = containerWithLinks();
    expect(findTocLink(container, '#second"quoted')).toBe(container.children[1]);
    expect(findTocLink(container, "#missing")).toBeUndefined();
  });
});
