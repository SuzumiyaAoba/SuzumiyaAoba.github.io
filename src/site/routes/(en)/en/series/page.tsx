import type { Metadata } from "@/shared/lib/site/metadata";
import SeriesPage from "@/pages/series/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Series",
  alternates: buildLocaleAlternates("/series", "en"),
};

export default function Page() {
  return <SeriesPage locale="en" />;
}
