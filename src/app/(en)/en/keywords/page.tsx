import type { Metadata } from "next";
import KeywordsPage from "@/pages/keywords/index";

export const metadata: Metadata = {
  title: "Keywords",
};

export default function Page() {
  return <KeywordsPage locale="en" />;
}
