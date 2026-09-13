import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import { getAffiliateProductUrlById } from "@/shared/lib/affiliate-products";
import { walkMarkdown } from "./markdown-tree";

describe("記事のアフィリエイトリンク", () => {
  it("全記事で管理ファイルの ID を参照し、リンク先を直接書いていない", async () => {
    const root = path.join(process.cwd(), "content");
    const affiliateById = await getAffiliateProductUrlById();
    const affiliateUrls = new Set(affiliateById.values());
    const files = (await readdir(root, { recursive: true })).filter((file) => /\.mdx?$/.test(file));
    const processor = remark().use(remarkGfm);
    let references = 0;

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = await readFile(path.join(root, file), "utf8");
      expect(source, file).not.toMatch(/https?:\/\/amzn\.to\//);
      for (const url of affiliateUrls) {
        expect(source, `${file}: ${url}`).not.toContain(url);
      }
      walkMarkdown(processor.parse(source), (node) => {
        if ((node.type !== "link" && node.type !== "definition") || !("url" in node)) return;
        if (typeof node.url !== "string" || !node.url.startsWith("affiliate://")) return;

        const id = decodeURIComponent(node.url.slice("affiliate://".length));
        expect(affiliateById.has(id), `${file}: ${id}`).toBe(true);
        references += 1;
      });
    }
    expect(references).toBeGreaterThan(0);
  });
});
