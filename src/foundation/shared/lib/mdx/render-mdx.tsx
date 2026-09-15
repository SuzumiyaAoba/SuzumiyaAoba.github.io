// 数式のスタイル。ルートレイアウトで読むと数式を含まないページ
// （トップ・一覧・タグなど大半）にも約 4.4KB(gzip) のレンダリングブロック CSS が
// 載るため、MDX を描画する経路にだけスコープする。
import "katex/dist/katex.min.css";

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
import remarkCustomHeadingId from "remark-custom-heading-id";
import remarkEmoji from "remark-emoji";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";
import type { PluggableList } from "unified";

import { mdxComponents } from "@/shared/lib/mdx/components";
import { Img } from "@/shared/ui/mdx/img";
import { createChatHistory } from "@/shared/ui/mdx/chat-history";
import { getAffiliateProductUrlById } from "@/shared/lib/affiliate-products";
import { createRehypeAffiliateLinks } from "./rehype-affiliate-links";
import type { TocHeading } from "./toc";

import {
  remarkCollectHeadings,
  remarkMermaid,
  remarkUnwrapImages,
} from "./remark-plugins";
import { rehypeHeadingIdPrefix } from "./rehype-heading-id-prefix";

type RenderOptions = {
  basePath?: string;
  scope?: Record<string, unknown>;
  idPrefix?: string;
  /** MDX 共通コンポーネントに追加注入するマップ（financial-data など、特定ページでのみ要る重いコンポーネント用） */
  extraComponents?: MDXComponents;
};

/**
 * mermaid 図を含む MDX かどうかの判定。
 * remarkMermaid が変換する ```mermaid フェンスと、
 * MDX 中に直接書かれた <Mermaid> の両方を拾う。
 */
const MERMAID_USAGE = /^[ \t]*(?:```|~~~)[ \t]*mermaid\b|<Mermaid[\s/>]/mu;

/** codehike の highlight（Shiki + TextMate 文法）を伴うコードブロックの使用判定 */
const CODE_BLOCK_USAGE =
  /<(?:CodeWithTabs|CodeSwitcher|CodeWithTooltips)[\s/>]/u;

/**
 * 重量級コンポーネントを、実際に使う記事にだけ注入する。
 *
 * 実体の読み込みは *-lazy（クライアント側の遅延境界）が行う。
 * ここで注入を絞るのは、使わない記事のルートに遅延境界そのものが
 * クライアント参照として登録されるのを防ぐため。
 */
async function loadHeavyComponents(source: string): Promise<MDXComponents> {
  const components: MDXComponents = {};

  if (MERMAID_USAGE.test(source)) {
    const { MermaidLazy } = await import("@/shared/ui/mdx/mermaid-lazy");
    components["Mermaid"] = MermaidLazy;
  }

  if (CODE_BLOCK_USAGE.test(source)) {
    const lazy = await import("@/shared/ui/mdx/code-blocks-lazy");
    components["CodeWithTabs"] = lazy.CodeWithTabs;
    components["CodeSwitcher"] = lazy.CodeSwitcher;
    components["CodeWithTooltips"] = lazy.CodeWithTooltips;
  }

  return components;
}

type RenderResult = { content: ReactElement; headings: TocHeading[] };
const devRenderCache = new Map<string, RenderResult>();

export const renderMdx = cache(
  async (source: string, options: RenderOptions = {}) => {
    const { content } = await compileContent(source, options, false);
    return content;
  }
);

/** MDX のコンパイルと目次抽出を同じパースで実行する。 */
export const renderMdxWithToc = cache(
  async (source: string, options: RenderOptions = {}): Promise<RenderResult> =>
    await compileContent(source, options, true)
);

function buildCompileOptions(
  source: string,
  { basePath, scope, idPrefix, extraComponents }: RenderOptions,
  extraRemarkPlugins: PluggableList = [],
  affiliateById = new Map<string, string>()
): Parameters<typeof compileMDX>[0] {
  const codeHikeConfig: CodeHikeConfig = {
    components: { code: "Code", inlineCode: "InlineCode" },
    syntaxHighlighting: { theme: "github-from-css" },
  };

  const baseComponents = {
    ...mdxComponents,
    ChatHistory: createChatHistory(renderMdx),
    ...extraComponents,
  };
  const components = basePath
    ? {
        ...baseComponents,
        Img: (props: ComponentProps<typeof Img>) => (
          <Img {...props} basePath={basePath} />
        ),
        img: (props: ComponentProps<typeof Img>) => (
          <Img {...props} basePath={basePath} />
        ),
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
          remarkCustomHeadingId,
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
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["noopener", "noreferrer"] },
          ],
          [
            rehypeKatex,
            {
              output: "mathml",
              throwOnError: false,
              errorColor: "#cc0000",
              trust: true,
            },
          ],
        ],
      },
    },
  };
}

async function compileContent(
  source: string,
  options: RenderOptions,
  collectHeadings: boolean
): Promise<RenderResult> {
  const [affiliateById, heavyComponents] = await Promise.all([
    getAffiliateProductUrlById(),
    loadHeavyComponents(source),
  ]);
  // コンポーネント関数はシリアライズできないため、追加マップがある場合は開発キャッシュを使わない。
  const useDevCache =
    process.env.NODE_ENV === "development" && !options.extraComponents;
  const cacheKey = useDevCache
    ? JSON.stringify([
        collectHeadings,
        options.idPrefix,
        options.basePath,
        options.scope,
        source,
        [...affiliateById],
      ])
    : "";
  if (useDevCache) {
    const cached = devRenderCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const headings: TocHeading[] = [];
  const { content } = await compileMDX(
    buildCompileOptions(
      source,
      {
        ...options,
        extraComponents: { ...options.extraComponents, ...heavyComponents },
      },
      collectHeadings
        ? [remarkCollectHeadings(headings, options.idPrefix)]
        : [],
      affiliateById
    )
  );
  const result = { content, headings };
  if (useDevCache) {
    devRenderCache.set(cacheKey, result);
  }
  return result;
}
