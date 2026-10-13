import {
  getBlogPostSummariesVariants,
  getBlogTagIndex,
  toPostIndexEntries,
} from "@/entities/blog";
import { getBookSlugs } from "@/entities/book";
import { getSeriesList } from "@/entities/series-item";
import { resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { HomePageContent } from "./page-content";

/** ホームに並べる新着記事の数（大きく見せる 1 本 + 見出しのみの 4 本） */
const LATEST_POST_COUNT = 5;

type PageProps = { locale?: Locale };

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const [posts, series, tagIndex, bookSlugs] = await Promise.all([
    getBlogPostSummariesVariants(),
    getSeriesList(resolvedLocale),
    getBlogTagIndex(resolvedLocale),
    getBookSlugs(),
  ]);
  const topics = ["Java", "Scala", "Nix", "AI", "関数型プログラミング"].flatMap(
    (name) => {
      const count = tagIndex.get(name)?.length ?? 0;
      return count > 0 ? [{ name, count }] : [];
    }
  );
  // 連載の目次に各回の題を出すため、記事のスラッグから表示言語の題を引けるようにする。
  const postTitles = Object.fromEntries(
    toPostIndexEntries(posts, resolvedLocale).map((entry) => [
      entry.slug,
      entry.title,
    ])
  );

  return (
    <HomePageContent
      locale={resolvedLocale}
      latestPosts={posts.slice(0, LATEST_POST_COUNT)}
      postCount={posts.length}
      keywordCount={201}
      bookCount={bookSlugs.length}
      series={series.filter((item) => item.posts.length > 0)}
      postTitles={postTitles}
      topics={topics}
    />
  );
}
