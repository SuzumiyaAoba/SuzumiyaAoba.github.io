import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "vite-plus/test/browser-playwright";
import ultraciteCore from "ultracite/oxlint/core";
import ultraciteReact from "ultracite/oxlint/react";
import ultraciteNext from "ultracite/oxlint/next";
import ultraciteVitest from "ultracite/oxlint/vitest";
import ultraciteFmt from "ultracite/oxfmt";

const dirname =
  typeof __dirname === "undefined"
    ? path.dirname(fileURLToPath(import.meta.url))
    : __dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  lint: {
    // Ultracite のプリセットを Baseline とし、rules / overrides でプロジェクト固有の調整を行う。
    // plugins / categories はプリセット側で定義済みのためここでは指定しない。
    extends: [ultraciteCore, ultraciteReact, ultraciteNext, ultraciteVitest],
    // @shadcn/lint は Oxlint の JS プラグインとして読み込む（Knip 等のためルートでも宣言）。
    jsPlugins: [{ name: "shadcn", specifier: "@shadcn/lint" }],
    options: {
      typeAware: true,
      denyWarnings: true,
      reportUnusedDisableDirectives: "error",
    },
    env: { browser: true, node: true },
    // 生成物の修正は生成元で行う。
    ignorePatterns: [
      ...(ultraciteCore.ignorePatterns ?? []),
      "src/foundation/shared/ui/icon/icon-data.ts",
      "src/foundation/shared/ui/icon/icon-data.client.ts",
    ],
    // 共有 UI は @/shared/ui/* エイリアスで import される（components.json の @/components/ui は未使用）。
    settings: {
      shadcn: { ui: "@/shared/ui" },
    },
    rules: {
      // App Router と react-jsx は従来の Pages Router / React import を要求しない。
      "nextjs/no-html-link-for-pages": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-filename-extension": [
        "error",
        { extensions: [".jsx", ".tsx"] },
      ],
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      "react/only-export-components": [
        "error",
        {
          allowConstantExport: true,
          allowExportNames: [
            "buttonVariants",
            "badgeVariants",
            "providerStyles",
            "providerLabel",
            "kindLabel",
            "useActiveAnchors",
            "useActiveAnchor",
            "useTOCItems",
          ],
        },
      ],
      // 推論済みの型の再記述や、外部 API の可変型の全面変換は要求しない。
      "typescript/explicit-function-return-type": "off",
      "typescript/explicit-module-boundary-types": "off",
      "typescript/prefer-readonly-parameter-types": "off",
      "typescript/consistent-type-definitions": ["error", "type"],
      "typescript/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true, ignoreVoidOperator: true },
      ],
      "typescript/strict-boolean-expressions": [
        "error",
        { allowNullableBoolean: true, allowNullableString: true },
      ],
      // named export を基本とし、公開 API は定義の近くに記述する。
      "import/no-named-export": "off",
      "import/prefer-default-export": "off",
      "import/group-exports": "off",
      "import/exports-last": "off",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      // 空文字へのフォールバックと nullish のフォールバックを区別して使う。
      "typescript/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],
      "import/no-namespace": "off",
      "import/no-relative-parent-imports": "off",
      "import/no-unassigned-import": [
        "error",
        { allow: ["**/*.css", "d3-transition", "ts-reset"] },
      ],
      // Node.js のビルド処理、ESM、React の props / render API で必要な構文。
      "import/no-nodejs-modules": "off",
      "node/no-sync": "off",
      "node/no-process-env": "off",
      "node/no-top-level-await": "off",
      "oxc/no-async-await": "off",
      "oxc/no-optional-chaining": "off",
      "oxc/no-rest-spread-properties": "off",
      "react/forbid-component-props": "off",
      "react/jsx-props-no-spreading": "off",
      "react/jsx-no-literals": "off",
      "react/no-multi-comp": "off",
      "react/function-component-definition": [
        "error",
        {
          namedComponents: [
            "function-declaration",
            "arrow-function",
            "function-expression",
          ],
          unnamedComponents: "arrow-function",
        },
      ],
      // React Compiler 未導入。実験的なコンパイラ解析とは独立に Hooks を検証する。
      "react/react-compiler": "off",
      "react/rules-of-hooks": "error",
      "unicorn/no-null": "off",
      "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
      "no-undefined": "off",
      "no-void": ["error", { allowAsStatement: true }],
      "no-ternary": "off",
      "no-nested-ternary": "off",
      // このルールの修正用の括弧は Oxfmt が除去するため競合する。
      "unicorn/no-nested-ternary": "off",
      "no-continue": "off",
      "no-plusplus": ["error", { allowForLoopAfterthoughts: true }],
      "init-declarations": "off",
      // 型付き版のルールで Promise を返す関数も正しく判定する。
      "require-await": "off",
      // useEffect は必要な場合だけ cleanup を返す。戻り値の型は TypeScript が検証する。
      "typescript/consistent-return": "off",
      "no-console": ["error", { allow: ["warn", "error", "time", "timeEnd"] }],
      "no-use-before-define": ["error", { functions: false, typedefs: false }],
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      // 整形は Oxfmt が担当。順序・名称・行数の一律制限は行わない。
      "sort-imports": "off",
      "sort-keys": "off",
      "capitalized-comments": "off",
      "no-inline-comments": "off",
      "id-length": "off",
      "no-underscore-dangle": "off",
      "no-magic-numbers": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      complexity: "off",
      "import/max-dependencies": "off",
      "react/jsx-max-depth": "off",
      // 外部ライブラリの位置引数・コールバック・正規表現の形式を許容する。
      "max-params": "off",
      "unicorn/max-nested-calls": "off",
      "prefer-named-capture-group": "off",
      "unicorn/prefer-number-coercion": "off",
      // await 後のプロパティ参照と、不変データを作る map 内のコピーを許容する。
      "unicorn/no-await-expression-member": "off",
      "oxc/no-map-spread": "off",
      "unicorn/filename-case": [
        "error",
        { cases: { kebabCase: true, pascalCase: true, camelCase: true } },
      ],
      // TypeScript の型と日本語の説明を JSDoc に重複させない。
      "jsdoc/require-param": "off",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/require-returns-type": "off",
      // ultracite/oxlint/shadcn プリセット相当。@shadcn/lint でデザインシステムの
      // クラス使用を検査する。allow: ["layout"] でページ側のレイアウト調整は許容する。
      "shadcn/no-arbitrary-values": ["error", { allow: ["layout"] }],
      "shadcn/no-inline-styles": "error",
      // text-micro/mini/label は globals.css の --text-* で宣言したフォントサイズ
      // トークン。text-* は色ユーティリティと名前空間を共有するため allow で除外する。
      "shadcn/no-raw-colors": [
        "error",
        { allow: ["text-micro", "text-mini", "text-label"] },
      ],
      "shadcn/no-restyle": [
        "error",
        {
          allow: ["layout"],
          contracts: [
            // Icon は任意の SVG を描く生プリミティブで、呼び出し側の色指定が API の一部。
            { pattern: "^Icon$", allow: ["layout", "color"] },
            // BackLink はリンク用のユーティリティで、配置・余白・文字サイズを呼び出し側が決める。
            {
              pattern: "^BackLink$",
              allow: ["layout", "spacing", "typography"],
            },
          ],
        },
      ],
      // Tailwind が生成しないクラスは実バグ（タイポ・死んだクラス）のため error を維持。
      // adsbygoogle は Google AdSense が実行時に付与するクラス。
      "shadcn/no-unknown-classes": ["error", { allow: ["adsbygoogle"] }],
      "shadcn/require-static-classes": "error",
    },
    overrides: [
      {
        // 固定の別オリジンに埋め込む YouTube / Google Forms は scripts と same-origin の両方が必要。
        // 親と同一オリジンの場合に sandbox を解除できる組み合わせとして一律に検出される。
        files: [
          "src/foundation/shared/ui/mdx/youtube-embed.tsx",
          "src/foundation/pages/site/contact/ui/page.tsx",
        ],
        rules: { "react/iframe-missing-sandbox": "off" },
      },
      {
        // HTML の script から直接読み込むブラウザースクリプト。
        files: ["public/pagefind-adapter.js"],
        rules: { "import/unambiguous": "off" },
      },
      {
        // ストーリー用セグメントに実行時エクスポートを公開しない。
        files: ["src/foundation/shared/ui/storybook/index.ts"],
        rules: { "unicorn/require-module-specifiers": "off" },
      },
      {
        // フックとそのフックが返す内部コンポーネントを同じモジュールで管理する。
        files: ["src/foundation/pages/archive/ai-news/ui/release-popover.tsx"],
        rules: { "react/only-export-components": "off" },
      },

      {
        // Code Hike の描画ハンドラーはコンポーネントを含むデータオブジェクト。
        files: ["src/foundation/shared/ui/mdx/codehike-*.tsx"],
        rules: { "react/only-export-components": "off" },
      },
      {
        // SVG・JSON-LD・検索抜粋は各生成器が作成したマークアップを描画する。
        files: [
          "src/foundation/shared/ui/icon/render.tsx",
          "src/foundation/shared/ui/seo/jsonld.tsx",
          "src/foundation/shared/ui/mdx/mermaid.tsx",
          "src/foundation/pages/site/search/ui/search-panel.tsx",
        ],
        rules: { "react/no-danger": "off" },
      },
      {
        // 文書中の静的なコード例・注釈は同じラベルを複数回持ち、位置で識別する。
        files: [
          "src/foundation/shared/ui/mdx/code*.tsx",
          "src/foundation/shared/ui/mdx/tabs.tsx",
          "src/foundation/shared/ui/mdx/chat-history.tsx",
        ],
        rules: { "react/no-array-index-key": "off" },
      },
      {
        // D3 の pie.sort は配列の破壊的 sort ではなく、レイアウトの設定 API。
        files: ["src/foundation/shared/ui/financial-charts/PieChart.tsx"],
        rules: { "unicorn/no-array-sort": "off" },
      },
      {
        // Vite+ は設定を CommonJS に変換して読み込むため、両形式に対応する。
        files: ["vite.config.ts"],
        rules: {
          "unicorn/prefer-module": "off",
          "unicorn/prefer-import-meta-properties": "off",
        },
      },
      {
        // ブラウザー SDK の拡張プロパティは Window の型宣言を使う。
        files: [
          "src/foundation/pages/site/search/model/use-pagefind-search.ts",
          "src/foundation/pages/site/search/ui/search-panel.test.tsx",
          "src/foundation/shared/ui/google-adsense-ad.tsx",
          "src/foundation/shared/ui/mdx/twitter-widgets.tsx",
          "public/pagefind-adapter.js",
        ],
        rules: {
          "unicorn/prefer-global-this": "off",
          "typescript/consistent-type-definitions": "off",
        },
      },
      {
        files: ["**/*.stories.tsx"],
        rules: {
          // Storybook の操作・assertion は順に実行して計測する。
          "no-await-in-loop": "off",
          // Storybook の計測付き expect は型が void でも await が必要。
          "typescript/await-thenable": "off",
          "typescript/no-confusing-void-expression": "off",
        },
      },
      {
        // Next.js と Storybook は default export とメタデータの同居が規約。
        files: [
          "src/app/**",
          "src/foundation/pages/**/ui/page.tsx",
          "src/foundation/pages/**/index.ts",
          "**/*.stories.tsx",
          "*.config.*",
          "mdx-components.tsx",
          ".storybook/**",
          "**/*.d.ts",
        ],
        rules: {
          "import/no-default-export": "off",
          "react/only-export-components": "off",
        },
      },
      {
        // Satori による OGP 画像描画はインラインスタイルが必須。
        files: ["**/*opengraph-image.tsx", "**/*twitter-image.tsx"],
        rules: { "shadcn/no-inline-styles": "off" },
      },
      {
        // Google AdSense の <ins> は公式実装どおり style 属性（display など）を渡す必要がある。
        files: ["src/foundation/shared/ui/google-adsense-ad.tsx"],
        rules: { "shadcn/no-inline-styles": "off" },
      },
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        plugins: ["vitest"],
        rules: {
          // テストのクラス名フィクスチャはデザインシステムの対象外。
          "shadcn/no-arbitrary-values": "off",
          "shadcn/no-inline-styles": "off",
          "shadcn/no-raw-colors": "off",
          "shadcn/no-restyle": "off",
          "shadcn/no-unknown-classes": "off",
          "shadcn/require-static-classes": "off",
          // 入力検証が javascript: URL を拒否することを確認するフィクスチャ。
          "no-script-url": "off",
          // 明示 import を使い、hooks で各テストの状態を初期化・破棄する。
          "vitest/no-importing-vitest-globals": "off",
          "vitest/no-hooks": "off",
          "vitest/prefer-describe-function-title": "off",
          "vitest/prefer-lowercase-title": "off",
          "vitest/prefer-to-be-truthy": "off",
          "vitest/prefer-to-be-falsy": "off",
          // CalledOnce と CalledTimes(1) の相互変換を防ぎ、回数指定に統一する。
          "vitest/prefer-called-once": "off",
          "vitest/require-test-timeout": "off",
          "vitest/max-expects": "off",
          "vitest/prefer-expect-assertions": [
            "error",
            { onlyFunctionsWithExpectInCallback: true },
          ],
          "vitest/valid-expect": ["error", { maxArgs: 2 }],
          // Promise を返す API のモックは非同期の契約を維持する。
          "typescript/require-await": "off",
          "vitest/require-hook": "off",
          "vitest/require-top-level-describe": "off",
        },
      },
      {
        files: ["**/*.d.ts"],
        rules: {
          "import/unambiguous": "off",
          "unicorn/require-module-specifiers": "off",
        },
      },
      {
        files: ["scripts/**"],
        rules: { "no-console": "off", "unicorn/no-process-exit": "off" },
      },
      {
        // デザインシステム本体は自身の見た目を定義するため、Ultracite の
        // **/components/ui/** と同じ緩和を共有 UI ディレクトリに適用する。
        files: ["src/foundation/shared/ui/**"],
        rules: {
          "shadcn/no-arbitrary-values": "off",
          "shadcn/no-restyle": "off",
          "shadcn/require-static-classes": "off",
        },
      },
    ],
  },
  fmt: {
    ...ultraciteFmt,
    // import 並べ替えと package.json ソートは既存の判断で無効のままにする。
    sortImports: false,
    sortPackageJson: false,
    sortTailwindcss: {
      functions: ["clsx", "cva", "tw", "twMerge", "cn", "twJoin", "tv"],
      stylesheet: "./src/app/styles/globals.css",
    },
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
