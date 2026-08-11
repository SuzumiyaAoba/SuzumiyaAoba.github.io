import { EmptyPage } from "@/shared/ui/empty-page";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

export type KeywordsIndexPageContentProps = {
  locale: Locale;
};

export function KeywordsIndexPageContent({ locale }: KeywordsIndexPageContentProps) {
  const pagePath = toLocalePath("/keywords", locale);
  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <EmptyPage />
      <Footer locale={locale} />
    </div>
  );
}
