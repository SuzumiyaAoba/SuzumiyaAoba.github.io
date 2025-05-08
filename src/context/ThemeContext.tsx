"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const defaultValue: ThemeContextType = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
};

export const ThemeContext = createContext<ThemeContextType>(defaultValue);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // サーバーサイドレンダリングとの一貫性のために、初期値を「light」に設定
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // 保存されたテーマを取得し、適用する
  useEffect(() => {
    // サーバーサイドでレンダリングされた初期テーマを取得
    const initialTheme = document.documentElement.getAttribute("data-theme") as
      | "light"
      | "dark";

    // ローカルストレージからテーマを取得
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      setThemeState(savedTheme);
    }

    // 解決されたテーマを初期値として設定
    if (initialTheme) {
      setResolvedTheme(initialTheme);
    }

    setMounted(true);
  }, []);

  // システムの設定を検出し、テーマが「system」の場合はそれに従う
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        setResolvedTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    handleChange(); // 初期値を設定

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  // テーマの変更時に実際のDOM属性を更新
  useEffect(() => {
    if (!mounted) return;

    let newResolvedTheme: "light" | "dark" = "light";

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      newResolvedTheme = systemTheme;
      document.documentElement.setAttribute("data-theme", systemTheme);
    } else {
      newResolvedTheme = theme as "light" | "dark";
      document.documentElement.setAttribute("data-theme", theme);
    }

    setResolvedTheme(newResolvedTheme);
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // マウント状態に関わらずテーマコンテキストを提供しますが、
  // サーバーサイドでは特定のテーマ関連の操作は行いません
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
