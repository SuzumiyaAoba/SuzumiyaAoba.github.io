import React, { FC } from "react";
import { useTheme } from "next-themes";
import { THEME_COLORS } from "./StandardCode.utils";

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
  color,
  strokeWidth = 2,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  const arrowColor = color || themeColors.stroke;

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
        stroke={arrowColor}
        strokeWidth={strokeWidth}
      />
      <polygon
        points={`${endX},${endY} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={arrowColor}
      />
    </>
  );
};

export default Arrow;
