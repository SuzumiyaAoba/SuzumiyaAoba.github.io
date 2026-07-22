import type { Metadata } from "next";
import { getSeriesSlugs } from "@/entities/series-item";
import { buildSeriesPageMetadata } from "@/app/_shared/series-page-metadata";
import SeriesDetailPage from "@/pages/series/detail";

type PageProps = {
  params: Promise<{ series?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  return buildSeriesPageMetadata(resolvedParams?.series, "ja");
}

export async function generateStaticParams(): Promise<Array<{ series: string }>> {
  const slugs = await getSeriesSlugs();
  return slugs.map((series) => ({ series }));
}

type PageComponentProps = {
  params: Promise<{ series: string }>;
};

export default function Page(props: PageComponentProps) {
  return <SeriesDetailPage {...props} locale="ja" />;
}
