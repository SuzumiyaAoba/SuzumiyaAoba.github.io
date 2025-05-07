import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import React from "react";
import config from "@/config";

// 基本サイズ設定
export const OG_IMAGE_SIZE = {
  width: 1200,
  height: 630,
};

// コンテンツタイプ
export const OG_CONTENT_TYPE = "image/png";

// テーマカラー
export const THEME = {
  primaryColor: "#3B82F6", // ブルー
  accentColor: "#06B6D4", // シアン
  bgColor: "#0F172A", // 濃紺（ダークブルー）
  textColor: "#F8FAFC", // 明るい白
  lightTextColor: "#94A3B8", // グレイブルー
};

// 日本語フォントパス
export const NOTO_SANS_JP_PATH = path.join(
  process.cwd(),
  "node_modules",
  "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff"
);

// 日本語フォントの読み込み関数
export async function loadJapaneseFont() {
  try {
    return await fs.promises.readFile(NOTO_SANS_JP_PATH);
  } catch (error) {
    console.error("フォント読み込みエラー:", error);
    throw error;
  }
}

// 基本OGPレイアウトコンポーネント
interface OgLayoutProps {
  children: React.ReactNode;
}

export function OgBaseLayout({ children }: OgLayoutProps) {
  return (
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
        fontFamily: '"Noto Sans JP", Inter, system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

// トップバーコンポーネント
interface TopBarProps {
  date?: string;
}

export function TopBar({ date }: TopBarProps) {
  return (
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
      {date && <div style={{ fontSize: "18px" }}>{date}</div>}
    </div>
  );
}

// カテゴリータグコンポーネント
interface CategoryTagProps {
  category: string;
}

export function CategoryTag({ category }: CategoryTagProps) {
  return (
    <div
      style={{
        display: "block",
        padding: "8px 16px",
        background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
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
  );
}

// タイトルコンポーネント
interface TitleProps {
  title: string;
}

export function Title({ title }: TitleProps) {
  return (
    <div
      style={{
        fontSize: "56px",
        fontWeight: "800",
        lineHeight: 1.2,
        marginBottom: "24px",
        color: THEME.textColor,
        letterSpacing: "-0.05em",
        maxWidth: "90%",
        overflow: "hidden",
        textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
      }}
    >
      {title}
    </div>
  );
}

// フッターコンポーネント
export function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: THEME.lightTextColor,
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
            background: `linear-gradient(135deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
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
  );
}

// デコレーションバーコンポーネント
export function DecorationBar() {
  return (
    <div
      style={{
        width: "120px",
        height: "8px",
        background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
        borderRadius: "4px",
        marginTop: "auto",
        marginBottom: "24px",
      }}
    />
  );
}

// OGP画像の生成関数
interface GenerateOgImageOptions {
  title: string;
  category?: string;
  date?: string;
  fontData: Buffer | ArrayBuffer;
}

export async function generateOgImage({
  title,
  category = "Blog",
  date,
  fontData,
}: GenerateOgImageOptions) {
  return new ImageResponse(
    (
      <OgBaseLayout>
        <TopBar date={date} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px",
            flex: 1,
          }}
        >
          <CategoryTag category={category} />
          <Title title={title} />
          <DecorationBar />
          <Footer />
        </div>
      </OgBaseLayout>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}

// ホームページOGP画像の生成関数
interface GenerateHomeOgImageOptions {
  fontData: Buffer | ArrayBuffer;
}

export async function generateHomeOgImage({
  fontData,
}: GenerateHomeOgImageOptions) {
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
          fontFamily: '"Noto Sans JP", Inter, system-ui, sans-serif',
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
            background: `linear-gradient(135deg, ${THEME.primaryColor}15 0%, ${THEME.accentColor}10 100%)`,
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
            background: `linear-gradient(135deg, ${THEME.primaryColor}10 0%, ${THEME.accentColor}05 100%)`,
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
              color: THEME.textColor,
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
              background: `linear-gradient(90deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
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
              color: THEME.lightTextColor,
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
                  background: `linear-gradient(135deg, ${THEME.primaryColor} 0%, ${THEME.accentColor} 100%)`,
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
                  color: THEME.textColor,
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
      ...OG_IMAGE_SIZE,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
