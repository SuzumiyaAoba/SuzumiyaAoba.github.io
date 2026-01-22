import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { resolveContentRoot } from "@/shared/lib/content-root";
import type { Locale } from "@/shared/lib/locale-path";

/**
 * シリーズ記事の定義（メタデータ）の型定義
 */
export type SeriesDefinition = {
  /** シリーズ名 */
  name: string;
  /** スラッグ */
  slug: string;
  /** サムネイル（オプション） */
  thumbnail?: string;
  /** 説明文（オプション） */
  description?: string;
  /** シリーズに含まれる記事のスラッグ配列 */
  posts: string[];
};

/**
 * 翻訳用データを含むシリーズ定義の Zod スキーマ
 */
const SeriesDefinitionRawSchema = z.object({
  /** シリーズ名 */
  name: z.string().min(1),
  /** 英語のシリーズ名 */
  nameEn: z.string().optional(),
  /** スラッグ */
  slug: z.string().min(1),
  /** 説明文（オプション） */
  description: z.string().optional(),
  /** 英語の説明文 */
  descriptionEn: z.string().optional(),
  /** サムネイル（オプション） */
  thumbnail: z.string().optional(),
  /** 英語のサムネイル */
  thumbnailEn: z.string().optional(),
  /** シリーズに含まれる記事のスラッグ配列 */
  posts: z.array(z.string()).default([]),
});

/**
 * 翻訳用データを含むシリーズ定義の内部型
 */
type SeriesDefinitionRaw = z.infer<typeof SeriesDefinitionRawSchema>;

/**
 * ロケールに応じてシリーズ定義を解決（翻訳を選択）する
 * @param definition 未解決のシリーズ定義
 * @param locale 対象のロケール
 * @returns 解決されたシリーズ定義
 */
function resolveSeriesDefinition(
  definition: SeriesDefinitionRaw,
  locale: Locale,
): SeriesDefinition {
  if (locale === "en") {
    const description = definition.descriptionEn ?? definition.description;
    const thumbnail = definition.thumbnailEn ?? definition.thumbnail;
    return {
      name: definition.nameEn ?? definition.name,
      slug: definition.slug,
      ...(thumbnail !== undefined ? { thumbnail } : {}),
      posts: definition.posts,
      ...(description !== undefined ? { description } : {}),
    };
  }

  return {
    name: definition.name,
    slug: definition.slug,
    ...(definition.thumbnail !== undefined ? { thumbnail: definition.thumbnail } : {}),
    posts: definition.posts,
    ...(definition.description !== undefined ? { description: definition.description } : {}),
  };
}

/**
 * ファイルシステムからすべてのシリーズ定義を読み込む
 * @returns 未解決のシリーズ定義の配列
 */
async function readSeriesDefinitions(): Promise<SeriesDefinitionRaw[]> {
  const root = await resolveContentRoot();
  const seriesRoot = path.join(root, "series");

  try {
    const entries = await fs.readdir(seriesRoot, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));

    const results = await Promise.all(
      files.map(async (entry) => {
        const filePath = path.join(seriesRoot, entry.name);
        try {
          const raw = await fs.readFile(filePath, "utf8");
          const data = JSON.parse(raw);
          const parsed = SeriesDefinitionRawSchema.safeParse(data);

          if (!parsed.success) {
            return null;
          }

          return parsed.data;
        } catch {
          return null;
        }
      }),
    );

    return results.filter((item): item is SeriesDefinitionRaw => item !== null);
  } catch {
    return [];
  }
}

/**
 * すべてのシリーズ定義を名前順に並べ替えて取得する
 * @param locale ロケール。デフォルトは 'ja'
 * @returns シリーズ定義の配列
 */
export async function getSeriesList(locale: Locale = "ja"): Promise<SeriesDefinition[]> {
  const list = await readSeriesDefinitions();
  const resolved = list.map((definition) => resolveSeriesDefinition(definition, locale));
  return resolved.sort((a, b) => a.name.localeCompare(b.name, locale === "en" ? "en-US" : "ja-JP"));
}

/**
 * スラッグ指定でシリーズ定義を取得する
 * @param slug シリーズのスラッグ
 * @param locale ロケール
 * @returns 見つかったシリーズ定義。存在しない場合は null
 */
export async function getSeriesBySlug(
  slug: string,
  locale: Locale = "ja",
): Promise<SeriesDefinition | null> {
  const list = await readSeriesDefinitions();
  const matched = list.find((item) => item.slug === slug);
  return matched ? resolveSeriesDefinition(matched, locale) : null;
}

/**
 * すべてのシリーズのスラッグ一覧を取得する
 * @returns スラッグの配列
 */
export async function getSeriesSlugs(): Promise<string[]> {
  const list = await readSeriesDefinitions();
  return list.map((item) => item.slug);
}
