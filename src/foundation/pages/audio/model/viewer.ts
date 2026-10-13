export const viewNames = [
  "overview",
  "front",
  "rear",
  "top",
  "bottom",
  "headphones",
  "meter",
  "outputs",
  "controls",
  "connections",
  "side",
  "earpads",
  "headband",
  "grille",
  "tubes",
  "dials",
] as const;
export const audioModels = [
  "system",
  "ud-505",
  "cg-10m",
  "node-n130",
  "ha-1a-mk2",
  "hd-800s",
  "clear-mg-pro",
] as const;
export type AudioModel = (typeof audioModels)[number];
export type EquipmentModel = Exclude<AudioModel, "system">;
export const headphoneModels = ["hd-800s", "clear-mg-pro"] as const;
export type HeadphoneModel = (typeof headphoneModels)[number];
export const headphoneNames: Record<HeadphoneModel, string> = {
  "hd-800s": "HD 800 S",
  "clear-mg-pro": "Clear Mg Professional",
};
export type AudioView = (typeof viewNames)[number];
export const modelViews: Record<AudioModel, readonly AudioView[]> = {
  system: ["overview", "front", "rear", "top", "headphones", "connections"],
  "ud-505": ["overview", "front", "rear", "top", "bottom", "headphones"],
  "cg-10m": ["overview", "front", "rear", "top", "bottom", "meter", "outputs"],
  "node-n130": [
    "overview",
    "front",
    "rear",
    "top",
    "bottom",
    "headphones",
    "controls",
    "connections",
  ],
  "ha-1a-mk2": [
    "overview",
    "front",
    "rear",
    "side",
    "top",
    "bottom",
    "tubes",
    "dials",
    "headphones",
    "connections",
  ],
  "hd-800s": [
    "overview",
    "front",
    "side",
    "grille",
    "rear",
    "top",
    "earpads",
    "headband",
  ],
  "clear-mg-pro": [
    "overview",
    "front",
    "side",
    "rear",
    "top",
    "earpads",
    "headband",
    "connections",
  ],
};
export type ViewerStatus = "loading" | "ready" | "unavailable";
export type ZoomDirection = "in" | "out";
export type ViewerHandle = {
  setHeadphones?: (model: HeadphoneModel) => void;
  setView: (view: AudioView) => void;
  zoom: (direction: ZoomDirection) => void;
  setInteractive: (enabled: boolean) => void;
  dispose: () => void;
};
