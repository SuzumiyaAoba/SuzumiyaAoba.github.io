import Image from "next/image";

import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPosts } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";

const POSTS_PER_PAGE = 10;

function formatDate(date: string): string {
  if (!date) {
    return "Unknown date";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolveThumbnail(slug: string, thumbnail?: string): string {
  if (!thumbnail) {
    return "/icon.svg";
  }
  if (
    thumbnail.startsWith("http://") ||
    thumbnail.startsWith("https://") ||
    thumbnail.startsWith("/")
  ) {
    return thumbnail;
  }
  return `/contents/blog/${slug}/${thumbnail}`;
}

function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

type PageProps = {
  params: Promise<{ page: string }>;
};

export default async function Page({ params }: PageProps) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const posts = await getBlogPosts();
  const pageCount = getPageCount(posts.length);

  if (pageNumber > pageCount) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: `Page ${pageNumber}`, path: pageNumber === 1 ? "/blog" : `/blog/${pageNumber}` },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            {
              name: `Page ${pageNumber}`,
              path: pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`,
            },
          ]}
        />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            BLOG
          </h1>
          <div className="text-sm text-muted-foreground">Page {pageNumber}</div>
        </section>

        <ul className="space-y-5">
          {pagePosts.map((post) => {
            const title = post.frontmatter.title || post.slug;
            const tags = post.frontmatter.tags ?? [];
            const category = post.frontmatter.category;
            const thumbnail = resolveThumbnail(post.slug, post.frontmatter.thumbnail);
            const isFallback = thumbnail === "/icon.svg";
            return (
              <li key={post.slug}>
                <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                  <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6">
                    <a
                      href={`/blog/post/${post.slug}`}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted md:w-44"
                    >
                      <Image
                        src={thumbnail}
                        alt={isFallback ? "Site icon" : title}
                        fill
                        sizes="(min-width: 768px) 176px, 100vw"
                        className={isFallback ? "object-contain p-6 opacity-70" : "object-cover"}
                      />
                    </a>
                    <div className="flex-1 flex flex-col gap-2 py-2">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(post.frontmatter.date)}</span>
                          {category ? (
                            <Badge
                              variant="outline"
                              className="border-border/40 text-[11px] font-medium"
                            >
                              {category}
                            </Badge>
                          ) : null}
                        </div>
                        <a
                          href={`/blog/post/${post.slug}`}
                          className="block text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80"
                        >
                          {title}
                        </a>
                      </div>
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 md:mt-auto">
                          {tags.map((tag) => (
                            <Tag
                              key={tag}
                              tag={tag}
                              href={`/tags/${encodeURIComponent(tag)}`}
                              className="bg-muted text-xs font-medium text-muted-foreground"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {pageNumber > 1 ? (
            <a
              href={pageNumber === 2 ? "/blog" : `/blog/${pageNumber - 1}`}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              ← 前のページ
            </a>
          ) : (
            <span className="w-[5.5rem]" />
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {Array.from({ length: pageCount }, (_, index) => {
              const page = index + 1;
              const href = page === 1 ? "/blog" : `/blog/${page}`;
              const isActive = page === pageNumber;
              return (
                <a
                  key={page}
                  href={href}
                  className={
                    isActive
                      ? "rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                      : "rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {page}
                </a>
              );
            })}
          </div>
          {pageNumber < pageCount ? (
            <a
              href={`/blog/${pageNumber + 1}`}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              次のページ →
            </a>
          ) : (
            <span className="w-[5.5rem]" />
          )}
        </nav>
      </main>
      <Footer />
    </div>
  );
}
