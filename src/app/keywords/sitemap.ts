import { getFrontmatters } from "@/libs/contents/markdown";
import { MetadataRoute } from "next";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const keywordEntries = await getFrontmatters({
    paths: ["keywords"],
    parser: {
      frontmatter: keywordFrontmatterSchema,
    },
  });

  return keywordEntries
    .filter((entry) => !entry.frontmatter.draft)
    .map((entry) => ({
      url: `https://suzumiyaaoba.com/keywords/${entry.path}/`,
      lastModified: entry.frontmatter.date,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    }));
}
