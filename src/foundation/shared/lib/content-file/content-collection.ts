import { cache } from "react";
import { resolveLocalizedValue } from "@/shared/lib/routing";
import type { LocalizedValue, Locale } from "@/shared/lib/routing";
import { compareContentByDate, compareLocalizedContentByDate } from "./compare-content";
import type { ReadContentOptions } from "./read-content-file";

type CollectionEntry = {
  slug: string;
  frontmatter: { date?: string; draft?: boolean };
};

export type ContentSummary<T extends CollectionEntry> = Pick<T, "slug" | "frontmatter">;
export type LocalizedContent<T> = { slug: string } & LocalizedValue<T>;

/** 読み込み方法とキャッシュ方針を呼び出し側に残し、一覧・翻訳・公開判定を共有する。 */
export function createContentCollection<T extends CollectionEntry>({
  getSlugs,
  getContent,
}: {
  getSlugs: () => Promise<string[]>;
  getContent: (slug: string, options?: ReadContentOptions) => Promise<T | null>;
}) {
  const readSummary = cache(
    async (slug: string, locale: Locale, fallback: boolean): Promise<ContentSummary<T> | null> => {
      const content = await getContent(slug, { locale, fallback });
      return content ? { slug: content.slug, frontmatter: content.frontmatter } : null;
    },
  );

  const getSummary = async (slug: string, options?: ReadContentOptions) =>
    readSummary(slug, options?.locale ?? "ja", options?.fallback ?? true);

  function createVariantsReader<Entry>(
    read: (slug: string, options?: ReadContentOptions) => Promise<Entry | null>,
  ) {
    return cache(async (slug: string): Promise<LocalizedContent<Entry>> => {
      const [ja, en] = await Promise.all([
        read(slug, { locale: "ja", fallback: false }),
        read(slug, { locale: "en", fallback: false }),
      ]);
      return { slug, ja, en };
    });
  }

  const getVariants = createVariantsReader(getContent);
  const getSummaryVariants = createVariantsReader(getSummary);

  const getAll = cache(async (): Promise<T[]> => {
    const slugs = await getSlugs();
    const entries: (T | null)[] = await Promise.all(slugs.map(async (slug) => getContent(slug)));
    return entries
      .filter((entry): entry is T => entry !== null && !entry.frontmatter.draft)
      .toSorted(compareContentByDate);
  });

  function createVariantsList<Entry extends CollectionEntry>(
    read: (slug: string) => Promise<LocalizedContent<Entry>>,
  ) {
    return cache(async (): Promise<LocalizedContent<Entry>[]> => {
      const slugs = await getSlugs();
      const entries = await Promise.all(slugs.map(async (slug) => read(slug)));
      return entries
        .filter((entry) => {
          // 公開状態は日本語版を基準とし、日本語版がなければ英語版を使う。
          const reference = resolveLocalizedValue(entry, "ja");
          return reference !== null && !reference.frontmatter.draft;
        })
        .toSorted(compareLocalizedContentByDate);
    });
  }

  return {
    getSummary,
    getVariants,
    getSummaryVariants,
    getAll,
    getAllVariants: createVariantsList(getVariants),
    getAllSummaryVariants: createVariantsList(getSummaryVariants),
  };
}
