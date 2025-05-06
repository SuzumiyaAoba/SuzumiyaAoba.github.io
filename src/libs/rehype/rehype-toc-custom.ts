import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Plugin } from "unified";
import type { Root, Element } from "hast";

interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

interface TocEntry {
  heading: TocHeading;
  children: TocEntry[];
}

export const rehypeTocCustom: Plugin<[], Root> = () => {
  return (tree) => {
    const headings: TocHeading[] = [];

    // 見出しを収集
    visit(tree, "element", (node) => {
      if (["h2", "h3", "h4"].includes(node.tagName)) {
        const id = node.properties?.id as string;
        if (id) {
          headings.push({
            depth: parseInt(node.tagName.charAt(1)),
            text: toString(node),
            id,
          });
        }
      }
    });

    // 見出しがなければ何もしない
    if (headings.length === 0) {
      return;
    }

    // 階層構造に変換
    const hierarchy = buildHierarchy(headings);

    // TOCの作成
    const tocList = createNestedTocList(hierarchy);

    // details要素を作成
    const details: Element = {
      type: "element",
      tagName: "details",
      properties: {
        className: ["toc-details"],
        open: true,
      },
      children: [
        {
          type: "element",
          tagName: "summary",
          properties: {
            className: ["toc-summary"],
          },
          children: [
            {
              type: "text",
              value: "コンテンツ",
            },
          ],
        },
        tocList,
      ],
    };

    // TOCコンテナの作成
    const tocContainer: Element = {
      type: "element",
      tagName: "nav",
      properties: {
        className: ["toc-container"],
        ariaLabel: "コンテンツ",
      },
      children: [details],
    };

    // サイドバーコンテナの作成
    const sidebarContainer: Element = {
      type: "element",
      tagName: "div",
      properties: {
        className: ["toc-sidebar"],
      },
      children: [tocContainer],
    };

    // ドキュメントの先頭に挿入
    // 最初のコンテンツ要素を探す
    let contentStartIndex = -1;
    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];
      if (child.type === "element" && child.tagName !== "head") {
        contentStartIndex = i;
        break;
      }
    }

    if (contentStartIndex !== -1) {
      tree.children.splice(contentStartIndex, 0, sidebarContainer);
    } else {
      tree.children.push(sidebarContainer);
    }
  };
};

// 見出しの階層構造を構築
function buildHierarchy(headings: TocHeading[]): TocEntry[] {
  const result: TocEntry[] = [];
  const stack: TocEntry[] = [];

  headings.forEach((heading) => {
    const entry: TocEntry = { heading, children: [] };

    // スタックが空の場合、またはh2見出しの場合はトップレベルに追加
    if (stack.length === 0 || heading.depth === 2) {
      result.push(entry);
      stack.length = 0; // スタックをクリア
      stack.push(entry);
      return;
    }

    // 現在の見出しの深さと、スタックトップの見出しの深さを比較
    while (
      stack.length > 0 &&
      stack[stack.length - 1].heading.depth >= heading.depth
    ) {
      stack.pop();
    }

    // 適切な親に追加
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(entry);
    } else {
      // 適切な親が見つからない場合はトップレベルに追加
      result.push(entry);
    }

    stack.push(entry);
  });

  return result;
}

// 階層構造の目次リストを作成
function createNestedTocList(entries: TocEntry[]): Element {
  const list: Element = {
    type: "element",
    tagName: "ul",
    properties: {
      className: ["toc-list"],
    },
    children: entries.map((entry) => {
      const listItem: Element = {
        type: "element",
        tagName: "li",
        properties: {
          className: ["toc-list-item"],
        },
        children: [
          {
            type: "element",
            tagName: "a",
            properties: {
              href: `#${entry.heading.id}`,
              className: ["toc-link"],
            },
            children: [{ type: "text", value: entry.heading.text }],
          },
        ],
      };

      // 子要素がある場合、再帰的にリストを追加
      if (entry.children.length > 0) {
        listItem.children.push(createNestedTocList(entry.children));
      }

      return listItem;
    }),
  };

  return list;
}

export default rehypeTocCustom;
