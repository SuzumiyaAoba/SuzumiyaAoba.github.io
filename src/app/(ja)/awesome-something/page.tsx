import type { Metadata } from "next";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description: "サービス・ライブラリ・フレームワーク・アプリケーションのリンク集。",
  alternates: buildLocaleAlternates("/awesome-something", "ja"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="ja" />;
}
