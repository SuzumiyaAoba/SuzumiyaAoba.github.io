"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ThemeTest: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const colors = [
    { name: "テキスト", var: "--foreground" },
    { name: "ミュート", var: "--muted" },
    { name: "ミュート（セカンダリー）", var: "--muted-secondary" },
    { name: "アクセント（プライマリー）", var: "--accent-primary" },
    { name: "アクセント（セカンダリー）", var: "--accent-secondary" },
    { name: "背景", var: "--background" },
    { name: "背景（セカンダリー）", var: "--background-secondary" },
    { name: "ボーダー", var: "--border" },
    { name: "カード背景", var: "--card-bg" },
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <div className="p-6 rounded-lg bg-card border border-border max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">テーマテスト</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">カラーパレット</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colors.map((color) => (
            <div key={color.var} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border border-border"
                style={{ backgroundColor: `var(${color.var})` }}
              ></div>
              <div>
                <p className="font-medium">{color.name}</p>
                <p className="text-xs text-muted">{color.var}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">リンクスタイル</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-2">標準リンク</h4>
            <p>
              これは<a href="#">標準的なリンク</a>
              のスタイルです。これはリンクがコンテンツの中に配置された場合の見え方です。
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-2">パンくずリスト風</h4>
            <div className="flex items-center text-sm">
              <span className="text-muted hover:text-accent-primary hover:underline">
                ホーム
              </span>
              <span className="mx-1">/</span>
              <span className="text-muted hover:text-accent-primary hover:underline">
                ブログ
              </span>
              <span className="mx-1">/</span>
              <span className="font-medium text-accent-primary">
                現在のページ
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">テーマ切り替え</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => handleThemeChange("light")}
          >
            ライト
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => handleThemeChange("dark")}
          >
            ダーク
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => handleThemeChange("system")}
          >
            システム
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">インタラクションテスト</h3>
        <p className="mb-4">
          これはナビゲーションとして表示される
          <Link href="/">ホームページへのリンク</Link>、そして
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            外部サイトへのリンク
          </a>
          です。
        </p>
        <p className="text-muted">
          このテキストはミュートされており、
          <a href="#" className="text-muted hover:text-accent-primary">
            ミュートされたリンク
          </a>
          を含んでいます。
        </p>
      </div>
    </div>
  );
};
