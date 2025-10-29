import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss"
import presetAnimations from "unocss-preset-animations"
import { presetShadcn } from "unocss-preset-shadcn"

export default defineConfig({
  content: {
    // 限定的にスキャンし、node_modules/.next/storybook-static 等は除外
    filesystem: [
      "src/**/*.{html,js,ts,jsx,tsx,md,mdx,css,scss}",
      "scripts/**/*.{js,ts}",
      "public/**/*.{html}",
      "README.md",
    ],
  },
  presets: [
    presetWind4({
      dark: "class",
      darkSelector: '[data-theme="dark"]',
    }),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        display: "inline-block",
        "vertical-align": "middle",
      },
    }),
    presetWebFonts(),
    presetAnimations(),
    presetShadcn(),
    presetTypography(),
  ],
  theme: {
    colors: {
      // カスタムカラーパレット
      primary: {
        DEFAULT: "var(--color-primary)",
        light: "#4f46e5", // インディゴ
        dark: "#818cf8", // 明るいインディゴ
      },
      background: {
        DEFAULT: "var(--color-background)",
        light: "#ffffff",
        dark: "#1e1e2e",
      },
      text: {
        DEFAULT: "var(--color-text)",
        light: "#1e293b",
        dark: "#e2e8f0",
      },
    },
  },
  shortcuts: {
    // よく使うパターンのショートカット
    btn: "px-4 py-2 rounded-lg transition-colors duration-200",
    "btn-primary": "btn bg-primary text-white hover:opacity-90",
    card: "bg-background rounded-xl p-4 shadow-md border border-text/10",
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: [
    "[data-theme='dark']",
    "[data-theme='light']",
    "[data-theme='system']",
    // Language toggle icon
    "i-material-symbols-translate",
  ],
})
