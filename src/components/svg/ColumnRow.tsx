import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import Arrow from "./Arrow";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export const ColumnRow = () => {
  const { x, y, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 30;
  const textY = y - cellHeight + offsetY;
  const arrowY = textY + offsetY / 2;
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
    <>
      <text
        x={cellWidth * 16}
        y={textY}
        fontSize="0.8rem"
        fill={themeColors.text.normal}
      >
        COLUMN
      </text>
      <Arrow
        startX={cellWidth * 24}
        startY={arrowY}
        endX={cellWidth * 30}
        endY={arrowY}
        color={themeColors.stroke}
      />
    </>
  );
};
