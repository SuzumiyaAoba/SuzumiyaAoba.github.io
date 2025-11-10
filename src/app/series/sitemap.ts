import { MetadataRoute } from "next";
import { getAllSeries } from "@/libs/contents/series";
import config from "@/config";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allSeries = await getAllSeries();
  const seriesEntries = Object.entries(allSeries);

  const seriesSitemaps: MetadataRoute.Sitemap = seriesEntries.map(
    ([, seriesInfo]) => ({
      url: `${config.metadata.url}/series/${seriesInfo.slug}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  return [
    {
      url: `${config.metadata.url}/series/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...seriesSitemaps,
  ];
}
