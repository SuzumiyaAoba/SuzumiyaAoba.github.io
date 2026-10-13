import { SiteLayout } from "@/widgets/site-layout";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

type NotFoundPageProps = {
  locale?: Locale;
};

export type NotFoundPageContentProps = {
  locale: Locale;
};

/**
 * 404。ファビコンと同じ ⊥ を大きく置き、主な行き先を並べる。
 */
export function NotFoundPageContent({ locale }: NotFoundPageContentProps) {
  const pagePath = toLocalePath("/", locale);
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <main className="site-main">
        <section className="not-found" aria-labelledby="not-found-title">
          <span className="not-found-falsum" aria-hidden="true" />
          <div className="not-found-body">
            <p className="not-found-code">404</p>
            <h1 id="not-found-title" className="page-title">
              <I18nText
                locale={locale}
                ja="ページが見つかりません"
                en="Page not found"
              />
            </h1>
            <ul className="not-found-links">
              <li>
                <a href={toLocalePath("/", locale)} className="arrow-link">
                  <I18nText locale={locale} ja="ホームへ" en="Home" />
                </a>
              </li>
              <li>
                <a href={toLocalePath("/blog", locale)} className="arrow-link">
                  <I18nText locale={locale} ja="記事の一覧" en="All articles" />
                </a>
              </li>
              <li>
                <a
                  href={toLocalePath("/search", locale)}
                  className="arrow-link"
                >
                  <I18nText
                    locale={locale}
                    ja="サイト内を検索"
                    en="Search the site"
                  />
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <NotFoundPageContent locale={resolvedLocale} />;
}
