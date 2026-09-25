import type { Metadata } from "next";
import { KeywordsIndexPage } from "@/pages/keywords";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Keywords",
  description:
    "ゲーム開発の表現と実装に役立つ200のキーワードを20分野から探す。",
  alternates: buildLocaleAlternates("/keywords", "ja"),
};

export default function Page() {
  return <KeywordsIndexPage locale="ja" />;
}
