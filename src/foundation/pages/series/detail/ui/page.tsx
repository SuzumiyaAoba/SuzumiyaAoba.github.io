import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/entities/series-item";
import { getBlogPost } from "@/entities/blog";
import { type Locale } from "@/shared/lib/routing";
import { SeriesDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ series: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug, resolvedLocale);

  if (!series) {
    notFound();
  }

  const [postsJa, postsEn] = await Promise.all([
    Promise.all(
      series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "ja", fallback: false })),
    ),
    Promise.all(
      series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "en", fallback: false })),
    ),
  ]);
  const entriesJa = postsJa
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));
  const entriesEn = postsEn
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));
  const entries = resolvedLocale === "en" ? entriesEn : entriesJa;

  return <SeriesDetailPageContent locale={resolvedLocale} series={series} entries={entries} />;
}
