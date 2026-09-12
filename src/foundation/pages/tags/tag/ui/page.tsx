import { notFound } from "next/navigation";
import { getBlogTagIndex, type BlogPostSummary } from "@/entities/blog";
import { decodePathParam, resolveLocale, type Locale } from "@/shared/lib/routing";
import { TagDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ tag: string }>;
  locale?: Locale;
};

function buildTagEntries(posts: BlogPostSummary[], tag: string) {
  return posts.map((post) => ({
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
  const [indexJa, indexEn] = await Promise.all([getBlogTagIndex("ja"), getBlogTagIndex("en")]);
  const entriesJa = buildTagEntries(indexJa.get(decodedTag) ?? [], decodedTag);
  const entriesEn = buildTagEntries(indexEn.get(decodedTag) ?? [], decodedTag);

  if (entriesJa.length === 0 && entriesEn.length === 0) {
    notFound();
  }
  const entries = resolvedLocale === "en" ? entriesEn : entriesJa;

  return <TagDetailPageContent locale={resolvedLocale} tag={decodedTag} entries={entries} />;
}
