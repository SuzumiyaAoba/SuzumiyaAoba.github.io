import { buildListBreadcrumbItems } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export const keywordPath = (
  category: string,
  subcategory?: string,
  slug?: string
) =>
  `/keywords/${category}${subcategory ? `/${subcategory}` : ""}${slug ? `/${slug}` : ""}`;

export const keywordBreadcrumbs = (locale: Locale) =>
  buildListBreadcrumbItems(locale, { name: "Keywords", path: "/keywords" });
