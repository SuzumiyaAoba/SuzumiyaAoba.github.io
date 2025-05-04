import { getPaths } from "@/libs/contents/markdown";
import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noteIds = await getPaths("keywords");

  return noteIds.map((id) => ({
    url: `https://suzumiyaaoba.com/keywords/${id}/`,
    lastModified: new Date(),
    priority: 1,
  }));
}
