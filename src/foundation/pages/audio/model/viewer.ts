import type { Camera, Group } from "three";

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
  "display",
  "circuit",
  "connections",
  "side",
  "earpads",
  "headband",
  "grille",
  "tubes",
  "dials",
  "housing",
  "eartips",
  "cable",
] as const;
export const audioModels = [
  "system",
  "ud-505",
  "cg-10m",
  "node-n130",
  "ha-1a-mk2",
  "sigma-pro",
  "btr17",
  "hd-800s",
  "clear-mg-pro",
  "ie-600",
  "audioquest-cinnamon",
  "cybershaft-bnc",
] as const;
export type AudioModel = (typeof audioModels)[number];
export type EquipmentModel = Exclude<AudioModel, "system">;
export const headphoneModels = ["hd-800s", "clear-mg-pro", "ie-600"] as const;
export type HeadphoneModel = (typeof headphoneModels)[number];
export const headphoneNames: Record<HeadphoneModel, string> = {
  "hd-800s": "HD 800 S",
  "clear-mg-pro": "Clear Mg Professional",
  "ie-600": "IE 600",
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
  "sigma-pro": [
    "overview",
    "front",
    "rear",
    "side",
    "top",
    "circuit",
    "bottom",
    "headphones",
    "display",
    "connections",
  ],
  btr17: [
    "overview",
    "front",
    "rear",
    "side",
    "top",
    "bottom",
    "display",
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
  "ie-600": [
    "overview",
    "front",
    "rear",
    "top",
    "housing",
    "eartips",
    "connections",
    "cable",
  ],
  "audioquest-cinnamon": ["overview", "top", "connections", "cable"],
  "cybershaft-bnc": ["overview", "top", "connections", "cable"],
};
export type ViewerStatus = "loading" | "ready" | "unavailable";
export type ZoomDirection = "in" | "out";
export type AudioScene = {
  group: Group;
  dispose: () => void;
  setHeadphones?: (model: HeadphoneModel) => void | Promise<void>;
  updateDetail?: (camera: Camera, viewportHeight: number) => boolean;
};
export type AudioModelBuilder = (onChange?: () => void) => AudioScene;
export type ViewerHandle = {
  setModel: (model: AudioModel, createModel: AudioModelBuilder) => void;
  setHeadphones?: (model: HeadphoneModel) => void;
  setView: (view: AudioView) => void;
  zoom: (direction: ZoomDirection) => void;
  setInteractive: (enabled: boolean) => void;
  dispose: () => void;
};
