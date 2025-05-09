import { useContext, useState, useEffect } from "react";
import { range } from "d3";
import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import { HoveredCellContext } from "./StandardCode.context";
import { useTheme } from "next-themes";

export const B1b4Row = () => {
  const { x, y, cellHeight, offsetX } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // クライアントサイドでのみ実行されるようにする
  useEffect(() => {
    setMounted(true);
  }, []);

  // サーバーサイド（またはテスト環境）用のフォールバック
  const isDark = mounted ? resolvedTheme === "dark" : false;
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  const Texts = [
    ...range(4).map((px) => (
      <text
        key={`b1b4row-${px}-text`}
        x={px * cellWidth + offsetX}
        y={y - 10}
        fontSize="0.8rem"
        fill={themeColors.text.normal}
      >
        {`b${4 - px}`}
      </text>
    )),
    <text
      key={`row-text`}
      x={4 * cellWidth + offsetX / 2}
      y={y - 10}
      fontSize="0.8rem"
      fill={themeColors.text.normal}
    >
      ROW
    </text>,
  ];

  const Lines = range(6).map((px) => (
    <line
      key={`lines-${px}-line`}
      x1={px * cellWidth}
      y1={y - cellHeight}
      x2={px * cellWidth}
      y2={y}
      stroke={themeColors.stroke}
      strokeWidth="1"
    />
  ));

  return (
    <>
      {Texts}
      {Lines}
    </>
  );
};
