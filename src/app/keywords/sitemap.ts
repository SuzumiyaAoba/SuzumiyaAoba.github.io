import { MetadataRoute } from "next";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { getSortedPosts } from "@/libs/contents/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const keywordEntries = await getSortedPosts({
    paths: ["keywords"],
    schema: keywordFrontmatterSchema,
  });

  return keywordEntries
    .filter((entry) => !entry.draft)
    .map((entry) => ({
      url: `https://suzumiyaaoba.com/keywords/${entry._path}/`,
      lastModified: entry.date,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    }));
}
