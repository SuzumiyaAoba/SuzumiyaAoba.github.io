import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import {
  getAdjacentSections,
  getBookMeta,
  getBookSection,
  getBookSlugs,
  getBookToc,
} from "./book";

let contentRoot = "";
let fixtureDirectory = "";

async function write(relativePath: string, content: string) {
  const filename = path.join(contentRoot, "books", relativePath);
  await mkdir(path.dirname(filename), { recursive: true });
  await writeFile(filename, content);
}

beforeAll(async () => {
  fixtureDirectory = await mkdtemp(path.join(tmpdir(), "book-test-"));
  contentRoot = path.join(fixtureDirectory, "content");
  vi.spyOn(process, "cwd").mockReturnValue(fixtureDirectory);
  await write(
    "sample/index.md",
    `---
title: サンプル書籍
date: 2026-01-02
tags: [TypeScript, 10]
co-author: [Author A, Author B]
---
書籍の概要。

---

## 第1章: はじめに {#intro}
## 第2章： 応用
`
  );
  await write(
    "sample/parts/01/chapters/02-second.mdx",
    `---
title: 次の節
llm: false
co-author: Author A
---
<Example />
`
  );
  await write(
    "sample/parts/01/chapters/01-first.md",
    "---\ntitle: 最初の節\n---\n本文\n"
  );
  await write("sample/parts/01/chapters/01-image.png", "image");
  await write("sample/parts/01/chapters/03-image.png", "image");
  await write("sample/parts/02/chapters/01.md", "番号だけの節。\n");
  await write(
    "sample/parts/03/chapters/01-broken.md",
    "---\ntitle: [broken\n---\n"
  );
  await mkdir(
    path.join(contentRoot, "books/sample/parts/01/chapters/04-directory.md")
  );
  await mkdir(path.join(contentRoot, "books/sample/parts/04"));
  await write("another/index.md", "前書きのみ。\n");
});

afterAll(async () => {
  vi.restoreAllMocks();
  if (fixtureDirectory) {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
});

describe("書籍の公開API", () => {
  it("書籍を並べ、frontmatterと最初の区切りまでの概要を読み込む", async () => {
    await expect(getBookSlugs()).resolves.toStrictEqual(["another", "sample"]);
    await expect(getBookMeta("sample")).resolves.toStrictEqual({
      slug: "sample",
      frontmatter: {
        title: "サンプル書籍",
        date: "2026-01-02",
        tags: ["TypeScript"],
        coAuthors: ["Author A", "Author B"],
      },
      lead: "書籍の概要。",
    });
    expect((await getBookMeta("another"))?.lead).toBe("前書きのみ。");
  });

  it("章と節を番号順に並べ、画像やディレクトリを目次に含めない", async () => {
    await expect(getBookToc("sample")).resolves.toStrictEqual([
      {
        chapter: "01",
        title: "はじめに",
        sections: [
          { chapter: "01", section: "01", title: "最初の節" },
          { chapter: "01", section: "02", title: "次の節" },
        ],
      },
      {
        chapter: "02",
        title: "応用",
        sections: [{ chapter: "02", section: "01", title: "01.md" }],
      },
      {
        chapter: "03",
        title: "第3章",
        sections: [{ chapter: "03", section: "01", title: "01-broken.md" }],
      },
    ]);
  });

  it("MDXの本文・形式・著者情報を保ち、falseのフラグを省略しない", async () => {
    await expect(getBookSection("sample", "01", "02")).resolves.toStrictEqual({
      chapter: "01",
      section: "02",
      title: "次の節",
      content: "<Example />\n",
      format: "mdx",
      llm: false,
      coAuthors: ["Author A"],
    });
  });

  it("通常のファイルと番号のみのファイルを、目次と同じ規則で読み込む", async () => {
    expect((await getBookSection("sample", "01", "01"))?.title).toBe(
      "最初の節"
    );
    await expect(getBookSection("sample", "02", "01")).resolves.toStrictEqual({
      chapter: "02",
      section: "01",
      title: "01.md",
      content: "番号だけの節。\n",
      format: "md",
    });
    await expect(getBookSection("sample", "01", "03")).resolves.toBeNull();
  });

  it("前後の節を章をまたいで返し、先頭・末尾・未登録の節を扱う", async () => {
    await expect(
      getAdjacentSections("sample", "01", "02")
    ).resolves.toStrictEqual({
      prev: { chapter: "01", section: "01", title: "最初の節" },
      next: { chapter: "02", section: "01", title: "01.md" },
    });
    expect((await getAdjacentSections("sample", "01", "01")).prev).toBeNull();
    expect((await getAdjacentSections("sample", "03", "01")).next).toBeNull();
    await expect(
      getAdjacentSections("sample", "99", "99")
    ).resolves.toStrictEqual({
      prev: null,
      next: null,
    });
  });

  it("存在しない書籍・章・節や壊れた本文は公開用データとして返さない", async () => {
    await expect(getBookMeta("missing")).resolves.toBeNull();
    await expect(getBookToc("missing")).resolves.toStrictEqual([]);
    await expect(getBookSection("sample", "missing", "01")).resolves.toBeNull();
    await expect(getBookSection("sample", "01", "missing")).resolves.toBeNull();
    await expect(getBookSection("sample", "03", "01")).resolves.toBeNull();
  });
});
