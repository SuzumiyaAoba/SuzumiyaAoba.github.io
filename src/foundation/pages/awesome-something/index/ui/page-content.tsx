import type { AwesomeItem } from "../model/awesome-item";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAwesomeCatalog } from "../model/awesome-catalog";
import { getAwesomePath } from "../model/awesome-categories";
import { SiteLayout } from "@/widgets/site-layout";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { CategoryIcon } from "./category-icon";

export type AwesomeSomethingPageContentProps = {
  locale: Locale;
  items: AwesomeItem[];
};

export function AwesomeSomethingPageContent({
  locale,
  items,
}: AwesomeSomethingPageContentProps) {
  const path = "/awesome-something";
  const categories = getAwesomeCatalog(items);
  const isEnglish = locale === "en";
  const breadcrumbs = buildListBreadcrumbItems(locale, {
    name: "Awesome Something",
    path,
  });

  return (
    <SiteLayout locale={locale} path={toLocalePath(path, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <h1 className="page-title">Awesome Something</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p className="page-count">
              {isEnglish
                ? `${categories.length} categories / ${items.length} items`
                : `${categories.length} カテゴリ / ${items.length} 件`}
            </p>
            {items.length > 0 && (
              <Link
                href={toLocalePath(getAwesomePath("all"), locale)}
                className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 transition-colors hover:text-muted-foreground"
              >
                {isEnglish
                  ? "Browse & search all items"
                  : "すべての項目を見る・検索する"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </header>
        {items.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            {isEnglish
              ? "No discoveries recorded yet."
              : "まだ登録がありません。"}
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category) => (
              <section
                key={category.id}
                aria-labelledby={`category-${category.id}`}
                className="flex min-w-0 flex-col rounded-xl border border-border bg-card transition-colors hover:border-foreground/30"
              >
                <Link
                  href={toLocalePath(getAwesomePath(category.id), locale)}
                  aria-labelledby={`category-${category.id}`}
                  className="group block rounded-t-xl p-6 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground">
                      <CategoryIcon category={category.id} size="large" />
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {isEnglish
                        ? `${category.count} items`
                        : `${category.count} 件`}
                    </span>
                  </div>
                  <h2
                    id={`category-${category.id}`}
                    className="flex items-center justify-between gap-3 text-lg font-semibold tracking-tight"
                  >
                    {category.name[locale]}
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </h2>
                </Link>
                <nav
                  aria-label={
                    isEnglish
                      ? `${category.name.en} subcategories`
                      : `${category.name.ja}のサブカテゴリ`
                  }
                  className="mx-6 mb-5 border-t border-border pt-3"
                >
                  <ul>
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <Link
                          href={toLocalePath(
                            getAwesomePath(category.id, subcategory.id),
                            locale
                          )}
                          className="group flex min-h-11 items-center justify-between gap-3 rounded-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span className="group-hover:underline group-hover:underline-offset-4">
                            {subcategory.name[locale]}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums">
                            {subcategory.count}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </section>
            ))}
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
