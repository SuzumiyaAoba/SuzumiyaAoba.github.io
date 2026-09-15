import { describe, it, expect, vi, beforeAll, afterAll } from "vite-plus/test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { listContentSlugs } from "./list-slugs";

let contentRoot = "";

vi.mock(import("./content-root"), () => ({
  resolveContentRoot: async () => contentRoot,
}));

describe("listContentSlugs", () => {
  beforeAll(async () => {
    contentRoot = await mkdtemp(path.join(tmpdir(), "list-slugs-test-"));
    await mkdir(path.join(contentRoot, "blog", "post-b"), { recursive: true });
    await mkdir(path.join(contentRoot, "blog", "post-a"), { recursive: true });
    await writeFile(path.join(contentRoot, "blog", "not-a-dir.txt"), "x");
  });

  afterAll(async () => {
    await rm(contentRoot, { recursive: true, force: true });
  });

  it("ディレクトリ名を昇順で返す", async () => {
    await expect(listContentSlugs("blog")).resolves.toStrictEqual([
      "post-a",
      "post-b",
    ]);
  });

  it("ファイルはslugとして含めない", async () => {
    const slugs = await listContentSlugs("blog");
    expect(slugs).not.toContain("not-a-dir.txt");
  });

  it("存在しないcollectionDirは空配列を返す", async () => {
    await expect(listContentSlugs("does-not-exist")).resolves.toStrictEqual([]);
  });
});
