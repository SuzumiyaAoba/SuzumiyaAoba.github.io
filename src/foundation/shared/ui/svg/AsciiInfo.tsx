import { useResolvedTheme } from "./use-resolved-theme";

type AsciiInfoProps = {
  char: string | undefined;
  binary: string | undefined;
  hex: string | undefined;
};

export const AsciiInfo = ({ char, binary, hex }: AsciiInfoProps) => {
  const theme = useResolvedTheme();
  const isDark = theme === "dark";

  const getMutedColor = () => (isDark ? "#cbd5e1" : "#94a3b8");
  const getGreenColor = () => (isDark ? "#4ade80" : "#16a34a");
  const getSkyColor = () => (isDark ? "#38bdf8" : "#0284c7");

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
              <span style={{ color: getMutedColor() }}>0b</span>
              <span style={{ color: getGreenColor() }}>{binary.slice(0, 3)}</span>
              <span style={{ color: getSkyColor() }}>{binary.slice(3, 7)}</span>
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
              <span style={{ color: getMutedColor() }}>0x</span>
              <span style={{ color: getGreenColor() }}>{hex.slice(0, 1).toUpperCase()}</span>
              <span style={{ color: getSkyColor() }}>{hex.slice(1, 2).toUpperCase()}</span>
            </>
          ) : (
            "--"
          )}
        </div>
      </div>
    </div>
  );
};
