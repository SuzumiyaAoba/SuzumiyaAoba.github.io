import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { PaginationNav } from "@/shared/ui/pagination-nav";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { BreadcrumbItem, Locale } from "@/shared/lib/routing";
import type { LocalizedBlogPostSummary } from "../model/blog";
import type { BlogTagCount } from "../model/blog-tags";
import { toPostIndexEntries } from "../model/post-index-entry";
import { PostIndex } from "./post-index";

export type BlogListingContentProps = {
  locale: Locale;
  posts: LocalizedBlogPostSummary[];
  pageNumber: number;
  pageCount: number;
  /** 全記事数 */
  totalCount: number;
  /** 見出し下に並べる、よく書いているテーマ */
  topics?: BlogTagCount[];
};

const hrefForPage = (page: number) => (page === 1 ? "/blog" : `/blog/${page}`);
const NO_TOPICS: BlogTagCount[] = [];

/**
 * /blog と /blog/N の本文部分(見出し・テーマ・記事一覧・ページ送り)。
 * Header/Footer はページ側の責務のため含まない。
 */
export function BlogListingContent({
  locale,
  posts,
  pageNumber,
  pageCount,
  totalCount,
  topics = NO_TOPICS,
}: BlogListingContentProps) {
  const en = locale === "en";
  const pagePath = toLocalePath(hrefForPage(pageNumber), locale);
  const breadcrumbItems: BreadcrumbItem[] =
    pageNumber > 1
      ? [
          { name: "Home", path: toLocalePath("/", locale) },
          {
            name: en ? "Articles" : "記事",
            path: toLocalePath("/blog", locale),
          },
          {
            name: en ? `Page ${pageNumber}` : `${pageNumber} ページ目`,
            path: pagePath,
          },
        ]
      : buildListBreadcrumbItems(locale, { name: "Blog", path: "/blog" });

  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack" data-pagefind-ignore="all">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              <I18nText locale={locale} ja="記事" en="Articles" />
            </h1>
          </div>
          <p className="page-count">
            {en ? `${totalCount} articles` : `全 ${totalCount} 件`}
            {pageCount > 1
              ? en
                ? ` · page ${pageNumber} of ${pageCount}`
                : ` · ${pageNumber} / ${pageCount} ページ`
              : null}
          </p>
        </header>

        {topics.length > 0 && (
          <nav
            className="topic-bar"
            aria-label={en ? "Browse by tag" : "タグから探す"}
          >
            <span className="topic-bar-label">
              <I18nText locale={locale} ja="テーマ" en="Topics" />
            </span>
            <ul>
              {topics.map((topic) => (
                <li key={topic.name}>
                  <a
                    href={toLocalePath(
                      `/tags/${encodeURIComponent(topic.name)}`,
                      locale
                    )}
                    className="topic-chip"
                  >
                    {topic.name}
                    <span className="topic-chip-count">{topic.count}</span>
                  </a>
                </li>
              ))}
            </ul>
            <a href={toLocalePath("/tags", locale)} className="arrow-link">
              <I18nText locale={locale} ja="すべてのタグ" en="All tags" />
              <span aria-hidden="true">→</span>
            </a>
          </nav>
        )}

        <PostIndex
          entries={toPostIndexEntries(posts, locale)}
          locale={locale}
        />

        <PaginationNav
          locale={locale}
          currentPage={pageNumber}
          pageCount={pageCount}
          hrefForPage={hrefForPage}
        />
      </main>
    </>
  );
}
