import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

export type PaginationNavProps = {
  locale: Locale;
  currentPage: number;
  pageCount: number;
  /** ロケール非依存のパスを返す(例: page===1 なら "/blog"、それ以外は "/blog/2") */
  hrefForPage: (page: number) => string;
  /** 前後ページへのリンクも表示するかどうか */
  showPrevNext?: boolean;
};

export function PaginationNav({
  locale,
  currentPage,
  pageCount,
  hrefForPage,
  showPrevNext = false,
}: PaginationNavProps) {
  const resolvedHref = (page: number) => toLocalePath(hrefForPage(page), locale);

  const pageLinks = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {Array.from({ length: pageCount }, (_, index) => {
        const page = index + 1;
        const isActive = page === currentPage;
        return (
          <a
            key={page}
            href={resolvedHref(page)}
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
  );

  if (!showPrevNext) {
    return (
      <nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        {pageLinks}
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
      {currentPage > 1 ? (
        <a
          href={resolvedHref(currentPage - 1)}
          className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
        >
          <I18nText locale={locale} ja="← 前のページ" en="← Previous page" />
        </a>
      ) : (
        <span className="w-[5.5rem]" />
      )}
      {pageLinks}
      {currentPage < pageCount ? (
        <a
          href={resolvedHref(currentPage + 1)}
          className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
        >
          <I18nText locale={locale} ja="次のページ →" en="Next page →" />
        </a>
      ) : (
        <span className="w-[5.5rem]" />
      )}
    </nav>
  );
}
