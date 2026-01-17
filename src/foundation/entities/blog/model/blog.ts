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
  model?: string;
};

export type BlogPost = {
  slug: string;
  content: string;
  format: "md" | "mdx";
  frontmatter: BlogFrontmatter;
};

export type BlogLocale = "ja" | "en";

type ReadContentOptions = {
  locale?: BlogLocale;
  fallback?: boolean;
};

async function readContentFileForLocale(
  slug: string,
  locale: BlogLocale,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const root = await resolveContentRoot();
  const baseDir = path.join(root, "blog", slug);

  const baseName = locale === "en" ? "index.en" : "index";
  const mdPath = path.join(baseDir, `${baseName}.md`);
  const mdxPath = path.join(baseDir, `${baseName}.mdx`);

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

async function readContentFile(
  slug: string,
  options?: ReadContentOptions,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const locale = options?.locale ?? "ja";
  const fallback = options?.fallback ?? true;

  const file = await readContentFileForLocale(slug, locale);
  if (file) {
    return file;
  }

  if (!fallback || locale === "ja") {
    if (!fallback) {
      return null;
    }
    return readContentFileForLocale(slug, "en");
  }

  return readContentFileForLocale(slug, "ja");
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

export async function getBlogPost(
  slug: string,
  options?: ReadContentOptions,
): Promise<BlogPost | null> {
  const file = await readContentFile(slug, options);
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
    ...(typeof data["model"] === "string" ? { model: data["model"] } : {}),
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

export async function getAdjacentPosts(
  slug: string,
): Promise<{ prev: BlogPost | null; next: BlogPost | null }> {
  const posts = await getBlogPosts();
  const index = posts.findIndex((post) => post.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  // posts are sorted by date desc (newest first)
  // next is newer (index - 1), prev is older (index + 1)
  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}

export type LocalizedBlogPost = {
  slug: string;
  ja: BlogPost | null;
  en: BlogPost | null;
};

export async function getBlogPostVariants(slug: string): Promise<LocalizedBlogPost> {
  const [ja, en] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
}

export async function getBlogPostsVariants(): Promise<LocalizedBlogPost[]> {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPostVariants(slug)));

  return posts
    .filter((post) => {
      const reference = post.ja ?? post.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort((a, b) => {
      const dateA = (a.ja ?? a.en)?.frontmatter.date ?? "";
      const dateB = (b.ja ?? b.en)?.frontmatter.date ?? "";
      return dateA < dateB ? 1 : -1;
    });
}

export async function getAdjacentPostsVariants(
  slug: string,
): Promise<{ prev: LocalizedBlogPost | null; next: LocalizedBlogPost | null }> {
  const posts = await getBlogPostsVariants();
  const index = posts.findIndex((post) => post.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}
