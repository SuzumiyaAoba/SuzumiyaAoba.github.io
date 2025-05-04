import { range } from "d3";
import { ASCII_TABLE_ATTR } from "./StandardCode.utils";
import Arrow from "./Arrow";

export const B5B7Rows = () => {
  const { x, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;

  return (
    <>
      {range(3).flatMap((py) => {
        const textX = cellWidth * 2 + (cellWidth / 2) * py;
        const textY = (py + 1) * cellHeight + offsetY;

        return [
          <text
            key={`b5b7rows-${py}-text`}
            x={textX}
            y={textY}
            fontSize="0.8rem"
          >
            {`b${7 - py}`}
          </text>,
          <Arrow
            key={`b5b7-rows-${py}-arrow`}
            startX={textX + cellWidth / 2}
            startY={textY + offsetY / 2}
            endX={x}
            endY={textY + offsetY / 2}
          />,
        ];
      })}
    </>
  );
};
