import { resolveLocalizedValue } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { Metadata } from "@/shared/lib/site/metadata";
import { buildPageMetadata } from "./page-metadata";

type ArticleFrontmatter = {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
};

type ArticleDetailMetadataOptions<
  T extends { frontmatter: ArticleFrontmatter },
> = {
  slug: string | undefined;
  locale: Locale;
  /** slug や記事が無いときに返す一覧の題。 */
  fallbackTitle: string;
  /** `/notes` のような、slug の手前のパス。 */
  basePath: string;
  loadVariants: (slug: string) => Promise<{ ja?: T | null; en?: T | null }>;
  /** description が無いとき、category から作る説明文。 */
  describeCategory: (category: string, locale: Locale) => string;
  buildOpenGraph: (
    article: T
  ) => NonNullable<Parameters<typeof buildPageMetadata>[0]["openGraph"]>;
};

/**
 * ブログ記事・ノートなど、ja/en の訳を持つ記事詳細ページの Metadata を構築する。
 * canonical は常に閲覧中のロケール自身を指す(自己参照 canonical)。
 * hreflang で ja/en を相互参照しているため、canonical を翻訳版に向けると
 * Google に矛盾したシグナルを送り、非正規ロケールの評価が正規ロケールに
 * 吸収されてしまう。
 * description は frontmatter の `description` を優先し、未設定の場合は
 * category ベースの生成文言、それも無ければタイトルにフォールバックする。
 */
export async function buildArticleDetailMetadata<
  T extends { frontmatter: ArticleFrontmatter },
>({
  slug,
  locale,
  fallbackTitle,
  basePath,
  loadVariants,
  describeCategory,
  buildOpenGraph,
}: ArticleDetailMetadataOptions<T>): Promise<Metadata> {
  if (!slug) {
    return { title: fallbackTitle };
  }

  const { ja, en } = await loadVariants(slug);
  const article = resolveLocalizedValue({ ja, en }, locale);
  if (!article) {
    return { title: fallbackTitle };
  }

  const { frontmatter } = article;
  const title = frontmatter.title || slug;
  const fallbackDescription = frontmatter.category
    ? describeCategory(frontmatter.category, locale)
    : title;

  return buildPageMetadata({
    title,
    description: frontmatter.description || fallbackDescription,
    path: `${basePath}/${slug}`,
    locale,
    alternates: {
      availability: { ja: Boolean(ja), en: Boolean(en) },
    },
    openGraph: buildOpenGraph(article),
  });
}
