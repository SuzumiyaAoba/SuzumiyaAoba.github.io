import fs from "node:fs/promises";
import path from "node:path";

import { resolveContentRoot } from "@/shared/lib/content-root";
import type { Locale } from "@/shared/lib/locale-path";

export type SeriesDefinition = {
  name: string;
  slug: string;
  description?: string;
  posts: string[];
};

type SeriesDefinitionRaw = SeriesDefinition & {
  nameEn?: string;
  descriptionEn?: string;
};

function resolveSeriesDefinition(
  definition: SeriesDefinitionRaw,
  locale: Locale,
): SeriesDefinition {
  if (locale === "en") {
    const description = definition.descriptionEn ?? definition.description;
    return {
      name: definition.nameEn ?? definition.name,
      slug: definition.slug,
      posts: definition.posts,
      ...(description !== undefined ? { description } : {}),
    };
  }

  return {
    name: definition.name,
    slug: definition.slug,
    posts: definition.posts,
    ...(definition.description !== undefined ? { description: definition.description } : {}),
  };
}

async function readSeriesDefinitions(): Promise<SeriesDefinitionRaw[]> {
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
        const nameEn = typeof data["nameEn"] === "string" ? data["nameEn"] : undefined;
        const slug = typeof data["slug"] === "string" ? data["slug"] : "";
        const description =
          typeof data["description"] === "string" ? data["description"] : undefined;
        const descriptionEn =
          typeof data["descriptionEn"] === "string" ? data["descriptionEn"] : undefined;
        const posts = Array.isArray(data["posts"])
          ? data["posts"].filter((item): item is string => typeof item === "string")
          : [];

        if (!name || !slug) {
          return null;
        }

        return { name, nameEn, slug, description, descriptionEn, posts };
      }),
    );

    return results.filter((item) => item !== null) as SeriesDefinitionRaw[];
  } catch {
    return [];
  }
}

export async function getSeriesList(locale: Locale = "ja"): Promise<SeriesDefinition[]> {
  const list = await readSeriesDefinitions();
  const resolved = list.map((definition) => resolveSeriesDefinition(definition, locale));
  return resolved.sort((a, b) => a.name.localeCompare(b.name, locale === "en" ? "en-US" : "ja-JP"));
}

export async function getSeriesBySlug(
  slug: string,
  locale: Locale = "ja",
): Promise<SeriesDefinition | null> {
  const list = await readSeriesDefinitions();
  const matched = list.find((item) => item.slug === slug);
  return matched ? resolveSeriesDefinition(matched, locale) : null;
}

export async function getSeriesSlugs(): Promise<string[]> {
  const list = await readSeriesDefinitions();
  return list.map((item) => item.slug);
}
