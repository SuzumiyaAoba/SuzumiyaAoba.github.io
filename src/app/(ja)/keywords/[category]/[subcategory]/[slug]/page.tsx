import type { Metadata } from "next";
import {
  KeywordDetailPage,
  getKeywordCategories,
  getKeyword,
} from "@/pages/keywords";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

type Props = {
  params: Promise<{ category: string; subcategory: string; slug: string }>;
};

export async function generateStaticParams() {
  return (await getKeywordCategories()).flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      subcategory.keywords.map((keyword) => ({
        category: category.id,
        subcategory: subcategory.id,
        slug: keyword.slug,
      }))
    )
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, subcategory, slug } = await params;
  const keyword = await getKeyword(category, subcategory, slug);
  return {
    title: keyword?.name ?? "Keywords",
    description: keyword?.effect,
    alternates: buildLocaleAlternates(
      `/keywords/${category}/${subcategory}/${slug}`,
      "ja"
    ),
  };
}

export default async function Page({ params }: Props) {
  const { category, subcategory, slug } = await params;
  return (
    <KeywordDetailPage
      locale="ja"
      categoryId={category}
      subcategoryId={subcategory}
      slug={slug}
    />
  );
}
