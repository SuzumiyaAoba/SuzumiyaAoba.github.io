import { ASCII_TABLE_ATTR } from "./StandardCode.utils";
import Arrow from "./Arrow";

export const ColumnRow = () => {
  const { x, y, cellHeight, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 30;
  const textY = y - cellHeight + offsetY;
  const arrowY = textY + offsetY / 2;

  return (
    <>
      <text x={cellWidth * 16} y={textY} fontSize="0.8rem">
        COLUMN
      </text>
      <Arrow
        startX={cellWidth * 24}
        startY={arrowY}
        endX={cellWidth * 30}
        endY={arrowY}
      />
    </>
  );
};
