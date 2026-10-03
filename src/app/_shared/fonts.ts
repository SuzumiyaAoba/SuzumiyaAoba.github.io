import {
  Inter as interFont,
  Newsreader as newsreaderFont,
  Source_Code_Pro as sourceCodeProFont,
} from "next/font/google";

/** 欧文の本文・UI 用。和文は端末内のゴシック体に任せ、日本語 Web フォントの取得を避ける。 */
export const inter = interFont({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** サイト名（ラテン語）のロゴタイプと、欧文の見出し装飾に限って使うセリフ体。 */
export const newsreader = newsreaderFont({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  display: "swap",
});

export const sourceCodePro = sourceCodeProFont({
  variable: "--font-source-code-pro",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});
