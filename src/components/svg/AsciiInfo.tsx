import { THEME_COLORS } from "./StandardCode.utils";
import { useTheme } from "next-themes";

type AsciiInfoProps = {
  char?: string;
  binary?: string;
  hex?: string;
};

export const AsciiInfo = ({ char, binary, hex }: AsciiInfoProps) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const themeColors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div>
        <div className="font-bold text-lg mb-1">Character</div>
        <div className="font-mono text-lg">{char ?? "--"}</div>
      </div>
      <div>
        <div className="font-bold text-lg mb-1">Binary</div>
        <div className="font-mono text-lg">
          {binary ? (
            <>
              <span className="text-gray-400 dark:text-gray-300">0b</span>
              <span className="text-green-600 dark:text-green-400">
                {binary.slice(0, 3)}
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {binary.slice(3, 7)}
              </span>
            </>
          ) : (
            "--"
          )}
        </div>
      </div>
      <div>
        <div className="font-bold text-lg mb-1">Hex</div>
        <div className="font-mono text-lg">
          {hex ? (
            <>
              <span className="text-gray-400 dark:text-gray-300">0x</span>
              <span className="text-green-600 dark:text-green-400">
                {hex.slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                {hex.slice(1, 2).toUpperCase()}
              </span>
            </>
          ) : (
            "--"
          )}
        </div>
      </div>
    </div>
  );
};
