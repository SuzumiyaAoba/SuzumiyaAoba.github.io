"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ビルド時に環境変数を評価
const isDevelopment = process.env.NODE_ENV === "development";

// 開発環境用のコンポーネント実装
const DevThemeTest = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // マウント後にのみレンダリング
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="card p-6 rounded-lg max-w-lg mx-auto my-8">
      <h2 className="text-text text-2xl font-bold mb-4">テーマテスト</h2>
      <p className="text-text mb-4">
        現在のテーマ: <span className="font-bold">{theme}</span>
      </p>
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setTheme("light")}
          className={`btn btn-primary ${
            theme === "light" ? "opacity-50" : "opacity-100"
          }`}
        >
          ライトモード
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`btn btn-primary ${
            theme === "dark" ? "opacity-50" : "opacity-100"
          }`}
        >
          ダークモード
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`btn btn-primary ${
            theme === "system" ? "opacity-50" : "opacity-100"
          }`}
        >
          システム設定
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary text-white p-4 rounded">
          プライマリーカラー
        </div>
        <div className="bg-background border border-text/20 text-text p-4 rounded">
          バックグラウンドカラー
        </div>
        <div className="bg-white dark:bg-gray-800 text-text p-4 rounded">
          自動切替カラー
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 text-text dark:text-white p-4 rounded">
          ダークモード対応カラー
        </div>
      </div>
    </div>
  );
};

// 空のコンポーネント
const EmptyThemeTest = () => null;

// 環境によって適切なコンポーネントをエクスポート
export const ThemeTest = isDevelopment ? DevThemeTest : EmptyThemeTest;
