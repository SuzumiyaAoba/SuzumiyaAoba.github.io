import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { getAdjacentPostSummariesVariants, getBlogPost } from "@/entities/blog";
import { resolveContentRoot } from "@/shared/lib/content-root";
import { getTocHeadings, renderMdx } from "@/shared/lib/mdx";
import {
  getAffiliateProductsByIds,
  getAffiliateProductsByTags,
  type AffiliateProduct,
} from "@/shared/lib/affiliate-products";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { getSiteUrl } from "@/shared/lib/site";
import { BlogPostPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ slug: string }>;
  locale?: Locale;
};

async function loadMdxScope(source: string, slug: string): Promise<Record<string, unknown>> {
  const importRegex = /^import\s+(\w+)\s+from\s+["'](.+\.json)["'];/gm;
  const matches = [...source.matchAll(importRegex)];
  if (matches.length === 0) {
    return {};
  }

  const root = await resolveContentRoot();
  const baseDir = path.join(root, "blog", slug);
  const scope: Record<string, unknown> = {};

  for (const match of matches) {
    const [, name, relPath] = match;
    if (!name || !relPath) {
      continue;
    }
    const filePath = path.join(baseDir, relPath);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      scope[name] = JSON.parse(raw) as unknown;
    } catch {
      continue;
    }
  }

  return scope;
}

export default async function Page({ params, locale }: PageProps) {
  const shouldLogPerf = process.env["NEXT_DEBUG_PERF"] === "1";
  if (shouldLogPerf) {
    console.time(`[blog] ${locale ?? "ja"}:${await params.then((p) => p.slug)}`);
  }
  const resolvedLocale: Locale = locale ?? "ja";
  const isEn = resolvedLocale === "en";
  const { slug } = await params;
  if (shouldLogPerf) {
    console.time(`[blog] load posts:${slug}`);
  }
  const [postJa, postEn, { prev, next }] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
    getAdjacentPostSummariesVariants(slug),
  ]);
  if (shouldLogPerf) {
    console.timeEnd(`[blog] load posts:${slug}`);
  }

  const post = isEn ? (postEn ?? postJa) : (postJa ?? postEn);

  if (!post) {
    notFound();
  }

  const postTitleJa = postJa?.frontmatter.title || post.slug;
  const postTitleEn = postEn?.frontmatter.title || postTitleJa;
  const postTitle = isEn ? postTitleEn : postTitleJa;
  const category = post.frontmatter.category;
  const tags = post.frontmatter.tags ?? [];
  const postPath = toLocalePath(`/blog/post/${slug}`, resolvedLocale);
  const postUrl = `${getSiteUrl()}${postPath}`;
  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    postTitle,
  )}&url=${encodeURIComponent(postUrl)}`;
  const primaryContent = isEn ? postEn?.content : postJa?.content;
  const fallbackContent = isEn ? postJa?.content : postEn?.content;
  const contentSource = primaryContent ?? fallbackContent ?? post.content;
  const translationModel = postEn?.frontmatter.model;
  const originalPath = toLocalePath(`/blog/post/${slug}`, "ja");
  if (shouldLogPerf) {
    console.time(`[blog] mdx scope:${slug}`);
  }
  const scope = primaryContent
    ? await loadMdxScope(primaryContent, slug)
    : fallbackContent
      ? await loadMdxScope(fallbackContent, slug)
      : {};
  if (shouldLogPerf) {
    console.timeEnd(`[blog] mdx scope:${slug}`);
  }
  const explicitProductIds = post.frontmatter.amazonProductIds ?? [];
  if (shouldLogPerf) {
    console.time(`[blog] mdx render:${slug}`);
  }
  const contentPromise = renderMdx(contentSource, { basePath: `/contents/blog/${slug}`, scope });
  if (shouldLogPerf) {
    console.time(`[blog] toc:${slug}`);
  }
  const tocPromise = getTocHeadings(contentSource);
  if (shouldLogPerf) {
    console.time(`[blog] amazon explicit:${slug}`);
  }
  const explicitPromise: Promise<AffiliateProduct[]> =
    explicitProductIds.length > 0
      ? getAffiliateProductsByIds(explicitProductIds)
      : Promise.resolve([]);
  const [content, headings, explicitProducts]: [
    ReactElement,
    Awaited<ReturnType<typeof getTocHeadings>>,
    AffiliateProduct[],
  ] = await Promise.all([contentPromise, tocPromise, explicitPromise]);
  if (shouldLogPerf) {
    console.timeEnd(`[blog] mdx render:${slug}`);
    console.timeEnd(`[blog] toc:${slug}`);
    console.timeEnd(`[blog] amazon explicit:${slug}`);
  }
  const prioritizedProducts = explicitProducts.slice(0, 3);
  const remainingSlots = 3 - prioritizedProducts.length;
  if (shouldLogPerf) {
    console.time(`[blog] tag products:${slug}`);
  }
  const tagProducts =
    remainingSlots > 0 && tags.length > 0
      ? await getAffiliateProductsByTags(tags, {
          excludeIds: prioritizedProducts.map((product) => product.id),
          limit: remainingSlots,
        })
      : [];
  if (shouldLogPerf) {
    console.timeEnd(`[blog] tag products:${slug}`);
    console.timeEnd(`[blog] ${resolvedLocale}:${slug}`);
  }
  const amazonProducts = [...prioritizedProducts, ...tagProducts];
  const shouldShowAmazonAssociate = amazonProducts.length > 0 || post.frontmatter.amazonAssociate;

  const prevTitle = prev
    ? (isEn ? (prev.en ?? prev.ja) : (prev.ja ?? prev.en))?.frontmatter.title ?? prev.slug
    : "";
  const nextTitle = next
    ? (isEn ? (next.en ?? next.ja) : (next.ja ?? next.en))?.frontmatter.title ?? next.slug
    : "";

  return (
    <BlogPostPageContent
      locale={resolvedLocale}
      postTitle={postTitle}
      postDate={post.frontmatter.date!}
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
    />
  );
}
