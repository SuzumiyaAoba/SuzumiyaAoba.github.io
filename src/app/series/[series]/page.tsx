import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@iconify/react";
import config from "@/config";
import { getAllSeries, getSeriesPosts } from "@/libs/contents/series";
import { Tag } from "@/components/Tag";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type Props = {
  params: Promise<{ series: string }>;
};

export async function generateStaticParams() {
  const allSeries = await getAllSeries();
  return Object.keys(allSeries).map((seriesName) => ({
    series: seriesName,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series } = await params;

  return {
    title: `${series} シリーズ | ${config.metadata.title}`,
    description: `${series} シリーズの記事一覧`,
  };
}

export default async function SeriesDetailPage({ params }: Props) {
  const { series } = await params;
  const seriesPosts = await getSeriesPosts(series);

  if (seriesPosts.length === 0) {
    notFound();
  }

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon
            icon="lucide:book-open"
            width={24}
            height={24}
            style={{ color: "var(--accent-primary)" }}
          />
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {series}
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
                    <Icon icon="lucide:calendar" width={14} height={14} style={{ color: "currentColor" }} />
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
          href="/series/"
          className="hover:underline transition-colors duration-200"
          style={{ color: "var(--accent-primary)" }}
        >
          ← すべてのシリーズを見る
        </Link>
      </div>
    </main>
  );
} 