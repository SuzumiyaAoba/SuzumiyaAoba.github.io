import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { PaginationNav } from "@/shared/ui/pagination-nav";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";

export type BlogPaginationPageContentProps = {
  locale: Locale;
  pageNumber: number;
  pageCount: number;
  posts: React.ComponentProps<typeof BlogPostList>["posts"];
};

export function BlogPaginationPageContent({
  locale,
  pageNumber,
  pageCount,
  posts,
}: BlogPaginationPageContentProps) {
  const pagePath = toLocalePath(pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`, locale);
  const pageLabel = locale === "en" ? `Page ${pageNumber}` : `ページ ${pageNumber}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Blog", path: toLocalePath("/blog", locale) },
          { name: pageLabel, path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: "Blog", path: toLocalePath("/blog", locale) },
            {
              name: pageLabel,
              path: pagePath,
            },
          ]}
        />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ブログ" en="Blog" />
          </h1>
          <div className="text-sm text-muted-foreground">{pageLabel}</div>
        </section>

        <BlogPostList posts={posts} locale={locale} variant="detailed" showThumbnail />

        <PaginationNav
          locale={locale}
          currentPage={pageNumber}
          pageCount={pageCount}
          hrefForPage={(page) => (page === 1 ? "/blog" : `/blog/${page}`)}
          showPrevNext
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
