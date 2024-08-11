import { MetadataRoute } from "next";
import * as blog from "@/libs/blog";

export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const posts = await blog.getAll();

  return posts.map((post) => ({
    url: `https://suzumiyaaoba.github.io/blog/${post?.slug}`,
    lastModified: new Date(),
    priority: 1,
  }));
}
