import { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@iconify/react";
import config from "@/config";
import { getAllSeries } from "@/libs/contents/series";

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
      <h1 
        className="mb-8 text-3xl font-bold"
        style={{ color: "var(--foreground)" }}
      >
        シリーズ
      </h1>
      
      {seriesEntries.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "var(--muted)" }}>
            まだシリーズはありません。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {seriesEntries.map(([seriesName, seriesInfo]) => (
            <div 
              key={seriesName} 
              className="border rounded-lg p-6"
              style={{
                backgroundColor: "var(--background)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-start gap-4">
                <Icon 
                  icon="lucide:book-open"
                  width={24}
                  height={24}
                  className="mt-1" 
                  style={{ color: "var(--accent-primary)" }}
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">
                    <Link
                      href={`/series/${encodeURIComponent(seriesName)}`}
                      className="hover:underline transition-colors duration-200"
                      style={{ 
                        color: "var(--foreground)",
                        textDecorationColor: "var(--accent-primary)"
                      }}
                    >
                      {seriesName}
                    </Link>
                  </h2>
                  
                  <div 
                    className="flex items-center gap-2 mb-3 text-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    <Icon icon="lucide:file-text" width={16} height={16} style={{ color: "currentColor" }} />
                    <span>{seriesInfo.totalPosts} 記事</span>
                  </div>

                  <div className="space-y-2">
                    {seriesInfo.posts.slice(0, 3).map((post, index) => (
                      <div key={post.slug} className="text-sm">
                        <Link
                          href={`/blog/post/${post.slug}`}
                          className="hover:underline transition-colors duration-200"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          {index + 1}. {post.frontmatter.title}
                        </Link>
                      </div>
                    ))}
                    {seriesInfo.posts.length > 3 && (
                      <div 
                        className="text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        ... 他 {seriesInfo.posts.length - 3} 記事
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
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
} 