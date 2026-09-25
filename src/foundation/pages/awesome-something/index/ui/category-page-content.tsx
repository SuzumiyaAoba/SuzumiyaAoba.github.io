import Link from "next/link";
import { ArrowLeft, ChevronDown, List } from "lucide-react";
import type { AwesomeItem } from "../model/awesome-item";
import {
  getAwesomeCatalog,
  selectAwesomeItems,
} from "../model/awesome-catalog";
import { getAwesomePath } from "../model/awesome-categories";
import type { AwesomeSelection } from "../model/awesome-categories";
import { SiteLayout } from "@/widgets/site-layout";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { AwesomeList } from "./awesome-list";

function SubcategoryNavigation({
  locale,
  category,
  subcategoryId,
}: {
  locale: Locale;
  category: ReturnType<typeof getAwesomeCatalog>[number];
  subcategoryId: string | undefined;
}) {
  const isEnglish = locale === "en";
  const links = (
    <nav
      aria-label={isEnglish ? "Subcategories" : "サブカテゴリ"}
      className="flex flex-wrap gap-2"
    >
      {[
        {
          id: undefined,
          name: {
            ja: "このカテゴリのすべて",
            en: "All in this category",
          },
          count: category.count,
        },
        ...category.subcategories,
      ].map((entry) => (
        <Link
          key={entry.id ?? "all"}
          href={toLocalePath(getAwesomePath(category.id, entry.id), locale)}
          aria-current={entry.id === subcategoryId ? "page" : undefined}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
        >
          {entry.name[locale]}
          <span className="text-xs tabular-nums">{entry.count}</span>
        </Link>
      ))}
    </nav>
  );
  return (
    <>
      <details className="group rounded-lg border border-border sm:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {isEnglish ? "Switch subcategory" : "サブカテゴリを切り替える"}
          <ChevronDown
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="p-3 pt-1">{links}</div>
      </details>
      <div className="hidden sm:block">{links}</div>
    </>
  );
}

export function AwesomeCategoryPageContent({
  locale,
  items,
  selection,
}: {
  locale: Locale;
  items: AwesomeItem[];
  selection: AwesomeSelection;
}) {
  const { category, subcategory } = selection;
  const isEnglish = locale === "en";
  const title =
    subcategory?.name[locale] ??
    category?.name[locale] ??
    (isEnglish ? "All discoveries" : "すべての項目");
  const path = getAwesomePath(category?.id ?? "all", subcategory?.id);
  const selectedItems = selectAwesomeItems(items, selection);
  const catalogCategory = getAwesomeCatalog(items).find(
    (entry) => entry.id === category?.id
  );
  const breadcrumbs = buildListBreadcrumbItems(locale, {
    name: "Awesome Something",
    path: "/awesome-something",
  });
  if (category && subcategory) {
    breadcrumbs.push({
      name: category.name[locale],
      path: toLocalePath(getAwesomePath(category.id), locale),
    });
  }
  breadcrumbs.push({ name: title, path: toLocalePath(path, locale) });

  return (
    <SiteLayout locale={locale} path={toLocalePath(path, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Awesome Something</p>
            <h1 className="page-title">{title}</h1>
          </div>
          <p className="page-count">
            {isEnglish
              ? `${selectedItems.length} items`
              : `${selectedItems.length} 件`}
          </p>
        </header>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <Link
              href={toLocalePath("/awesome-something", locale)}
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {isEnglish ? "Browse categories" : "カテゴリから探す"}
            </Link>
            {category && (
              <Link
                href={toLocalePath(getAwesomePath("all"), locale)}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <List className="size-4" aria-hidden="true" />
                {isEnglish ? "All discoveries" : "すべての項目"}
              </Link>
            )}
          </div>
          {catalogCategory && (
            <SubcategoryNavigation
              key={path}
              locale={locale}
              category={catalogCategory}
              subcategoryId={subcategory?.id}
            />
          )}
        </div>
        <AwesomeList
          key={path}
          locale={locale}
          items={selectedItems}
          groupBy={category ? "subcategory" : "category"}
          showCategoryFilters={!category}
        />
      </main>
    </SiteLayout>
  );
}
