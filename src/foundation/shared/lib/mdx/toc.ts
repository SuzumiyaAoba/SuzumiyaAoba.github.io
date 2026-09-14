import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";
import { remark } from "remark";
import { cache } from "react";
import { extractMarkdownText, walkMarkdown } from "./markdown-tree";
import type { MarkdownNode } from "./markdown-tree";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

/** コンパイル中の AST と単独の目次取得で同じ見出し抽出を使う。 */
export function collectTocHeadings(tree: MarkdownNode, idPrefix?: string): TocHeading[] {
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];
  walkMarkdown(tree, (node) => {
    const level = node.depth;
    if (node.type !== "heading" || (level !== 2 && level !== 3)) {
      return;
    }
    const text = extractMarkdownText(node).trim();
    if (!text) {
      return;
    }
    const id = slugger.slug(text);
    headings.push({ id: `${idPrefix ?? ""}${id}`, text, level });
  });
  return headings;
}

export const getTocHeadings = cache(
  async (source: string, options?: { idPrefix?: string }): Promise<TocHeading[]> => {
    const processor = remark()
      .use(remarkGfm)
      .use(remarkEmoji)
      .use(remarkJoinCjkLines)
      .use(remarkMath);
    const tree = await processor.run(processor.parse(source));
    return collectTocHeadings(tree, options?.idPrefix);
  },
);
