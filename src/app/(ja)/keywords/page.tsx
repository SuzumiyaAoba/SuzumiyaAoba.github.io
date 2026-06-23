import type { Metadata } from "next";
import KeywordsIndexPage from "@/pages/keywords/index";

export const metadata: Metadata = {
  title: "Keywords",
};

export default function Page() {
  return <KeywordsIndexPage locale="ja" />;
}
