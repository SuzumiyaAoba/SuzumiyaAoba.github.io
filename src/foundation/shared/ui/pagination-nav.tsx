import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type PaginationNavProps = {
  locale: Locale;
  currentPage: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  /** 「前へ・次へ」のリンクを表示するかどうか */
  showPrevNext?: boolean;
};

/**
 * ページ送り。前後のリンクとページ番号を 1 行にまとめる。
 * ページ数が多いときは先頭・末尾・現在地の周辺だけを表示する。
 */
export function PaginationNav({
  locale,
  currentPage,
  pageCount,
  hrefForPage,
  showPrevNext = true,
}: PaginationNavProps) {
  if (pageCount <= 1) {
    return null;
  }

  const en = locale === "en";
  const resolvedHref = (page: number) =>
    toLocalePath(hrefForPage(page), locale);
  const visiblePages = Array.from(
    { length: pageCount },
    (_, index) => index + 1
  ).filter(
    (page) =>
      page === 1 ||
      page === pageCount ||
      Math.abs(page - currentPage) <= 1 ||
      (currentPage <= 3 && page <= 5) ||
      (currentPage >= pageCount - 2 && page >= pageCount - 4)
  );
  const prevLabel = en ? "← Previous" : "← 前へ";
  const nextLabel = en ? "Next →" : "次へ →";

  return (
    <nav aria-label={en ? "Pagination" : "ページ送り"} className="pagination">
      {showPrevNext ? (
        currentPage > 1 ? (
          <a
            href={resolvedHref(currentPage - 1)}
            rel="prev"
            className="pagination-step"
          >
            {prevLabel}
          </a>
        ) : (
          <span aria-disabled="true" className="pagination-step">
            {prevLabel}
          </span>
        )
      ) : null}
      <ol className="pagination-pages">
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          return (
            <li key={page}>
              {previousPage !== undefined && page - previousPage > 1 && (
                <span aria-hidden="true" className="pagination-gap">
                  …
                </span>
              )}
              <a
                href={resolvedHref(page)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={en ? `Page ${page}` : `${page} ページ目`}
                className="pagination-page"
              >
                {page}
              </a>
            </li>
          );
        })}
      </ol>
      {showPrevNext ? (
        currentPage < pageCount ? (
          <a
            href={resolvedHref(currentPage + 1)}
            rel="next"
            className="pagination-step"
          >
            {nextLabel}
          </a>
        ) : (
          <span aria-disabled="true" className="pagination-step">
            {nextLabel}
          </span>
        )
      ) : null}
    </nav>
  );
}
