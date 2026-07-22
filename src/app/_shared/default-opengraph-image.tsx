/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/shared/lib/site/site-title";
import { loadShipporiMinchoBold } from "./opengraph-font";

export const DEFAULT_OPENGRAPH_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

/**
 * サイトルート用の既定 OGP 画像を描画する。ja/en で完全に共通。
 */
export async function renderDefaultOpengraphImage() {
  const fontBuffer = await loadShipporiMinchoBold();

  return new ImageResponse(
    <div
      style={{
        background: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
        fontFamily: '"Shippori Mincho"',
      }}
    >
      <div
        style={{
          fontSize: 100,
          fontWeight: 700,
          color: "#18181b",
          textAlign: "center",
        }}
      >
        {SITE_TITLE}
      </div>
      <div
        style={{
          marginTop: "40px",
          fontSize: 40,
          color: "#71717a",
        }}
      >
        suzumiyaaoba.com
      </div>
    </div>,
    {
      ...DEFAULT_OPENGRAPH_IMAGE_SIZE,
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
