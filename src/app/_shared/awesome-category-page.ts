import { notFound } from "next/navigation";
import {
  getAwesomeItems,
  getAwesomeStaticParams,
  getAwesomePath,
  resolveAwesomeSelection,
} from "@/pages/awesome-something/index";
import type { Locale } from "@/shared/lib/routing";
import { buildPageMetadata } from "./page-metadata";

export type AwesomeCategoryPageProps = {
  params: Promise<{ category: string[] }>;
};

export async function buildAwesomeCategoryStaticParams() {
  return getAwesomeStaticParams(await getAwesomeItems());
}

export async function buildAwesomeCategoryMetadata(
  { params }: AwesomeCategoryPageProps,
  locale: Locale
) {
  const { category: segments } = await params;
  const selection = resolveAwesomeSelection(segments);
  if (!selection) {
    notFound();
  }
  const { category, subcategory } = selection;
  const name =
    subcategory?.name[locale] ??
    category?.name[locale] ??
    (locale === "en" ? "All discoveries" : "すべての項目");
  return buildPageMetadata({
    title: `${name} | Awesome Something`,
    description:
      locale === "en"
        ? `Explore tools and resources for ${name}.`
        : `${name}に関するツール・サービス・資料のリンク集。`,
    path: getAwesomePath(category?.id ?? "all", subcategory?.id),
    locale,
  });
}
