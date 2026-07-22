import type { Metadata } from "next";
import KeywordsIndexPage from "@/pages/keywords/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  alternates: buildLocaleAlternates("/keywords", "ja"),
};

export default function Page() {
  return <KeywordsIndexPage locale="ja" />;
}
