import { getBlogTagIndex } from "@/entities/blog";
import { resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { TagsListPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const index = await getBlogTagIndex(resolvedLocale);
  const tags = Array.from(index, ([name, posts]) => ({
    name,
    count: posts.length,
  })).toSorted(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, resolvedLocale)
  );

  return <TagsListPageContent locale={resolvedLocale} tags={tags} />;
}
