import type { Metadata } from "next";
import AiNewsPage from "@/pages/archive/ai-news";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AI News",
  alternates: buildLocaleAlternates("/archive/ai-news", "ja", { availability: { ja: true } }),
};

export default function Page() {
  return <AiNewsPage locale="ja" />;
}
