import type { Metadata } from "next";
import { getSeriesBySlug, getSeriesSlugs } from "@/entities/series-item";

type PageProps = {
  params: Promise<{ series?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.series;
  if (!slug) {
    return { title: "Series" };
  }
  const series = await getSeriesBySlug(slug);
  const title = series?.name || slug;
  return { title };
}

export async function generateStaticParams(): Promise<Array<{ series: string }>> {
  const slugs = await getSeriesSlugs();
  return slugs.map((series) => ({ series }));
}

export { default } from "@/pages/series/detail";
