"use client";

import { FC } from "react";
import dynamic from "next/dynamic";

// ThemeTestコンポーネントを動的にインポート
const ThemeTest = dynamic(
  () => import("@/components/ui/ThemeTest").then((mod) => mod.ThemeTest),
  {
    ssr: false,
  },
);

// ビルド時に評価される環境変数
const isDevelopment = process.env.NODE_ENV === "development";

export const DevelopmentOnly: FC = () => {
  // 開発環境でない場合は何も表示しない
  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      <div className="mt-16 mb-16">
        <ThemeTest />
      </div>
      <section
        className="mt-16 p-6 rounded-xl shadow-md border border-text/10 transition-all duration-300"
        style={{ backgroundColor: "var(--card-bg)" }}
      >
        <h2 className="text-2xl font-bold text-primary mb-4">
          UnoCSS + テーマ切り替えのテスト
        </h2>
        <p className="mb-4">
          このセクションは UnoCSS と next-themes
          を使用したテーマ切り替えの動作確認用です。
          ヘッダーのテーマトグルボタンをクリックして、ライト/ダークモードを切り替えてみてください。
        </p>
        <div className="flex flex-wrap gap-4 mt-6">
          <button className="btn-primary">プライマリボタン</button>
          <button className="btn bg-background border border-text/20">
            デフォルトボタン
          </button>
        </div>
      </section>
    </>
  );
}; 