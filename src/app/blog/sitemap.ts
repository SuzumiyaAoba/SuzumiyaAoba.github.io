import { MetadataRoute } from "next";
import { Pages } from "@/libs/contents/blog";
import { getSortedPosts } from "@/libs/contents/utils";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogEntries = await getSortedPosts({
    paths: [Pages.blog.root],
    parser: {
      frontmatter: Pages.blog.frontmatter,
    },
  });

  return blogEntries
    .filter((entry) => !entry.frontmatter.draft)
    .map((entry) => ({
      url: `https://suzumiyaaoba.com/blog/post/${entry.path}/`,
      lastModified: entry.frontmatter.date,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    }));
}
