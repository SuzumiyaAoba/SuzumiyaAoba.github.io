export async function getPostSlugs(): Promise<string[]> {
  const fsPromise = import("node:fs/promises");
  const { default: path } = await import("node:path");
  const fs = await fsPromise;
  const postsDirectory = path.join(process.cwd(), "content", "posts");

  try {
    const entries = await fs.readdir(postsDirectory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/u, ""));
  } catch {
    return [];
  }
}
