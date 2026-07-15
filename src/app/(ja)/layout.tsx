import type { Metadata } from "next";
import "@/app/styles/globals.css";
import "katex/dist/katex.min.css";
import { AppRootLayout, buildRootMetadata } from "@/app/_shared/root-layout";

/**
 * 日本語版の基本メタデータ設定
 */
export const metadata: Metadata = buildRootMetadata("ja");

/**
 * 日本語版のルートレイアウトコンポーネント。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppRootLayout locale="ja">{children}</AppRootLayout>;
}
