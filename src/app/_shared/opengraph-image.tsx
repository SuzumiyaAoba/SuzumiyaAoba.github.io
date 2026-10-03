import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/shared/lib/site/site-title";
import { loadOpengraphFonts } from "./opengraph-font";

export const OPENGRAPH_IMAGE_SIZE = { width: 1200, height: 630 };

/** サイトのライトテーマ（globals.css の :root）と同じ色。 */
export const OPENGRAPH_COLORS = {
  background: "#faf9f6",
  foreground: "#1f1e1b",
  muted: "#66635c",
  subtle: "#8d897f",
  brand: "#3e5a86",
  rule: "#e4e0d7",
} as const;

const SITE_DOMAIN = "suzumiyaaoba.com";
const SANS = '"Noto Sans JP"';
const DISPLAY = '"Newsreader"';
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

/** サイトの印 ∴。ヘッダーのロゴと同じ図形。 */
export function OpengraphBrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="6.5" r="2.25" fill={OPENGRAPH_COLORS.brand} />
      <circle cx="5.75" cy="17.5" r="2.25" fill={OPENGRAPH_COLORS.brand} />
      <circle cx="18.25" cy="17.5" r="2.25" fill={OPENGRAPH_COLORS.brand} />
    </svg>
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
    return 76;
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
 * OGP 画像の共通の枠。上にロゴ、下に罫線とドメインを置き、中央に内容を入れる。
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
        padding: "64px 80px 56px",
        background: OPENGRAPH_COLORS.background,
        color: OPENGRAPH_COLORS.foreground,
        fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <OpengraphBrandMark size={30} />
        <div
          style={{
            display: "flex",
            fontFamily: DISPLAY,
            fontStyle: "italic",
            fontSize: 32,
            color: OPENGRAPH_COLORS.foreground,
          }}
        >
          {SITE_TITLE}
        </div>
      </div>
      {children}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "32px",
          paddingTop: "28px",
          borderTop: `1px solid ${OPENGRAPH_COLORS.rule}`,
          fontSize: 26,
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
 * 記事・連載・タグ・書籍などの OGP 画像。種別（kicker）とタイトルを大きく置き、
 * 下部にタグを添える。
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
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              color: OPENGRAPH_COLORS.brand,
              fontWeight: 700,
              letterSpacing: "0.04em",
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
            fontSize: titleFontSize(title),
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: "0.01em",
            lineClamp: 3,
          }}
        >
          {title}
        </div>
      </div>
    </OpengraphFrame>
  );
}
