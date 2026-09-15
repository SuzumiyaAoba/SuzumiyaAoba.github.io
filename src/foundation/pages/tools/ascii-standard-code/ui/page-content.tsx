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
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            <I18nText locale={locale} ja="ツール" en="Tools" />
          </p>
          <h1 className="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
            ASCII Standard Code
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            <I18nText
              locale={locale}
              ja={
                <>
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc20#section-2"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                  >
                    RFC 20
                  </a>{" "}
                  の Standard Code にあるテーブルの SVG バージョン。ASCII
                  コードから 16 進数、2 進数への変換表。
                </>
              }
              en={
                <>
                  An SVG version of the Standard Code table from{" "}
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc20#section-2"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
                  >
                    RFC 20
                  </a>
                  . A conversion table from ASCII codes to hexadecimal and
                  binary.
                </>
              }
            />
          </p>
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
