import type { Metadata } from "next";
import AiNewsPage from "@/pages/archive/ai-news";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AIニュース（タイムライン）",
  description: "AIモデルのリリース情報を年ごとに並べたタイムライン。",
  alternates: buildLocaleAlternates("/archive/ai-news/timeline", "ja", {
    availability: { ja: true },
  }),
};

export default function Page() {
  return <AiNewsPage locale="ja" view="timeline" />;
}
