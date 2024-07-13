import type { Metadata } from "next";
import "./globals.css";
import config from "@/config";
import { exo_2, zen_maru_gothic } from "@/fonts";
import { Header } from "@/components/Header";
import clsx from "clsx";

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={clsx(zen_maru_gothic.className, exo_2.variable)}>
        <Header siteName={config.metadata.title} />
        {children}
      </body>
    </html>
  );
}
