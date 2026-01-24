import { getSeriesList } from "@/entities/series-item";
import { type Locale } from "@/shared/lib/routing";
import { SeriesListPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const seriesList = await getSeriesList(resolvedLocale);
  return <SeriesListPageContent locale={resolvedLocale} seriesList={seriesList} />;
}
