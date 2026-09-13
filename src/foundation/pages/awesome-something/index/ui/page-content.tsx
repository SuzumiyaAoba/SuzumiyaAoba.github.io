import type { AwesomeItem } from "../model/awesome-item";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
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
      <main className="site-main space-y-8 sm:space-y-10">
        <Breadcrumbs items={breadcrumbs} />
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Awesome Something</h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            <I18nText
              locale={locale}
              ja="日々見つけた、気になるサービス、ライブラリ、フレームワーク、アプリケーション。紹介記事や使ってみた記録と一緒にまとめています。"
              en="Services, libraries, frameworks, and applications discovered along the way, collected with useful articles and notes from trying them out."
            />
          </p>
        </section>
        <AwesomeList locale={locale} items={items} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
