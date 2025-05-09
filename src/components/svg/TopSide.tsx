import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { Cell, ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import { HoveredCellContext } from "./StandardCode.context";
import { useTheme } from "next-themes";

export const TopSide = () => {
  const { cellWidth, cellHeight } = ASCII_TABLE_ATTR;
  const x = ASCII_TABLE_ATTR.x + 2;
  const fontSize = "0.8rem";
  const offsetX = ASCII_TABLE_ATTR.offsetX + cellWidth / 5;
  const hoveredValue = useContext(HoveredCellContext);
  const columnNum = 8;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  return range(columnNum).flatMap((px) => {
    const isHovered = hoveredValue?.[0] === px;
    return (
      <g key={`top-side-group-${px}`}>
        {px
          .toString(2)
          .padStart(3, "0")
          .split("")
          .map((b, py) => (
            <RectText
              key={`top-side-${px}-${py}`}
              x={x + cellWidth * px}
              y={cellHeight * py}
              width={cellWidth}
              height={cellHeight}
              offsetX={offsetX}
              sides={["left", "right"]}
              stroke={themeColors.stroke}
              fill={isHovered ? themeColors.hover.primary : "transparent"}
              fontWeight={isHovered ? "bold" : "normal"}
              color={
                isHovered ? themeColors.text.hover : themeColors.text.normal
              }
            >
              {b}
            </RectText>
          ))}
        <RectText
          key={`top-side-${px}-column`}
          x={x + cellWidth * px}
          y={cellHeight * 3}
          width={cellWidth}
          height={cellHeight * 2}
          fill={isHovered ? themeColors.hover.secondary : "transparent"}
          stroke={themeColors.stroke}
          fontSize={fontSize}
          offsetX={offsetX - 2}
          offsetY={cellHeight * 0.75}
          color={themeColors.text.normal}
        >
          {px}
        </RectText>
      </g>
    );
  });
};
