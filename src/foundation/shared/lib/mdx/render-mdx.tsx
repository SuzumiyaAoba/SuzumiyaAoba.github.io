import type { ComponentProps, ReactElement } from "react";
import { cache } from "react";
import type { MDXComponents } from "mdx/types";
import { compileMDX } from "next-mdx-remote/rsc";
import type { CodeHikeConfig } from "codehike/mdx";
import { recmaCodeHike, remarkCodeHike } from "codehike/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";
import GithubSlugger from "github-slugger";

import { mdxComponents } from "@/shared/lib/mdx/components";
import { Img } from "@/shared/ui/mdx/img";
import { getAffiliateProductUrlById } from "@/shared/lib/affiliate-products";
import { createRehypeAffiliateLinks } from "./rehype-affiliate-links";
import type { TocHeading } from "./toc";

type MdastNode = {
  type?: string;
  value?: string;
  depth?: number;
  children?: MdastNode[];
};

function extractTextFromNode(node: MdastNode): string {
  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }
  if (!node.children) return "";
  return node.children.map(extractTextFromNode).join("");
}

function remarkCollectHeadings(headings: TocHeading[], idPrefix?: string) {
  const slugger = new GithubSlugger();
  return () => (tree: MdastNode) => {
    const walk = (node: MdastNode) => {
      if (node.type === "heading") {
        const level = node.depth;
        if (level === 2 || level === 3) {
          const text = extractTextFromNode(node).trim();
          if (text) {
            const id = slugger.slug(text);
            headings.push({ id: idPrefix ? `${idPrefix}${id}` : id, text, level });
          }
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

function rehypeHeadingIdPrefix(prefix: string) {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || typeof node !== "object") {
        return;
      }
      if (node.type === "element" && node.properties?.id) {
        node.properties.id = `${prefix}${node.properties.id}`;
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(visit);
      }
    };
    visit(tree);
  };
}

/**
 * 画像のみを含む段落タグを剥がすプラグイン。
 * MDX は ![alt](src) を <p><img/></p> に変換するが、Img コンポーネントが
 * <div>（Zoom）を描画するため <p> 内に <div> が入り HTML が不正になる。
 */
function remarkUnwrapImages() {
  return (tree: any) => {
    const visit = (parent: any) => {
      if (!parent || !Array.isArray(parent.children)) return;

      parent.children = parent.children.flatMap((node: any) => {
        if (
          node.type === "paragraph" &&
          Array.isArray(node.children) &&
          node.children.length > 0 &&
          node.children.every(
            (child: any) =>
              child.type === "image" ||
              (child.type === "text" && /^\s*$/.test(child.value ?? "")),
          )
        ) {
          return node.children.filter((child: any) => child.type === "image");
        }
        return [node];
      });

      for (const child of parent.children) {
        visit(child);
      }
    };
    visit(tree);
  };
}

function remarkMermaid() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || !Array.isArray(node.children)) {
        return;
      }

      node.children = node.children.map((child: any) => {
        if (child?.type === "code" && child.lang === "mermaid") {
          return {
            type: "mdxJsxFlowElement",
            name: "Mermaid",
            attributes: [
              {
                type: "mdxJsxAttribute",
                name: "code",
                value: child.value,
              },
            ],
            children: [],
          };
        }

        return child;
      });

      node.children.forEach(visit);
    };

    visit(tree);
  };
}

type RenderOptions = {
  basePath?: string;
  scope?: Record<string, unknown>;
  idPrefix?: string;
  /** MDX 共通コンポーネントに追加注入するマップ（financial-data など、特定ページでのみ要る重いコンポーネント用） */
  extraComponents?: MDXComponents;
};

const devRenderCache = new Map<string, ReactElement>();
const devRenderWithTocCache = new Map<string, { content: ReactElement; headings: TocHeading[] }>();

function buildCompileOptions(
  source: string,
  { basePath, scope, idPrefix, extraComponents }: RenderOptions,
  extraRemarkPlugins: any[] = [],
  affiliateById: Map<string, string> = new Map(),
) {
  const codeHikeConfig: CodeHikeConfig = {
    components: { code: "Code", inlineCode: "InlineCode" },
    syntaxHighlighting: { theme: "github-from-css" },
  };

  const baseComponents = extraComponents
    ? { ...mdxComponents, ...extraComponents }
    : mdxComponents;
  const components = basePath
    ? {
        ...baseComponents,
        Img: (props: ComponentProps<typeof Img>) => <Img {...props} basePath={basePath} />,
        img: (props: ComponentProps<typeof Img>) => <Img {...props} basePath={basePath} />,
      }
    : baseComponents;

  return {
    source,
    components,
    options: {
      ...(scope ? { scope } : {}),
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkEmoji,
          remarkJoinCjkLines,
          remarkMath,
          ...extraRemarkPlugins,
          remarkUnwrapImages,
          remarkMermaid,
          [remarkCodeHike, codeHikeConfig],
        ],
        recmaPlugins: [[recmaCodeHike, codeHikeConfig]],
        rehypePlugins: [
          rehypeSlug,
          ...(idPrefix ? [rehypeHeadingIdPrefix(idPrefix)] : []),
          [rehypeAutolinkHeadings, { behavior: "append" }],
          createRehypeAffiliateLinks(affiliateById),
          [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
          [
            rehypeKatex,
            { output: "mathml", throwOnError: false, errorColor: "#cc0000", trust: true },
          ],
        ],
      },
    },
  } as Parameters<typeof compileMDX>[0];
}

export const renderMdx = cache(
  async (source: string, options: RenderOptions = {}) => {
    const { scope, idPrefix, basePath } = options;
    const useDevCache = process.env["NODE_ENV"] === "development";
    let cacheKey = "";
    if (useDevCache) {
      const scopeKey = scope ? JSON.stringify(scope) : "";
      cacheKey = `${idPrefix ?? ""}::${basePath ?? ""}::${scopeKey}::${source}`;
      const cached = devRenderCache.get(cacheKey);
      if (cached) return cached;
    }

    const affiliateById = await getAffiliateProductUrlById();
    const { content } = await compileMDX(buildCompileOptions(source, options, [], affiliateById));

    const rendered = <>{content}</>;
    if (useDevCache) devRenderCache.set(cacheKey, rendered);
    return rendered;
  },
);

/**
 * MDX をコンパイルしながら同一パスで TOC 見出しを抽出する。
 * renderMdx + getTocHeadings を別々に呼ぶより remark パースが1回で済む。
 */
export const renderMdxWithToc = cache(
  async (
    source: string,
    options: RenderOptions = {},
  ): Promise<{ content: ReactElement; headings: TocHeading[] }> => {
    const { scope, idPrefix, basePath } = options;
    const useDevCache = process.env["NODE_ENV"] === "development";
    let cacheKey = "";
    if (useDevCache) {
      const scopeKey = scope ? JSON.stringify(scope) : "";
      cacheKey = `toc::${idPrefix ?? ""}::${basePath ?? ""}::${scopeKey}::${source}`;
      const cached = devRenderWithTocCache.get(cacheKey);
      if (cached) return cached;
    }

    const affiliateById = await getAffiliateProductUrlById();
    const headings: TocHeading[] = [];
    const { content } = await compileMDX(
      buildCompileOptions(
        source,
        options,
        [remarkCollectHeadings(headings, idPrefix)],
        affiliateById,
      ),
    );

    const result = { content: <>{content}</>, headings };
    if (useDevCache) devRenderWithTocCache.set(cacheKey, result);
    return result;
  },
);
