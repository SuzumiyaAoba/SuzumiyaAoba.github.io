import { MetadataRoute } from "next";
import { frontmatterSchema } from "@/libs/contents/notes";
import { getSortedPosts } from "@/libs/contents/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noteEntries = await getSortedPosts({
    paths: ["notes"],
    schema: frontmatterSchema,
  });

  return noteEntries
    .filter((entry) => !entry.draft)
    .map((entry) => ({
      url: `https://suzumiyaaoba.com/notes/${entry._path}/`,
      lastModified: entry.date,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    }));
}
