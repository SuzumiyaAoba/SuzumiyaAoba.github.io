import { Metadata } from "next";
import Link from "next/link";
import config from "@/config";
import { getAllSeries } from "@/libs/contents/series";
import { Book, FileText } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `シリーズ | ${config.metadata.title}`,
    description: "記事のシリーズ一覧",
  };
}

export default async function SeriesPage() {
  const allSeries = await getAllSeries();
  const seriesEntries = Object.entries(allSeries).sort((a, b) => 
    a[1].name.localeCompare(b[1].name)
  );

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl font-bold">シリーズ</h1>
      
      {seriesEntries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            まだシリーズはありません。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {seriesEntries.map(([seriesName, seriesInfo]) => (
            <div key={seriesName} className="border rounded-lg p-6 bg-white dark:bg-gray-800">
              <div className="flex items-start gap-4">
                <Book size={24} className="mt-1 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">
                    <Link
                      href={`/series/${encodeURIComponent(seriesName)}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                    >
                      {seriesName}
                    </Link>
                  </h2>
                  
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                    <FileText size={16} />
                    <span>{seriesInfo.totalPosts} 記事</span>
                  </div>

                  <div className="space-y-2">
                    {seriesInfo.posts.slice(0, 3).map((post, index) => (
                      <div key={post.slug} className="text-sm">
                        <Link
                          href={`/blog/post/${post.slug}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        >
                          {index + 1}. {post.frontmatter.title}
                        </Link>
                      </div>
                    ))}
                    {seriesInfo.posts.length > 3 && (
                      <div className="text-sm text-gray-500">
                        ... 他 {seriesInfo.posts.length - 3} 記事
                      </div>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
} 