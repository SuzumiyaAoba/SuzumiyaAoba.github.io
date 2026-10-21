import { audioEquipment } from "@/shared/ui/audio/definitions/equipment";
import type { EquipmentModel } from "@/shared/ui/audio/definitions/viewer";
import type { Locale } from "@/shared/lib/routing";
import { AudioViewer } from "./audio-viewer";

export type AudioEquipmentProps = {
  model: EquipmentModel;
  locale?: Locale;
};

/** 登録済みの機器情報を使い、単体の 3D モデルを表示する。 */
export function AudioEquipment({ model, locale = "ja" }: AudioEquipmentProps) {
  const equipment = audioEquipment.find((item) => item.model === model);
  if (!equipment) {
    throw new Error(`未登録のオーディオモデル: ${model}`);
  }

  return (
    <AudioViewer
      model={model}
      name={equipment.name}
      manufacturer={equipment.manufacturer}
      finish={equipment.finish[locale]}
      description={equipment.description[locale]}
      locale={locale}
    />
  );
}
