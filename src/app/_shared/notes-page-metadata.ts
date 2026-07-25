import type { Metadata } from "next";
import { getNoteSummaryVariants } from "@/entities/note";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";

/**
 * ノート詳細ページの Metadata を構築する。
 * canonical は常に閲覧中のロケール自身を指す(自己参照 canonical、
 * ブログ記事の locale-alternates ロジックを踏襲)。
 * description は frontmatter の `description` を優先し、未設定の場合は
 * category ベースの生成文言、それも無ければタイトルにフォールバックする。
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
  const fallbackDescription = note.frontmatter.category
    ? locale === "en"
      ? `${note.frontmatter.category} note.`
      : `${note.frontmatter.category}に関するノート。`
    : title;
  const description = note.frontmatter.description || fallbackDescription;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/notes/${slug}`, locale, {
      availability: { ja: Boolean(noteJa), en: Boolean(noteEn) },
    }),
    openGraph: {
      title,
      description,
      type: "article",
      ...(note.frontmatter.date ? { publishedTime: note.frontmatter.date } : {}),
    },
  };
}
