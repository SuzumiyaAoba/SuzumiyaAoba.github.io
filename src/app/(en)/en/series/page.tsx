import type { Metadata } from "next";
import SeriesPage from "@/pages/series/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Series",
  alternates: buildLocaleAlternates("/series", "en"),
};

export default function Page() {
  return <SeriesPage locale="en" />;
}
