/**
 * UI定数
 */
export const uiConfig = {
  header: {
    height: 64, // ヘッダーの高さ（ピクセル）
    mobileMenuMaxHeight: 450, // モバイルメニューの最大高さ（ピクセル）
  },
  pagination: {
    postsPerPage: 10,
  },
  theme: {
    defaultTheme: "system" as const,
    themes: ["light", "dark", "system"] as const,
  },
} as const;

export type Theme = (typeof uiConfig.theme.themes)[number];
