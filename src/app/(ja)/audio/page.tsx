import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "オーディオ",
  description:
    "NODE、UD-505、CG-10M、HA-1A MK2 を配線した3Dオーディオシステムを紹介。HD 800 S と Clear Mg Professional を切り替え、接続端子や機器の細部を確認できます。",
  path: "/audio",
  locale: "ja",
});

export default function Page() {
  return <AudioPage locale="ja" />;
}
