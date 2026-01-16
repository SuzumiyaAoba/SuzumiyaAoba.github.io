
import { StandardCode } from "@/shared/ui/svg";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: "ASCII Standard Code", path: "/tools/ascii-standard-code" },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "ASCII Standard Code", path: "/tools/ascii-standard-code" },
          ]}
          className="mb-4"
        />
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText ja="ツール" en="Tools" />
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">ASCII Standard Code</h1>
          <p className="text-sm leading-6 text-muted-foreground lang-ja">
            <a
              href="https://www.rfc-editor.org/rfc/rfc20#section-2"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              RFC 20
            </a>
            の Standard Code にあるテーブルの SVG バージョン。ASCII コードから 16 進数、2
            進数への変換表。
          </p>
          <p className="text-sm leading-6 text-muted-foreground lang-en">
            An SVG version of the Standard Code table from{" "}
            <a
              href="https://www.rfc-editor.org/rfc/rfc20#section-2"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              RFC 20
            </a>
            . A conversion table from ASCII codes to hexadecimal and binary.
          </p>
        </section>

        <section className="mt-8">
          <StandardCode />
        </section>
      </main>
      <Footer />
    </div>
  );
}
