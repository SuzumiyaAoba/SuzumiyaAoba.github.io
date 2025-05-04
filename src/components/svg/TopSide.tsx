import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { Cell, ASCII_TABLE_ATTR } from "./StandardCode.utils";
import { HoveredCellContext } from "./StandardCode.context";

export const TopSide = () => {
  const { cellWidth, cellHeight } = ASCII_TABLE_ATTR;
  const x = ASCII_TABLE_ATTR.x + 2;
  const fontSize = "0.8rem";
  const offsetX = ASCII_TABLE_ATTR.offsetX + cellWidth / 5;
  const hoveredValue = useContext(HoveredCellContext);
  const columnNum = 8;

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
              stroke="black"
              fill={isHovered ? "oklch(0.723 0.219 149.579)" : "transparent"}
              fontWeight={isHovered ? "bold" : "normal"}
              color={isHovered ? "#ffffff" : "black"}
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
          fill={isHovered ? "oklch(0.872 0.01 258.338)" : "transparent"}
          stroke="black"
          fontSize={fontSize}
          offsetX={offsetX - 2}
          offsetY={cellHeight * 0.75}
        >
          {px}
        </RectText>
      </g>
    );
  });
};
