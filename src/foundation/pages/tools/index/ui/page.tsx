import { resolveLocale, type Locale } from "@/shared/lib/routing";
import { ToolsIndexPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <ToolsIndexPageContent locale={resolvedLocale} />;
}
