import type { Metadata } from "next";
import AwesomeSomethingPage from "@/pages/awesome-something/index";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "Awesome Something",
  description:
    "日々見つけたサービス、ライブラリ、フレームワーク、アプリケーションを、紹介記事やサイト内の関連記事と一緒にまとめています。",
  alternates: buildLocaleAlternates("/awesome-something", "ja"),
};

export default function Page() {
  return <AwesomeSomethingPage locale="ja" />;
}
