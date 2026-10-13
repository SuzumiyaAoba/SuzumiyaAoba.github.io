import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { loadOpengraphFonts } from "./opengraph-font";

export const OPENGRAPH_IMAGE_SIZE = { width: 1200, height: 630 };

/** サイトのライトテーマ（globals.css の :root）と同じ色。紙・墨・朱の三色。 */
export const OPENGRAPH_COLORS = {
  background: "#fcfcfb",
  foreground: "#161514",
  muted: "#5c5852",
  subtle: "#8c8780",
  brand: "#c8361c",
  rule: "#e3e0da",
} as const;

const SITE_DOMAIN = "suzumiyaaoba.com";
const SANS = '"Noto Sans JP"';
const SERIF = '"Noto Serif JP"';
const LATIN = '"Libre Caslon Text"';
/** 下部に並べるタグの上限。多すぎると 1 行に収まらない。 */
const MAX_TAGS = 4;
/** 欧文 1 文字の幅を、和文 1 文字に対する比で表したおおよその値。 */
const LATIN_WIDTH_RATIO = 0.55;
/** これより大きい符号位置を全角幅（和文）とみなす。 */
const LATIN_CODE_POINT_MAX = 0xff;
const NO_ITEMS: string[] = [];

export async function renderOpengraphImage(content: ReactElement) {
  return new ImageResponse(content, {
    ...OPENGRAPH_IMAGE_SIZE,
    fonts: await loadOpengraphFonts(),
  });
}

/**
 * サイト名の推論図。ヘッダーのロゴと同じく、前提 Ex falso と結論 quodlibet を朱の線で隔てる。
 * size は欧文の字の大きさ（px）。showRule で線の右に sequitur を添える。
 */
export function OpengraphLockup({
  size,
  showRule = false,
}: {
  size: number;
  showRule?: boolean;
}) {
  const word = {
    display: "flex",
    padding: `0 ${Math.round(size * 0.3)}px`,
    fontFamily: LATIN,
    fontStyle: "italic",
    fontSize: size,
    lineHeight: 1,
    color: OPENGRAPH_COLORS.foreground,
  } as const;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={word}>Ex falso</div>
      <div
        style={{
          display: "flex",
          alignSelf: "stretch",
          height: Math.max(2, Math.round(size * 0.04)),
          margin: `${Math.round(size * 0.24)}px 0 ${Math.round(size * 0.2)}px`,
          background: OPENGRAPH_COLORS.brand,
        }}
      />
      <div style={word}>quodlibet</div>
      {showRule ? (
        <div
          style={{
            position: "absolute",
            left: "100%",
            top: Math.round(size * 0.98),
            display: "flex",
            marginLeft: Math.round(size * 0.18),
            fontFamily: LATIN,
            fontStyle: "italic",
            fontSize: Math.round(size * 0.42),
            lineHeight: 1,
            color: OPENGRAPH_COLORS.foreground,
          }}
        >
          sequitur
        </div>
      ) : null}
    </div>
  );
}

/** 和文を 1、欧文を約半分として、見た目の文字幅を見積もる。 */
function visualLength(text: string): number {
  let length = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0;
    length += codePoint > LATIN_CODE_POINT_MAX ? 1 : LATIN_WIDTH_RATIO;
  }
  return length;
}

/** タイトルが長いほど文字を小さくし、3 行以内に収める。 */
function titleFontSize(title: string): number {
  const length = visualLength(title);
  if (length <= 18) {
    return 78;
  }
  if (length <= 30) {
    return 66;
  }
  if (length <= 44) {
    return 58;
  }
  return 50;
}

/**
 * OGP 画像の共通の枠。上に小さな推論図、下に墨の罫とドメインを置き、中央に内容を入れる。
 */
export function OpengraphFrame({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 80px 52px",
        background: OPENGRAPH_COLORS.background,
        color: OPENGRAPH_COLORS.foreground,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex" }}>
        <OpengraphLockup size={30} />
      </div>
      {children}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "32px",
          paddingTop: "26px",
          borderTop: `2px solid ${OPENGRAPH_COLORS.foreground}`,
          fontSize: 25,
          color: OPENGRAPH_COLORS.muted,
        }}
      >
        <div style={{ display: "flex", overflow: "hidden" }}>{footer}</div>
        <div style={{ display: "flex", flexShrink: 0 }}>{SITE_DOMAIN}</div>
      </div>
    </div>
  );
}

/** タグを文字だけで並べる（サイトの記事ヘッダーと同じ表記）。 */
export function OpengraphTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div style={{ display: "flex", gap: "24px" }}>
      {tags.slice(0, MAX_TAGS).map((tag) => (
        <div key={tag} style={{ display: "flex" }}>
          #{tag}
        </div>
      ))}
    </div>
  );
}

/**
 * 記事・連載・タグ・書籍などの OGP 画像。種別（kicker）を朱の角印とともに置き、
 * 題を明朝で大きく組む。下部にタグを添える。
 */
export function ArticleOpengraphImage({
  kicker,
  meta = NO_ITEMS,
  title,
  tags = NO_ITEMS,
}: {
  /** 種別ラベル（例: 記事、連載、タグ） */
  kicker: string;
  /** 種別ラベルの横に添える補足（カテゴリ・日付など） */
  meta?: string[];
  title: string;
  tags?: string[];
}) {
  return (
    <OpengraphFrame footer={<OpengraphTags tags={tags} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            fontSize: 27,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              background: OPENGRAPH_COLORS.brand,
            }}
          />
          <div
            style={{
              display: "flex",
              color: OPENGRAPH_COLORS.foreground,
              letterSpacing: "0.12em",
            }}
          >
            {kicker}
          </div>
          {meta.map((item) => (
            <div
              key={item}
              style={{ display: "flex", color: OPENGRAPH_COLORS.muted }}
            >
              {item}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "block",
            fontFamily: SERIF,
            fontSize: titleFontSize(title),
            fontWeight: 700,
            lineHeight: 1.42,
            letterSpacing: "0.02em",
            lineClamp: 3,
          }}
        >
          {title}
        </div>
      </div>
    </OpengraphFrame>
  );
}
