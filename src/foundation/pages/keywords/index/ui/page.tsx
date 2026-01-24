import { type Locale } from "@/shared/lib/routing";
import { KeywordsIndexPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  return <KeywordsIndexPageContent locale={resolvedLocale} />;
}
