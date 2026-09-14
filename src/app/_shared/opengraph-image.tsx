import type { ReactElement, ReactNode } from "react";
import { ImageResponse } from "next/og";
import { loadShipporiMinchoBold } from "./opengraph-font";

export const OPENGRAPH_IMAGE_SIZE = { width: 1200, height: 630 };

export async function renderOpengraphImage(content: ReactElement) {
  const fontBuffer = await loadShipporiMinchoBold();
  return new ImageResponse(content, {
    ...OPENGRAPH_IMAGE_SIZE,
    fonts: [{ name: "Shippori Mincho", data: fontBuffer, style: "normal", weight: 700 }],
  });
}

export function OpengraphTags({ tags, fontSize = 28 }: { tags: string[]; fontSize?: number }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
      {tags.map((tag) => (
        <div
          key={tag}
          style={{
            fontSize,
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
  );
}

/** 記事種別ごとのラベル・タグの位置を保ち、タイトルと外枠を共有する。 */
export function ArticleOpengraphImage({
  title,
  beforeTitle,
  afterTitle,
}: {
  title: string;
  beforeTitle?: ReactNode;
  afterTitle?: ReactNode;
}) {
  return (
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
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {beforeTitle}
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
        {afterTitle}
      </div>
      <div
        style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "flex-end" }}
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
    </div>
  );
}
