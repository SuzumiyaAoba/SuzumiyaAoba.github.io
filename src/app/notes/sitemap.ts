import { getPaths } from "@/libs/contents/markdown";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noteIds = await getPaths("notes");

  return noteIds.map((id) => ({
    url: `https://suzumiyaaoba.com/notes/${id}/`,
    lastModified: new Date(),
    priority: 1,
  }));
}
