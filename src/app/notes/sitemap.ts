import { getFrontmatters } from "@/libs/contents/markdown";
import { MetadataRoute } from "next";
import { frontmatterSchema } from "@/libs/contents/notes";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const noteEntries = await getFrontmatters({
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
