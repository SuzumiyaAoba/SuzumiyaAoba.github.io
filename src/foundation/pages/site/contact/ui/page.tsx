import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/contact", resolvedLocale);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Contact", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="お問い合わせ" en="Contact" />
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              <I18nText locale={resolvedLocale} ja="お問い合わせ" en="Contact" />
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            <I18nText
              locale={resolvedLocale}
              ja="お問い合わせは以下のフォームからお願いします。"
              en="Please use the form below to get in touch."
            />
          </p>
        </section>

        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-card/40">
            <iframe
              title="Contact form"
              src="https://docs.google.com/forms/d/e/1FAIpQLSeXOZA4Mriinisf4yXq8Y9XxfiSNvWjF_qhg5qFYY8af85bfQ/viewform?embedded=true"
              className="h-[1000px] w-full border-0"
            >
              <I18nText locale={resolvedLocale} ja="読み込んでいます…" en="Loading…" />
            </iframe>
          </div>
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
