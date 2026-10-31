import type { Metadata } from "@/shared/lib/site/metadata";
import { redirect } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "@/app/_shared/locale-alternates";

export const metadata: Metadata = {
  title: "AIニュース（タイムライン）",
  description: "AIモデルのリリース情報を年ごとに並べたタイムライン。",
  alternates: buildLocaleAlternates("/ai/models/timeline", "ja", {
    availability: { ja: true },
  }),
};

export default function Page() {
  redirect("/ai/models/timeline/");
}
