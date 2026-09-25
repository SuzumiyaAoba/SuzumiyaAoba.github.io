import type { DiagramMode, Keyword } from "../model/catalog";
import type { Locale } from "@/shared/lib/routing";

type SceneProps = { mode: DiagramMode; variant: number; slug: string };

const gridCells = Array.from({ length: 30 }, (_, index) => ({
  x: 42 + (index % 10) * 42,
  y: 26 + Math.floor(index / 10) * 48,
}));

function FieldScene({ mode, variant, slug }: SceneProps) {
  if (mode === "flow") {
    if (slug === "curl-noise") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          {[0, 1, 2].map((index) => (
            <path
              key={index}
              d={`M ${275 + index * 42} 85 A ${25 + index * 42} ${25 + index * 27} 0 1 1 ${225 - index * 42} 85`}
              opacity={0.9 - index * 0.17}
            />
          ))}
          <path d="M 242 25 L 255 22 L 248 35 M 180 119 L 170 128 L 184 131 M 331 113 L 343 120 L 331 127" />
        </g>
      );
    }
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        {[0, 1, 2, 3].map((row) => (
          <path
            key={row}
            d={`M 25 ${30 + row * 38} C 105 ${10 + row * 38}, 175 ${75 + row * 23}, 248 ${72 + row * 13} S 380 ${20 + row * 28}, 470 ${42 + row * 31}`}
            opacity={0.95 - row * 0.17}
          />
        ))}
        <circle
          cx={245 + variant * 3}
          cy="83"
          r="25"
          strokeDasharray="5 5"
          opacity="0.55"
        />
      </g>
    );
  }
  if (mode === "field") {
    if (slug === "perlin") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2, 3].map((row) => (
            <path key={row} d={`M 75 ${28 + row * 40} H 435`} opacity="0.35" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((column) => (
            <path
              key={column}
              d={`M ${75 + column * 60} 28 V 148`}
              opacity="0.35"
            />
          ))}
          {[0, 1, 2, 3].flatMap((row) =>
            [0, 1, 2, 3, 4, 5, 6].map((column) => (
              <path
                key={`${row}-${column}`}
                d={`M ${75 + column * 60} ${28 + row * 40} l ${(((column + row) % 3) - 1) * 10 + 4} ${(((column * 2 + row) % 3) - 1) * 10 - 3}`}
                strokeWidth="3"
              />
            ))
          )}
        </g>
      );
    }
    if (slug === "simplex-noise") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2, 3].map((row) => (
            <path
              key={row}
              d={`M ${row % 2 === 0 ? 35 : 65} ${30 + row * 39} H 465`}
              opacity="0.35"
            />
          ))}
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4, 5, 6].map((column) => (
              <path
                key={`${row}-${column}`}
                d={`M ${50 + column * 60 + (row % 2) * 30} ${30 + row * 39} l 30 39 l 30 -39`}
                opacity="0.42"
              />
            ))
          )}
          {[0, 1, 2].map((index) => (
            <circle
              key={index}
              cx={160 + index * 90}
              cy={68 + (index % 2) * 38}
              r="7"
              fill="currentColor"
            />
          ))}
        </g>
      );
    }
    return (
      <g>
        {gridCells.map(({ x, y }, index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={5 + ((index * 3 + variant) % 5) * 3}
            fill="currentColor"
            opacity={0.12 + ((index + variant * 2) % 7) * 0.1}
          />
        ))}
      </g>
    );
  }
  if (mode === "grid") {
    if (slug === "wave-function-collapse" || slug === "wang-tiles") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4].map((column) => (
              <g key={`${row}-${column}`}>
                <rect
                  x={70 + column * 70}
                  y={25 + row * 43}
                  width="70"
                  height="43"
                  fill="currentColor"
                  fillOpacity={((row + column) % 3) * 0.11 + 0.07}
                />
                <path
                  d={`M ${86 + column * 70} ${46 + row * 43} H ${126 + column * 70}`}
                  strokeWidth={2 + ((row + column) % 2)}
                />
              </g>
            ))
          )}
        </g>
      );
    }
    if (slug === "bounding-volume-hierarchy") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="40" y="22" width="420" height="130" rx="6" />
          <rect x="60" y="42" width="175" height="90" rx="5" />
          <rect x="260" y="42" width="180" height="90" rx="5" />
          <rect x="78" y="65" width="70" height="46" />
          <rect x="150" y="65" width="70" height="46" />
          <rect x="280" y="65" width="70" height="46" />
          <rect x="355" y="65" width="70" height="46" />
        </g>
      );
    }
    if (slug === "domain-warping") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <path
              key={`h-${index}`}
              d={`M 30 ${20 + index * 33} C 145 ${-20 + index * 33}, 235 ${75 + index * 15}, 340 ${20 + index * 33} S 440 ${20 + index * 33}, 470 ${20 + index * 33}`}
              opacity="0.6"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <path
              key={`v-${index}`}
              d={`M ${35 + index * 60} 15 Q ${95 + index * 38} 85 ${35 + index * 60} 160`}
              opacity="0.5"
            />
          ))}
        </g>
      );
    }
    if (slug === "periodic") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {[0, 1, 2].map((index) => (
            <g key={index}>
              <rect
                x={55 + index * 135}
                y="35"
                width="135"
                height="105"
                strokeOpacity="0.4"
              />
              <path
                d={`M ${55 + index * 135} 88 C ${95 + index * 135} 30, ${145 + index * 135} 150, ${190 + index * 135} 88`}
              />
            </g>
          ))}
        </g>
      );
    }
    return (
      <g>
        {gridCells.map(({ x, y }, index) => (
          <rect
            key={index}
            x={x - 17 + (variant % 3 === 0 ? Math.sin(index) * 5 : 0)}
            y={y - 17 + (variant % 3 === 1 ? Math.cos(index) * 5 : 0)}
            width="34"
            height="34"
            rx={variant % 4}
            fill="currentColor"
            opacity={0.12 + ((index * 5 + variant) % 7) * 0.09}
            stroke="currentColor"
            strokeOpacity="0.25"
          />
        ))}
      </g>
    );
  }
  if (mode === "points" || mode === "particles") {
    if (slug === "worley") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M 20 25 L 125 20 L 158 72 L 120 155 L 20 160 Z M 125 20 L 250 20 L 245 80 L 158 72 M 250 20 L 375 20 L 360 85 L 245 80 M 375 20 L 480 20 L 480 90 L 360 85 M 120 155 L 158 72 L 245 80 L 270 155 M 245 80 L 360 85 L 375 155 L 270 155 M 360 85 L 480 90 L 480 155 L 375 155"
            opacity="0.5"
          />
          {(
            [
              [87, 82],
              [204, 48],
              [310, 49],
              [428, 55],
              [198, 120],
              [322, 122],
              [433, 125],
            ] as const
          ).map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="5" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (slug === "poisson-disk-sampling") {
      return (
        <g fill="none" stroke="currentColor">
          {[
            [80, 55],
            [175, 110],
            [275, 50],
            [385, 115],
            [455, 42],
          ].map(([x, y], index) => (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="38"
                strokeDasharray="5 6"
                opacity="0.35"
              />
              <circle cx={x} cy={y} r="5" fill="currentColor" />
            </g>
          ))}
        </g>
      );
    }
    if (slug === "smoothed-particle-hydrodynamics") {
      return (
        <g fill="none" stroke="currentColor">
          {[
            [110, 65],
            [180, 100],
            [250, 60],
            [315, 112],
            [390, 70],
          ].map(([x, y], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r="35" opacity="0.3" />
              <circle cx={x} cy={y} r="7" fill="currentColor" />
            </g>
          ))}
        </g>
      );
    }
    if (slug === "boids") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {(
            [
              [135, 70],
              [190, 45],
              [225, 95],
              [285, 58],
              [340, 110],
              [390, 65],
            ] as const
          ).map(([x, y], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r="6" fill="currentColor" />
              <path
                d={`M ${x + 10} ${y} l 30 ${index % 2 === 0 ? -8 : 7} m -9 -9 l 9 9 l -10 7`}
              />
            </g>
          ))}
        </g>
      );
    }
    if (slug === "delaunay-triangulation") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M 55 130 L 135 40 L 220 100 L 310 35 L 435 100 L 335 145 L 220 100 L 55 130 M 135 40 L 310 35 M 310 35 L 335 145"
            opacity="0.65"
          />
          {[
            [55, 130],
            [135, 40],
            [220, 100],
            [310, 35],
            [435, 100],
            [335, 145],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="5" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (slug === "optimal-reciprocal-collision-avoidance") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="145" cy="88" r="14" />
          <circle cx="355" cy="88" r="14" />
          <path d="M 160 88 L 235 50 M 340 88 L 265 125" strokeWidth="5" />
          <path d="M 223 48 L 235 50 L 230 62 M 277 127 L 265 125 L 270 113" />
        </g>
      );
    }
    return (
      <g>
        {Array.from({ length: 30 }, (_, index) => {
          const x = 35 + ((index * 79 + variant * 17) % 430);
          const y = 23 + ((index * 47 + variant * 13) % 125);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={mode === "particles" ? 2 + (index % 4) * 2 : 3 + (index % 3)}
              fill="currentColor"
              opacity={0.25 + (index % 4) * 0.18}
            />
          );
        })}
      </g>
    );
  }
  if (mode === "layers") {
    return (
      <g>
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={`M 70 ${116 - index * 27} L 260 ${65 - index * 12} L 432 ${111 - index * 27} L 243 ${161 - index * 12} Z`}
            fill="currentColor"
            fillOpacity={0.08 + index * 0.08}
            stroke="currentColor"
            strokeOpacity="0.55"
          />
        ))}
      </g>
    );
  }
  return null;
}

function GeometryScene({ mode, variant, slug }: SceneProps) {
  if (mode === "graph") {
    const specificPaths: Record<string, string> = {
      "turbulence-noise":
        "M 50 100 L 105 32 L 160 100 L 220 40 L 275 100 L 335 25 L 390 100 L 450 50",
      "ridged-multifractal-noise":
        "M 50 135 L 110 32 L 165 135 L 225 22 L 280 135 L 335 38 L 390 135 L 450 45",
      lerp: "M 50 135 L 450 28",
      smoothstep: "M 50 135 C 180 135, 320 28, 450 28",
      easing: "M 50 135 C 160 150, 215 20, 280 36 S 385 90, 450 28",
      "exponential-damping": "M 50 135 C 120 62, 195 34, 450 29",
      "critical-damping": "M 50 135 C 145 45, 230 29, 450 29",
      "beer-lambert-law": "M 50 30 C 120 100, 220 128, 450 135",
      "tone-mapping": "M 50 135 C 190 105, 285 45, 450 30",
      gaussian: "M 50 135 C 150 135, 190 24, 250 24 S 350 135, 450 135",
      "fixed-timestep":
        "M 50 135 H 115 V 112 H 180 V 88 H 245 V 65 H 310 V 43 H 375 V 28 H 450",
      "coyote-time": "M 50 135 H 160 V 48 H 290 V 135 H 450",
      input: "M 50 135 H 135 V 48 H 260 V 135 H 450",
      "parallel-prefix-sum":
        "M 50 135 H 120 V 120 H 190 V 92 H 260 V 83 H 330 V 48 H 400 V 28 H 450",
      "impulse-camera-shake":
        "M 50 86 L 120 86 L 150 30 L 185 130 L 220 50 L 255 110 L 290 70 L 325 97 L 360 80 L 395 90 L 450 86",
    };
    const paths = [
      "M 50 135 C 150 130, 220 40, 450 30",
      "M 50 135 C 155 35, 250 35, 450 135",
      "M 50 135 L 185 45 L 280 110 L 450 30",
      "M 50 135 C 180 140, 250 130, 320 45 S 420 30, 450 30",
    ];
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 45 20 V 145 H 465" opacity="0.5" strokeWidth="2" />
        <path
          d={specificPaths[slug] ?? paths[variant % paths.length]}
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    );
  }
  if (mode === "curve") {
    if (slug === "arc-length-parameterization") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 40 135 C 130 15, 315 155, 460 35" strokeWidth="5" />
          {[
            [40, 135],
            [88, 92],
            [157, 74],
            [230, 83],
            [305, 88],
            [378, 70],
            [460, 35],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="6" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (slug === "catmull-rom-spline") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 35 118 C 85 118, 110 45, 150 55 S 210 135, 260 105 S 345 30, 390 52 S 435 80, 465 35"
            strokeWidth="5"
          />
          {[
            [35, 118],
            [150, 55],
            [260, 105],
            [390, 52],
            [465, 35],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="7" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (slug === "ribbon") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 40 118 C 130 15, 290 150, 450 38 L 450 68 C 290 180, 130 45, 40 148 Z"
            fill="currentColor"
            fillOpacity="0.18"
            strokeWidth="3"
          />
          <path
            d="M 40 133 C 130 30, 290 165, 450 53"
            strokeDasharray="7 6"
            opacity="0.5"
          />
        </g>
      );
    }
    if (slug === "sweep") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 55 135 C 145 15, 310 145, 445 40 M 55 155 C 145 35, 310 165, 445 60" />
          <ellipse cx="55" cy="145" rx="15" ry="10" />
          <ellipse cx="445" cy="50" rx="15" ry="10" />
        </g>
      );
    }
    const paths = [
      "M 40 132 C 140 8, 310 162, 460 38",
      "M 40 132 C 180 148, 235 5, 460 38",
      "M 40 132 Q 245 3, 460 38",
      "M 40 132 C 125 60, 320 104, 460 38",
    ];
    return (
      <g fill="none" stroke="currentColor">
        <path
          d="M 40 132 L 140 24 M 340 144 L 460 38"
          strokeDasharray="5 6"
          opacity="0.5"
        />
        <path
          d={paths[variant % paths.length]}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {[
          [40, 132],
          [140, 24],
          [340, 144],
          [460, 38],
        ].map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={index % 3 === 0 ? 6 : 4}
            fill="currentColor"
          />
        ))}
      </g>
    );
  }
  if (mode === "shape") {
    if (slug === "signed-distance-field") {
      return (
        <g fill="none" stroke="currentColor">
          <circle cx="250" cy="86" r="46" strokeWidth="5" />
          {[68, 91, 113].map((radius) => (
            <circle
              key={radius}
              cx="250"
              cy="86"
              r={radius}
              strokeDasharray="6 7"
              opacity="0.35"
            />
          ))}
          <circle cx="250" cy="86" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "smooth-union") {
      return (
        <path
          d="M 163 130 C 95 107, 116 40, 177 34 C 219 29, 234 54, 250 60 C 275 40, 312 30, 344 44 C 418 75, 384 148, 320 145 C 271 155, 220 153, 163 130 Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="4"
        />
      );
    }
    if (slug === "slerp") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="250" cy="88" r="70" opacity="0.4" />
          <path
            d="M 250 88 L 195 45 M 250 88 L 305 45 M 195 45 A 70 70 0 0 1 305 45"
            strokeWidth="5"
          />
          <circle cx="195" cy="45" r="6" fill="currentColor" />
          <circle cx="305" cy="45" r="6" fill="currentColor" />
        </g>
      );
    }
    if (slug === "polar-coordinates") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="250" cy="88" r="40" opacity="0.4" />
          <circle cx="250" cy="88" r="75" opacity="0.4" />
          <path d="M 250 88 L 420 35 M 250 88 L 80 35 M 250 88 V 10 M 250 88 V 165 M 250 88 L 420 140 M 250 88 L 80 140" />
          <circle cx="330" cy="62" r="6" fill="currentColor" />
        </g>
      );
    }
    if (slug === "metaballs") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 120 92 C 120 22, 205 20, 232 62 C 253 75, 265 75, 284 62 C 335 18, 409 54, 385 115 C 371 155, 310 158, 285 125 C 263 110, 238 111, 212 131 C 170 158, 112 133, 120 92 Z"
            strokeWidth="4"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <circle cx="185" cy="85" r="5" fill="currentColor" />
          <circle cx="325" cy="85" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "voronoi-fracture") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 100 30 H 400 L 445 115 L 310 150 H 150 L 70 110 Z M 200 30 L 225 80 L 150 150 M 225 80 L 325 65 L 400 30 M 225 80 L 310 150 M 325 65 L 445 115" />
        </g>
      );
    }
    if (slug === "island-falloff") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 72 94 C 75 28, 168 17, 218 38 C 320 3, 420 33, 430 100 C 395 151, 295 157, 248 138 C 148 169, 69 139, 72 94 Z"
            strokeWidth="4"
          />
          <path
            d="M 135 93 C 145 55, 215 48, 248 59 C 320 38, 375 63, 368 101 C 338 125, 290 126, 249 113 C 178 133, 135 116, 135 93 Z"
            strokeDasharray="6 6"
            strokeWidth="2"
          />
        </g>
      );
    }
    if (slug === "axis-aligned-bounding-box") {
      return (
        <g fill="none" stroke="currentColor">
          <rect x="110" y="22" width="280" height="128" strokeWidth="4" />
          <path d="M 170 120 L 185 45 L 285 66 L 350 118 Z" strokeWidth="3" />
        </g>
      );
    }
    if (slug === "separating-axis-theorem") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 110 75 L 170 35 L 210 95 L 130 115 Z M 295 65 L 365 50 L 395 120 L 305 130 Z" />
          <path
            d="M 40 145 H 455 M 210 137 V 153 M 295 137 V 153"
            strokeDasharray="6 5"
          />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <circle cx={190 - variant * 2} cy="83" r="60" strokeWidth="4" />
        <circle
          cx={300 + variant * 2}
          cy="83"
          r="60"
          strokeWidth="4"
          opacity="0.65"
        />
        <path
          d="M 246 23 Q 290 83, 246 143"
          strokeWidth="5"
          strokeDasharray={variant % 2 === 0 ? "0" : "8 6"}
        />
        <circle cx="246" cy="83" r="5" fill="currentColor" />
      </g>
    );
  }
  if (mode === "mesh") {
    if (slug === "marching-squares") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 60 30 H 440 M 60 70 H 440 M 60 110 H 440 M 60 150 H 440 M 60 30 V 150 M 136 30 V 150 M 212 30 V 150 M 288 30 V 150 M 364 30 V 150 M 440 30 V 150"
            strokeWidth="1.5"
            opacity="0.3"
          />
          <path
            d="M 60 105 L 136 82 L 212 96 L 288 65 L 364 75 L 440 42"
            strokeWidth="5"
          />
        </g>
      );
    }
    if (slug === "gpu-instancing") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <path
              key={index}
              d={`M ${50 + index * 74} 130 L ${85 + index * 74} 45 L ${120 + index * 74} 130 Z`}
              fill="currentColor"
              fillOpacity="0.06"
            />
          ))}
        </g>
      );
    }
    if (slug === "level-of-detail") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 45 135 L 125 20 L 205 135 Z M 45 135 L 125 65 L 205 135 M 125 20 V 65 M 85 80 L 165 80" />
          <path d="M 235 86 H 290 M 280 77 L 290 86 L 280 95" />
          <path d="M 330 125 L 385 50 L 440 125 Z" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M 65 137 L 105 36 L 195 54 L 252 22 L 335 48 L 430 32 L 457 128 L 335 145 L 235 122 L 135 147 Z"
          strokeWidth="3"
        />
        <path
          d="M 65 137 L 195 54 L 135 147 L 235 122 L 195 54 L 252 22 L 235 122 L 335 48 L 335 145 L 235 122 L 457 128 L 335 48 L 430 32 L 457 128"
          opacity="0.6"
        />
        {variant % 2 === 0 && (
          <circle cx="235" cy="122" r="6" fill="currentColor" />
        )}
      </g>
    );
  }
  if (mode === "surface") {
    if (slug === "billboard") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 65 90 L 145 45 L 145 135 Z" />
          <rect x="280" y="38" width="125" height="100" />
          <path d="M 145 90 H 275 M 263 80 L 275 90 L 263 100" />
          <path d="M 300 70 H 385 M 300 95 H 385" opacity="0.4" />
        </g>
      );
    }
    if (slug === "triplanar") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 250 35 L 350 65 L 350 130 L 250 153 L 150 130 L 150 65 Z M 250 35 V 153 M 150 65 L 250 95 L 350 65" />
          <path
            d="M 95 95 H 145 M 355 95 H 405 M 250 5 V 30"
            strokeDasharray="6 5"
          />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 60 43 L 420 43 L 455 135 L 95 135 Z" strokeWidth="3" />
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={`M ${95 + index * 80} 135 L ${60 + index * 80} 43 M 60 ${43 + index * 23} L ${420 + index * 9} ${43 + index * 23}`}
            opacity={0.3 + index * 0.12}
          />
        ))}
        <path
          d={`M 170 88 C 220 ${45 + variant * 4}, 290 ${130 - variant * 3}, 350 91`}
          strokeWidth="5"
        />
      </g>
    );
  }
  if (mode === "wave") {
    return (
      <g fill="none" stroke="currentColor">
        {[0, 1, 2].map((index) => (
          <path
            key={index}
            d={`M 25 ${48 + index * 42} Q 78 ${8 + index * 42}, 130 ${48 + index * 42} T 235 ${48 + index * 42} T 340 ${48 + index * 42} T 445 ${48 + index * 42}`}
            strokeWidth={index === variant % 3 ? 5 : 2.5}
            opacity={0.9 - index * 0.2}
          />
        ))}
      </g>
    );
  }
  return null;
}

function MotionScene({ mode, variant, slug }: SceneProps) {
  if (mode === "path") {
    if (slug === "ray-casting" || slug === "continuous-collision-detection") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 40 122 L 440 48" strokeWidth="4" />
          <circle cx="40" cy="122" r="6" fill="currentColor" />
          <circle cx="325" cy="70" r="29" strokeWidth="3" />
          <circle cx="299" cy="74" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "gilbert-johnson-keerthi-algorithm") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 115 85 L 195 28 L 365 35 L 420 100 L 325 150 L 175 140 Z" />
          <path
            d="M 250 20 V 155 M 75 88 H 445"
            strokeDasharray="5 7"
            opacity="0.4"
          />
          <circle cx="250" cy="88" r="7" fill="currentColor" />
        </g>
      );
    }
    if (slug === "uniform-sphere-sampling" || slug === "uniform-disk") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle
            cx="250"
            cy="88"
            r="74"
            fill={slug === "uniform-disk" ? "currentColor" : "none"}
            fillOpacity="0.08"
          />
          {[
            [200, 55],
            [260, 35],
            [310, 75],
            [210, 110],
            [270, 120],
            [335, 105],
            [235, 85],
            [285, 70],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="5" fill="currentColor" />
          ))}
          {slug === "uniform-sphere-sampling" && (
            <ellipse cx="250" cy="88" rx="74" ry="25" opacity="0.45" />
          )}
        </g>
      );
    }
    if (slug === "sphere-tracing") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 45 86 H 455" strokeWidth="3" />
          <circle cx="390" cy="86" r="53" strokeWidth="4" />
          <circle cx="257" cy="86" r="80" strokeDasharray="5 6" opacity="0.4" />
          <circle cx="320" cy="86" r="17" strokeDasharray="5 6" opacity="0.4" />
          <circle cx="334" cy="86" r="3" strokeDasharray="5 6" opacity="0.4" />
          <circle cx="257" cy="86" r="5" fill="currentColor" />
          <circle cx="320" cy="86" r="5" fill="currentColor" />
          <circle cx="337" cy="86" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "a-search" || slug === "dijkstra-s-algorithm") {
      return (
        <g fill="none" stroke="currentColor">
          <path
            d="M 30 135 H 470 M 30 90 H 470 M 30 45 H 470 M 75 20 V 155 M 145 20 V 155 M 215 20 V 155 M 285 20 V 155 M 355 20 V 155 M 425 20 V 155"
            strokeWidth="1.5"
            opacity="0.25"
          />
          <rect
            x="225"
            y="48"
            width="115"
            height="78"
            fill="currentColor"
            fillOpacity="0.15"
          />
          <path
            d="M 72 133 L 145 133 L 145 88 L 215 88 L 215 43 L 355 43 L 425 43"
            strokeWidth="5"
          />
          <circle cx="72" cy="133" r="7" fill="currentColor" />
          <circle cx="425" cy="43" r="7" fill="currentColor" />
        </g>
      );
    }
    if (slug === "l-system" || slug === "space-colonization-algorithm") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M 250 160 L 250 100 L 190 55 M 250 100 L 310 60 M 190 55 L 155 25 M 190 55 L 210 25 M 310 60 L 285 25 M 310 60 L 355 30" />
          <circle cx="250" cy="160" r="6" fill="currentColor" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <circle cx="250" cy="85" r="25" opacity="0.35" strokeWidth="2" />
        <path
          d={
            variant % 2 === 0
              ? "M 25 135 C 122 135, 145 26, 240 40 S 350 138, 470 45"
              : "M 25 135 Q 136 5, 245 95 T 470 40"
          }
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="25" cy="135" r="6" fill="currentColor" />
        <circle
          cx="470"
          cy={variant % 2 === 0 ? "45" : "40"}
          r="6"
          fill="currentColor"
        />
      </g>
    );
  }
  if (mode === "physics") {
    if (slug === "buoyancy") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 40 95 Q 90 75, 140 95 T 240 95 T 340 95 T 440 95" />
          <rect
            x="205"
            y="55"
            width="90"
            height="95"
            rx="5"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M 250 145 V 35 M 240 50 L 250 35 L 260 50" strokeWidth="5" />
        </g>
      );
    }
    if (slug === "verlet-integration") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 85 125 L 225 88 L 390 42" strokeDasharray="7 6" />
          <circle
            cx="85"
            cy="125"
            r="9"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <circle cx="225" cy="88" r="9" fill="currentColor" />
          <circle
            cx="390"
            cy="42"
            r="9"
            fill="currentColor"
            fillOpacity="0.5"
          />
          <path d="M 350 45 L 390 42 L 365 72" />
        </g>
      );
    }
    if (slug === "position-based-dynamics" || slug === "extended-pbd") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 105 90 H 395" strokeDasharray="7 6" opacity="0.45" />
          <circle cx="105" cy="90" r="12" fill="currentColor" />
          <circle cx="395" cy="90" r="12" fill="currentColor" />
          <circle cx="170" cy="90" r="12" strokeDasharray="5 5" />
          <circle cx="330" cy="90" r="12" strokeDasharray="5 5" />
          <path d="M 145 60 L 170 90 L 145 120 M 355 60 L 330 90 L 355 120" />
          {slug === "extended-pbd" && (
            <path
              d="M 185 90 l 15 -15 l 15 30 l 15 -30 l 15 30 l 15 -30 l 15 15"
              strokeWidth="2"
            />
          )}
        </g>
      );
    }
    if (slug === "joints") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        >
          <path d="M 80 90 L 160 55 L 240 108 L 325 55 L 420 90" />
          {[
            [80, 90],
            [160, 55],
            [240, 108],
            [325, 55],
            [420, 90],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="10" fill="currentColor" />
          ))}
        </g>
      );
    }
    if (slug === "friction") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 65 135 H 440" strokeWidth="6" />
          <rect
            x="205"
            y="65"
            width="90"
            height="65"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M 100 95 H 195 M 185 85 L 195 95 L 185 105 M 300 115 H 365 M 310 105 L 300 115 L 310 125 M 250 65 V 25 M 240 40 L 250 25 L 260 40" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <path
          d="M 50 86 L 145 86 L 165 65 L 185 105 L 205 65 L 225 105 L 245 65 L 265 105 L 285 65 L 305 105 L 325 86 L 445 86"
          strokeWidth="3"
        />
        <circle
          cx={105 + variant * 3}
          cy="86"
          r="19"
          fill="currentColor"
          fillOpacity="0.15"
          strokeWidth="3"
        />
        <circle
          cx={400 - variant * 3}
          cy="86"
          r="19"
          fill="currentColor"
          fillOpacity="0.35"
          strokeWidth="3"
        />
        <path
          d="M 105 122 L 105 149 M 400 122 L 400 149"
          opacity="0.4"
          strokeWidth="2"
        />
      </g>
    );
  }
  if (mode === "rig") {
    const elbowY = 38 + variant * 5;
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      >
        <path d={`M 85 128 L 180 ${elbowY} L 265 106 L 365 54 L 450 92`} />
        <g fill="currentColor">
          {[
            [85, 128],
            [180, elbowY],
            [265, 106],
            [365, 54],
            [450, 92],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="8" />
          ))}
        </g>
        <circle cx="450" cy="92" r="20" strokeWidth="2" strokeDasharray="5 5" />
      </g>
    );
  }
  if (mode === "camera") {
    return (
      <g fill="none" stroke="currentColor">
        <rect x="90" y="28" width="315" height="125" rx="5" strokeWidth="3" />
        <rect
          x="150"
          y="55"
          width="185"
          height="72"
          rx="4"
          strokeDasharray="7 6"
          opacity="0.6"
        />
        <circle
          cx={210 + variant * 13}
          cy="92"
          r="12"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path d="M 35 80 L 90 54 M 35 80 L 90 126" strokeWidth="3" />
      </g>
    );
  }
  if (mode === "collision") {
    return (
      <g fill="none" stroke="currentColor">
        <rect
          x={95 + variant * 3}
          y="46"
          width="145"
          height="88"
          rx="8"
          strokeWidth="3"
        />
        <circle cx={310 - variant * 2} cy="89" r="58" strokeWidth="3" />
        <path d="M 260 27 L 260 150" strokeDasharray="6 5" opacity="0.6" />
        <circle cx="260" cy="89" r="5" fill="currentColor" />
      </g>
    );
  }
  return null;
}

function ProcessScene({ mode, variant, slug }: SceneProps) {
  if (mode === "pipeline" || mode === "class") {
    if (slug === "channel-packing") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2, 3].map((index) => (
            <g key={index}>
              <rect
                x={55 + index * 105}
                y="44"
                width="75"
                height="75"
                rx="5"
                fill="currentColor"
                fillOpacity={0.06 + index * 0.07}
              />
              <path
                d={`M ${130 + index * 105} 82 H ${153 + index * 105}`}
                opacity={index === 3 ? 0 : 0.5}
              />
            </g>
          ))}
        </g>
      );
    }
    if (slug === "ping-pong-buffers") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect x="85" y="48" width="125" height="80" rx="7" />
          <rect x="290" y="48" width="125" height="80" rx="7" />
          <path d="M 210 68 H 290 M 278 58 L 290 68 L 278 78 M 290 108 H 210 M 222 98 L 210 108 L 222 118" />
        </g>
      );
    }
    if (slug === "structure-of-arrays") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4, 5].map((column) => (
              <rect
                key={`${row}-${column}`}
                x={62 + column * 63}
                y={29 + row * 44}
                width="52"
                height="35"
                rx="3"
                fill="currentColor"
                fillOpacity={0.08 + row * 0.09}
              />
            ))
          )}
        </g>
      );
    }
    if (slug === "object-pool") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect x="165" y="43" width="170" height="96" rx="8" />
          <circle
            cx="220"
            cy="90"
            r="12"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <circle
            cx="280"
            cy="90"
            r="12"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path d="M 80 88 H 165 M 335 88 H 420 M 420 88 Q 445 30, 250 20 Q 90 20, 80 88" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={42 + index * 155}
            y={40 + (mode === "class" && index === 1 ? -10 : 0)}
            width="105"
            height={mode === "class" && index === 1 ? 100 : 80}
            rx="8"
            fill="currentColor"
            fillOpacity={0.06 + index * 0.08}
            strokeWidth="2"
          />
        ))}
        <path d="M 148 80 H 192 M 303 80 H 347" strokeWidth="3" />
        <path
          d="M 184 73 L 194 80 L 184 87 M 339 73 L 349 80 L 339 87"
          strokeWidth="3"
        />
        {mode === "class" && (
          <>
            <path
              d="M 210 65 H 291 M 210 88 H 291 M 210 111 H 275"
              opacity="0.5"
            />
            <circle cx={90 + variant * 2} cy="80" r="6" fill="currentColor" />
          </>
        )}
      </g>
    );
  }
  if (mode === "fluid") {
    if (
      slug === "particle-in-cell" ||
      slug === "affine-particle-in-cell" ||
      slug === "material-point-method"
    ) {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2, 3].map((column) => (
            <path
              key={column}
              d={`M ${100 + column * 100} 25 V 150`}
              opacity="0.35"
            />
          ))}
          {[0, 1, 2].map((row) => (
            <path key={row} d={`M 90 ${35 + row * 52} H 410`} opacity="0.35" />
          ))}
          {(
            [
              [155, 65],
              [255, 100],
              [355, 70],
            ] as const
          ).map(([x, y], index) => (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="11"
                fill="currentColor"
                fillOpacity="0.25"
              />
              <path
                d={`M ${x + 12} ${y} l 25 ${index % 2 === 0 ? -12 : 10}`}
                strokeWidth="3"
              />
            </g>
          ))}
          {slug === "affine-particle-in-cell" && (
            <path d="M 235 105 A 27 27 0 1 1 275 85" strokeWidth="3" />
          )}
          {slug === "material-point-method" && (
            <path d="M 95 145 Q 230 105, 405 145" strokeWidth="4" />
          )}
        </g>
      );
    }
    return (
      <g>
        {gridCells.map(({ x, y }, index) => (
          <rect
            key={index}
            x={x - 17}
            y={y - 17}
            width="34"
            height="34"
            fill="currentColor"
            opacity={0.06 + ((index * 3 + variant) % 9) * 0.05}
            stroke="currentColor"
            strokeOpacity="0.35"
          />
        ))}
        <path
          d="M 65 120 C 135 25, 180 140, 260 61 S 390 32, 450 105"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
      </g>
    );
  }
  if (mode === "volume") {
    return (
      <g fill="none" stroke="currentColor">
        {[0, 1, 2, 3].map((index) => (
          <rect
            key={index}
            x={110 + index * 65}
            y={30 + index * 7}
            width="105"
            height="110"
            rx="20"
            fill="currentColor"
            fillOpacity={0.04 + index * 0.05}
            strokeOpacity="0.4"
          />
        ))}
        <path d="M 25 85 H 465" strokeWidth="3" strokeDasharray="8 6" />
        <circle cx="35" cy="85" r="7" fill="currentColor" />
        <circle cx="450" cy="85" r={4 + (variant % 5)} fill="currentColor" />
      </g>
    );
  }
  if (mode === "light") {
    if (slug === "sdf-gradient") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="250" cy="88" r="60" />
          <circle cx="250" cy="88" r="88" strokeDasharray="6 7" opacity="0.4" />
          <path
            d="M 295 47 L 345 4 M 333 10 L 345 4 L 341 18"
            strokeWidth="5"
          />
        </g>
      );
    }
    if (
      slug === "henyey-greenstein-phase-function" ||
      slug === "mie-scattering"
    ) {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="220" cy="88" r="8" fill="currentColor" />
          <path
            d="M 55 88 H 210 M 230 88 L 445 45 M 230 88 L 445 88 M 230 88 L 445 130"
            opacity="0.7"
          />
          <path
            d="M 225 88 C 310 35, 385 30, 440 88 C 385 145, 310 140, 225 88 Z"
            strokeDasharray="6 6"
            opacity="0.5"
          />
        </g>
      );
    }
    if (slug === "rayleigh-scattering") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 45 88 H 230" />
          <circle cx="245" cy="88" r="8" fill="currentColor" />
          <path
            d="M 255 80 L 360 25 M 255 83 L 430 50 M 255 93 L 430 130 M 255 97 L 360 155"
            opacity="0.55"
          />
          <path d="M 255 88 H 450" strokeWidth="4" />
        </g>
      );
    }
    if (slug === "cosine-weighted-hemisphere-sampling") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 100 135 H 400 M 150 135 A 100 100 0 0 1 350 135" />
          <path
            d="M 250 135 V 30 M 250 135 L 220 40 M 250 135 L 285 47 M 250 135 L 170 86 M 250 135 L 325 87"
            opacity="0.7"
          />
        </g>
      );
    }
    if (slug === "fresnel") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 70 125 Q 250 95, 430 125" strokeWidth="5" />
          <path d="M 115 25 L 150 110 L 210 38 M 270 26 L 320 110 L 430 66" />
          <path
            d="M 150 110 V 45 M 320 110 V 45"
            strokeDasharray="5 6"
            opacity="0.5"
          />
          <circle cx="320" cy="110" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "ggx") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 45 118 l 30 -8 l 30 10 l 30 -15 l 30 14 l 30 -10 l 30 10 l 30 -14 l 30 13 l 30 -10 l 30 11 l 30 -13 l 30 12" />
          <path
            d="M 85 35 L 230 105 M 230 105 L 300 28 M 230 105 L 340 43 M 230 105 L 375 70"
            opacity="0.75"
          />
        </g>
      );
    }
    if (slug === "anisotropic-reflection") {
      return (
        <g fill="none" stroke="currentColor">
          <ellipse cx="255" cy="85" rx="156" ry="40" strokeWidth="4" />
          <ellipse
            cx="255"
            cy="85"
            rx="110"
            ry="20"
            strokeWidth="3"
            opacity="0.5"
          />
          <path
            d="M 105 60 H 405 M 105 110 H 405"
            strokeWidth="2"
            strokeDasharray="8 6"
          />
        </g>
      );
    }
    if (slug === "image-based-lighting") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle
            cx="250"
            cy="90"
            r="42"
            fill="currentColor"
            fillOpacity="0.12"
          />
          {(
            [
              [55, 45],
              [115, 25],
              [365, 25],
              [445, 50],
              [55, 135],
              [440, 135],
            ] as const
          ).map(([x, y], index) => (
            <path
              key={index}
              d={`M ${x} ${y} L ${250 + (x < 250 ? -30 : 30)} ${90 + (y < 90 ? -25 : 25)}`}
              opacity="0.5"
            />
          ))}
        </g>
      );
    }
    if (slug === "rim-lighting") {
      return (
        <g fill="none" stroke="currentColor">
          <circle cx="250" cy="87" r="64" strokeWidth="3" opacity="0.3" />
          <path
            d="M 210 38 A 64 64 0 0 0 210 136 M 290 38 A 64 64 0 0 1 290 136"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle
            cx="410"
            cy="45"
            r="13"
            fill="currentColor"
            fillOpacity="0.35"
          />
        </g>
      );
    }
    if (slug === "god-rays") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle
            cx="250"
            cy="28"
            r="14"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path d="M 50 95 H 220 M 280 95 H 450" strokeWidth="12" />
          <path
            d="M 234 95 L 165 155 M 245 95 L 230 155 M 256 95 L 290 155 M 270 95 L 360 155"
            opacity="0.6"
          />
        </g>
      );
    }
    if (slug === "caustics") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 35 55 Q 85 22 135 55 T 235 55 T 335 55 T 435 55 M 40 145 H 460" />
          <path
            d="M 95 62 L 220 145 M 175 58 L 220 145 M 280 58 L 345 145 M 380 58 L 345 145"
            opacity="0.75"
          />
          <circle cx="220" cy="145" r="5" fill="currentColor" />
          <circle cx="345" cy="145" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "ssao") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 80 130 H 420 M 250 40 V 130" strokeWidth="8" />
          <path
            d="M 220 128 Q 250 70 280 128 Z"
            fill="currentColor"
            fillOpacity="0.28"
          />
          <circle
            cx="250"
            cy="115"
            r="30"
            strokeDasharray="5 5"
            opacity="0.4"
          />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <circle cx="90" cy="42" r="15" fill="currentColor" fillOpacity="0.35" />
        <path
          d="M 105 52 L 250 115 L 390 45 M 125 53 L 250 115 L 430 90 M 110 65 L 250 115 L 365 25"
          strokeWidth="3"
          opacity="0.7"
        />
        <path d="M 100 118 H 405" strokeWidth="5" />
        <path d="M 250 115 V 35" strokeDasharray="5 5" opacity="0.5" />
        <circle cx={390 - variant * 12} cy="45" r="5" fill="currentColor" />
      </g>
    );
  }
  if (mode === "image") {
    return (
      <g fill="none" stroke="currentColor">
        <rect x="45" y="30" width="170" height="120" rx="6" strokeWidth="3" />
        <rect x="285" y="30" width="170" height="120" rx="6" strokeWidth="3" />
        <circle
          cx="124"
          cy="86"
          r="33"
          fill="currentColor"
          fillOpacity="0.24"
        />
        <circle
          cx={364 + variant * 2}
          cy="86"
          r="33"
          fill="currentColor"
          fillOpacity="0.52"
        />
        <path d="M 227 90 H 273 M 262 80 L 273 90 L 262 100" strokeWidth="3" />
      </g>
    );
  }
  return null;
}

function DiagramScene({
  mode,
  variant,
  slug,
  process,
}: SceneProps & { process: string }) {
  const sceneProps = { mode, variant, slug };
  return (
    <svg
      viewBox="0 0 500 205"
      aria-hidden="true"
      className="w-full text-foreground"
    >
      <rect
        x="1"
        y="1"
        width="498"
        height="203"
        rx="12"
        fill="none"
        stroke="currentColor"
        opacity="0.2"
      />
      <FieldScene {...sceneProps} />
      <GeometryScene {...sceneProps} />
      <MotionScene {...sceneProps} />
      <ProcessScene {...sceneProps} />
      <path d="M 25 175 H 475" stroke="currentColor" opacity="0.15" />
      <text
        x="250"
        y="194"
        fill="currentColor"
        fontSize="13"
        fontWeight="600"
        textAnchor="middle"
      >
        {process}
      </text>
    </svg>
  );
}

export function KeywordVisual({
  keyword,
  locale,
}: {
  keyword: Keyword;
  locale: Locale;
}) {
  const { diagram } = keyword;
  const steps = [
    { label: locale === "ja" ? "入力" : "Input", value: diagram.input },
    { label: locale === "ja" ? "処理" : "Process", value: diagram.process },
    { label: locale === "ja" ? "結果" : "Result", value: diagram.output },
  ];
  return (
    <figure className="rounded-xl border border-border bg-card p-5 sm:p-7">
      <DiagramScene
        mode={diagram.mode}
        variant={diagram.variant}
        slug={keyword.slug}
        process={diagram.process}
      />
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className="rounded-lg border border-border bg-muted/30 p-3"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {index + 1}. {step.label}
            </p>
            <p className="mt-1 text-sm font-medium" lang="ja">
              {step.value}
            </p>
          </li>
        ))}
      </ol>
      <figcaption className="mt-4 text-xs text-muted-foreground">
        {locale === "ja"
          ? `${keyword.name}のしくみを示す模式図。入力・処理・結果の関係を表し、実際の数値や描画結果は実装によって異なります。`
          : `A schematic of ${keyword.english}. It shows the relationship between input, process, and result; exact values and rendering depend on the implementation.`}
      </figcaption>
    </figure>
  );
}
