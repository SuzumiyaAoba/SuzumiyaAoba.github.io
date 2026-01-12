import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { LEFT_SIDE_ATTR, ASCII_TABLE, THEME_COLORS } from "./StandardCode.utils";
import { HoveredCellContext } from "./StandardCode.context";
import { useResolvedTheme } from "./use-resolved-theme";

export const LeftSide = () => {
  const { y, cellWidth, cellHeight, offset, color } = LEFT_SIDE_ATTR;
  const hoveredValue = useContext(HoveredCellContext);
  const columnNum = 4;
  const theme = useResolvedTheme();
  const isDark = theme === "dark";
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <g>
      {range(ASCII_TABLE.length).flatMap((py) => {
        const isHover = hoveredValue?.[1] === py;
        return [
          ...py
            .toString(2)
            .padStart(columnNum, "0")
            .split("")
            .map((b, px) => (
              <RectText
                key={`left-side-${py}-${px}`}
                x={cellWidth * px}
                y={y + cellHeight * py}
                width={cellWidth}
                height={cellHeight}
                fill={
                  isHover
                    ? isDark
                      ? themeColors.hover.b1b4
                      : color.b1b4.hover.background
                    : "transparent"
                }
                stroke={themeColors.stroke}
                offsetX={offset.x}
                fontSize="0.8rem"
                fontWeight={isHover ? "bold" : "normal"}
                color={isHover ? themeColors.text.hover : themeColors.text.normal}
              >
                {b}
              </RectText>
            )),
          <RectText
            key={`left-side-${py}-text`}
            x={cellWidth * columnNum}
            y={y + cellHeight * py}
            width={cellWidth}
            height={cellHeight}
            fill={
              isHover
                ? isDark
                  ? themeColors.hover.secondary
                  : color.column.hover.background
                : "transparent"
            }
            stroke={themeColors.stroke}
            offsetX={offset.x}
            fontSize="0.8rem"
            fontWeight={isHover ? "bold" : "normal"}
            color={themeColors.text.normal}
          >
            {py}
          </RectText>,
        ];
      })}
    </g>
  );
};
