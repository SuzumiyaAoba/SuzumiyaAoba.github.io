import fs from "node:fs/promises";
import path from "node:path";

const fallbackContentRoot = path.join(
  process.cwd(),
  "..",
  "SuzumiyaAoba.github.io",
  "src",
  "contents",
);
const contentRoot = path.join(process.cwd(), "content");

export async function resolveContentRoot(): Promise<string> {
  try {
    await fs.access(contentRoot);
    return contentRoot;
  } catch {
    return fallbackContentRoot;
  }
}


