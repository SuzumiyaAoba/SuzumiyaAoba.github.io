/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getBlogPost, getBlogSlugs } from "@/entities/blog";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const dynamic = "force-static";

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const title = post?.frontmatter.title || slug;
  const tags = post?.frontmatter.tags || [];

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

  // Extract the font file URL from the CSS response
  const fontUrl = fontData.match(/src: url\((.+?)\) format\(['"]?truetype['"]?\)/)?.[1];

  if (!fontUrl) {
    console.error("Failed to extract font URL from CSS:", fontData);
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
                  fontSize: 32,
                  background: "#f3f4f6", // gray-100
                  color: "#4b5563", // gray-600
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
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#18181b", // zinc-900
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {title}
        </div>
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
            color: "#71717a", // zinc-500
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* You can add site icon here if available */}
          <span>suzumiyaaoba.com</span>
        </div>
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
