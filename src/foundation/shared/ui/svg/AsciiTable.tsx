import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { Cell, ASCII_TABLE_ATTR, ASCII_TABLE, THEME_COLORS } from "./StandardCode.utils";
import { HoveredCellContext, ClickedCellContext } from "./StandardCode.context";
import { useResolvedTheme } from "./use-resolved-theme";

export const AsciiTable = ({
  onClick,
  onMouseOver,
}: {
  onClick: (cell: Cell) => void;
  onMouseOver: (cell: Cell) => void;
}) => {
  const { colNum, rowNum, x, y, cellWidth, cellHeight, offsetX } = ASCII_TABLE_ATTR;
  const hoveredCell = useContext(HoveredCellContext);
  const clickedCell = useContext(ClickedCellContext);
  const theme = useResolvedTheme();
  const themeColors = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return range(rowNum).map((py) =>
    Array.from({ length: colNum }, (_, k) => k).map((px) => {
      const isHoveredRow = hoveredCell?.[1] === py;
      const isHoveredCol = hoveredCell?.[0] === px;
      const isHovered = isHoveredRow && isHoveredCol;
      const isClicked = clickedCell?.[0] === px && clickedCell?.[1] === py;

      const cellValue = ASCII_TABLE[py]?.[px] ?? "";
      return (
        <RectText
          key={`ascii-table-${px}-${py}`}
          x={x + px * cellWidth + 2}
          y={y + py * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={
            isHovered
              ? themeColors.hover.highlight
              : isClicked
                ? themeColors.hover.secondary
                : isHoveredRow
                  ? themeColors.hover.rowHighlight
                  : isHoveredCol
                    ? themeColors.hover.colHighlight
                    : "transparent"
          }
          offsetX={offsetX}
          stroke={themeColors.stroke}
          fontWeight={isHovered || isClicked ? "bold" : "normal"}
          color={themeColors.text.normal}
          onClick={() => {
            onClick([px, py]);
          }}
          onMouseOver={() => {
            onMouseOver([px, py]);
          }}
        >
          {cellValue}
        </RectText>
      );
    }),
  );
};
