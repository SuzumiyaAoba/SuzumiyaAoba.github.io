import { MetadataRoute } from "next";
import { getIds } from "@/libs/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogIds = await getIds("blog");

  return blogIds.map((id) => ({
    url: `https://suzumiyaaoba.github.io/blog/${id}`,
    lastModified: new Date(),
    priority: 1,
  }));
}
