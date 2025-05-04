import { Cell } from "./StandardCode.utils";

export const AsciiInfo = ({
  char,
  hex,
  binary,
}: {
  char: string | undefined;
  hex: string | undefined;
  binary: string | undefined;
}) => {
  return (
    <div className="grid grid-cols-[max-content_1fr]">
      <span className="text-right pr-4 font-bold">ASCII:</span>
      <span className="font-mono">{char ?? ""}</span>
      <span className="text-right pr-4 font-bold">Hex:</span>
      <span className="font-mono">
        {hex && (
          <>
            <span className="text-gray-400">0x</span>
            <span className="text-green-600">{hex.slice(0, 1)}</span>
            <span className="text-sky-600">{hex.slice(1, 2)}</span>
          </>
        )}
      </span>
      <span className="text-right pr-4 font-bold">Binary:</span>
      <span className="font-mono">
        {binary && (
          <>
            <span className="text-gray-400">0b</span>
            <span className="text-green-600">{binary.slice(0, 3)}</span>
            <span className="text-sky-600">{binary.slice(3, 7)}</span>
          </>
        )}
      </span>
    </div>
  );
};
