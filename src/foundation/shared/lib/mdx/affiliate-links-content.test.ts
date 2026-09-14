import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import { getAffiliateProductUrlById } from "@/shared/lib/affiliate-products";
import { walkMarkdown } from "./markdown-tree";

const processor = remark().use(remarkGfm);

function collectAffiliateIds(source: string): string[] {
  const ids: string[] = [];
  walkMarkdown(processor.parse(source), (node) => {
    if ((node.type !== "link" && node.type !== "definition") || !("url" in node)) {
      return;
    }
    if (typeof node.url === "string" && node.url.startsWith("affiliate://")) {
      ids.push(decodeURIComponent(node.url.slice("affiliate://".length)));
    }
  });
  return ids;
}

async function readArticles(root: string, files: string[]) {
  const articles = [];
  for (const file of files) {
    // oxlint-disable-next-line no-await-in-loop -- 記事数に比例してファイルを同時に開かない。
    const source = await readFile(path.join(root, file), "utf8");
    articles.push({ file, source, ids: collectAffiliateIds(source) });
  }
  return articles;
}

describe("記事のアフィリエイトリンク", () => {
  // 全記事の読み込み・解析を行うため、CI の I/O 待ちも考慮した時間枠を設ける。
  it("全記事で管理ファイルの ID を参照し、リンク先を直接書いていない", async () => {
    const root = path.join(process.cwd(), "content");
    const affiliateById = await getAffiliateProductUrlById();
    const affiliateUrls = new Set(affiliateById.values());
    const files = (await readdir(root, { recursive: true })).filter((file) =>
      /\.mdx?$/u.test(file),
    );
    const articles = await readArticles(root, files);
    expect(articles.length).toBeGreaterThan(0);
    let references = 0;
    for (const { file, source, ids } of articles) {
      expect(source, file).not.toMatch(/https?:\/\/amzn\.to\//u);
      for (const url of affiliateUrls) {
        expect(source, `${file}: ${url}`).not.toContain(url);
      }
      for (const id of ids) {
        expect(affiliateById.has(id), `${file}: ${id}`).toBe(true);
      }
      references += ids.length;
    }
    expect(references).toBeGreaterThan(0);
  }, 30_000);
});
