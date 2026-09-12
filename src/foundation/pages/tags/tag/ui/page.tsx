import { notFound } from "next/navigation";
import { getBlogPostSummariesVariants, type BlogPostSummary } from "@/entities/blog";
import {
  decodePathParam,
  resolveLocale,
  type Locale,
  resolveLocalizedValue,
} from "@/shared/lib/routing";
import { TagDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ tag: string }>;
  locale?: Locale;
};

function buildTagEntries(posts: BlogPostSummary[], tag: string) {
  return posts
    .filter((post) => (post.frontmatter.tags ?? []).includes(tag))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: (post.frontmatter.tags ?? []).filter((item) => item !== tag),
      category: post.frontmatter.category,
      thumbnail: post.frontmatter.thumbnail,
    }));
}

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const { tag } = await params;
  const decodedTag = decodePathParam(tag);
  const posts = await getBlogPostSummariesVariants();
  const entriesForLocale = (targetLocale: Locale) =>
    buildTagEntries(
      posts.flatMap((post) => resolveLocalizedValue(post, targetLocale) ?? []),
      decodedTag,
    );
  const entriesJa = entriesForLocale("ja");
  const entriesEn = entriesForLocale("en");

  if (entriesJa.length === 0 && entriesEn.length === 0) {
    notFound();
  }
  const entries = resolvedLocale === "en" ? entriesEn : entriesJa;

  return <TagDetailPageContent locale={resolvedLocale} tag={decodedTag} entries={entries} />;
}
