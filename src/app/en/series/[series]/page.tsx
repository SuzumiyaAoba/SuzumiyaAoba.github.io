import SeriesDetailPage from "@/pages/series/detail";

type PageProps = {
  params: Promise<{ series: string }>;
};

export default function Page(props: PageProps) {
  return <SeriesDetailPage {...props} locale="en" />;
}
export * from "../../../series/[series]/page";
export * from "../../../series/[series]/page";
