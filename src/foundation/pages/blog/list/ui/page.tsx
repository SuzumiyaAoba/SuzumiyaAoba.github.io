import { getBlogPostSummariesVariants } from "@/entities/blog";
import { paginate } from "@/shared/lib/presentation";
import { type Locale } from "@/shared/lib/routing";
import { BlogListPageContent } from "./page-content";

/**
 * ブログ記事一覧ページのプロパティ
 */
type PageProps = {
  /** 描画ロケール */
  locale?: Locale;
};

/**
 * ブログ記事一覧ページを表示するサーバーサイドコンポーネント。
 */
export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const posts = await getBlogPostSummariesVariants();
  const pagePosts = paginate(posts, 1);

  return (
    <BlogListPageContent
      locale={resolvedLocale}
      posts={pagePosts}
      totalCount={posts.length}
      currentPage={1}
    />
  );
}
