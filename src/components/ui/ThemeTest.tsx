"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeTest = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // マウント後にのみレンダリング
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="card p-6 rounded-lg max-w-lg mx-auto my-8">
      <h2 className="text-theme-text text-2xl font-bold mb-4">テーマテスト</h2>
      <p className="text-theme-text mb-4">
        現在のテーマ: <span className="font-bold">{theme}</span>
      </p>
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setTheme("light")}
          className={`btn btn-primary ${
            theme === "light" ? "bg-opacity-50" : "bg-opacity-100"
          }`}
        >
          ライトモード
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`btn btn-primary ${
            theme === "dark" ? "bg-opacity-50" : "bg-opacity-100"
          }`}
        >
          ダークモード
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`btn btn-primary ${
            theme === "system" ? "bg-opacity-50" : "bg-opacity-100"
          }`}
        >
          システム設定
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-theme-primary text-white p-4 rounded">
          プライマリーカラー
        </div>
        <div className="bg-theme-secondary text-white p-4 rounded">
          セカンダリーカラー
        </div>
        <div className="bg-theme-background border border-gray-200 dark:border-gray-700 text-theme-text p-4 rounded">
          バックグラウンドカラー
        </div>
        <div className="bg-white dark:bg-gray-800 text-theme-text p-4 rounded">
          テキストカラー
        </div>
      </div>
    </div>
  );
};
