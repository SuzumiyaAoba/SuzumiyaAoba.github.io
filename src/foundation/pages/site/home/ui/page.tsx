import { getBlogPostSummariesVariants, getBlogTagIndex } from "@/entities/blog";
import { getNoteSummariesVariants } from "@/entities/note";
import { getSeriesList } from "@/entities/series-item";
import { resolveLocale, resolveLocalizedValue } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { HomePageContent } from "./page-content";

type PageProps = { locale?: Locale };

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const [posts, series, notes, tagIndex] = await Promise.all([
    getBlogPostSummariesVariants(),
    getSeriesList(resolvedLocale),
    getNoteSummariesVariants(),
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
      series={series.filter((item) => item.posts.length > 0)}
      notes={notes.flatMap((variant) => {
        const note = resolveLocalizedValue(variant, resolvedLocale);
        return note
          ? [
              {
                slug: variant.slug,
                title: note.frontmatter.title || variant.slug,
              },
            ]
          : [];
      })}
      topics={topics}
    />
  );
}
