import { StandardCode } from "@/shared/ui/svg";
import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type AsciiStandardCodePageContentProps = {
  locale: Locale;
};

export function AsciiStandardCodePageContent({
  locale,
}: AsciiStandardCodePageContentProps) {
  const pagePath = toLocalePath("/tools/ascii-standard-code", locale);
  const breadcrumbItems = [
    { name: "Home", path: toLocalePath("/", locale) },
    { name: "Archive", path: toLocalePath("/archive", locale) },
    { name: "Tools", path: toLocalePath("/tools", locale) },
    { name: "ASCII Standard Code", path: pagePath },
  ];
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-3">
          <p className="section-label">
            <I18nText locale={locale} ja="ツール" en="Tools" />
          </p>
          <h1 className="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
            ASCII Standard Code
          </h1>
        </section>

        <section
          className="min-w-0 overflow-x-auto"
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 表を矢印キーで横スクロールできるようにする。
          tabIndex={0}
          aria-label={locale === "en" ? "ASCII code table" : "ASCIIコード表"}
        >
          <StandardCode />
        </section>
      </main>
    </SiteLayout>
  );
}
