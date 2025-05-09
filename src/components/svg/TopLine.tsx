import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export const TopLine = () => {
  const { cellWidth } = ASCII_TABLE_ATTR;
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setMounted(true);
  }, []);

  // サーバーサイド（またはテスト環境）用のフォールバック
  const isDark = mounted ? resolvedTheme === "dark" : false;
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <line
      x1={0}
      y1={0}
      x2={cellWidth * 3.5}
      y2={0}
      stroke={themeColors.stroke}
      strokeWidth="1"
    />
  );
};
