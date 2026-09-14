import {
  Shippori_Mincho as shipporiMinchoFont,
  Source_Code_Pro as sourceCodeProFont,
  Source_Sans_3 as sourceSans3Font,
} from "next/font/google";

export const sourceSans3 = sourceSans3Font({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  display: "swap",
});

export const sourceCodePro = sourceCodeProFont({
  variable: "--font-source-code-pro",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const shipporiMincho = shipporiMinchoFont({
  variable: "--font-shippori-mincho",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  // 日本語グリフは next/font/google の subsets では絞り込めず、preload すると
  // Unicode range 分割された woff2 が数百ファイル先読みされてしまうため無効化する。
  preload: false,
});
