import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { Cell, ASCII_TABLE_ATTR, ASCII_TABLE } from "./StandardCode.utils";
import { HoveredCellContext, ClickedCellContext } from "./StandardCode.context";

export const AsciiTable = ({
  onClick,
  onMouseOver,
}: {
  onClick: (cell: Cell) => void;
  onMouseOver: (cell: Cell) => void;
}) => {
  const { colNum, rowNum, x, y, cellWidth, cellHeight, offsetX } =
    ASCII_TABLE_ATTR;
  const hoveredCell = useContext(HoveredCellContext);
  const clickedCell = useContext(ClickedCellContext);

  return range(rowNum).map((py) =>
    Array.from({ length: colNum }, (_, k) => k).map((px) => {
      const isHoveredRow = hoveredCell?.[1] === py;
      const isHoveredCol = hoveredCell?.[0] === px;
      const isHovered = isHoveredRow && isHoveredCol;
      const isClicked = clickedCell?.[0] === px && clickedCell?.[1] === py;

      return (
        <RectText
          key={`ascii-table-${px}-${py}`}
          x={x + px * cellWidth + 2}
          y={y + py * cellHeight}
          width={cellWidth}
          height={cellHeight}
          fill={
            isHovered
              ? "oklch(0.885 0.062 18.334)"
              : isClicked
              ? "oklch(0.872 0.01 258.338)"
              : isHoveredRow
              ? "oklch(0.901 0.058 230.902)"
              : isHoveredCol
              ? "oklch(0.925 0.084 155.995)"
              : "transparent"
          }
          offsetX={offsetX}
          stroke="black"
          fontWeight={isHovered || isClicked ? "bold" : "normal"}
          onClick={() => {
            onClick([px, py]);
          }}
          onMouseOver={() => {
            onMouseOver([px, py]);
          }}
        >
          {ASCII_TABLE[py][px]}
        </RectText>
      );
    })
  );
};
