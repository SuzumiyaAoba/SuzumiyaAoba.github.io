import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants } from "@/entities/blog";

import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";

const POSTS_PER_PAGE = 10;

function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

type PageProps = {
  params: Promise<{ page: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const posts = await getBlogPostsVariants();
  const pageCount = getPageCount(posts.length);

  if (pageNumber > pageCount) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);
  const pagePath = toLocalePath(pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`, resolvedLocale);
  const pageLabel = resolvedLocale === "en" ? `Page ${pageNumber}` : `ページ ${pageNumber}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
          { name: pageLabel, path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
            {
              name: pageLabel,
              path: pagePath,
            },
          ]}
        />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="ブログ" en="Blog" />
          </h1>
          <div className="text-sm text-muted-foreground">{pageLabel}</div>
        </section>

        <BlogPostList posts={pagePosts} locale={resolvedLocale} variant="detailed" showThumbnail />

        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {pageNumber > 1 ? (
            <a
              href={toLocalePath(
                pageNumber === 2 ? "/blog" : `/blog/${pageNumber - 1}`,
                resolvedLocale,
              )}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              <I18nText locale={resolvedLocale} ja="← 前のページ" en="← Previous page" />
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
                  href={toLocalePath(href, resolvedLocale)}
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
              href={toLocalePath(`/blog/${pageNumber + 1}`, resolvedLocale)}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              <I18nText locale={resolvedLocale} ja="次のページ →" en="Next page →" />
            </a>
          ) : (
            <span className="w-[5.5rem]" />
          )}
        </nav>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
