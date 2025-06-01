import { MetadataRoute } from "next";
import { frontmatterSchema } from "@/libs/contents/notes";
import { getSortedPosts } from "@/libs/contents/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noteEntries = await getSortedPosts({
    paths: ["notes"],
    parser: {
      frontmatter: frontmatterSchema,
    },
  });

  return noteEntries
    .filter((entry) => !entry.frontmatter.draft)
    .map((entry) => ({
      url: `https://suzumiyaaoba.com/notes/${entry.path}/`,
      lastModified: entry.frontmatter.date,
      priority: 0.7,
      changeFrequency: "monthly" as const,
    }));
}
