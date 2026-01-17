import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getAdjacentPostsVariants, getBlogPost } from "@/entities/blog";
import { resolveContentRoot } from "@/shared/lib/content-root";
import { getTocHeadings, renderMdx } from "@/shared/lib/mdx";
import { Comments } from "@/shared/ui/comments";
import { Badge } from "@/shared/ui/badge";
import { getAmazonProductsByIds } from "@/shared/lib/amazon-products";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { getSiteUrl } from "@/shared/lib/site-url";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Button } from "@/shared/ui/button";
import { Message } from "@/shared/ui/mdx";
import { Icon } from "@iconify/react";
import { Separator } from "@/shared/ui/separator";
import { Toc } from "./toc";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

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
  const resolvedLocale: Locale = locale ?? "ja";
  const isEn = resolvedLocale === "en";
  const { slug } = await params;
  const [postJa, postEn, { prev, next }] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
    getAdjacentPostsVariants(slug),
  ]);

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
  const scope = primaryContent
    ? await loadMdxScope(primaryContent, slug)
    : fallbackContent
      ? await loadMdxScope(fallbackContent, slug)
      : {};
  const [content, headings, amazonProducts] = await Promise.all([
    renderMdx(contentSource, { basePath: `/contents/blog/${slug}`, scope }),
    getTocHeadings(contentSource),
    post.frontmatter.amazonProductIds
      ? getAmazonProductsByIds(post.frontmatter.amazonProductIds)
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={postPath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
          { name: postTitle, path: postPath },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: postTitle,
          datePublished: post.frontmatter.date,
          dateModified: post.frontmatter.date,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${getSiteUrl()}${postPath}`,
          },
          author: {
            "@type": "Person",
            name: "SuzumiyaAoba",
          },
        }}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl min-w-0 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
            { name: postTitle, path: postPath },
          ]}
          className="mb-4"
        />
        <header className="mb-10 space-y-3">
          <p className="text-sm text-muted-foreground">{post.frontmatter.date}</p>
          <h1 className="text-3xl font-semibold break-all">{postTitle}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {category ? (
              <Badge variant="outline" className="border-border/40 text-[11px] font-medium">
                {category}
              </Badge>
            ) : null}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Tag
                    key={tag}
                    tag={tag}
                    href={toLocalePath(`/tags/${encodeURIComponent(tag)}`, resolvedLocale)}
                    className="bg-muted text-[11px] font-medium text-muted-foreground"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </header>
        <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
          <div className="flex flex-col w-full min-w-0">
            <article className="prose prose-neutral min-w-0 max-w-none font-sans">
              {isEn && translationModel ? (
                <Message title="Notes" variant="info" defaultOpen>
                  This article was translated by {translationModel}. The original is{" "}
                  <a href={originalPath}>here</a>.
                </Message>
              ) : null}
              <div>{content}</div>
            </article>
            <div>
              {amazonProducts.length > 0 ? (
                <AmazonProductSection products={amazonProducts} className="mt-8" />
              ) : null}
              {post.frontmatter.amazonAssociate ? (
                <div className="mt-6">
                  <AmazonAssociate />
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button asChild variant="outline" size="sm">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                >
                  <Icon icon="simple-icons:x" className="size-3.5" />
                  <I18nText locale={resolvedLocale} ja="ポスト" en="Post" />
                </a>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <Toc headings={headings} locale={resolvedLocale} />
          </div>
        </div>

        <div className="mt-6 space-y-8">
          <Separator className="bg-border/40" />
          <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prev ? (
              <div className="flex min-w-0 flex-1">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto w-full min-w-0 flex-col items-start gap-1 px-4 py-4 whitespace-normal hover:bg-muted/50"
                >
                  <a
                    href={toLocalePath(`/blog/post/${prev.slug}`, resolvedLocale)}
                    className="w-full min-w-0"
                  >
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <Icon icon="lucide:chevron-left" className="size-3" />
                      <I18nText locale={resolvedLocale} ja="前の記事" en="Previous Post" />
                    </span>
                    <span className="line-clamp-2 w-full text-left text-sm font-semibold break-all">
                      {(isEn ? (prev.en ?? prev.ja) : (prev.ja ?? prev.en))?.frontmatter.title ??
                        prev.slug}
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <div />
            )}
            {next ? (
              <div className="flex min-w-0 flex-1">
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto w-full min-w-0 flex-col items-end gap-1 px-4 py-4 whitespace-normal hover:bg-muted/50"
                >
                  <a
                    href={toLocalePath(`/blog/post/${next.slug}`, resolvedLocale)}
                    className="w-full min-w-0"
                  >
                    <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                      <I18nText locale={resolvedLocale} ja="次の記事" en="Next Post" />
                      <Icon icon="lucide:chevron-right" className="size-3" />
                    </span>
                    <span className="line-clamp-2 w-full text-right text-sm font-semibold break-all">
                      {(isEn ? (next.en ?? next.ja) : (next.ja ?? next.en))?.frontmatter.title ??
                        next.slug}
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <div />
            )}
          </nav>
        </div>
        <Comments locale={resolvedLocale} />
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
