import type { Locale } from "@/shared/lib/routing";
import type {
  AudioView,
  HeadphoneModel,
} from "@/shared/ui/audio/definitions/viewer";

export function getHeadphoneConnectionLabel(
  headphone: HeadphoneModel,
  locale: Locale
): string {
  if (headphone === "ie-600") {
    return locale === "ja"
      ? "UD-505 正面の 4.4 mm バランス出力"
      : "UD-505 front 4.4 mm balanced output";
  }
  return locale === "ja"
    ? "HA-1A MK2 正面左の PHONES A · 6.35 mm"
    : "HA-1A MK2 front left PHONES A · 6.35 mm";
}

export const viewLabels: Record<AudioView, Record<Locale, string>> = {
  overview: { ja: "全体", en: "Overview" },
  front: { ja: "正面", en: "Front" },
  rear: { ja: "背面", en: "Rear" },
  top: { ja: "上面", en: "Top" },
  bottom: { ja: "底面", en: "Underside" },
  headphones: { ja: "ヘッドホン端子", en: "Headphone outputs" },
  meter: { ja: "メーター", en: "Meter" },
  outputs: { ja: "クロック出力", en: "Clock outputs" },
  controls: { ja: "タッチパネル", en: "Touch controls" },
  display: { ja: "表示・操作部", en: "Display & buttons" },
  circuit: { ja: "基板", en: "Circuit board" },
  connections: { ja: "接続端子", en: "Connections" },
  side: { ja: "側面", en: "Side" },
  earpads: { ja: "イヤーパッド", en: "Ear pads" },
  headband: { ja: "ヘッドバンド", en: "Headband" },
  grille: { ja: "グリル・ドライバー", en: "Grille & driver" },
  tubes: { ja: "真空管窓", en: "Tube window" },
  dials: { ja: "ダイアル", en: "Dials" },
  housing: { ja: "筐体", en: "Housing" },
  eartips: { ja: "イヤーチップ", en: "Ear tips" },
  cable: { ja: "ケーブル", en: "Cable" },
};
