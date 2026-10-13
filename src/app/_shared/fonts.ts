/*
 * 欧文の Web フォントだけをここで定義する。見出しの明朝体と本文の和文ゴシックは端末の書体を使い、
 * 日本語 Web フォントは取得しない（分割定義だけで全ページの CSS が大きく膨らむため）。
 */
import {
  IBM_Plex_Mono as ibmPlexMonoFont,
  IBM_Plex_Sans as ibmPlexSansFont,
  Libre_Caslon_Text as libreCaslonTextFont,
} from "next/font/google";

/**
 * 本文・UI の欧文。和文は端末内のゴシック体に任せ、本文用の日本語 Web フォントは取得しない。
 * 機械的な骨格を持つ Plex は、技術記事に混ざる英単語やコード名とよくなじむ。
 */
export const ibmPlexSans = ibmPlexSansFont({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

/** コード・数表用。本文の Plex Sans と骨格をそろえる。コードのないページでは取得しないよう先読みしない。 */
export const ibmPlexMono = ibmPlexMonoFont({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/**
 * サイト名（ラテン語）の推論図に限って使うキャスロンの斜体と、欧文の飾り数字。
 * Caslon Text は本文サイズ向けに設計されており、ヘッダーの小さなロゴでも潰れない。
 */
export const libreCaslonText = libreCaslonTextFont({
  variable: "--font-caslon",
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
