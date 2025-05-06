import { ImageResponse } from "next/og";
import config from "@/config";
import { getPaths } from "@/libs/contents/markdown";
import { Pages } from "@/libs/contents/blog";
import { getFrontmatter } from "@/libs/contents/markdown";

// メタデータ
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// 静的生成のパラメータを提供
export async function generateStaticParams() {
  const ids = await getPaths("blog");
  return ids.map((id) => ({
    slug: id,
  }));
}

// 画像生成
export default async function Image({ params }: { params: { slug: string } }) {
  // frontmatterの取得を試みる
  let title;
  let category = "Blog";
  let date = new Date().toLocaleDateString("ja-JP");

  try {
    const frontmatter = await getFrontmatter({
      paths: ["blog", params.slug],
      parser: Pages["blog"].frontmatter,
    });

    if (frontmatter) {
      title = frontmatter.title;
      if (frontmatter.category) {
        category = frontmatter.category;
      }
      if (frontmatter.date) {
        date = new Date(frontmatter.date).toLocaleDateString("ja-JP");
      }
    }
  } catch (error) {
    console.error("Frontmatter取得エラー:", error);
  }

  // タイトルがない場合はslugから生成
  if (!title) {
    title = params.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // テーマカラー
  const primaryColor = "#3B82F6"; // ブルー
  const accentColor = "#06B6D4"; // シアン
  const bgColor = "#0F172A"; // 濃紺（ダークブルー）
  const textColor = "#F8FAFC"; // 明るい白
  const lightTextColor = "#94A3B8"; // グレイブルー

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          width: "100%",
          height: "100%",
          padding: "0",
          background:
            "linear-gradient(125deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* トップバー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "24px 40px",
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(6,182,212,0.8) 100%)",
            color: "white",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              letterSpacing: "-0.025em",
            }}
          >
            {config.metadata.title}
          </div>
          <div style={{ fontSize: "18px" }}>{date}</div>
        </div>

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px",
            flex: 1,
          }}
        >
          {/* カテゴリータグ */}
          <div
            style={{
              display: "block",
              padding: "8px 16px",
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
              color: "white",
              borderRadius: "9999px",
              fontSize: "18px",
              fontWeight: "600",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
              marginBottom: "24px",
              width: "auto",
            }}
          >
            {category}
          </div>

          {/* タイトル */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: "800",
              lineHeight: 1.2,
              marginBottom: "24px",
              color: textColor,
              letterSpacing: "-0.05em",
              maxWidth: "90%",
              overflow: "hidden",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            {title}
          </div>

          {/* 下部デコレーション */}
          <div
            style={{
              width: "120px",
              height: "8px",
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
              borderRadius: "4px",
              marginTop: "auto",
              marginBottom: "24px",
            }}
          />

          {/* フッター */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: lightTextColor,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {config.metadata.author[0]}
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "500",
                }}
              >
                {config.metadata.author}
              </div>
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {config.metadata.url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
