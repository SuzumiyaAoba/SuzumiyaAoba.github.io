import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPost } from "@/entities/blog";
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
import { GoogleAdsenseAd } from "@/shared/ui/google-adsense-ad";
import { Toc } from "./toc";

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
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const scope = await loadMdxScope(post.content, slug);
  const postTitle = post.frontmatter.title || post.slug;
  const postUrl = `${getSiteUrl()}/blog/post/${slug}`;
  const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    postTitle,
  )}&url=${encodeURIComponent(postUrl)}`;
  const [content, headings, amazonProducts] = await Promise.all([
    renderMdx(post.content, { basePath: `/contents/blog/${slug}`, scope }),
    getTocHeadings(post.content),
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
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: postTitle, path: `/blog/post/${slug}` },
          ]}
          className="mb-4"
        />
        <header className="mb-10 space-y-3">
          <p className="text-sm text-muted-foreground">{post.frontmatter.date}</p>
          <h1 className="text-3xl font-semibold">{postTitle}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {post.frontmatter.category ? (
              <Badge variant="outline" className="border-border/40 text-[11px] font-medium">
                {post.frontmatter.category}
              </Badge>
            ) : null}
            {(post.frontmatter.tags ?? []).map((tag) => (
              <Tag
                key={tag}
                tag={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="bg-muted text-[11px] font-medium text-muted-foreground"
              />
            ))}
          </div>
        </header>
        <div className="grid w-full min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
          <article className="prose prose-neutral min-w-0 max-w-none font-sans">{content}</article>
          <div className="hidden lg:block">
            <Toc headings={headings} />
          </div>
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              {/* oxlint-disable-next-line next/no-html-link-for-pages -- 外部リンク (X/Twitter) は <a> タグを使用 */}
              <a href={shareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                <Icon icon="simple-icons:x" className="size-3.5" />ポスト
              </a>
            </Button>
          </div>
        </div>
        {amazonProducts.length > 0 ? (
          <AmazonProductSection products={amazonProducts} className="mt-8" />
        ) : null}
        {post.frontmatter.amazonAssociate ? (
          <div className="mt-6">
            <AmazonAssociate />
          </div>
        ) : null}
        <div className="mt-12 mb-8">
          <GoogleAdsenseAd slot="9361206074" format="autorelaxed" responsive="false" />
        </div>
        <Comments />
      </main>
      <Footer />
    </div>
  );
}
