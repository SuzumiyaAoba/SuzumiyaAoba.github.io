import Link from "next/link";
import { Book, ChevronLeft, ChevronRight } from "lucide-react";
import type { SeriesPost } from "@/libs/contents/series";

interface SeriesNavigationProps {
  seriesName: string;
  currentIndex: number;
  totalPosts: number;
  previous: SeriesPost | null;
  next: SeriesPost | null;
  className?: string;
}

export function SeriesNavigation({
  seriesName,
  currentIndex,
  totalPosts,
  previous,
  next,
  className = "",
}: SeriesNavigationProps) {
  return (
    <div className={`border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Book size={20} />
        <div className="text-lg font-semibold">シリーズ: {seriesName}</div>
      </div>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {currentIndex + 1} / {totalPosts} 記事
      </div>

      <div className="flex justify-between items-center">
        {previous ? (
          <Link
            href={`/blog/post/${previous.slug}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            <ChevronLeft size={16} />
            <span className="text-sm">前の記事: {previous.frontmatter.title}</span>
          </Link>
        ) : (
          <div className="text-sm text-gray-400">最初の記事です</div>
        )}

        {next ? (
          <Link
            href={`/blog/post/${next.slug}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
          >
            <span className="text-sm">次の記事: {next.frontmatter.title}</span>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <div className="text-sm text-gray-400">最後の記事です</div>
        )}
      </div>

      <div className="mt-4">
        <Link
          href={`/series/${encodeURIComponent(seriesName)}`}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
        >
          シリーズの全記事を見る →
        </Link>
      </div>
    </div>
  );
} 