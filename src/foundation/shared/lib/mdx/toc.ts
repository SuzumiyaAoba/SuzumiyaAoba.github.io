import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";
import { remark } from "remark";

export type TocHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

type MdastNode = {
  type?: string;
  value?: string;
  depth?: number;
  children?: MdastNode[];
};

function extractText(node: MdastNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }
  if (!node.children) {
    return "";
  }
  return node.children.map(extractText).join("");
}

function walk(node: MdastNode, handler: (node: MdastNode) => void) {
  handler(node);
  node.children?.forEach((child) => walk(child, handler));
}

export async function getTocHeadings(
  source: string,
  options?: { idPrefix?: string },
): Promise<TocHeading[]> {
  const processor = remark()
    .use(remarkGfm)
    .use(remarkEmoji)
    .use(remarkJoinCjkLines)
    .use(remarkMath);
  const tree = processor.runSync(processor.parse(source)) as MdastNode;
  const slugger = new GithubSlugger();
  const headings: TocHeading[] = [];

  walk(tree, (node) => {
    if (node.type !== "heading") {
      return;
    }
    const level = node.depth;
    if (level !== 2 && level !== 3) {
      return;
    }
    const text = extractText(node).trim();
    if (!text) {
      return;
    }
    const id = slugger.slug(text);
    headings.push({
      id: options?.idPrefix ? `${options.idPrefix}${id}` : id,
      text,
      level,
    });
  });

  return headings;
}
