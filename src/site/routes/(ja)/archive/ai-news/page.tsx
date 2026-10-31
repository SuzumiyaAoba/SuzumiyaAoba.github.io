import type { Metadata } from "@/shared/lib/site/metadata";
import { redirect } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AIモデルのリリース比較",
  description:
    "LLM・画像・音声モデルのリリース日と、系列ごとのリリース間隔の記録。",
  alternates: buildLocaleAlternates("/ai/models", "ja", {
    availability: { ja: true },
  }),
};

export default function Page() {
  redirect("/ai/models/");
}
