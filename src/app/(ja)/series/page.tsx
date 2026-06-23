import type { Metadata } from "next";
import SeriesIndexPage from "@/pages/series/index";

export const metadata: Metadata = {
  title: "Series",
};

export default function Page() {
  return <SeriesIndexPage locale="ja" />;
}
