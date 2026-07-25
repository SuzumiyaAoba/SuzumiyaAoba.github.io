import type { Metadata } from "next";
import KeywordsIndexPage from "@/pages/keywords/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  alternates: buildLocaleAlternates("/keywords", "ja"),
  // コンテンツが未整備で本文が空のため、整うまでは検索結果に出さない。
  robots: { index: false, follow: true },
};

export default function Page() {
  return <KeywordsIndexPage locale="ja" />;
}
