import matter from "gray-matter";
import { cache } from "react";

import { resolveContentRoot } from "@/shared/lib/content-root";

export type NoteFrontmatter = {
  title: string;
  date?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  draft?: boolean;
  amazonAssociate?: boolean;
  amazonProductIds?: string[];
  model?: string;
};

export type Note = {
  slug: string;
  content: string;
  format: "md" | "mdx";
  frontmatter: NoteFrontmatter;
};

export type NoteSummary = {
  slug: string;
  frontmatter: NoteFrontmatter;
};

export type NoteLocale = "ja" | "en";

type ReadContentOptions = {
  locale?: NoteLocale;
  fallback?: boolean;
};

async function readContentFileForLocale(
  slug: string,
  locale: NoteLocale,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const baseDir = path.join(root, "notes", slug);

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

export const getNoteSlugs = cache(async (): Promise<string[]> => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const notesRoot = path.join(root, "notes");

  try {
    const entries = await fs.readdir(notesRoot, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
});

export const getNote = cache(
  async (slug: string, options?: ReadContentOptions): Promise<Note | null> => {
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
  },
);

export const getNoteSummary = cache(
  async (slug: string, options?: ReadContentOptions): Promise<NoteSummary | null> => {
    const file = await readContentFile(slug, options);
    if (!file) {
      return null;
    }

    const { data } = matter(file.raw);
    const frontmatter = normalizeFrontmatter(data);

    return {
      slug,
      frontmatter,
    };
  },
);

function normalizeFrontmatter(data: Record<string, unknown>): NoteFrontmatter {
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
    ...(date ? { date } : {}),
    ...(typeof data["category"] === "string" ? { category: data["category"] } : {}),
    ...(Array.isArray(data["tags"])
      ? { tags: data["tags"].filter((tag): tag is string => typeof tag === "string") }
      : {}),
    ...(typeof data["thumbnail"] === "string" ? { thumbnail: data["thumbnail"] } : {}),
    ...(typeof data["draft"] === "boolean" ? { draft: data["draft"] } : {}),
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

export type LocalizedNote = {
  slug: string;
  ja: Note | null;
  en: Note | null;
};

export type LocalizedNoteSummary = {
  slug: string;
  ja: NoteSummary | null;
  en: NoteSummary | null;
};

function compareLocalizedNotes(
  a: LocalizedNote | LocalizedNoteSummary,
  b: LocalizedNote | LocalizedNoteSummary,
) {
  const dateA = (a.ja ?? a.en)?.frontmatter.date ?? "";
  const dateB = (b.ja ?? b.en)?.frontmatter.date ?? "";

  if (dateA && dateB && dateA !== dateB) {
    return dateA < dateB ? 1 : -1;
  }
  if (dateA) {
    return -1;
  }
  if (dateB) {
    return 1;
  }

  return a.slug.localeCompare(b.slug);
}

export const getNoteVariants = cache(async (slug: string): Promise<LocalizedNote> => {
  const [ja, en] = await Promise.all([
    getNote(slug, { locale: "ja", fallback: false }),
    getNote(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
});

export const getNotes = cache(async (): Promise<Note[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNote(slug)));

  return notes
    .filter((note): note is Note => Boolean(note))
    .filter((note) => !note.frontmatter.draft)
    .sort((a, b) =>
      compareLocalizedNotes({ slug: a.slug, ja: a, en: null }, { slug: b.slug, ja: b, en: null }),
    );
});

export const getNotesVariants = cache(async (): Promise<LocalizedNote[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNoteVariants(slug)));

  return notes
    .filter((note) => {
      const reference = note.ja ?? note.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort(compareLocalizedNotes);
});

export const getNoteSummaryVariants = cache(async (slug: string): Promise<LocalizedNoteSummary> => {
  const [ja, en] = await Promise.all([
    getNoteSummary(slug, { locale: "ja", fallback: false }),
    getNoteSummary(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
});

export const getNoteSummariesVariants = cache(async (): Promise<LocalizedNoteSummary[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNoteSummaryVariants(slug)));

  return notes
    .filter((note) => {
      const reference = note.ja ?? note.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort(compareLocalizedNotes);
});
