import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import config from "@/config";
import { getAllSeries, getSeriesPosts } from "@/libs/contents/series";
import { Tag } from "@/components/Tag";
import { Book, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
          <Book size={24} className="text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">{seriesName}</h1>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>{seriesPosts.length} 記事</span>
        </div>
      </div>

      <div className="space-y-6">
        {seriesPosts.map((post, index) => (
          <article key={post.slug} className="border rounded-lg p-6 bg-white dark:bg-gray-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-400 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">
                  <Link
                    href={`/blog/post/${post.slug}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {post.frontmatter.title}
                  </Link>
                </h2>

                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
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
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {post.frontmatter.description}
                  </p>
                )}

                <Link
                  href={`/blog/post/${post.slug}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline text-sm"
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
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
        >
          ← すべてのシリーズを見る
        </Link>
      </div>
    </main>
  );
} 