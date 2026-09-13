import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "vite-plus/test/browser-playwright";
const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "nextjs", "react", "jsx-a11y", "import"],
    rules: {
      "nextjs/no-html-link-for-pages": "off",
    },
  },
  fmt: {
    sortImports: false,
    sortPackageJson: false,
  },
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["node_modules", ".storybook"],
          environment: "node",
        },
      },
      {
        extends: true,
        // 遅延読み込み中の依存最適化でテストブラウザーがリロードされるのを防ぐ。
        optimizeDeps: { include: ["storybook/test", "d3-transition"] },
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
