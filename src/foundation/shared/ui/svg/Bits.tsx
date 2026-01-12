import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import { useResolvedTheme } from "./use-resolved-theme";

export const Bits = () => {
  const { x, cellHeight, offsetX, offsetY } = ASCII_TABLE_ATTR;
  const cellWidth = x / 5;
  const theme = useResolvedTheme();
  const themeColors = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <>
      {["B", "I", "T", "S"].map((char, py) => (
        <text
          key={`bits-${py}-text`}
          x={(cellWidth * py) / 2 + offsetX}
          y={((py + 1) * cellHeight) / 1.25}
          fontSize="0.8rem"
          fill={themeColors.text.normal}
        >
          {char}
        </text>
      ))}
      <line
        x1={(cellWidth * 2) / 2}
        y1={-offsetY}
        x2={(cellWidth * 5) / 2}
        y2={cellHeight * 3}
        stroke={themeColors.stroke}
        strokeWidth="1"
      />
    </>
  );
};
