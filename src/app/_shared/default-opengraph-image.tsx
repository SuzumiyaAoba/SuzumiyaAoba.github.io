import type { Locale } from "@/shared/lib/routing";
import {
  OPENGRAPH_COLORS,
  OpengraphLockup,
  renderOpengraphImage,
} from "./opengraph-image";

export { OPENGRAPH_IMAGE_SIZE as DEFAULT_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

/** 縦に一字ずつ積む和訳。縦組みの約物は位置が変わるため句読点を省く。同じ字が並ぶため位置を識別子にする。 */
const VERTICAL_GLOSS = Array.from(
  "偽からは何でも導かれる",
  (char, position) => ({
    char,
    id: `${position}-${char}`,
  })
);

/**
 * サイトルート用の既定 OGP 画像を描画する。ホームの冒頭と同じく、
 * 左にサイト名の推論図、右端に和訳を縦に置く。英語版は和訳の代わりに英訳を添える。
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
        padding: "64px 80px 52px",
        background: OPENGRAPH_COLORS.background,
        color: OPENGRAPH_COLORS.foreground,
        fontFamily: '"Noto Sans JP"',
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", paddingTop: "28px" }}>
          <OpengraphLockup size={112} showRule />
        </div>
        {locale === "ja" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              fontFamily: '"Noto Serif JP"',
              fontWeight: 700,
              fontSize: 30,
              lineHeight: 1.1,
              color: OPENGRAPH_COLORS.foreground,
            }}
          >
            {VERTICAL_GLOSS.map(({ char, id }) => (
              <div key={id} style={{ display: "flex" }}>
                {char}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              maxWidth: 260,
              fontFamily: '"Libre Caslon Text"',
              fontStyle: "italic",
              fontSize: 30,
              lineHeight: 1.4,
              textAlign: "right",
              color: OPENGRAPH_COLORS.muted,
            }}
          >
            From falsehood, anything follows.
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "26px",
          borderTop: `2px solid ${OPENGRAPH_COLORS.foreground}`,
          fontSize: 25,
          color: OPENGRAPH_COLORS.muted,
        }}
      >
        <div style={{ display: "flex" }}>SuzumiyaAoba</div>
        <div style={{ display: "flex" }}>suzumiyaaoba.com</div>
      </div>
    </div>
  );
}
