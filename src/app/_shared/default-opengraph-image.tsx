import type { Locale } from "@/shared/lib/routing";
import { SITE_TITLE } from "@/shared/lib/site/site-title";
import {
  OPENGRAPH_COLORS,
  OpengraphBrandMark,
  renderOpengraphImage,
} from "./opengraph-image";

export { OPENGRAPH_IMAGE_SIZE as DEFAULT_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

const SITE_TITLE_GLOSS: Record<Locale, string> = {
  ja: "偽からは、何でも導かれる。",
  en: "From falsehood, anything follows.",
};

/**
 * サイトルート用の既定 OGP 画像を描画する。ja/en の差分はサイト名の訳のみ。
 * ホームの導入と同じく、∴ の印とサイト名を大きく置く。
 */
export async function renderDefaultOpengraphImage(locale: Locale) {
  return await renderOpengraphImage(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px 56px",
        background: OPENGRAPH_COLORS.background,
        color: OPENGRAPH_COLORS.foreground,
        fontFamily: '"Noto Sans JP"',
      }}
    >
      <OpengraphBrandMark size={56} />
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div
          style={{
            display: "flex",
            fontFamily: '"Newsreader"',
            fontStyle: "italic",
            fontSize: 104,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
          }}
        >
          {SITE_TITLE}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: OPENGRAPH_COLORS.subtle,
            letterSpacing: "0.08em",
          }}
        >
          {SITE_TITLE_GLOSS[locale]}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "28px",
          borderTop: `1px solid ${OPENGRAPH_COLORS.rule}`,
          fontSize: 26,
          color: OPENGRAPH_COLORS.muted,
        }}
      >
        <div style={{ display: "flex" }}>SuzumiyaAoba</div>
        <div style={{ display: "flex" }}>suzumiyaaoba.com</div>
      </div>
    </div>
  );
}
