import type { Metadata } from "next";
import SeriesIndexPage from "@/pages/series/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Series",
  alternates: buildLocaleAlternates("/series", "ja"),
};

export default function Page() {
  return <SeriesIndexPage locale="ja" />;
}
