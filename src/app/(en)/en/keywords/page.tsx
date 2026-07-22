import type { Metadata } from "next";
import KeywordsPage from "@/pages/keywords/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  alternates: buildLocaleAlternates("/keywords", "en"),
};

export default function Page() {
  return <KeywordsPage locale="en" />;
}
