import type { Metadata } from "next";
import { getSeriesBySlug } from "@/entities/series-item";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";

/**
 * シリーズ詳細ページの Metadata を構築する。
 * シリーズ定義はロケールに関わらず同じ slug で ja/en 両方のページが
 * 生成されるため、canonical は常に現在ロケール自身を指し、hreflang は
 * 双方向に設定する。
 */
export async function buildSeriesPageMetadata(
  slug: string | undefined,
  locale: Locale,
): Promise<Metadata> {
  if (!slug) {
    return { title: "Series" };
  }

  const series = await getSeriesBySlug(slug, locale);
  if (!series) {
    return { title: "Series" };
  }

  const title = series.name;
  const description =
    series.description ||
    (locale === "en"
      ? `${series.name} — a series of ${series.posts.length} posts.`
      : `「${series.name}」シリーズの記事一覧（全${series.posts.length}件）。`);

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/series/${slug}`, locale),
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}
