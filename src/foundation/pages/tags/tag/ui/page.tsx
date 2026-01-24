import { notFound } from "next/navigation";
import { getBlogPostsVariants, type BlogPost } from "@/entities/blog";
import { type Locale } from "@/shared/lib/routing";
import { TagDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ tag: string }>;
  locale?: Locale;
};

function normalizeTagParam(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { tag } = await params;
  const decodedTag = normalizeTagParam(tag);
  const posts = await getBlogPostsVariants();
  const postsJa = posts.map((post) => post.ja ?? post.en).filter(Boolean) as BlogPost[];
  const postsEn = posts.map((post) => post.en ?? post.ja).filter(Boolean) as BlogPost[];
  const entriesJa = postsJa
    .filter((post) => (post.frontmatter.tags ?? []).includes(decodedTag))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: (post.frontmatter.tags ?? []).filter((item) => item !== decodedTag),
      category: post.frontmatter.category,
      thumbnail: post.frontmatter.thumbnail,
    }));
  const entriesEn = postsEn
    .filter((post) => (post.frontmatter.tags ?? []).includes(decodedTag))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: (post.frontmatter.tags ?? []).filter((item) => item !== decodedTag),
      category: post.frontmatter.category,
      thumbnail: post.frontmatter.thumbnail,
    }));

  if (entriesJa.length === 0 && entriesEn.length === 0) {
    notFound();
  }
  const entries = resolvedLocale === "en" ? entriesEn : entriesJa;

  return <TagDetailPageContent locale={resolvedLocale} tag={decodedTag} entries={entries} />;
}
