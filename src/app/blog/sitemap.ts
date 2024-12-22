import { getPaths } from "@/libs/contents/markdown";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogIds = await getPaths("blog");

  return blogIds.map((id) => ({
    url: `https://suzumiyaaoba.github.io/blog/${id}`,
    lastModified: new Date(),
    priority: 1,
  }));
}
