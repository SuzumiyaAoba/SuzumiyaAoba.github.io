import type { Metadata } from "next";
import SeriesPage from "@/pages/series/index";

export const metadata: Metadata = {
  title: "Series",
};

export default function Page() {
  return <SeriesPage locale="en" />;
}
