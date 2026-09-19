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

type PageProps = {
  locale?: Locale;
};

export type ContactPageContentProps = {
  locale: Locale;
};

export function ContactPageContent({ locale }: ContactPageContentProps) {
  const pagePath = toLocalePath("/contact", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: "Contact",
    path: "/contact",
  });
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="section-label">
              <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
            </p>
            <h1 className="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
              <I18nText locale={locale} ja="お問い合わせ" en="Contact" />
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            <I18nText
              locale={locale}
              ja="お問い合わせは以下のフォームからお願いします。"
              en="Please use the form below to get in touch."
            />
          </p>
        </section>

        <section>
          <div className="overflow-hidden rounded-2xl bg-card/40">
            <iframe
              // Google フォームの埋め込みは allow-scripts + allow-same-origin が必須。
              // react-doctor-disable-next-line iframe-missing-sandbox
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              title="Contact form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSeXOZA4Mriinisf4yXq8Y9XxfiSNvWjF_qhg5qFYY8af85bfQ/viewform?embedded=true"
              className="h-[1000px] w-full border-0"
            >
              {locale === "en" ? "Loading…" : "読み込んでいます…"}
            </iframe>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}

export default function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <ContactPageContent locale={resolvedLocale} />;
}
