/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getBlogPost, getBlogSlugs } from "@/entities/blog";
import type { Locale } from "@/shared/lib/routing";

export const BLOG_POST_OPENGRAPH_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

/**
 * ブログ記事詳細の generateStaticParams。ja/en で完全に共通。
 */
export async function generateBlogPostOpengraphStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * ブログ記事詳細用の OGP 画像を描画する。ja/en の差分は取得する記事の locale のみ。
 */
export async function renderBlogPostOpengraphImage(slug: string, locale: Locale) {
  const post = await getBlogPost(slug, { locale, fallback: true });
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
      ...BLOG_POST_OPENGRAPH_IMAGE_SIZE,
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
