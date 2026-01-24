export async function getPostSlugs(): Promise<string[]> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const postsDirectory = path.join(process.cwd(), "content", "posts");

  try {
    const entries = await fs.readdir(postsDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}
