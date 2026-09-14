/** MDX 拡張ノードにも共通する、変換・見出し抽出で参照するフィールド。 */
export type MarkdownNode = {
  type: string;
  value?: string | undefined;
  depth?: number | undefined;
  lang?: string | null | undefined;
  children?: MarkdownNode[] | undefined;
};

export function walkMarkdown(node: MarkdownNode, visit: (node: MarkdownNode) => void): void {
  visit(node);
  for (const child of node.children ?? []) {
    walkMarkdown(child, visit);
  }
}

export function extractMarkdownText(node: MarkdownNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }
  return node.children?.map(extractMarkdownText).join("") ?? "";
}
