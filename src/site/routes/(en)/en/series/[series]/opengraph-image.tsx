import { getSeriesBySlug, getSeriesSlugs } from "@/entities/series-item";
import { renderContentOpengraphImage } from "@/app/_shared/content-opengraph-image";

export { CONTENT_OPENGRAPH_IMAGE_SIZE as size } from "@/app/_shared/content-opengraph-image";

export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams(): Promise<{ series: string }[]> {
  const slugs = await getSeriesSlugs();
  return slugs.map((series) => ({ series }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug, "en");
  return await renderContentOpengraphImage({
    eyebrow: "Series",
    title: series?.name || slug,
  });
}
