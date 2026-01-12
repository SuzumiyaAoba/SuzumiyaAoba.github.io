import fs from "node:fs/promises";
import path from "node:path";

import { resolveContentRoot } from "@/shared/lib/content-root";

export type SeriesDefinition = {
  name: string;
  slug: string;
  description?: string;
  posts: string[];
};

async function readSeriesDefinitions(): Promise<SeriesDefinition[]> {
  const root = await resolveContentRoot();
  const seriesRoot = path.join(root, "series");

  try {
    const entries = await fs.readdir(seriesRoot, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

    const results = await Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(seriesRoot, entry.name);
        const raw = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(raw) as Record<string, unknown>;
        const name = typeof data["name"] === "string" ? data["name"] : "";
        const slug = typeof data["slug"] === "string" ? data["slug"] : "";
        const description =
          typeof data["description"] === "string" ? data["description"] : undefined;
        const posts = Array.isArray(data["posts"])
          ? data["posts"].filter((item): item is string => typeof item === "string")
          : [];

        if (!name || !slug) {
          return null;
        }

        return { name, slug, description, posts };
      }),
    );

    return results.filter((item) => item !== null) as SeriesDefinition[];
  } catch {
    return [];
  }
}

export async function getSeriesList(): Promise<SeriesDefinition[]> {
  const list = await readSeriesDefinitions();
  return list.sort((a, b) => a.name.localeCompare(b.name, "ja-JP"));
}

export async function getSeriesBySlug(slug: string): Promise<SeriesDefinition | null> {
  const list = await readSeriesDefinitions();
  return list.find((item) => item.slug === slug) ?? null;
}

export async function getSeriesSlugs(): Promise<string[]> {
  const list = await readSeriesDefinitions();
  return list.map((item) => item.slug);
}
