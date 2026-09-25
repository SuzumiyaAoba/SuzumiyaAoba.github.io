import { AWESOME_CATEGORIES, getAwesomeCategory } from "./awesome-categories";
import type { AwesomeSelection } from "./awesome-categories";
import type { AwesomeItem } from "./awesome-item";

export function getAwesomeCatalog(items: AwesomeItem[]) {
  return AWESOME_CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => item.category === category.id);
    return {
      ...category,
      count: categoryItems.length,
      subcategories: category.subcategories
        .map((subcategory) => ({
          ...subcategory,
          count: categoryItems.filter(
            (item) => item.subcategory === subcategory.id
          ).length,
        }))
        .filter((subcategory) => subcategory.count > 0),
    };
  }).filter((category) => category.count > 0);
}

export function selectAwesomeItems(
  items: AwesomeItem[],
  { category, subcategory }: AwesomeSelection
) {
  return items.filter(
    (item) =>
      (!category || item.category === category.id) &&
      (!subcategory || item.subcategory === subcategory.id)
  );
}

export function getAwesomeStaticParams(items: AwesomeItem[]) {
  return [
    { category: ["all"] },
    ...getAwesomeCatalog(items).flatMap((category) => [
      { category: [category.id] },
      ...category.subcategories.map((subcategory) => ({
        category: [category.id, subcategory.id],
      })),
    ]),
  ];
}

/** 日本語・英語のカテゴリ名もキーワード検索の対象にする。 */
export function getAwesomeSearchText(item: AwesomeItem) {
  const category = getAwesomeCategory(item.category);
  const subcategory = category?.subcategories.find(
    (entry) => entry.id === item.subcategory
  );
  return [
    item.name,
    item.description,
    ...item.tags,
    category?.name.ja,
    category?.name.en,
    subcategory?.name.ja,
    subcategory?.name.en,
  ].join(" ");
}
