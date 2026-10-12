import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "オーディオ",
  description:
    "所有しているオーディオ機器を紹介。TEAC UD-505・CG-10M、Bluesound NODE、Sennheiser HD 800 S、Focal Clear Mg Professional の3Dモデルを回転・拡大して細部を確認できます。",
  path: "/audio",
  locale: "ja",
});

export default function Page() {
  return <AudioPage locale="ja" />;
}
