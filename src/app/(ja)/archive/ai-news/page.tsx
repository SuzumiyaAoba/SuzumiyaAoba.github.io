import type { Metadata } from "next";
import AiNewsPage from "@/pages/archive/ai-news";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AIモデルのリリース比較",
  description:
    "LLM・画像・音声モデルの全期間のリリースを、連続した時間軸で比較できます。横スクロールや拡大・縮小で系列ごとのリリース間隔を確認できます。",
  alternates: buildLocaleAlternates("/archive/ai-news", "ja", { availability: { ja: true } }),
};

export default function Page() {
  return <AiNewsPage locale="ja" />;
}
