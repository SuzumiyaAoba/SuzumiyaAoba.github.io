import { describe, expect, it } from "vite-plus/test";
import { getNavigationState } from "./navigation";

describe("getNavigationState", () => {
  it.each([
    ["/blog", "/blog", true],
    ["/blog/", "/blog", true],
    ["/en/blog/post/entry/", "/blog", true],
    ["/en/blogging/", "/blog", false],
    ["/keywords/graphics/noise/curl-noise/", "/keywords", true],
    ["/en/tools/", "/archive", true],
    ["/tools/ascii-standard-code/", "/archive", true],
    ["/archive/ai-news/", "/archive", true],
    ["/toolshop/", "/archive", false],
    ["/archive/", "/keywords", false],
    ["/en/search/", "/search", true],
    ["/", "/blog", false],
    ["/en/about/", "/about", true],
    ["/en/rss.xml", "/rss.xml", true],
  ] as const)("%s の %s リンクの選択状態は %s", (path, href, active) => {
    expect(getNavigationState(path).isActive(href)).toBe(active);
  });

  it.each([
    ["/blog/", false],
    ["/blog/1/", false],
    ["/en/blog/post/entry/", true],
    ["/notes/", false],
    ["/notes/java/", true],
    ["/keywords/graphics/noise/curl-noise/", true],
    ["/en/notes/java/", true],
    ["/books/", false],
    ["/books/scala/", true],
    ["/books/scala/introduction/", true],
    ["/en/", false],
    ["/tools/ascii-standard-code/", false],
  ] as const)("%s の読書進捗の表示は %s", (path, isReading) => {
    expect(getNavigationState(path).isReading).toBe(isReading);
  });
});
