/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { loadShipporiMinchoBold } from "./opengraph-font";

export const CONTENT_OPENGRAPH_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

export type RenderContentOpengraphImageOptions = {
  /** 種別ラベル(例: "Notes", "Series", "Tag", "Book") */
  eyebrow: string;
  title: string;
  tags?: string[];
};

/**
 * notes/series/tags/books 詳細ページ共通の OGP 画像を描画する。
 * ブログ記事用テンプレート(blog-post-opengraph-image)と視覚的に統一したレイアウト。
 */
export async function renderContentOpengraphImage({
  eyebrow,
  title,
  tags = [],
}: RenderContentOpengraphImageOptions) {
  const fontBuffer = await loadShipporiMinchoBold();

  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        padding: "80px",
        fontFamily: '"Shippori Mincho"',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: "#71717a",
            textTransform: "uppercase",
            letterSpacing: 4,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#18181b",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 28,
                  background: "#f3f4f6",
                  color: "#4b5563",
                  padding: "8px 20px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                #{tag}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            fontSize: 40,
            color: "#71717a",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span>suzumiyaaoba.com</span>
        </div>
      </div>
    </div>,
    {
      ...CONTENT_OPENGRAPH_IMAGE_SIZE,
      fonts: [
        {
          name: "Shippori Mincho",
          data: fontBuffer,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
