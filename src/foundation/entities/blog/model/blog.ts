import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import { resolveContentRoot } from "@/shared/lib/content-root";

export type BlogFrontmatter = {
  title: string;
  date: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  draft?: boolean;
  layout?: string;
  amazonAssociate?: boolean;
  amazonProductIds?: string[];
};

export type BlogPost = {
  slug: string;
  content: string;
  format: "md" | "mdx";
  frontmatter: BlogFrontmatter;
};

async function readContentFile(
  slug: string,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const root = await resolveContentRoot();
  const baseDir = path.join(root, "blog", slug);

  const mdPath = path.join(baseDir, "index.md");
  const mdxPath = path.join(baseDir, "index.mdx");

  try {
    const raw = await fs.readFile(mdPath, "utf8");
    return { raw, format: "md" };
  } catch {
    try {
      const raw = await fs.readFile(mdxPath, "utf8");
      return { raw, format: "mdx" };
    } catch {
      return null;
    }
  }
}

export async function getBlogSlugs(): Promise<string[]> {
  const root = await resolveContentRoot();
  const blogRoot = path.join(root, "blog");
  const entries = await fs.readdir(blogRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const file = await readContentFile(slug);
  if (!file) {
    return null;
  }

  const { content, data } = matter(file.raw);
  const frontmatter = normalizeFrontmatter(data);

  return {
    slug,
    content,
    format: file.format,
    frontmatter,
  };
}

function normalizeFrontmatter(data: Record<string, unknown>): BlogFrontmatter {
  const title = typeof data["title"] === "string" ? data["title"] : "";
  const dateValue = data["date"];
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : typeof dateValue === "string"
        ? dateValue
        : "";

  return {
    title,
    date,
    ...(typeof data["category"] === "string" ? { category: data["category"] } : {}),
    ...(Array.isArray(data["tags"])
      ? { tags: data["tags"].filter((tag): tag is string => typeof tag === "string") }
      : {}),
    ...(typeof data["thumbnail"] === "string" ? { thumbnail: data["thumbnail"] } : {}),
    ...(typeof data["draft"] === "boolean" ? { draft: data["draft"] } : {}),
    ...(typeof data["layout"] === "string" ? { layout: data["layout"] } : {}),
    ...(typeof data["amazonAssociate"] === "boolean"
      ? { amazonAssociate: data["amazonAssociate"] }
      : {}),
    ...(Array.isArray(data["amazonProductIds"])
      ? {
          amazonProductIds: data["amazonProductIds"].filter(
            (item): item is string => typeof item === "string",
          ),
        }
      : {}),
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPost(slug)));
  return posts
    .filter((post): post is BlogPost => Boolean(post))
    .filter((post) => !post.frontmatter.draft)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
}
