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

export function NotFoundPageContent({ locale }: NotFoundPageContentProps) {
  const pagePath = toLocalePath("/", locale);
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <main className="site-main page-stack">
        <section className="not-found">
          <p className="not-found-code">404</p>
          <h1 className="page-title">
            <I18nText
              locale={locale}
              ja="ページが見つかりません"
              en="Page not found"
            />
          </h1>
          <p className="page-lead">
            <I18nText
              locale={locale}
              ja="お探しのページは存在しないか、移動または削除された可能性があります。"
              en="The page you’re looking for might have been moved or removed."
            />
          </p>
          <ul className="not-found-links">
            <li>
              <a href={toLocalePath("/", locale)} className="arrow-link">
                <I18nText locale={locale} ja="ホームへ戻る" en="Back to home" />
              </a>
            </li>
            <li>
              <a href={toLocalePath("/blog", locale)} className="arrow-link">
                <I18nText locale={locale} ja="記事の一覧" en="All articles" />
              </a>
            </li>
            <li>
              <a href={toLocalePath("/search", locale)} className="arrow-link">
                <I18nText
                  locale={locale}
                  ja="サイト内を検索"
                  en="Search the site"
                />
              </a>
            </li>
          </ul>
        </section>
      </main>
    </SiteLayout>
  );
}

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <NotFoundPageContent locale={resolvedLocale} />;
}
