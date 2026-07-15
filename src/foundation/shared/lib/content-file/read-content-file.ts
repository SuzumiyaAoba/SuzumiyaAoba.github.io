import { cache } from "react";
import { resolveContentRoot } from "./content-root";

export type ContentLocale = "ja" | "en";
export type ContentFormat = "md" | "mdx";
export type ContentFile = { raw: string; format: ContentFormat };
export type ReadContentOptions = { locale?: ContentLocale; fallback?: boolean };

/**
 * `content/<collectionDir>/<slug>` 配下のファイル一覧をキャッシュ付きで取得する関数を作る。
 * try/catch で逐次ファイルを試すより readdir 1回で済む。
 */
export function createArticleFileLister(
  collectionDir: string,
): (slug: string) => Promise<Set<string>> {
  return cache(async (slug: string): Promise<Set<string>> => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = await resolveContentRoot();
    const dir = path.join(root, collectionDir, slug);
    try {
      const entries = await fs.readdir(dir);
      return new Set(entries);
    } catch {
      return new Set();
    }
  });
}

/**
 * 特定のロケールのコンテンツファイルを読み込む。
 * @returns ファイルの内容とフォーマット。存在しない場合は null
 */
export async function readLocaleContentFile(
  collectionDir: string,
  slug: string,
  locale: ContentLocale,
  listFiles: (slug: string) => Promise<Set<string>>,
): Promise<ContentFile | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const baseDir = path.join(root, collectionDir, slug);
  const baseName = locale === "en" ? "index.en" : "index";

  const files = await listFiles(slug);

  const mdFile = `${baseName}.md`;
  const mdxFile = `${baseName}.mdx`;

  if (files.has(mdFile)) {
    const raw = await fs.readFile(path.join(baseDir, mdFile), "utf8");
    return { raw, format: "md" };
  }
  if (files.has(mdxFile)) {
    const raw = await fs.readFile(path.join(baseDir, mdxFile), "utf8");
    return { raw, format: "mdx" };
  }
  return null;
}

/**
 * フォールバック込みでコンテンツファイルを読み込む。
 * locale を優先し、存在しなければ(fallback が true の場合)もう一方の言語を試す。
 */
export async function readContentFileWithFallback(
  collectionDir: string,
  slug: string,
  listFiles: (slug: string) => Promise<Set<string>>,
  options?: ReadContentOptions,
): Promise<ContentFile | null> {
  const locale = options?.locale ?? "ja";
  const fallback = options?.fallback ?? true;

  const file = await readLocaleContentFile(collectionDir, slug, locale, listFiles);
  if (file) {
    return file;
  }

  if (!fallback || locale === "ja") {
    if (!fallback) {
      return null;
    }
    return readLocaleContentFile(collectionDir, slug, "en", listFiles);
  }

  return readLocaleContentFile(collectionDir, slug, "ja", listFiles);
}
