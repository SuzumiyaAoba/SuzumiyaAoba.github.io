import { resolveLocale } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { AsciiStandardCodePageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <AsciiStandardCodePageContent locale={resolvedLocale} />;
}
