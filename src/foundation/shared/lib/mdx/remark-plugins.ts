import { collectTocHeadings, type TocHeading } from "./toc";
import { walkMarkdown, type MarkdownNode } from "./markdown-tree";

export function remarkCollectHeadings(headings: TocHeading[], idPrefix?: string) {
  return () => (tree: MarkdownNode) => {
    headings.push(...collectTocHeadings(tree, idPrefix));
  };
}

/** Zoom が描画する div が p の子にならないよう、画像だけの段落を展開する。 */
export function remarkUnwrapImages() {
  return (tree: MarkdownNode) => {
    walkMarkdown(tree, (parent) => {
      if (!parent.children) return;
      parent.children = parent.children.flatMap((node) => {
        if (
          node.type === "paragraph" &&
          node.children?.length &&
          node.children.every(
            (child) =>
              child.type === "image" || (child.type === "text" && /^\s*$/.test(child.value ?? "")),
          )
        ) {
          return node.children.filter((child) => child.type === "image");
        }
        return [node];
      });
    });
  };
}

/** Mermaid のコードフェンスを遅延描画コンポーネントへ変換する。 */
export function remarkMermaid() {
  return (tree: MarkdownNode) => {
    walkMarkdown(tree, (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) =>
        child.type === "code" && child.lang === "mermaid"
          ? {
              type: "mdxJsxFlowElement",
              name: "Mermaid",
              attributes: [{ type: "mdxJsxAttribute", name: "code", value: child.value }],
              children: [],
            }
          : child,
      );
    });
  };
}
