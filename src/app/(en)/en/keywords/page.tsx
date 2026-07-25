import type { Metadata } from "next";
import KeywordsPage from "@/pages/keywords/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  alternates: buildLocaleAlternates("/keywords", "en"),
  // コンテンツが未整備で本文が空のため、整うまでは検索結果に出さない。
  robots: { index: false, follow: true },
};

export default function Page() {
  return <KeywordsPage locale="en" />;
}
