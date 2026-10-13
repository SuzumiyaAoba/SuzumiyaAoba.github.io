import type { Locale } from "@/shared/lib/routing";
import type { AudioView } from "../model/viewer";

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
  connections: { ja: "接続端子", en: "Connections" },
  side: { ja: "側面", en: "Side" },
  earpads: { ja: "イヤーパッド", en: "Ear pads" },
  headband: { ja: "ヘッドバンド", en: "Headband" },
  grille: { ja: "グリル・ドライバー", en: "Grille & driver" },
  tubes: { ja: "真空管窓", en: "Tube window" },
  dials: { ja: "ダイアル", en: "Dials" },
};
