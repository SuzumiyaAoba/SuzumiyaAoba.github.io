import type { AwesomeItem } from "../model/awesome-item";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, buildListBreadcrumbItems, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { AwesomeList } from "./awesome-list";

export type AwesomeSomethingPageContentProps = {
  locale: Locale;
  items: AwesomeItem[];
};

export function AwesomeSomethingPageContent({ locale, items }: AwesomeSomethingPageContentProps) {
  const path = "/awesome-something";
  const breadcrumbs = buildListBreadcrumbItems(locale, { name: "Awesome Something", path });

  return (
    <div className="site-page">
      <Header locale={locale} path={toLocalePath(path, locale)} />
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <section className="page-heading">
          <h1 className="page-title">Awesome Something</h1>
          <p className="page-count">
            {locale === "en" ? `${items.length} items` : `${items.length} 件`}
          </p>
        </section>
        <AwesomeList locale={locale} items={items} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
