import fs from "node:fs/promises";
import path from "node:path";

const postsDirectory = path.join(process.cwd(), "content", "posts");

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
