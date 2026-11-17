import type { Locale } from "@/shared/lib/routing";
import type { Metadata } from "@/shared/lib/site/metadata";
import { getNoteSummaryVariants } from "@/entities/note";
import { buildArticleDetailMetadata } from "./article-detail-metadata";

/** ノート詳細ページの Metadata を構築する。 */
export async function buildNotesPageMetadata(
  slug: string | undefined,
  locale: Locale
): Promise<Metadata> {
  return await buildArticleDetailMetadata({
    slug,
    locale,
    fallbackTitle: "Notes",
    basePath: "/notes",
    loadVariants: getNoteSummaryVariants,
    describeCategory: (category, currentLocale) =>
      currentLocale === "en"
        ? `${category} note.`
        : `${category}に関するノート。`,
    buildOpenGraph: (note) => ({
      type: "article",
      ...(note.frontmatter.date
        ? { publishedTime: note.frontmatter.date }
        : {}),
    }),
  });
}
