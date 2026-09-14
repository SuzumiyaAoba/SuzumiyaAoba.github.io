type HtmlNode = {
  type: string;
  properties?: { id?: string | number };
  children?: HtmlNode[];
};

export function rehypeHeadingIdPrefix(prefix: string) {
  return () => (tree: HtmlNode) => {
    const visit = (node: HtmlNode) => {
      if (node.type === "element" && node.properties && String(node.properties.id ?? "") !== "") {
        node.properties.id = `${prefix}${node.properties.id}`;
      }
      for (const child of node.children ?? []) {
        visit(child);
      }
    };
    visit(tree);
  };
}
