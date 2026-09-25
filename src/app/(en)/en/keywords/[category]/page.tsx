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
    title: item?.english ?? legacy?.subcategory.english ?? "Keywords",
    alternates: buildLocaleAlternates(
      legacy
        ? `/keywords/${legacy.category.id}/${category}`
        : `/keywords/${category}`,
      "en"
    ),
  };
}

export default async function Page({ params }: Props) {
  const { category } = await params;
  const legacy = await getLegacyKeywordSubcategory(category);
  if (legacy && !(await getKeywordCategory(category))) {
    redirect(`/en/keywords/${legacy.category.id}/${category}/`);
  }
  return <KeywordCategoryPage locale="en" id={category} />;
}
