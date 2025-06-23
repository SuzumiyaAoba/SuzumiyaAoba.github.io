import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import config from "@/config";
import { getAllSeries, getSeriesPosts } from "@/libs/contents/series";
import { Tag } from "@/components/Tag";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// カスタムSVGアイコン
const BookIcon = ({ size = 24, ...props }: { size?: number; [key: string]: any }) => (
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

const CalendarIcon = ({ size = 14, ...props }: { size?: number; [key: string]: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

type Props = {
  params: Promise<{ series: string }>;
};

export async function generateStaticParams() {
  const allSeries = await getAllSeries();
  return Object.keys(allSeries).map((seriesName) => ({
    series: encodeURIComponent(seriesName),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series } = await params;
  const seriesName = decodeURIComponent(series);
  
  return {
    title: `${seriesName} シリーズ | ${config.metadata.title}`,
    description: `${seriesName} シリーズの記事一覧`,
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { series } = await params;
  const seriesName = decodeURIComponent(series);
  const seriesPosts = await getSeriesPosts(seriesName);

  if (seriesPosts.length === 0) {
    notFound();
  }

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookIcon 
            size={24} 
            style={{ color: "var(--accent-primary)" }} 
          />
          <h1 
            className="text-3xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {seriesName}
          </h1>
        </div>
        
        <div 
          className="flex items-center gap-2"
          style={{ color: "var(--muted)" }}
        >
          <span>{seriesPosts.length} 記事</span>
        </div>
      </div>

      <div className="space-y-6">
        {seriesPosts.map((post, index) => (
          <article 
            key={post.slug} 
            className="border rounded-lg p-6"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="flex-shrink-0 w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: "var(--accent-primary)" }}
              >
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">
                  <Link
                    href={`/blog/post/${post.slug}`}
                    className="hover:underline transition-colors duration-200"
                    style={{ 
                      color: "var(--foreground)",
                      textDecorationColor: "var(--accent-primary)"
                    }}
                  >
                    {post.frontmatter.title}
                  </Link>
                </h2>

                <div 
                  className="flex items-center gap-4 mb-3 text-sm"
                  style={{ color: "var(--muted)" }}
                >
                  <div className="flex items-center gap-1">
                    <CalendarIcon size={14} style={{ color: "currentColor" }} />
                    <span>
                      {format(new Date(post.frontmatter.date), "yyyy年M月d日", { locale: ja })}
                    </span>
                  </div>
                </div>

                {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    {post.frontmatter.tags.map((tag) => (
                      <Tag
                        key={tag}
                        label={tag}
                        href={`/tags/${encodeURIComponent(tag)}/`}
                      />
                    ))}
                  </div>
                )}

                {post.frontmatter.description && (
                  <p 
                    className="mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    {post.frontmatter.description}
                  </p>
                )}

                <Link
                  href={`/blog/post/${post.slug}`}
                  className="inline-flex items-center hover:underline text-sm transition-colors duration-200"
                  style={{ color: "var(--accent-primary)" }}
                >
                  記事を読む →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/series"
          className="hover:underline transition-colors duration-200"
          style={{ color: "var(--accent-primary)" }}
        >
          ← すべてのシリーズを見る
        </Link>
      </div>
    </main>
  );
} 