import fs from "node:fs/promises";
import path from "node:path";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type Post = {
  slug: string;
  content: string;
};

export async function getPostSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(postsDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  try {
    const content = await fs.readFile(fullPath, "utf8");
    return { slug, content };
  } catch {
    return null;
  }
}
