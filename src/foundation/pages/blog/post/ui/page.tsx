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
import { Icon } from "@iconify/react";
import { Separator } from "@/shared/ui/separator";
import { Toc } from "./toc";
import { I18nText } from "@/shared/ui/i18n-text";


type PageProps = {
  params: Promise<{ slug: string }>;
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

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const [postJa, postEn, { prev, next }] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
    getAdjacentPostsVariants(slug),
  ]);

  const post = postJa ?? postEn;

  if (!post) {
    notFound();
  }

  const postTitleJa = postJa?.frontmatter.title || post.slug;
  const postTitleEn = postEn?.frontmatter.title || postTitleJa;
  const categoryJa = postJa?.frontmatter.category;
  const categoryEn = postEn?.frontmatter.category ?? categoryJa;
  const tagsJa = postJa?.frontmatter.tags ?? postEn?.frontmatter.tags ?? [];
  const tagsEn = postEn?.frontmatter.tags ?? tagsJa;
  const postUrl = `${getSiteUrl()}/blog/post/${slug}`;
  const shareUrlJa = `https://x.com/intent/tweet?text=${encodeURIComponent(
    postTitleJa,
  )}&url=${encodeURIComponent(postUrl)}`;
  const shareUrlEn = `https://x.com/intent/tweet?text=${encodeURIComponent(
    postTitleEn,
  )}&url=${encodeURIComponent(postUrl)}`;
  const scopeJa = postJa ? await loadMdxScope(postJa.content, slug) : {};
  const scopeEn = postEn ? await loadMdxScope(postEn.content, slug) : scopeJa;
  const contentEnSource = postEn?.content ?? post.content;
  const [contentJa, contentEn, headingsJa, headingsEn, amazonProducts] = await Promise.all([
    renderMdx(post.content, { basePath: `/contents/blog/${slug}`, scope: scopeJa }),
    renderMdx(contentEnSource, {
      basePath: `/contents/blog/${slug}`,
      scope: scopeEn,
      idPrefix: "en-",
    }),
    getTocHeadings(post.content),
    getTocHeadings(contentEnSource, { idPrefix: "en-" }),
    post.frontmatter.amazonProductIds
      ? getAmazonProductsByIds(post.frontmatter.amazonProductIds)
      : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.frontmatter.title || post.slug, path: `/blog/post/${slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.frontmatter.title || post.slug,
          datePublished: post.frontmatter.date,
          dateModified: post.frontmatter.date,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${getSiteUrl()}/blog/post/${slug}`,
          },
          author: {
            "@type": "Person",
            name: "SuzumiyaAoba",
          },
        }}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl min-w-0 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <div className="lang-ja">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: postTitleJa, path: `/blog/post/${slug}` },
            ]}
            className="mb-4"
          />
        </div>
        <div className="lang-en">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: postTitleEn, path: `/blog/post/${slug}` },
            ]}
            className="mb-4"
          />
        </div>
        <header className="mb-10 space-y-3">
          <p className="text-sm text-muted-foreground">
            <span className="lang-ja">
              {postJa?.frontmatter.date ?? post.frontmatter.date}
            </span>
            <span className="lang-en">
              {postEn?.frontmatter.date ?? postJa?.frontmatter.date ?? post.frontmatter.date}
            </span>
          </p>
          <h1 className="text-3xl font-semibold break-all">
            <span className="lang-ja">{postTitleJa}</span>
            <span className="lang-en">{postTitleEn}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {categoryJa ? (
              <Badge variant="outline" className="border-border/40 text-[11px] font-medium">
                <span className="lang-ja">{categoryJa}</span>
                <span className="lang-en">{categoryEn}</span>
              </Badge>
            ) : null}
            {tagsJa.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 lang-ja">
                  {tagsJa.map((tag) => (
                    <Tag
                      key={tag}
                      tag={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="bg-muted text-[11px] font-medium text-muted-foreground"
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 lang-en">
                  {tagsEn.map((tag) => (
                    <Tag
                      key={`en-${tag}`}
                      tag={tag}
                      href={`/tags/${encodeURIComponent(tag)}`}
                      className="bg-muted text-[11px] font-medium text-muted-foreground"
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </header>
        <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
          <div className="flex flex-col w-full min-w-0">
            <article className="prose prose-neutral min-w-0 max-w-none font-sans">
              <div className="lang-ja">{contentJa}</div>
              <div className="lang-en">{contentEn}</div>
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
              <Button asChild variant="outline" size="sm" className="lang-ja">
                <a
                  href={shareUrlJa}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                >
                  <Icon icon="simple-icons:x" className="size-3.5" />
                  <I18nText ja="ポスト" en="Post" />
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="lang-en">
                <a
                  href={shareUrlEn}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                >
                  <Icon icon="simple-icons:x" className="size-3.5" />
                  <I18nText ja="ポスト" en="Post" />
                </a>
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="lang-ja">
              <Toc headings={headingsJa} />
            </div>
            <div className="lang-en">
              <Toc headings={headingsEn} />
            </div>
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
                  <a href={`/blog/post/${prev.slug}`} className="w-full min-w-0">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <Icon icon="lucide:chevron-left" className="size-3" />
                      <I18nText ja="前の記事" en="Previous Post" />
                    </span>
                    <span className="line-clamp-2 w-full text-left text-sm font-semibold break-all">
                      <span className="lang-ja">
                        {(prev.ja ?? prev.en)?.frontmatter.title ?? prev.slug}
                      </span>
                      <span className="lang-en">
                        {(prev.en ?? prev.ja)?.frontmatter.title ?? prev.slug}
                      </span>
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
                  <a href={`/blog/post/${next.slug}`} className="w-full min-w-0">
                    <span className="flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">
                      <I18nText ja="次の記事" en="Next Post" />
                      <Icon icon="lucide:chevron-right" className="size-3" />
                    </span>
                    <span className="line-clamp-2 w-full text-right text-sm font-semibold break-all">
                      <span className="lang-ja">
                        {(next.ja ?? next.en)?.frontmatter.title ?? next.slug}
                      </span>
                      <span className="lang-en">
                        {(next.en ?? next.ja)?.frontmatter.title ?? next.slug}
                      </span>
                    </span>
                  </a>
                </Button>
              </div>
            ) : (
              <div />
            )}
          </nav>
        </div>
        <Comments />
      </main>
      <Footer />
    </div>
  );
}
