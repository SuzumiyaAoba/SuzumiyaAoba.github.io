import {
  resolveLocalizedValue,
  toLocalePath,
  resolveLocale,
  notFound,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import path from "node:path";

import { getAdjacentPostSummariesVariants, getBlogPost } from "@/entities/blog";
import { getSeriesForPostSlug } from "@/entities/series-item";
import { resolveContentRoot } from "@/shared/lib/content-file";
import {
  extractAmazonProductIdsFromMdx,
  loadFinancialDataComponents,
  loadMdxScope,
  renderMdxWithToc,
} from "@/shared/lib/mdx";
import {
  getAffiliateProductsByIds,
  getAffiliateProductsByTags,
} from "@/shared/lib/affiliate-products";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";
import { getSiteUrl } from "@/shared/lib/site";
import { estimateReadingMinutes } from "@/shared/lib/presentation";
import { BlogPostPageContent } from "./page-content";

/**
 * 本文中で financial-data の Chart/Sheet ラッパーが使われているかを判定する。
 * 該当した場合のみ重い dynamic 群を MDX components マップに注入する。
 */
const FINANCIAL_DATA_USAGE_RE =
  /\b(?:Section\d+ChartWrapper|Sheet\d+(?:Bar|Stacked|Amount|Pie|Line)?ChartWrapper)\b/u;

/**
 * ブログ記事詳細ページのプロパティ
 */
type PageProps = {
  /** ルートパラメータ（Promiseとして渡される） */
  params: Promise<{ slug: string }>;
  /** 描画ロケール */
  locale?: Locale;
};

/**
 * ブログ記事詳細ページを表示するサーバーサイドコンポーネント。
 * 指定されたスラッグに対応する Markdown/MDX ファイルを読み込み、レンダリングします。
 */
export default async function Page({ params, locale }: PageProps) {
  logPerformance(
    "start",
    `[blog] ${locale ?? "ja"}:${await params.then((p) => p.slug)}`
  );
  const resolvedLocale = resolveLocale(locale);
  const isEn = resolvedLocale === "en";
  const { slug } = await params;
  logPerformance("start", `[blog] load posts:${slug}`);
  const [postJa, postEn, { prev, next }, series] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
    getAdjacentPostSummariesVariants(slug),
    getSeriesForPostSlug(slug, resolvedLocale),
  ]);
  logPerformance("end", `[blog] load posts:${slug}`);

  const post = resolveLocalizedValue(
    { ja: postJa, en: postEn },
    resolvedLocale
  );

  if (!post) {
    notFound();
  }

  const postTitleJa = postJa?.frontmatter.title || post.slug;
  const postTitleEn = postEn?.frontmatter.title || postTitleJa;
  const postTitle = isEn ? postTitleEn : postTitleJa;
  const { category } = post.frontmatter;
  const tags = post.frontmatter.tags ?? [];
  const postPath = toLocalePath(`/blog/post/${slug}`, resolvedLocale);
  const postUrl = `${getSiteUrl()}${postPath}`;
  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    postTitle
  )}&url=${encodeURIComponent(postUrl)}`;
  const primaryContent = isEn ? postEn?.content : postJa?.content;
  const fallbackContent = isEn ? postJa?.content : postEn?.content;
  const contentSource = primaryContent ?? fallbackContent ?? post.content;
  const productIdsInContent = extractAmazonProductIdsFromMdx(contentSource);
  const translationModel = postEn?.frontmatter.model;
  const originalPath = toLocalePath(`/blog/post/${slug}`, "ja");
  logPerformance("start", `[blog] mdx scope:${slug}`);
  const blogPostDir = path.join(await resolveContentRoot(), "blog", slug);
  const scope = primaryContent
    ? await loadMdxScope(primaryContent, blogPostDir)
    : fallbackContent
      ? await loadMdxScope(fallbackContent, blogPostDir)
      : {};
  logPerformance("end", `[blog] mdx scope:${slug}`);
  const explicitProductIds = post.frontmatter.amazonProductIds ?? [];
  const excludedIdsInContent = new Set(productIdsInContent);
  const explicitProductIdsForFooter = explicitProductIds.filter(
    (id) => !excludedIdsInContent.has(id)
  );
  logPerformance("start", `[blog] mdx render:${slug}`);
  // 使う記事だけが実行時に読み込む。静的 import にすると、チャートを
  // 使わない記事のバンドルにも約 115KB(gzip) が載る。
  const financialDataComponents = FINANCIAL_DATA_USAGE_RE.test(contentSource)
    ? await loadFinancialDataComponents()
    : null;
  const mdxPromise = renderMdxWithToc(contentSource, {
    basePath: `/contents/blog/${slug}`,
    scope,
    ...(financialDataComponents
      ? { extraComponents: financialDataComponents }
      : {}),
  });
  logPerformance("start", `[blog] amazon explicit:${slug}`);
  const explicitPromise: Promise<AffiliateProduct[]> =
    explicitProductIdsForFooter.length > 0
      ? getAffiliateProductsByIds(explicitProductIdsForFooter)
      : Promise.resolve([]);
  const [{ content, headings }, explicitProducts]: [
    Awaited<ReturnType<typeof renderMdxWithToc>>,
    AffiliateProduct[],
  ] = await Promise.all([mdxPromise, explicitPromise]);
  logPerformance("end", `[blog] mdx render:${slug}`);
  logPerformance("end", `[blog] amazon explicit:${slug}`);
  const amazonProducts = await loadFooterProducts(
    explicitProducts,
    category,
    tags,
    slug,
    productIdsInContent,
    resolvedLocale
  );
  const shouldShowAmazonAssociate =
    amazonProducts.length > 0 ||
    productIdsInContent.length > 0 ||
    post.frontmatter.amazonAssociate;

  const prevTitle = prev
    ? (resolveLocalizedValue(prev, resolvedLocale)?.frontmatter.title ??
      prev.slug)
    : "";
  const nextTitle = next
    ? (resolveLocalizedValue(next, resolvedLocale)?.frontmatter.title ??
      next.slug)
    : "";

  return (
    <BlogPostPageContent
      locale={resolvedLocale}
      postTitle={postTitle}
      description={post.frontmatter.description}
      postDate={post.frontmatter.date}
      readingMinutes={estimateReadingMinutes(contentSource)}
      category={category}
      tags={tags}
      postPath={postPath}
      shareUrl={shareUrl}
      isEn={isEn}
      translationModel={translationModel}
      originalPath={originalPath}
      content={content}
      amazonProducts={amazonProducts}
      shouldShowAmazonAssociate={shouldShowAmazonAssociate ?? false}
      headings={headings}
      prev={prev ? { slug: prev.slug, title: prevTitle } : null}
      next={next ? { slug: next.slug, title: nextTitle } : null}
      series={series ? { slug: series.slug, name: series.name } : null}
    />
  );
}

async function loadFooterProducts(
  explicitProducts: AffiliateProduct[],
  category: string | undefined,
  tags: string[],
  slug: string,
  productIdsInContent: string[],
  resolvedLocale: string
) {
  const prioritizedProducts = explicitProducts.slice(0, 3);
  const remainingSlots = 3 - prioritizedProducts.length;
  const productMatchTags = category ? [category, ...tags] : tags;
  logPerformance("start", `[blog] tag products:${slug}`);
  const tagProducts =
    remainingSlots > 0 && productMatchTags.length > 0
      ? await getAffiliateProductsByTags(productMatchTags, {
          ...(category ? { category } : {}),
          excludeIds: [
            ...prioritizedProducts.map((product) => product.id),
            ...productIdsInContent,
          ],
          limit: remainingSlots,
        })
      : [];
  logPerformance("end", `[blog] tag products:${slug}`);
  logPerformance("end", `[blog] ${resolvedLocale}:${slug}`);
  const amazonProducts = [...prioritizedProducts, ...tagProducts];
  return amazonProducts;
}

function logPerformance(phase: "start" | "end", label: string) {
  if (process.env["NEXT_DEBUG_PERF"] !== "1") {
    return;
  }
  if (phase === "start") {
    console.time(label);
  } else {
    console.timeEnd(label);
  }
}
