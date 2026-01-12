import { ASCII_TABLE_ATTR, THEME_COLORS } from "./StandardCode.utils";
import { useResolvedTheme } from "./use-resolved-theme";

export const TopLine = () => {
  const { cellWidth } = ASCII_TABLE_ATTR;
  const theme = useResolvedTheme();
  const themeColors = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <line x1={0} y1={0} x2={cellWidth * 3.5} y2={0} stroke={themeColors.stroke} strokeWidth="1" />
  );
};
