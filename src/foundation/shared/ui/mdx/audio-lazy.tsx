"use client";

import dynamic from "@/shared/ui/lazy-component";

// 使用する記事でのみこの境界を登録し、3D 実装は画面に近づいてから読み込む。
export const AudioSystem = dynamic(async () => {
  const audio = await import("@/shared/ui/audio/audio-system");
  return audio.AudioSystem;
});

export const AudioEquipment = dynamic(async () => {
  const audio = await import("@/shared/ui/audio/audio-equipment");
  return audio.AudioEquipment;
});
