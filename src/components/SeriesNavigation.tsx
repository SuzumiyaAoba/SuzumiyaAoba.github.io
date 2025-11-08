import Link from "next/link";
import { Icon } from "@iconify/react";
import type { SeriesPost } from "@/libs/contents/series";

interface SeriesNavigationProps {
  seriesName: string;
  seriesSlug: string;
  currentIndex: number;
  totalPosts: number;
  previous: SeriesPost | null;
  next: SeriesPost | null;
  className?: string;
}

export function SeriesNavigation({
  seriesName,
  seriesSlug,
  currentIndex,
  totalPosts,
  previous,
  next,
  className = "",
}: SeriesNavigationProps) {
  return (
    <div 
      className={`border rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: "var(--background-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="lucide:book-open" width={20} height={20} style={{ color: "currentColor" }} />
        <div 
          className="text-lg font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          シリーズ: {seriesName}
        </div>
      </div>

      <div 
        className="mb-4 text-sm"
        style={{ color: "var(--muted)" }}
      >
        {currentIndex + 1} / {totalPosts} 記事
      </div>

      <div className="flex justify-between items-center">
        {previous ? (
          <Link
            href={`/blog/post/${previous.slug}`}
            className="flex items-center gap-2 text-sm hover:underline transition-colors duration-200"
            style={{ color: "var(--accent-primary)" }}
          >
            <Icon icon="lucide:chevron-left" width={16} height={16} style={{ color: "currentColor" }} />
            <span>前の記事: {previous.frontmatter.subtitle || previous.frontmatter.title}</span>
          </Link>
        ) : (
          <div
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            最初の記事です
          </div>
        )}

        {next ? (
          <Link
            href={`/blog/post/${next.slug}`}
            className="flex items-center gap-2 text-sm hover:underline transition-colors duration-200"
            style={{ color: "var(--accent-primary)" }}
          >
            <span>次の記事: {next.frontmatter.subtitle || next.frontmatter.title}</span>
            <Icon icon="lucide:chevron-right" width={16} height={16} style={{ color: "currentColor" }} />
          </Link>
        ) : (
          <div
            className="text-sm"
            style={{ color: "var(--muted)" }}
          >
            最後の記事です
          </div>
        )}
      </div>

      <div className="mt-4">
        <Link
          href={`/series/${seriesSlug}/`}
          className="text-sm hover:underline transition-colors duration-200"
          style={{ color: "var(--accent-primary)" }}
        >
          シリーズの全記事を見る →
        </Link>
      </div>
    </div>
  );
} 