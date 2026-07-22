import type { Metadata } from "next";
import { getNoteSummaryVariants } from "@/entities/note";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";

/**
 * ノート詳細ページの Metadata を構築する。
 * ja/en どちらのノートも存在する場合、canonical は常に en 版を指す
 * (ブログ記事の既存ロジックを踏襲。ja のみ存在する場合は ja 版を指す)。
 * ノートには description frontmatter が無いため、category ベースの文言
 * (無ければタイトル)を description として使う。
 */
export async function buildNotesPageMetadata(
  slug: string | undefined,
  locale: Locale,
): Promise<Metadata> {
  if (!slug) {
    return { title: "Notes" };
  }

  const { ja: noteJa, en: noteEn } = await getNoteSummaryVariants(slug);
  const note = locale === "en" ? (noteEn ?? noteJa) : (noteJa ?? noteEn);
  if (!note) {
    return { title: "Notes" };
  }

  const title = note.frontmatter.title || slug;
  const description = note.frontmatter.category
    ? locale === "en"
      ? `${note.frontmatter.category} note.`
      : `${note.frontmatter.category}に関するノート。`
    : title;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/notes/${slug}`, locale, {
      availability: { ja: Boolean(noteJa), en: Boolean(noteEn) },
      canonicalLocale: noteEn ? "en" : "ja",
    }),
    openGraph: {
      title,
      description,
      type: "article",
      ...(note.frontmatter.date ? { publishedTime: note.frontmatter.date } : {}),
    },
  };
}
