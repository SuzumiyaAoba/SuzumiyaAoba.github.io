import AudioPage from "@/pages/audio";
import { buildPageMetadata } from "@/app/_shared/page-metadata";

export const metadata = buildPageMetadata({
  title: "オーディオ",
  description:
    "持っているオーディオ機器（NODE、CG-10M、UD-505、HA-1A MK2 ほか）の 3D モデル、接続、仕様。",
  path: "/audio",
  locale: "ja",
});

export default function Page() {
  return <AudioPage locale="ja" />;
}
