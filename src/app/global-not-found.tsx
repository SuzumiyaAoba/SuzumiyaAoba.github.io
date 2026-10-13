import type { Metadata } from "next";
import "@/app/styles/globals.css";
import { AppRootLayout, buildRootMetadata } from "@/app/_shared/root-layout";
import NotFoundPage from "@/pages/site/not-found";
import { SITE_TITLE } from "@/shared/lib/site/site-title";

/**
 * どのルートにも一致しない URL の 404。言語ごとにルートレイアウトが分かれているため、
 * 共通のレイアウトから 404 を組めず、静的書き出しの 404.html はこのファイルから作られる。
 */
export const metadata: Metadata = {
  ...buildRootMetadata("ja"),
  title: `404 | ${SITE_TITLE}`,
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <AppRootLayout locale="ja">
      <NotFoundPage locale="ja" />
    </AppRootLayout>
  );
}
