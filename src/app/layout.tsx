import type { Metadata } from "next";
import "./globals.css";
import config from "@/config";
import { exo_2, mono as monoFont, zen_maru_gothic } from "@/fonts";
import { Header } from "@/components/Header";
import clsx from "clsx";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
  generator: "Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={clsx(
          zen_maru_gothic.className,
          exo_2.variable,
          monoFont.variable,
          "flex flex-col w-full h-screen"
        )}
      >
        <Header siteName={config.metadata.title} />
        {children}
        <Footer
          copyright="SuzumiyaAoba"
          poweredBy={{
            name: "Next.js",
            url: "https://nextjs.org",
          }}
        />
      </body>
    </html>
  );
}
