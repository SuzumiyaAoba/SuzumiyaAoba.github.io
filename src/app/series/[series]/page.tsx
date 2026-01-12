import type { Metadata } from "next";
import { getSeriesBySlug } from "@/entities/series-item";

type PageProps = {
  params?: { series?: string } | Promise<{ series?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.series;
  if (!slug) {
    return { title: "Series" };
  }
  const series = await getSeriesBySlug(slug);
  const title = series?.name || slug;
  return { title };
}

export { default } from "@/pages/series/detail";
