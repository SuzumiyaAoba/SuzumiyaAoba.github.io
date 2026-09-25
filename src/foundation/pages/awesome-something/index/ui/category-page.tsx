import { notFound } from "next/navigation";
import { getAwesomeItems } from "../model/awesome-items";
import { resolveAwesomeSelection } from "../model/awesome-categories";
import type { Locale } from "@/shared/lib/routing";
import { AwesomeCategoryPageContent } from "./category-page-content";

export async function AwesomeCategoryPage({
  params,
  locale,
}: {
  params: Promise<{ category: string[] }>;
  locale: Locale;
}) {
  const { category } = await params;
  const selection = resolveAwesomeSelection(category);
  if (!selection) {
    notFound();
  }
  const items = await getAwesomeItems();
  return (
    <AwesomeCategoryPageContent
      locale={locale}
      items={items}
      selection={selection}
    />
  );
}
