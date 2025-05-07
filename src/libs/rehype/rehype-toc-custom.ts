import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Plugin } from "unified";
import type { Root, Element, RootContent, ElementContent } from "hast";

export interface TocHeading {
  depth: number;
  text: string;
  id: string;
}

export interface TocEntry {
  heading: TocHeading;
  children: TocEntry[];
}

export const rehypeTocCustom: Plugin<[], Root> = () => {
  return (tree) => {
    // 目次データ抽出のみ行い、ツリーへのTOC挿入は行わない
    // 既存のTOC挿入ロジック（sidebarContainer生成やunshift等）は削除
    // 必要ならここでグローバル変数や外部にTOCデータを渡す仕組みを追加可能
    // ただし現状はextractTocFromTreeで十分
  };
};

// 見出しの階層構造を構築
interface BuildHierarchyProps {
  headings: TocHeading[];
}

function buildHierarchy({ headings }: BuildHierarchyProps): TocEntry[] {
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
interface CreateNestedTocListProps {
  entries: TocEntry[];
}

function createNestedTocList({ entries }: CreateNestedTocListProps): Element {
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
        listItem.children.push(
          createNestedTocList({ entries: entry.children })
        );
      }

      return listItem;
    }),
  };

  return list;
}

// ツリーからTOCデータを抽出する関数
interface ExtractTocFromTreeProps {
  tree: Root;
}

export function extractTocFromTree({
  tree,
}: ExtractTocFromTreeProps): TocEntry[] {
  const headings: TocHeading[] = [];

  // 見出しを収集
  visit(tree, "element", (node) => {
    if (["h2", "h3", "h4"].includes(node.tagName)) {
      const id = node.properties?.id as string;
      if (id) {
        // KaTeXで処理された数式を含む見出しのテキストを抽出
        let headingText = toString(node);

        // KaTeXで処理された見出しの整形処理（必要に応じて）
        // 例えば、数式が含まれる場合は特定のパターンを確認して処理する

        headings.push({
          depth: parseInt(node.tagName.charAt(1)),
          text: headingText,
          id,
        });
      }
    }
  });

  if (headings.length === 0) return [];
  return buildHierarchy({ headings });
}

export default rehypeTocCustom;
