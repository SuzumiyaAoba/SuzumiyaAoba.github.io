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
          : "bg-gray-100 hover:bg-gray-200",
      )}
      aria-current={isCurrent ? "page" : undefined}
    >
      {page}
    </Link>
  );

  const renderNavigationButton = (
    page: number,
    label: string,
    condition: boolean,
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

      {/* ページ番号の表示ロジック */}
      {(() => {
        const pages: (number | string)[] = [];

        // 総ページ数が5以下の場合はすべて表示
        if (totalPages <= 5) {
          for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          // 常に1ページ目を表示
          pages.push(1);

          // 現在のページが1-3の場合
          if (currentPage <= 3) {
            pages.push(2, 3, 4);
            pages.push("...");
            pages.push(totalPages);
          }
          // 現在のページが最後から3ページ以内の場合
          else if (currentPage >= totalPages - 2) {
            pages.push("...");
            pages.push(
              totalPages - 3,
              totalPages - 2,
              totalPages - 1,
              totalPages,
            );
          }
          // それ以外（中間のページ）の場合
          else {
            pages.push("...");
            pages.push(currentPage - 1, currentPage, currentPage + 1);
            pages.push("...");
            pages.push(totalPages);
          }
        }

        return pages.map((page, index) => {
          if (typeof page === "string") {
            return (
              <span key={`ellipsis-${index}`} className="px-2">
                {page}
              </span>
            );
          }
          return renderPageButton(page, page === currentPage);
        });
      })()}

      {/* 次へボタン */}
      {renderNavigationButton(
        currentPage + 1,
        "次へ",
        currentPage < totalPages,
      )}
    </div>
  );
};
