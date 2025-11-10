import { Metadata } from "next";
import config from "@/config";
import { getAllSeries } from "@/libs/contents/series";
import { SeriesPageClient } from "@/components/Pages/SeriesPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `シリーズ | ${config.metadata.title}`,
    description: "記事のシリーズ一覧",
  };
}

export default async function SeriesPage() {
  const allSeries = await getAllSeries();
  const seriesEntries = Object.entries(allSeries).sort((a, b) =>
    a[1].name.localeCompare(b[1].name),
  );

  return <SeriesPageClient seriesEntries={seriesEntries} />;
}
