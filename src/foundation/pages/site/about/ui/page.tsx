import { SiteLayout } from "@/widgets/site-layout";

import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  resolveLocale,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

/**
 * About ページのページコンポーネント用プロパティ
 */
type PageProps = {
  /** 描画ロケール */
  locale?: Locale;
};

/**
 * About ページの表示内容を構成するコンポーネントのプロパティ
 */
export type AboutPageContentProps = {
  /** 描画ロケール */
  locale: Locale;
};

/**
 * About ページの表示内容を構成するコンポーネント。
 */
export function AboutPageContent({ locale }: AboutPageContentProps) {
  const pagePath = toLocalePath("/about", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: "About",
    path: "/about",
  });
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="page-heading">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              <I18nText locale={locale} ja="概要" en="About" />
            </p>
            <h1 className="page-title">SuzumiyaAoba</h1>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-muted/70 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              <I18nText locale={locale} ja="コンテンツ" en="Contents" />
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href={toLocalePath("/blog", locale)}
                  className="font-medium text-foreground"
                >
                  <I18nText locale={locale} ja="ブログ" en="Blog" />
                </a>
                <I18nText
                  locale={locale}
                  as="span"
                  ja="：技術メモと更新履歴"
                  en=": Technical notes and updates"
                />
              </li>
              <li>
                <a
                  href={toLocalePath("/series", locale)}
                  className="font-medium text-foreground"
                >
                  <I18nText locale={locale} ja="シリーズ" en="Series" />
                </a>
                <I18nText
                  locale={locale}
                  as="span"
                  ja="：テーマ別の連載まとめ"
                  en=": Curated series by theme"
                />
              </li>
              <li>
                <a
                  href={toLocalePath("/tools", locale)}
                  className="font-medium text-foreground"
                >
                  <I18nText locale={locale} ja="ツール" en="Tools" />
                </a>
                <I18nText
                  locale={locale}
                  as="span"
                  ja="：小さなプロダクトの公開"
                  en=": Small product releases"
                />
              </li>
            </ul>
          </div>
          <div className="rounded-xl bg-muted/70 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">
              <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <I18nText
                locale={locale}
                ja={
                  <>
                    お問い合わせは
                    <a
                      href={toLocalePath("/contact", locale)}
                      className="font-medium text-foreground"
                    >
                      Contact
                    </a>
                    ページからお願いします。
                  </>
                }
                en={
                  <>
                    Please use the{" "}
                    <a
                      href={toLocalePath("/contact", locale)}
                      className="font-medium text-foreground"
                    >
                      Contact
                    </a>{" "}
                    page for inquiries.
                  </>
                }
              />
            </p>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

/**
 * About ページを表示するサーバーサイドコンポーネント。
 */
export default function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <AboutPageContent locale={resolvedLocale} />;
}
