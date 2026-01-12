import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import Arrow from "./Arrow";
import { useResolvedTheme } from "./use-resolved-theme";

export const ColumnRow = () => {
  const { x, y, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 30;
  const textY = y - cellHeight + offsetY;
  const arrowY = textY + offsetY / 2;
  const theme = useResolvedTheme();
  const themeColors = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <>
      <text x={cellWidth * 16} y={textY} fontSize="0.8rem" fill={themeColors.text.normal}>
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
