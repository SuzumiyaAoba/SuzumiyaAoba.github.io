import type { Locale } from "@/shared/lib/routing";
import { AudioViewer } from "./audio-viewer";

export type AudioSystemProps = {
  locale?: Locale;
};

/** 接続全体の 3D モデル。オーディオページと MDX で共有する。 */
export function AudioSystem({ locale = "ja" }: AudioSystemProps) {
  const ja = locale === "ja";
  return (
    <AudioViewer
      model="system"
      name={ja ? "接続全体" : "Connected system"}
      manufacturer="Audio"
      finish="NODE / CG-10M / UD-505 / HA-1A MK2"
      description={
        ja
          ? "NODE（USB-A）→ AudioQuest Cinnamon USB 2.0 A–B 1.5m（USB2/CIN/1.5）→ UD-505（USB-B）。CG-10M → サイバーシャフト 50Ω BNCセミリジッドケーブル → UD-505。HD 800 S と Clear Mg Professional は HA-1A MK2 正面左の PHONES A（6.35 mm）に、IE 600 は UD-505 正面の 4.4 mm バランス出力に接続します。"
          : "NODE (USB-A) → AudioQuest Cinnamon USB 2.0 A–B 1.5m (USB2/CIN/1.5) → UD-505 (USB-B). CG-10M → Cybershaft 50Ω BNC semi-rigid cable → UD-505. HD 800 S and Clear Mg Professional connect through HA-1A MK2’s front left PHONES A (6.35 mm) jack; IE 600 connects to UD-505’s front 4.4 mm balanced output."
      }
      locale={locale}
    />
  );
}
