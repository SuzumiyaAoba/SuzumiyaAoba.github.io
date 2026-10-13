import type { Metadata } from "next";
import { KeywordsIndexPage } from "@/pages/keywords";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  description: "ゲーム開発の技法を分野別にまとめた用語集。",
  alternates: buildLocaleAlternates("/keywords", "ja"),
};

export default function Page() {
  return <KeywordsIndexPage locale="ja" />;
}
