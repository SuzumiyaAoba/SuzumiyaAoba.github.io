import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";

/**
 * ブログ記事一覧ページの表示用コンポーネントのプロパティ
 */
export type BlogListPageContentProps = {
  /** 描画ロケール */
  locale: Locale;
  /** 表示する記事のリスト */
  posts: React.ComponentProps<typeof BlogPostList>["posts"];
  /** 全記事数 */
  totalCount: number;
  /** 現在のページ番号 */
  currentPage: number;
};

/**
 * ブログ記事一覧ページの表示内容を構成するコンポーネント。
 */
export function BlogListPageContent({
  locale,
  posts,
  totalCount,
  currentPage,
}: BlogListPageContentProps) {
  const pagePath = toLocalePath("/blog", locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Blog", path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ブログ" en="Blog" />
          </h1>
        </section>

        <BlogPostList posts={posts} locale={locale} variant="detailed" showThumbnail />

        {totalCount > 10 ? (
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {Array.from({ length: Math.ceil(totalCount / 10) }, (_, index) => {
              const page = index + 1;
              const href = page === 1 ? "/blog" : `/blog/${page}`;
              const isActive = page === currentPage;
              return (
                <a
                  key={page}
                  href={toLocalePath(href, locale)}
                  className={
                    isActive
                      ? "rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                      : "rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {page}
                </a>
              );
            })}
          </nav>
        ) : null}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
