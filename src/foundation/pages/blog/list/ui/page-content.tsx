import { SiteLayout } from "@/widgets/site-layout";
import { getPageCount } from "@/shared/lib/presentation";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { BlogListingContent } from "@/entities/blog";
import type { BlogListingContentProps } from "@/entities/blog";

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
    <SiteLayout locale={locale} path={pagePath}>
      <BlogListingContent
        locale={locale}
        posts={posts}
        pageNumber={currentPage}
        pageCount={getPageCount(totalCount)}
        totalCount={totalCount}
        variant="list"
      />
    </SiteLayout>
  );
}
