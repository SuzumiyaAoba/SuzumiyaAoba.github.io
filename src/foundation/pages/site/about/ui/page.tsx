
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
  const pagePath = toLocalePath("/about", resolvedLocale);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "About", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-10 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="概要" en="About" />
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">SuzumiyaAoba</h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            <I18nText
              locale={resolvedLocale}
              ja="開発・読書・ツールづくりの記録をまとめる場所です。記事の整理と公開を続けながら、学習の過程や試行錯誤をログとして残しています。"
              en="A place to collect notes on development, reading, and tool building. I keep publishing posts while logging what I learned and the experiments along the way."
            />
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: { ja: "執筆", en: "Writing" },
              body: {
                ja: "ブログと連載記事の更新。技術メモや検証結果を中心に掲載。",
                en: "Updates to blog posts and series, focusing on technical notes and findings.",
              },
            },
            {
              title: { ja: "制作", en: "Building" },
              body: {
                ja: "小さなツールや実験的なプロトタイプの開発ログ。",
                en: "Development logs for small tools and experimental prototypes.",
              },
            },
            {
              title: { ja: "学習", en: "Learning" },
              body: {
                ja: "書籍や資料からの学びを整理し、後で参照できる形で保存。",
                en: "Summaries of books and materials, organized for future reference.",
              },
            },
          ].map((item) => (
            <div
              key={item.title.en}
              className="rounded-2xl bg-card/40 px-5 py-6 text-sm text-muted-foreground shadow-none"
            >
              <div className="text-base font-semibold text-foreground">
                <I18nText locale={resolvedLocale} ja={item.title.ja} en={item.title.en} />
              </div>
              <p className="mt-2 leading-6">
                <I18nText locale={resolvedLocale} ja={item.body.ja} en={item.body.en} />
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-card/40 px-5 py-6 shadow-none">
            <h2 className="text-lg font-semibold">
              <I18nText locale={resolvedLocale} ja="コンテンツ" en="Contents" />
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={toLocalePath("/blog", resolvedLocale)} className="font-medium text-foreground">
                  <I18nText locale={resolvedLocale} ja="ブログ" en="Blog" />
                </a>
                <I18nText
                  locale={resolvedLocale}
                  as="span"
                  ja="：技術メモと更新履歴"
                  en=": Technical notes and updates"
                />
              </li>
              <li>
                <a href={toLocalePath("/series", resolvedLocale)} className="font-medium text-foreground">
                  <I18nText locale={resolvedLocale} ja="シリーズ" en="Series" />
                </a>
                <I18nText
                  locale={resolvedLocale}
                  as="span"
                  ja="：テーマ別の連載まとめ"
                  en=": Curated series by theme"
                />
              </li>
              <li>
                <a href={toLocalePath("/tools", resolvedLocale)} className="font-medium text-foreground">
                  <I18nText locale={resolvedLocale} ja="ツール" en="Tools" />
                </a>
                <I18nText
                  locale={resolvedLocale}
                  as="span"
                  ja="：小さなプロダクトの公開"
                  en=": Small product releases"
                />
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-card/40 px-5 py-6 shadow-none">
            <h2 className="text-lg font-semibold">
              <I18nText locale={resolvedLocale} ja="お問い合わせ" en="Contact" />
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              <I18nText
                locale={resolvedLocale}
                ja={
                  <>
                    お問い合わせは
                    <a href={toLocalePath("/contact", resolvedLocale)} className="font-medium text-foreground">
                      Contact
                    </a>
                    ページからお願いします。
                  </>
                }
                en={
                  <>
                    Please use the{" "}
                    <a href={toLocalePath("/contact", resolvedLocale)} className="font-medium text-foreground">
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
      <Footer locale={resolvedLocale} />
    </div>
  );
}
