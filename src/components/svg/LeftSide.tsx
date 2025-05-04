import { useContext } from "react";
import { range } from "d3";
import { RectText } from "./RectText";
import { Cell, LEFT_SIDE_ATTR, ASCII_TABLE } from "./StandardCode.utils";
import { HoveredCellContext } from "./StandardCode.context";

export const LeftSide = () => {
  const { y, cellWidth, cellHeight, offset, color } = LEFT_SIDE_ATTR;
  const hoveredValue = useContext(HoveredCellContext);
  const columnNum = 4;

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
                fill={isHover ? color.b1b4.hover.background : "transparent"}
                stroke="black"
                offsetX={offset.x}
                fontSize="0.8rem"
                fontWeight={isHover ? "bold" : "normal"}
                color={isHover ? "white" : "black"}
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
            fill={isHover ? color.column.hover.background : "transparent"}
            stroke="black"
            offsetX={offset.x}
            fontSize="0.8rem"
            fontWeight={isHover ? "bold" : "normal"}
          >
            {py}
          </RectText>,
        ];
      })}
    </g>
  );
};
