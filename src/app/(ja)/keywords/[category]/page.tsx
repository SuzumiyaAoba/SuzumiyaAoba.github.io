import type { Metadata } from "next";
import {
  KeywordCategoryPage,
  getKeywordCategories,
  getKeywordCategory,
  getLegacyKeywordSubcategory,
} from "@/pages/keywords";
import { redirect } from "next/navigation";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await getKeywordCategories();
  return [
    ...categories.map(({ id }) => ({ category: id })),
    ...categories.flatMap((item) =>
      item.subcategories.map(({ id }) => ({ category: id }))
    ),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const item = await getKeywordCategory(category);
  const legacy = item ? undefined : await getLegacyKeywordSubcategory(category);
  return {
    title: item?.name ?? legacy?.subcategory.name ?? "Keywords",
    description: item?.description ?? legacy?.subcategory.description,
    alternates: buildLocaleAlternates(
      legacy
        ? `/keywords/${legacy.category.id}/${category}`
        : `/keywords/${category}`,
      "ja"
    ),
  };
}

export default async function Page({ params }: Props) {
  const { category } = await params;
  const legacy = await getLegacyKeywordSubcategory(category);
  if (legacy && !(await getKeywordCategory(category))) {
    redirect(`/keywords/${legacy.category.id}/${category}/`);
  }
  return <KeywordCategoryPage locale="ja" id={category} />;
}
