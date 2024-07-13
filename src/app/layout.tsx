import type { Metadata } from "next";
import "./globals.css";
import config from "@/config";
import { exo_2, zen_maru_gothic } from "@/fonts";
import { Header } from "@/components/Header";
import clsx from "clsx";
import { Footer } from "@/components/Footer";
import styles from "./layout.module.scss";

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
      <head />
      <body className={clsx(zen_maru_gothic.className, exo_2.variable)}>
        <div className={styles.wrapper}>
          <Header siteName={config.metadata.title} />
          {children}
          <Footer
            copyright="SuzumiyaAoba"
            poweredBy={{
              name: "Next.js",
              url: "https://nextjs.org",
            }}
          />
        </div>
      </body>
    </html>
  );
}
