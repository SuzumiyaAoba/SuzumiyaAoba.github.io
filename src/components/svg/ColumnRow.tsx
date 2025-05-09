import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import Arrow from "./Arrow";
import { useTheme } from "next-themes";

export const ColumnRow = () => {
  const { x, y, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 30;
  const textY = y - cellHeight + offsetY;
  const arrowY = textY + offsetY / 2;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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
