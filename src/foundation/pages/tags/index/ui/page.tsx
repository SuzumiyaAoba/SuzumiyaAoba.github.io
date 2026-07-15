import { getBlogPostSummariesVariants, type BlogPostSummary } from "@/entities/blog";
import { resolveLocale, type Locale } from "@/shared/lib/routing";
import { TagsListPageContent, type TagEntry } from "./page-content";

function buildTagList(posts: BlogPostSummary[], locale: Locale): TagEntry[] {
  const tagMap = new Map<string, TagEntry>();

  for (const post of posts) {
    const tags = post.frontmatter.tags ?? [];
    for (const tag of tags) {
      tagMap.set(tag, {
        name: tag,
        count: (tagMap.get(tag)?.count ?? 0) + 1,
      });
    }
  }

  return [...tagMap.values()].sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, locale === "ja" ? "ja" : "en");
  });
}

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const posts = await getBlogPostSummariesVariants();
  const postsJa = posts.map((post) => post.ja ?? post.en).filter(Boolean) as BlogPostSummary[];
  const postsEn = posts.map((post) => post.en ?? post.ja).filter(Boolean) as BlogPostSummary[];
  const tagsJa = buildTagList(postsJa, "ja");
  const tagsEn = buildTagList(postsEn, "en");
  const tags = resolvedLocale === "en" ? tagsEn : tagsJa;

  return <TagsListPageContent locale={resolvedLocale} tags={tags} />;
}
