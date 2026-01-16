import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Card } from "@/shared/ui/card";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type NotFoundPageProps = {
  locale?: Locale;
};

export default function NotFoundPage({ locale }: NotFoundPageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/", resolvedLocale);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="flex flex-col items-center justify-center gap-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
            <h2 className="text-2xl font-semibold">
              <I18nText locale={resolvedLocale} ja="ページが見つかりません" en="Page not found" />
            </h2>
            <p className="text-muted-foreground">
              <I18nText
                locale={resolvedLocale}
                ja="お探しのページは存在しないか、移動または削除された可能性があります。"
                en="The page you’re looking for might have been moved or removed."
              />
            </p>
          </div>
          <Card className="border-transparent bg-card/40 shadow-none">
            <a
              href={toLocalePath("/", resolvedLocale)}
              className="flex items-center gap-2 px-6 py-4 text-sm font-medium"
            >
              <I18nText locale={resolvedLocale} ja="← ホームに戻る" en="← Back to home" />
            </a>
          </Card>
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
