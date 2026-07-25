import { Noto_Sans_JP, Shippori_Mincho, Source_Code_Pro } from "next/font/google";

export const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  // 日本語グリフは next/font/google の subsets では絞り込めず、preload すると
  // Unicode range 分割された woff2 が数百ファイル先読みされてしまうため無効化する。
  preload: false,
});

export const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  preload: false,
});
