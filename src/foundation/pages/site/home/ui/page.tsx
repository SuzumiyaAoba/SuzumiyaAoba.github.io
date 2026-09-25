import { getBlogPostSummariesVariants, getBlogTagIndex } from "@/entities/blog";
import { getSeriesList } from "@/entities/series-item";
import { resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { HomePageContent } from "./page-content";

type PageProps = { locale?: Locale };

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const [posts, series, tagIndex] = await Promise.all([
    getBlogPostSummariesVariants(),
    getSeriesList(resolvedLocale),
    getBlogTagIndex(resolvedLocale),
  ]);
  const topics = ["Java", "Scala", "Nix", "AI", "関数型プログラミング"].flatMap(
    (name) => {
      const count = tagIndex.get(name)?.length ?? 0;
      return count > 0 ? [{ name, count }] : [];
    }
  );

  return (
    <HomePageContent
      locale={resolvedLocale}
      latestPosts={posts.slice(0, 6)}
      postCount={posts.length}
      keywordCount={201}
      series={series.filter((item) => item.posts.length > 0)}
      topics={topics}
    />
  );
}
