import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { getPageCount } from "@/shared/lib/presentation";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogListingContent, type BlogListingContentProps } from "@/entities/blog";

/**
 * ブログ記事一覧ページの表示用コンポーネントのプロパティ
 */
export type BlogListPageContentProps = {
  /** 描画ロケール */
  locale: Locale;
  /** 表示する記事のリスト */
  posts: BlogListingContentProps["posts"];
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
      <BlogListingContent
        locale={locale}
        posts={posts}
        pageNumber={currentPage}
        pageCount={getPageCount(totalCount)}
        totalCount={totalCount}
        variant="list"
      />
      <Footer locale={locale} />
    </div>
  );
}
