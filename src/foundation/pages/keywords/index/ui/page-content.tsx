import { EmptyPage } from "@/shared/ui/empty-page";
import { SiteLayout } from "@/widgets/site-layout";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type KeywordsIndexPageContentProps = {
  locale: Locale;
};

export function KeywordsIndexPageContent({ locale }: KeywordsIndexPageContentProps) {
  const pagePath = toLocalePath("/keywords", locale);
  return (
    <SiteLayout locale={locale} path={pagePath}>
      <EmptyPage />
    </SiteLayout>
  );
}
