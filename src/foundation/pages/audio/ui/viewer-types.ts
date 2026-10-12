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
export type AudioModel =
  | "ud-505"
  | "cg-10m"
  | "node-n130"
  | "ha-1a-mk2"
  | "hd-800s"
  | "clear-mg-pro";
export type AudioView = (typeof viewNames)[number];
export const modelViews: Record<AudioModel, readonly AudioView[]> = {
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
export type ViewerHandle = {
  setView: (view: AudioView) => void;
  zoom: (direction: "in" | "out") => void;
  setInteractive: (enabled: boolean) => void;
  dispose: () => void;
};
