import { FC, MouseEventHandler, PropsWithChildren } from "react";

type BorderSide = "top" | "right" | "bottom" | "left";

export type RectTextProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  sides?: BorderSide[];
  offsetX: number;
  offsetY?: number;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  onClick?: MouseEventHandler<SVGElement>;
  onMouseOver?: MouseEventHandler<SVGElement>;
};

const LineRect = ({
  x,
  y,
  width,
  height,
  sides,
  stroke,
  strokeWidth,
}: RectTextProps) => {
  const lines = {
    top: { x1: x, y1: y, x2: x + width, y2: y },
    right: { x1: x + width, y1: y, x2: x + width, y2: y + height },
    bottom: { x1: x, y1: y + height, x2: x + width, y2: y + height },
    left: { x1: x, y1: y, x2: x, y2: y + height },
  };

  return sides?.map((side) => (
    <line
      key={side}
      x1={lines[side].x1}
      y1={lines[side].y1}
      x2={lines[side].x2}
      y2={lines[side].y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  ));
};

export const RectText: FC<PropsWithChildren<RectTextProps>> = (props) => {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    sides,
    offsetX,
    offsetY,
    fontSize,
    fontWeight,
    color,
    onClick,
    onMouseOver,
    children,
  } = props;
  const existsSides = sides && sides.length !== 0;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill ?? "transparent"}
        stroke={existsSides ? "transparent" : stroke}
        strokeWidth={existsSides ? "0" : strokeWidth}
        onClick={onClick}
        onMouseOver={onMouseOver}
      />
      {existsSides ? <LineRect {...props} /> : <></>}
      <text
        x={x + offsetX}
        y={y + (offsetY ?? (height * 2) / 3)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        fill={color}
        onClick={onClick}
        onMouseOver={onMouseOver}
      >
        {children}
      </text>
    </g>
  );
};
