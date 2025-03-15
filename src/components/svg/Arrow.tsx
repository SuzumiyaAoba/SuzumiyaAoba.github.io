import React, { FC } from "react";

type ArrowProps = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: string;
  strokeWidth?: number;
};

const Arrow: FC<ArrowProps> = ({
  startX,
  startY,
  endX,
  endY,
  color = "black",
  strokeWidth = 2,
}) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);

  const arrowLength = 10;

  const lineEndX = endX - arrowLength * Math.cos(angle);
  const lineEndY = endY - arrowLength * Math.sin(angle);

  const arrowX1 = endX - arrowLength * Math.cos(angle - Math.PI / 6);
  const arrowY1 = endY - arrowLength * Math.sin(angle - Math.PI / 6);
  const arrowX2 = endX - arrowLength * Math.cos(angle + Math.PI / 6);
  const arrowY2 = endY - arrowLength * Math.sin(angle + Math.PI / 6);

  return (
    <>
      <line
        x1={startX}
        y1={startY}
        x2={lineEndX}
        y2={lineEndY}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={color}
      />
    </>
  );
};

export default Arrow;
