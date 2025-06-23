import Link from "next/link";
import type { SeriesPost } from "@/libs/contents/series";

// カスタムSVGアイコン
const BookIcon = ({ size = 20, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ChevronLeftIcon = ({ size = 16, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

const ChevronRightIcon = ({ size = 16, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <polyline points="9,18 15,12 9,6" />
  </svg>
);

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
    <div 
      className={`border rounded-lg p-4 ${className}`}
      style={{
        backgroundColor: "var(--background-secondary)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <BookIcon size={20} style={{ color: "currentColor" }} />
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
            <ChevronLeftIcon size={16} style={{ color: "currentColor" }} />
            <span>前の記事: {previous.frontmatter.title}</span>
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
            <span>次の記事: {next.frontmatter.title}</span>
            <ChevronRightIcon size={16} style={{ color: "currentColor" }} />
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
          href={`/series/${encodeURIComponent(seriesName)}`}
          className="text-sm hover:underline transition-colors duration-200"
          style={{ color: "var(--accent-primary)" }}
        >
          シリーズの全記事を見る →
        </Link>
      </div>
    </div>
  );
} 