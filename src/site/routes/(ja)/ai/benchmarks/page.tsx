import type { Metadata } from "@/shared/lib/site/metadata";
import AiBenchmarksPage from "@/pages/ai/benchmarks";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AIモデルのベンチマーク",
  description:
    "AIモデルのベンチマークスコアと実行費用を、取得ソース・評価条件付きで比較。",
  alternates: buildLocaleAlternates("/ai/benchmarks", "ja", {
    availability: { ja: true },
  }),
};

export default function Page() {
  return <AiBenchmarksPage />;
}
