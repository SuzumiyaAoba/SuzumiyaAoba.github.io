type AsciiInfoProps = {
  char: string | undefined;
  binary: string | undefined;
  hex: string | undefined;
};

export const AsciiInfo = ({ char, binary, hex }: AsciiInfoProps) => (
  <div className="mb-4 grid grid-cols-3 gap-4">
    <div>
      <div className="mb-1 text-lg font-bold">Character</div>
      <div className="font-mono text-lg">{char ?? "--"}</div>
    </div>
    <div>
      <div className="mb-1 text-lg font-bold">Binary</div>
      <div className="font-mono text-lg">
        {binary ? (
          <>
            <span className="text-bit-muted">0b</span>
            <span className="text-bit-high">{binary.slice(0, 3)}</span>
            <span className="text-bit-low">{binary.slice(3, 7)}</span>
          </>
        ) : (
          "--"
        )}
      </div>
    </div>
    <div>
      <div className="mb-1 text-lg font-bold">Hex</div>
      <div className="font-mono text-lg">
        {hex ? (
          <>
            <span className="text-bit-muted">0x</span>
            <span className="text-bit-high">
              {hex.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-bit-low">
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
