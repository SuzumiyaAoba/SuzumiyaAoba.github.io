import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let contentRoot = "";

vi.mock("./content-root", () => ({
  resolveContentRoot: () => Promise.resolve(contentRoot),
}));

import { createArticleFileLister, readContentFileWithFallback } from "./read-content-file";

describe("createArticleFileLister / readContentFileWithFallback", () => {
  beforeAll(async () => {
    contentRoot = await mkdtemp(path.join(tmpdir(), "read-content-file-test-"));

    await mkdir(path.join(contentRoot, "blog", "both-locales"), { recursive: true });
    await writeFile(path.join(contentRoot, "blog", "both-locales", "index.md"), "ja content");
    await writeFile(path.join(contentRoot, "blog", "both-locales", "index.en.md"), "en content");

    await mkdir(path.join(contentRoot, "blog", "ja-only-mdx"), { recursive: true });
    await writeFile(path.join(contentRoot, "blog", "ja-only-mdx", "index.mdx"), "ja mdx content");

    await mkdir(path.join(contentRoot, "blog", "en-only"), { recursive: true });
    await writeFile(path.join(contentRoot, "blog", "en-only", "index.en.md"), "en only content");

    await mkdir(path.join(contentRoot, "blog", "empty"), { recursive: true });
  });

  afterAll(async () => {
    await rm(contentRoot, { recursive: true, force: true });
  });

  it("指定localeのファイルが存在すればそれを読む", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "both-locales", listFiles, { locale: "ja" });
    expect(file).toEqual({ raw: "ja content", format: "md" });
  });

  it("mdxもフォーマットとして認識する", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "ja-only-mdx", listFiles, {
      locale: "ja",
    });
    expect(file).toEqual({ raw: "ja mdx content", format: "mdx" });
  });

  it("指定localeが無くfallback有効ならもう一方を読む", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "en-only", listFiles, { locale: "ja" });
    expect(file).toEqual({ raw: "en only content", format: "md" });
  });

  it("fallback無効なら別言語を読まない", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "en-only", listFiles, {
      locale: "ja",
      fallback: false,
    });
    expect(file).toBeNull();
  });

  it("どちらの言語も存在しなければnullを返す", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "empty", listFiles);
    expect(file).toBeNull();
  });

  it("optionsを省略した場合はja+fallbackが既定になる", async () => {
    const listFiles = createArticleFileLister("blog");
    const file = await readContentFileWithFallback("blog", "en-only", listFiles);
    expect(file).toEqual({ raw: "en only content", format: "md" });
  });
});
