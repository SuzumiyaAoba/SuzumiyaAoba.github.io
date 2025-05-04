import { ASCII_TABLE_ATTR } from "./StandardCode.utils";

export const TopLine = () => {
  const { cellWidth } = ASCII_TABLE_ATTR;

  return (
    <line
      x1={0}
      y1={0}
      x2={cellWidth * 3.5}
      y2={0}
      stroke="black"
      strokeWidth="1"
    />
  );
};
