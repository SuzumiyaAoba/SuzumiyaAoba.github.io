import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createContentReader } from "./read-content";
import { asDateString, asStringWithDefault } from "./frontmatter";

let contentRoot = "";
vi.mock(import("./content-root"), () => ({
  resolveContentRoot: async () => contentRoot,
}));

const readBlog = createContentReader("blog", (data) => ({
  title: asStringWithDefault(data["title"], "Untitled"),
  date: asDateString(data["date"]) ?? "",
}));

describe("createContentReader", () => {
  beforeAll(async () => {
    contentRoot = await mkdtemp(path.join(tmpdir(), "read-content-test-"));
    await mkdir(path.join(contentRoot, "blog", "both"), { recursive: true });
    await writeFile(
      path.join(contentRoot, "blog", "both", "index.md"),
      "---\ntitle: 日本語の記事\ndate: 2026-01-01\n---\n日本語の本文\n"
    );
    await writeFile(
      path.join(contentRoot, "blog", "both", "index.en.mdx"),
      "---\ntitle: English article\ndate: 2026-01-02\n---\n<Component />\n"
    );
    await mkdir(path.join(contentRoot, "blog", "en-only"), { recursive: true });
    await writeFile(
      path.join(contentRoot, "blog", "en-only", "index.en.md"),
      "English only\n"
    );
  });

  afterAll(async () => {
    await rm(contentRoot, { recursive: true, force: true });
  });

  it("本文・フォーマットと正規化したメタデータを返す", async () => {
    await expect(readBlog("both")).resolves.toStrictEqual({
      slug: "both",
      content: "日本語の本文\n",
      format: "md",
      frontmatter: { title: "日本語の記事", date: "2026-01-01" },
    });
  });

  it("指定したロケールのMDXを返す", async () => {
    await expect(
      readBlog("both", { locale: "en", fallback: false })
    ).resolves.toStrictEqual({
      slug: "both",
      content: "<Component />\n",
      format: "mdx",
      frontmatter: { title: "English article", date: "2026-01-02" },
    });
  });

  it("フォールバックの設定を呼び出しごとに尊重する", async () => {
    await expect(readBlog("en-only", { fallback: false })).resolves.toBeNull();
    await expect(readBlog("en-only")).resolves.toMatchObject({
      content: "English only\n",
      frontmatter: { title: "Untitled", date: "" },
    });
    await expect(readBlog("en-only", { fallback: false })).resolves.toBeNull();
  });

  it("存在しない記事はnullになる", async () => {
    await expect(readBlog("missing")).resolves.toBeNull();
  });
});
