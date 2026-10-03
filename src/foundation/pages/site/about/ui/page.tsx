import { SiteLayout } from "@/widgets/site-layout";

import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { SITE_TITLE } from "@/shared/lib/site";
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
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">About</p>
            <h1 className="page-title">
              <I18nText
                locale={locale}
                ja="このサイトについて"
                en="About this site"
              />
            </h1>
          </div>
        </header>

        <div className="about-sections">
          <section aria-labelledby="about-name">
            <h2 id="about-name" className="about-heading">
              <I18nText locale={locale} ja="サイト名" en="The name" />
            </h2>
            <div className="about-body">
              <p className="about-motto" lang="la">
                {SITE_TITLE}
              </p>
              <p className="about-gloss">
                <I18nText
                  locale={locale}
                  ja="偽からは、何でも導かれる。"
                  en="From falsehood, anything follows."
                />
              </p>
            </div>
          </section>

          <section aria-labelledby="about-contact">
            <h2 id="about-contact" className="about-heading">
              <I18nText
                locale={locale}
                ja="更新情報・連絡先"
                en="Updates & contact"
              />
            </h2>
            <ul className="about-body link-list">
              <li>
                <a href={toLocalePath("/rss.xml", locale)}>RSS</a>
              </li>
              <li>
                <a
                  href="https://github.com/SuzumiyaAoba"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>GitHub</span>
                  <small>@SuzumiyaAoba</small>
                </a>
              </li>
              <li>
                <a href={toLocalePath("/contact", locale)}>
                  <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
                </a>
              </li>
            </ul>
          </section>
        </div>
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
