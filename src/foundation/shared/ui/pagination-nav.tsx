import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";

export type PaginationNavProps = {
  locale: Locale;
  currentPage: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  showPrevNext?: boolean;
};

export function PaginationNav({
  locale,
  currentPage,
  pageCount,
  hrefForPage,
  showPrevNext = true,
}: PaginationNavProps) {
  if (pageCount <= 1) return null;

  const en = locale === "en";
  const resolvedHref = (page: number) => toLocalePath(hrefForPage(page), locale);
  const visiblePages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 ||
      page === pageCount ||
      Math.abs(page - currentPage) <= 1 ||
      (currentPage <= 3 && page <= 5) ||
      (currentPage >= pageCount - 2 && page >= pageCount - 4),
  );
  const controlClass =
    "inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted";

  return (
    <nav aria-label={en ? "Pagination" : "ページ送り"} className="space-y-4 pt-8">
      <ol className="flex flex-wrap items-center justify-center gap-1">
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          return (
            <li key={page} className="flex items-center gap-1">
              {previousPage !== undefined && page - previousPage > 1 && (
                <span aria-hidden="true" className="px-2 text-muted-foreground">
                  …
                </span>
              )}
              <a
                href={resolvedHref(page)}
                aria-current={page === currentPage ? "page" : undefined}
                aria-label={en ? `Page ${page}` : `ページ ${page}`}
                className={cn(
                  "inline-flex h-11 w-9 items-center justify-center rounded-full font-mono text-xs tabular-nums transition-colors sm:w-11",
                  page === currentPage
                    ? "bg-[var(--brand)] font-semibold text-[var(--brand-contrast)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {page}
              </a>
            </li>
          );
        })}
      </ol>
      {showPrevNext && (
        <div className="flex items-center justify-between gap-2">
          {currentPage > 1 ? (
            <a href={resolvedHref(currentPage - 1)} rel="prev" className={controlClass}>
              {en ? "← Previous" : "← 前のページ"}
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground/60"
            >
              {en ? "← Previous" : "← 前のページ"}
            </span>
          )}
          <span
            className="text-sm tabular-nums text-muted-foreground"
            aria-label={
              en
                ? `Page ${currentPage} of ${pageCount}`
                : `${pageCount} ページ中 ${currentPage} ページ`
            }
          >
            {currentPage} / {pageCount}
          </span>
          {currentPage < pageCount ? (
            <a href={resolvedHref(currentPage + 1)} rel="next" className={controlClass}>
              {en ? "Next →" : "次のページ →"}
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground/60"
            >
              {en ? "Next →" : "次のページ →"}
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
