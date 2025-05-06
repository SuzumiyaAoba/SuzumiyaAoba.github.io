import { ImageResponse } from "next/og";
import config from "@/config";

// メタデータ
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = config.metadata.title;

// Edgeランタイムの代わりに静的出力に設定
// export const runtime = "edge";
export const dynamic = "force-static";

// デフォルトのTwitter画像を生成（OGP画像と同じデザイン）
export default function Image() {
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
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "0",
          background:
            "linear-gradient(125deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* 背景装飾 */}
        <div
          style={{
            position: "absolute",
            width: "800px",
            height: "800px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${accentColor}10 100%)`,
            top: "-400px",
            right: "-200px",
            zIndex: "1",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${primaryColor}10 0%, ${accentColor}05 100%)`,
            bottom: "-300px",
            left: "-100px",
            zIndex: "1",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: "2",
            textAlign: "center",
            padding: "40px",
            maxWidth: "800px",
          }}
        >
          {/* サイトタイトル */}
          <div
            style={{
              fontSize: "88px",
              fontWeight: "900",
              color: textColor,
              letterSpacing: "-0.05em",
              marginBottom: "16px",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            {config.metadata.title}
          </div>

          {/* アクセントバー */}
          <div
            style={{
              width: "180px",
              height: "10px",
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
              borderRadius: "5px",
              margin: "24px 0",
              boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)",
            }}
          />

          {/* 説明文 */}
          <div
            style={{
              fontSize: "28px",
              lineHeight: "1.5",
              fontWeight: "500",
              color: lightTextColor,
              maxWidth: "700px",
              marginBottom: "32px",
            }}
          >
            {config.metadata.description}
          </div>

          {/* 著者＆URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(30, 41, 59, 0.7)",
                padding: "12px 24px",
                borderRadius: "9999px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                }}
              >
                {config.metadata.author[0]}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: textColor,
                }}
              >
                {config.metadata.url.replace(/^https?:\/\//, "")}
              </div>
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
