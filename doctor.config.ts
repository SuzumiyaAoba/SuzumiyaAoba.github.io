export default {
  ignore: {
    overrides: [
      // foundation/pages/**/ui/page.tsx は Feature-Sliced Design の
      // プレゼンテーション層で、Next.js のルートセグメントではない。
      // metadata は src/app 配下のルートファイルで定義している。
      {
        files: ["src/foundation/pages/**/ui/page.tsx"],
        rules: ["react-doctor/nextjs-missing-metadata"],
      },
      // コンポーネントと定数・ハンドラ等の混在 export が意図されたファイル。
      // - src/app/_shared: opengraph-image 用ヘルパー・レイアウトで
      //   Next.js 規約の size/contentType/metadata 等を併記する
      // - badge/button: shadcn 由来で cva variants を併記する
      // - codehike-*: MDX 統合用のハンドラ群を集約したモジュール
      // - provider-identity: プロバイダー表示のスタイル・ラベル・アイコンを
      //   一箇所にまとめる意図的なコロケーション
      {
        files: [
          "src/app/_shared/*.tsx",
          "src/foundation/shared/ui/badge.tsx",
          "src/foundation/shared/ui/button.tsx",
          "src/foundation/shared/ui/mdx/codehike-*.tsx",
          "src/foundation/pages/archive/ai-news/ui/provider-identity.tsx",
        ],
        rules: ["react-doctor/only-export-components"],
      },
    ],
  },
  rules: {
    // このサイトは静的エクスポート前提で、next/link は使わず
    // すべてのナビゲーションを素の <a> で統一している。
    "react-doctor/nextjs-no-a-element": "off",
  },
};
