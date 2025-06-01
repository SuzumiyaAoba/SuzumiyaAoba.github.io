import Link from "next/link";
import { cn } from "@/libs/utils";

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  className?: string;
};

export const Pagination = ({
  currentPage,
  totalPages,
  basePath,
  className,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageHref = (page: number) => {
    if (page === 1) return `/${basePath}/`;
    return `/${basePath}/page/${page}/`;
  };

  const renderPageButton = (page: number, isCurrent: boolean = false) => (
    <Link
      key={page}
      href={getPageHref(page)}
      className={cn(
        "px-4 py-2 rounded transition-colors",
        isCurrent
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-gray-100 hover:bg-gray-200"
      )}
      aria-current={isCurrent ? "page" : undefined}
    >
      {page}
    </Link>
  );

  const renderNavigationButton = (
    page: number,
    label: string,
    condition: boolean
  ) => {
    if (!condition) return null;

    return (
      <Link
        href={getPageHref(page)}
        className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        {label}
      </Link>
    );
  };

  return (
    <div className={cn("flex gap-3 justify-center my-12", className)}>
      {/* 前へボタン */}
      {renderNavigationButton(currentPage - 1, "前へ", currentPage > 1)}

      {/* 最初のページ (1ページ目) */}
      {currentPage > 2 && renderPageButton(1)}

      {/* 現在のページ周辺のページ */}
      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((page) => {
          if (totalPages <= 5) return true;
          return Math.abs(page - currentPage) <= 1;
        })
        .map((page) => renderPageButton(page, page === currentPage))}

      {/* 最後のページ */}
      {currentPage < totalPages - 1 && renderPageButton(totalPages)}

      {/* 次へボタン */}
      {renderNavigationButton(
        currentPage + 1,
        "次へ",
        currentPage < totalPages
      )}
    </div>
  );
};
