import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { PaginationNav } from "@/shared/ui/pagination-nav";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/presentation";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  type BreadcrumbItem,
  type Locale,
} from "@/shared/lib/routing";
import { BlogPostList } from "./blog-post-list";

export type BlogListingContentProps = {
  locale: Locale;
  posts: React.ComponentProps<typeof BlogPostList>["posts"];
  pageNumber: number;
  pageCount: number;
  /** variant="list" の場合のみ参照する、ページネーション表示要否の判定に使う総件数 */
  totalCount?: number;
  /**
   * "list": /blog相当。パンくずはJsonLdのみ、ページネーションは記事数超過時のみ表示。
   * "paginated": /blog/N相当。ビジュアルのパンくずを常に表示し、ページネーションも常に前後リンク付きで表示。
   * 両バリアントの既存の見た目の差分をそのまま維持するためのフラグ。
   */
  variant: "list" | "paginated";
};

const hrefForPage = (page: number) => (page === 1 ? "/blog" : `/blog/${page}`);

/**
 * /blog と /blog/N の本文部分(パンくず・見出し・記事一覧・ページネーション)を統合したコンポーネント。
 * 両ページは元々コードがほぼ同一だったが見た目に差分があるため、
 * variant で既存の見た目をそれぞれ完全に維持する。Header/Footer はページ側の責務のため含まない。
 */
export function BlogListingContent({
  locale,
  posts,
  pageNumber,
  pageCount,
  totalCount,
  variant,
}: BlogListingContentProps) {
  const pagePath = toLocalePath(hrefForPage(pageNumber), locale);
  const pageLabel = locale === "en" ? `Page ${pageNumber}` : `ページ ${pageNumber}`;

  const breadcrumbItems: BreadcrumbItem[] =
    variant === "paginated"
      ? [
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Blog", path: toLocalePath("/blog", locale) },
          { name: pageLabel, path: pagePath },
        ]
      : buildListBreadcrumbItems(locale, { name: "Blog", path: "/blog" });

  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ブログ" en="Blog" />
          </h1>
          {variant === "paginated" ? (
            <div className="text-sm text-muted-foreground">{pageLabel}</div>
          ) : null}
        </section>

        <BlogPostList posts={posts} locale={locale} variant="detailed" showThumbnail />

        {variant === "paginated" ? (
          <PaginationNav
            locale={locale}
            currentPage={pageNumber}
            pageCount={pageCount}
            hrefForPage={hrefForPage}
            showPrevNext
          />
        ) : (totalCount ?? 0) > DEFAULT_PAGE_SIZE ? (
          <PaginationNav
            locale={locale}
            currentPage={pageNumber}
            pageCount={pageCount}
            hrefForPage={hrefForPage}
          />
        ) : null}
      </main>
    </>
  );
}
