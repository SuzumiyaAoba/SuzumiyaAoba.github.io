import type { Metadata } from "next";
import SearchPage from "@/pages/site/search";

export const metadata: Metadata = {
  title: "Search",
};

export default function Page() {
  return <SearchPage locale="en" />;
}
