import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { staticAssets } from "./src/site/static-assets";
import { reactIslands } from "./src/site/react-islands-plugin.ts";

// Astro 標準の MDX ではなく、React 向けの MDX を生成して island 全体を hydrate する。
export default defineConfig({
  site: "https://suzumiyaaoba.com",
  srcDir: "./src/astro",
  outDir: "./out",
  output: "static",
  trailingSlash: "always",
  integrations: [react(), staticAssets()],
  vite: {
    build: {
      // 遅延ロードする Code Hike のハイライターは Oniguruma WASM を内包し、約 735 kB になる。
      // 単一モジュールを分割できないため、このサイズを許容し、それ以上の増加は警告する。
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        onwarn(warning, warn) {
          // Zod の説明コメント内の注釈文字列は実行コードに影響しない。
          // 正規の PURE 注釈や他の依存パッケージの警告は従来どおり検査する。
          if (
            warning.code === "INVALID_ANNOTATION" &&
            /\/node_modules\/zod\/v4\/core\/(?:util|regexes)\.js$/u.test(
              warning.id ?? ""
            ) &&
            warning.message.includes("`@__PURE__`")
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
    server: {
      // dev と build を併用しても、生成物でファイル監視を発火させない。
      watch: { ignored: ["**/out/**"] },
    },
    resolve: {
      alias: [
        {
          find: "@/content",
          replacement: fileURLToPath(new URL("content", import.meta.url)),
        },
        ...["pages", "entities", "features", "widgets"].map((layer) => ({
          find: `@/${layer}`,
          replacement: fileURLToPath(
            new URL(`src/foundation/${layer}`, import.meta.url)
          ),
        })),
        {
          find: "@/shared",
          replacement: fileURLToPath(
            new URL("src/foundation/shared", import.meta.url)
          ),
        },
        {
          find: "@",
          replacement: fileURLToPath(new URL("src", import.meta.url)),
        },
      ],
    },
    plugins: [reactIslands()],
  },
});
