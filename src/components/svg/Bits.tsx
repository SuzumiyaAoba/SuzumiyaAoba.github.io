import { ASCII_TABLE_ATTR } from "./StandardCode.utils";

export const Bits = () => {
  const { x, cellHeight, offsetX, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;

  return (
    <>
      {["B", "I", "T", "S"].map((char, py) => (
        <text
          key={`bits-${py}-text`}
          x={(cellWidth * py) / 2 + offsetX}
          y={((py + 1) * cellHeight) / 1.25}
          fontSize="0.8rem"
        >
          {char}
        </text>
      ))}
      <line
        x1={(cellWidth * 2) / 2}
        y1={-offsetY}
        x2={(cellWidth * 5) / 2}
        y2={cellHeight * 3}
        stroke="black"
        strokeWidth="1"
      />
    </>
  );
};
