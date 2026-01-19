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
  const pagePath = toLocalePath("/archive", resolvedLocale);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Archive", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="アーカイブ" en="Archive" />
          </h1>
        </section>

        <section className="mt-8">
          {resolvedLocale === "ja" ? (
            <ul className="list-disc space-y-3 pl-6 text-sm text-muted-foreground">
              <li>
                <a
                  href={toLocalePath("/archive/ai-news/", resolvedLocale)}
                  className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                >
                  AIニュース
                </a>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No archive items.</p>
          )}
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
