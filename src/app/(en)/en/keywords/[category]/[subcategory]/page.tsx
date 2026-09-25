import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  KeywordSubcategoryPage,
  getKeywordCategories,
  getKeywordSubcategory,
  getLegacyKeywordSubcategory,
} from "@/pages/keywords";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

type Props = { params: Promise<{ category: string; subcategory: string }> };

export async function generateStaticParams() {
  const categories = await getKeywordCategories();
  return [
    ...categories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        category: category.id,
        subcategory: subcategory.id,
      }))
    ),
    ...categories.flatMap((category) =>
      category.subcategories.flatMap((subcategory) =>
        subcategory.id === "dotnet"
          ? []
          : subcategory.keywords.map((keyword) => ({
              category: subcategory.id,
              subcategory: keyword.slug,
            }))
      )
    ),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, subcategory } = await params;
  const item = await getKeywordSubcategory(category, subcategory);
  const legacy = item ? undefined : await getLegacyKeywordSubcategory(category);
  const oldKeyword = legacy?.subcategory.keywords.find(
    (keyword) => keyword.slug === subcategory
  );
  const canonicalPath = oldKeyword
    ? `/keywords/${legacy?.category.id}/${category}/${subcategory}`
    : `/keywords/${category}/${subcategory}`;
  return {
    title: item?.english ?? oldKeyword?.english ?? "Keywords",
    alternates: buildLocaleAlternates(canonicalPath, "en"),
  };
}

export default async function Page({ params }: Props) {
  const { category, subcategory } = await params;
  const legacy = await getLegacyKeywordSubcategory(category);
  if (
    legacy?.subcategory.keywords.some((keyword) => keyword.slug === subcategory)
  ) {
    redirect(`/en/keywords/${legacy.category.id}/${category}/${subcategory}/`);
  }
  return (
    <KeywordSubcategoryPage
      locale="en"
      categoryId={category}
      subcategoryId={subcategory}
    />
  );
}
