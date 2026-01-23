/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { SITE_TITLE } from "@/shared/lib/site/site-title";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const dynamic = "force-static";

export default async function Image() {
  // Font loading
  const fontData = await fetch(
    new URL("https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&display=swap").href,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Droid Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
      },
    },
  ).then((res) => res.text());

  const fontUrl = fontData.match(/src: url\((.+?)\) format\(['"]?truetype['"]?\)/)?.[1];

  if (!fontUrl) {
    throw new Error("Failed to load font");
  }

  const fontBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

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
      ...size,
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
