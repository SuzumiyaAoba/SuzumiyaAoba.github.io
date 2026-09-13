const BLADE_COUNT = 36;
const point = (radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return `${(300 + radius * Math.cos(radians)).toFixed(3)} ${(300 + radius * Math.sin(radians)).toFixed(3)}`;
};

/** 同心円の内周をひねった、紙の羽根のような図形。静的 SVG なので JS は不要。 */
export function CuriosityArt() {
  return (
    <div className="curiosity-art" aria-hidden="true">
      <svg className="curiosity-art-sculpture" viewBox="0 0 600 600" fill="none">
        <g className="curiosity-art-blades">
          {Array.from({ length: BLADE_COUNT }, (_, index) => {
            const angle = (index * 360) / BLADE_COUNT;
            const end = angle + 6.6;
            return (
              <path
                key={index}
                fill="currentColor"
                d={[
                  `M ${point(246, angle)}`,
                  `A 246 246 0 0 1 ${point(246, end)}`,
                  `C ${point(194, end + 32)} ${point(116, end + 53)} ${point(78, end + 74)}`,
                  `A 78 78 0 0 0 ${point(78, angle + 74)}`,
                  `C ${point(116, angle + 53)} ${point(194, angle + 32)} ${point(246, angle)}`,
                  "Z",
                ].join(" ")}
              />
            );
          })}
        </g>
        <text x="300" y="314" textAnchor="middle" className="curiosity-art-symbol">
          ∴
        </text>
      </svg>
    </div>
  );
}
