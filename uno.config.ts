import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  presetWind,
  presetTypography,
} from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx,md,mdx}"],
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
    presetWebFonts(),
    presetWind(),
    presetAnimations(),
    presetShadcn(),
    presetTypography(),
  ],
  theme: {
    colors: {
      // ライトテーマのカラー
      light: {
        primary: "#3b82f6", // blue-500
        secondary: "#64748b", // slate-500
        background: "#ffffff",
        text: "#1e293b", // slate-800
      },
      // ダークテーマのカラー
      dark: {
        primary: "#60a5fa", // blue-400
        secondary: "#94a3b8", // slate-400
        background: "#1e293b", // slate-800
        text: "#f8fafc", // slate-50
      },
    },
  },
  shortcuts: {
    // テーマに基づいたショートカット
    btn: "px-6 py-2 rounded transition-colors",
    "btn-primary": "bg-theme-primary text-white hover:bg-opacity-90",
    card: "bg-theme-background text-theme-text rounded-lg shadow-md p-4",
  },
  rules: [
    // カスタムルールを追加して、テーマカラーにアクセスする
    [
      /^bg-theme-(.*)$/,
      ([, name], { theme }) => {
        const themeMode = "var(--theme-mode, light)";
        const color = `var(--${name}-color)`;
        return { "background-color": color };
      },
    ],
    [
      /^text-theme-(.*)$/,
      ([, name], { theme }) => {
        const color = `var(--${name}-color)`;
        return { color: color };
      },
    ],
  ],
});
