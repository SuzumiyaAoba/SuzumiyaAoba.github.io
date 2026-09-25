import type {
  AnimationSceneKind,
  Keyword,
  KeywordAnimation,
} from "../model/catalog";
import type { Locale } from "@/shared/lib/routing";
import {
  demoPresets,
  illustrativeFamilies,
  illustrativeSlugs,
} from "../model/demo-presets";
import { KeywordDemo } from "./keyword-demo";

type Phase = 0 | 1 | 2;
type SceneProps = {
  kind: AnimationSceneKind;
  phase: Phase;
  variant: number;
  slug: string;
};

function FieldAndSurfaceScene({ kind, phase, variant, slug }: SceneProps) {
  if (kind === "flow") {
    return (
      <g fill="none" stroke="currentColor">
        <path
          d="M 26 76 C 80 12, 150 138, 211 65"
          strokeWidth="3"
          opacity="0.4"
        />
        {[0, 1, 2, 3].map((index) => {
          const angle = (index * Math.PI) / 2 + phase * 0.7 + variant * 0.09;
          return (
            <circle
              key={index}
              cx={119 + Math.cos(angle) * (17 + index * 11)}
              cy={70 + Math.sin(angle) * (17 + index * 7)}
              r="5"
              fill="currentColor"
            />
          );
        })}
      </g>
    );
  }
  if (kind === "deform") {
    return (
      <path
        d={`M 16 101 Q 62 ${80 - phase * 14}, 106 94 T 224 ${81 + phase * 8}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    );
  }
  if (kind === "field") {
    if (slug === "ridged-multifractal-noise") {
      return (
        <path
          d={`M 15 111 L 58 ${71 - phase * 4} L 85 111 L 122 ${32 - phase * 3} L 158 111 L 193 ${62 - phase * 5} L 225 111`}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
        />
      );
    }
    if (slug === "turbulence-noise") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {[0, 1, 2].map((index) => (
            <path
              key={index}
              d={`M 15 ${35 + index * 34} L 57 ${9 + index * 34 + phase * 3} L 99 ${35 + index * 34} L 141 ${15 + index * 34 - phase * 3} L 183 ${35 + index * 34} L 225 ${13 + index * 34}`}
              opacity={0.8 - index * 0.2}
            />
          ))}
        </g>
      );
    }
    return (
      <g>
        {Array.from({ length: 15 }, (_, index) => (
          <circle
            key={index}
            cx={30 + (index % 5) * 43}
            cy={33 + Math.floor(index / 5) * 39}
            r={7 + ((index + variant + phase) % 3) * 3}
            fill="currentColor"
            opacity={0.13 + ((index * 2 + phase * 3) % 6) * 0.12}
          />
        ))}
      </g>
    );
  }
  if (kind === "cells") {
    if (slug === "worley") {
      const boundary = 105 + phase * 12;
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d={`M ${boundary} 17 L ${boundary + 8} 72 L ${boundary - 6} 120 M 20 ${70 + phase * 4} L ${boundary + 8} 72 L 220 ${78 - phase * 4}`}
            opacity="0.55"
          />
          <circle cx={58 + phase * 4} cy="43" r="5" fill="currentColor" />
          <circle cx={166 + phase * 8} cy="42" r="5" fill="currentColor" />
          <circle cx={65 + phase * 6} cy="103" r="5" fill="currentColor" />
          <circle cx={176 + phase * 3} cy="106" r="5" fill="currentColor" />
        </g>
      );
    }
    if (slug === "reaction-diffusion") {
      return (
        <g fill="none" stroke="currentColor">
          {[0, 1, 2, 3].map((index) => (
            <circle
              key={index}
              cx={52 + index * 46}
              cy={55 + (index % 2) * 25}
              r={8 + phase * 7}
              strokeWidth="3"
              opacity={0.7 - index * 0.1}
            />
          ))}
        </g>
      );
    }
    if (slug === "binary-space-partitioning") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="22" y="20" width="196" height="100" />
          <path d={phase === 0 ? "" : "M 120 20 V 120"} />
          <path d={phase === 2 ? "M 22 65 H 120 M 120 83 H 218" : ""} />
        </g>
      );
    }
    if (
      slug === "wave-function-collapse" ||
      slug === "wang-tiles" ||
      slug === "dijkstra-s-algorithm"
    ) {
      const filled = ([2, 8, 15] as const)[phase];
      return (
        <g>
          {Array.from({ length: 15 }, (_, index) => {
            const column = index % 5;
            const row = Math.floor(index / 5);
            const visible =
              slug === "dijkstra-s-algorithm"
                ? Math.abs(column - 2) + Math.abs(row - 1) <= phase
                : index < filled;
            return (
              <rect
                key={index}
                x={21 + column * 40}
                y={19 + row * 35}
                width="36"
                height="31"
                rx="2"
                fill="currentColor"
                fillOpacity={
                  visible ? 0.13 + ((index + variant) % 4) * 0.14 : 0
                }
                stroke="currentColor"
                strokeOpacity="0.25"
              />
            );
          })}
        </g>
      );
    }
    return (
      <g>
        {Array.from({ length: 15 }, (_, index) => (
          <rect
            key={index}
            x={21 + (index % 5) * 40}
            y={19 + Math.floor(index / 5) * 35}
            width="36"
            height="31"
            rx="3"
            fill="currentColor"
            opacity={0.08 + ((index + phase * 2 + variant) % 5) * 0.14}
          />
        ))}
      </g>
    );
  }
  if (kind === "surface") {
    if (slug === "billboard") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path
            d={`M ${34 + phase * 55} 70 L ${74 + phase * 55} 45 L ${74 + phase * 55} 95 Z`}
          />
          <path
            d={`M ${142 + phase * 10} 32 L ${142 + phase * 10} 108 L ${189 + phase * 10} 108 L ${189 + phase * 10} 32 Z`}
          />
        </g>
      );
    }
    if (slug === "polar-coordinates") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          transform={`rotate(${phase * 25} 120 70)`}
        >
          <circle cx="120" cy="70" r="48" />
          <circle cx="120" cy="70" r="23" opacity="0.5" />
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <path
              key={index}
              d="M 120 22 V 45"
              transform={`rotate(${index * 60} 120 70)`}
            />
          ))}
        </g>
      );
    }
    if (slug === "depth-of-field") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="70" cy="72" r="24" strokeOpacity={0.9 - phase * 0.325} />
          <circle
            cx="174"
            cy="72"
            r="24"
            strokeOpacity={0.25 + phase * 0.325}
          />
          <circle cx={70 + phase * 52} cy="72" r="6" fill="currentColor" />
          <path d="M 26 113 H 218" opacity="0.25" />
        </g>
      );
    }
    if (slug === "temporal-anti-aliasing") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4">
          <path
            d={
              phase === 0
                ? "M 32 112 H 72 V 92 H 112 V 70 H 152 V 49 H 207"
                : phase === 1
                  ? "M 32 112 L 90 84 L 135 62 L 207 49"
                  : "M 32 112 L 207 49"
            }
          />
          <path d="M 32 118 L 207 55" opacity={phase === 2 ? 0.15 : 0} />
        </g>
      );
    }
    if (slug === "chromatic-aberration") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {[-1, 0, 1].map((offset) => (
            <circle
              key={offset}
              cx={120 + offset * phase * 8}
              cy="70"
              r="35"
              opacity={0.3 + (offset + 1) * 0.2}
            />
          ))}
        </g>
      );
    }
    if (slug === "depth") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 75 108 L 120 34 L 165 108 Z" strokeWidth={2 + phase * 2} />
          <path d="M 25 115 H 215" strokeWidth="2" opacity="0.25" />
        </g>
      );
    }
    if (slug === "screen-space-reflections") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 20 75 H 220" />
          <circle cx={85 + phase * 34} cy="47" r="16" />
          <circle
            cx={85 + phase * 34}
            cy="103"
            r="16"
            opacity={0.15 + phase * 0.16}
          />
        </g>
      );
    }
    if (slug === "color-grading") {
      return (
        <g>
          {[0, 1, 2, 3, 4].map((index) => (
            <rect
              key={index}
              x={21 + index * 42}
              y="32"
              width="37"
              height="78"
              rx="3"
              fill="currentColor"
              opacity={0.13 + ((index + phase) % 5) * 0.16}
            />
          ))}
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 20 34 H 220 V 115 H 20 Z" strokeWidth="3" />
        {[0, 1, 2, 3].map((index) => (
          <path
            key={index}
            d={`M ${32 + index * 49 - phase * 11} 108 L ${65 + index * 49 - phase * 11} 40`}
            strokeWidth="3"
            opacity="0.35"
          />
        ))}
      </g>
    );
  }
  return null;
}

function ShapeAndTimingScene({ kind, phase, slug }: SceneProps) {
  if (kind === "curve" || kind === "route") {
    if (
      kind === "route" &&
      (slug === "a-search" || slug === "dijkstra-s-algorithm")
    ) {
      const positions = [
        [35, 108],
        [116, 49],
        [208, 44],
      ] as const;
      const [x, y] = positions[phase];
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect
            x="101"
            y="70"
            width="82"
            height="38"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path d="M 35 108 H 82 V 50 H 208" strokeDasharray="6 5" />
          <circle cx={x} cy={y} r="8" fill="currentColor" />
        </g>
      );
    }
    const positions = [
      [31, 108],
      [118, 48],
      [211, 63],
    ] as const;
    const [x, y] = positions[phase];
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 31 108 C 75 15, 156 125, 211 63" strokeWidth="4" />
        <circle cx={x} cy={y} r="8" fill="currentColor" />
        <circle cx="211" cy="63" r="5" />
      </g>
    );
  }
  if (kind === "timing") {
    if (slug === "coyote-time" || slug === "input") {
      const positions = [
        [78, 70],
        [136, 92],
        [190, 38],
      ] as const;
      const [x, y] = positions[phase];
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 15 104 H 115" strokeWidth="6" />
          <circle cx={x} cy={y} r="10" fill="currentColor" fillOpacity="0.2" />
          <path d="M 118 28 H 178" strokeDasharray="5 5" opacity="0.45" />
        </g>
      );
    }
    if (slug === "size") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle
            cx="120"
            cy="69"
            r={[12, 34, 21][phase]}
            fill="currentColor"
            fillOpacity={[0.5, 0.32, 0.1][phase]}
          />
          <path d="M 25 113 H 215" opacity="0.35" />
        </g>
      );
    }
    if (slug === "jump-apex-hang-time") {
      const positions = [
        [32, 105],
        [120, 33],
        [150, 34],
      ] as const;
      const [x, y] = positions[phase];
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 26 106 Q 120 12 214 106" strokeWidth="4" />
          <circle cx={x} cy={y} r="8" fill="currentColor" />
        </g>
      );
    }
    if (slug === "fixed-timestep") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 24 103 H 218" opacity="0.4" />
          {Array.from({ length: 2 + phase * 3 }, (_, index) => (
            <path key={index} d={`M ${38 + index * 26} 45 V 100`} />
          ))}
        </g>
      );
    }
    if (slug === "exponential-damping" || slug === "easing") {
      const positions =
        slug === "easing"
          ? ([
              [32, 105],
              [222, 26],
              [208, 34],
            ] as const)
          : ([
              [32, 105],
              [130, 35],
              [208, 34],
            ] as const);
      const [x, y] = positions[phase];
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 23 20 V 116 H 220" opacity="0.45" strokeWidth="2" />
          <path
            d={
              slug === "easing"
                ? "M 32 105 C 105 110, 163 2, 222 26 Q 220 34 208 34"
                : "M 32 105 C 90 45, 130 35, 208 34"
            }
            strokeWidth="4"
          />
          <circle cx={x} cy={y} r="7" fill="currentColor" />
        </g>
      );
    }
    const positions = [
      [32, 105],
      [119, 52],
      [208, 34],
    ] as const;
    const [x, y] = positions[phase];
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 23 20 V 116 H 220" opacity="0.45" strokeWidth="2" />
        <path d="M 32 105 C 110 105, 130 34, 208 34" strokeWidth="4" />
        <circle cx={x} cy={y} r="7" fill="currentColor" />
      </g>
    );
  }
  if (kind === "spring") {
    const x =
      slug === "critical-damping"
        ? ([50, 101, 120] as const)[phase]
        : ([50, 177, 128] as const)[phase];
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 120 20 V 117" strokeDasharray="5 5" opacity="0.45" />
        <path d="M 24 108 H 216" opacity="0.35" />
        <circle
          cx={x}
          cy="72"
          r="19"
          fill="currentColor"
          fillOpacity="0.22"
          strokeWidth="3"
        />
        <path d={`M ${x} 93 V 108`} strokeWidth="2" />
      </g>
    );
  }
  if (kind === "shape" || kind === "merge") {
    if (slug === "constructive-solid-geometry") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect
            x="44"
            y="27"
            width="152"
            height="88"
            rx="6"
            fill="currentColor"
            fillOpacity="0.14"
          />
          <circle
            cx={123 + phase * 15}
            cy="72"
            r={16 + phase * 10}
            fill="var(--card)"
            strokeWidth="3"
          />
        </g>
      );
    }
    if (slug === "domain-repetition") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          {Array.from({ length: phase + 2 }, (_, index) => (
            <circle
              key={index}
              cx={38 + index * 50}
              cy="70"
              r="18"
              fill="currentColor"
              fillOpacity="0.14"
            />
          ))}
        </g>
      );
    }
    const distance = 53 - phase * 17;
    return (
      <g fill="none" stroke="currentColor" strokeWidth="4">
        <circle
          cx={120 - distance}
          cy="70"
          r={kind === "shape" ? 19 + phase * 8 : 31}
          fill="currentColor"
          fillOpacity="0.1"
        />
        <circle
          cx={120 + distance}
          cy="70"
          r={kind === "shape" ? 19 + phase * 8 : 31}
          fill="currentColor"
          fillOpacity="0.1"
        />
      </g>
    );
  }
  if (kind === "reveal") {
    return (
      <g>
        {Array.from({ length: 20 }, (_, index) => (
          <rect
            key={index}
            x={18 + (index % 5) * 42}
            y={15 + Math.floor(index / 5) * 29}
            width="36"
            height="25"
            fill="currentColor"
            opacity={index % 5 <= phase + 1 ? 0.15 : 0.75}
          />
        ))}
      </g>
    );
  }
  return null;
}

function ScatterScene({ phase, slug, variant }: SceneProps) {
  if (slug === "density-masked-scattering") {
    const positions = [
      [40, 38],
      [62, 95],
      [92, 62],
      [118, 38],
      [75, 52],
      [120, 102],
      [158, 75],
      [52, 78],
      [190, 42],
    ] as const;
    return (
      <g>
        <rect
          x="18"
          y="19"
          width="115"
          height="100"
          fill="currentColor"
          opacity="0.08"
        />
        {positions.slice(0, 3 + phase * 3).map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="4" fill="currentColor" />
        ))}
      </g>
    );
  }
  if (slug === "uniform-sphere-sampling" || slug === "uniform-disk") {
    return (
      <g fill="none" stroke="currentColor">
        <circle cx="120" cy="70" r="53" strokeWidth="2" opacity="0.55" />
        {Array.from({ length: 3 + phase * 3 }, (_, index) => {
          const angle = (index * 2.4 + variant * 0.2) % (Math.PI * 2);
          const radius =
            slug === "uniform-sphere-sampling" ? 53 : 15 + (index % 3) * 14;
          return (
            <circle
              key={index}
              cx={120 + Math.cos(angle) * radius}
              cy={70 + Math.sin(angle) * radius}
              r="4"
              fill="currentColor"
            />
          );
        })}
      </g>
    );
  }
  if (slug === "stratified") {
    return (
      <g fill="none" stroke="currentColor">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((column) => (
            <g key={`${row}-${column}`}>
              <rect
                x={38 + column * 55}
                y={16 + row * 36}
                width="55"
                height="36"
                strokeOpacity="0.25"
              />
              {column + row <= phase + 1 && (
                <circle
                  cx={63 + column * 55 + (row % 2) * 6}
                  cy={34 + row * 36}
                  r="4"
                  fill="currentColor"
                />
              )}
            </g>
          ))
        )}
      </g>
    );
  }
  if (slug === "blue-noise") {
    const positions = [
      [38, 37],
      [108, 27],
      [191, 39],
      [65, 103],
      [145, 98],
      [211, 105],
      [117, 62],
      [184, 72],
    ] as const;
    return (
      <g fill="none" stroke="currentColor">
        {positions.map(([x, y], index) => (
          <circle
            key={index}
            cx={x + (((phase + index) % 3) - 1) * 7}
            cy={y + (((phase * 2 + index) % 3) - 1) * 6}
            r="4"
            fill="currentColor"
          />
        ))}
      </g>
    );
  }
  if (slug === "poisson-disk-sampling" || slug === "low-discrepancy-sequence") {
    const positions = [
      [38, 37],
      [108, 27],
      [191, 39],
      [65, 103],
      [145, 98],
      [211, 105],
      [117, 62],
      [184, 72],
    ] as const;
    return (
      <g fill="none" stroke="currentColor">
        {positions.slice(0, 2 + phase * 3).map(([x, y], index) => (
          <g key={index}>
            {slug === "poisson-disk-sampling" && (
              <circle
                cx={x}
                cy={y}
                r="14"
                strokeDasharray="4 5"
                opacity="0.26"
              />
            )}
            <circle cx={x} cy={y} r="4" fill="currentColor" />
          </g>
        ))}
      </g>
    );
  }
  if (slug === "point-relaxation") {
    return (
      <g fill="none" stroke="currentColor">
        {(
          [
            [68, 40],
            [77, 55],
            [160, 38],
            [190, 97],
            [176, 104],
          ] as const
        ).map(([x, y], index) => (
          <circle
            key={index}
            cx={x + phase * (index % 2 === 0 ? -8 : 12)}
            cy={y + phase * (index % 2 === 0 ? 8 : -10)}
            r="5"
            fill="currentColor"
          />
        ))}
      </g>
    );
  }
  if (slug === "importance-sampling" || slug === "gaussian") {
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 20 117 H 222" opacity="0.3" />
        <path
          d={
            slug === "gaussian"
              ? "M 35 115 Q 120 4 205 115"
              : "M 40 115 Q 175 100 206 20"
          }
          opacity="0.4"
          strokeWidth="2"
        />
        {Array.from({ length: 4 + phase * 3 }, (_, index) => (
          <circle
            key={index}
            cx={
              slug === "gaussian"
                ? 120 + ((index * 19) % 71) - 35
                : 155 + ((index * 17) % 51)
            }
            cy={98 - ((index * 13) % 58)}
            r="4"
            fill="currentColor"
          />
        ))}
      </g>
    );
  }
  if (slug === "environment-query") {
    return (
      <g fill="none" stroke="currentColor">
        {(
          [
            [45, 35],
            [110, 45],
            [175, 30],
            [75, 105],
            [155, 105],
          ] as const
        )
          .slice(0, phase === 0 ? 2 : 5)
          .map(([x, y], index) => (
            <g key={index}>
              <circle cx={x} cy={y} r="5" fill="currentColor" />
              {phase === 2 && index === 3 && (
                <circle cx={x} cy={y} r="16" strokeWidth="3" />
              )}
            </g>
          ))}
      </g>
    );
  }
  return (
    <g>
      {Array.from({ length: 5 + phase * 5 }, (_, index) => (
        <circle
          key={index}
          cx={24 + ((index * 61 + variant * 11) % 193)}
          cy={20 + ((index * 43 + phase * 13) % 98)}
          r="4"
          fill="currentColor"
          opacity="0.5"
        />
      ))}
    </g>
  );
}

function EffectsScene({ kind, phase, variant, slug }: SceneProps) {
  if (kind === "scatter") {
    return (
      <ScatterScene kind={kind} phase={phase} variant={variant} slug={slug} />
    );
  }
  if (kind === "sprite") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        {phase < 2 ? (
          <path
            d={
              phase === 0
                ? "M 120 46 L 131 70 L 120 94 L 109 70 Z"
                : "M 120 19 L 135 49 L 174 34 L 155 70 L 186 94 L 146 94 L 120 122 L 94 94 L 54 94 L 85 70 L 66 34 L 105 49 Z"
            }
            fill="currentColor"
            fillOpacity="0.18"
          />
        ) : (
          [0, 1, 2, 3].map((index) => (
            <circle
              key={index}
              cx={65 + index * 38}
              cy={67 + (index % 2) * 20}
              r={18 + (index % 2) * 7}
              opacity="0.45"
            />
          ))
        )}
      </g>
    );
  }
  if (kind === "streak") {
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path
          d={`M ${55 + phase * 32} ${109 - phase * 18} L ${94 + phase * 57} ${82 - phase * 19}`}
          strokeWidth={4 + phase * 2}
        />
        <circle
          cx={94 + phase * 57}
          cy={82 - phase * 19}
          r="5"
          fill="currentColor"
        />
      </g>
    );
  }
  if (kind === "glyph") {
    return (
      <g
        transform={`translate(120 70) scale(${0.58 + phase * 0.26}) translate(-120 -70)`}
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="square"
      >
        <path d="M 84 113 L 120 24 L 156 113 M 96 86 H 144" />
      </g>
    );
  }
  if (kind === "particles" || kind === "throughput") {
    if (kind === "particles" && slug === "surface") {
      return (
        <g fill="none" stroke="currentColor">
          <path d="M 18 107 Q 115 88 222 107" strokeWidth="3" />
          {Array.from({ length: 3 + phase * 4 }, (_, index) => (
            <circle
              key={index}
              cx={35 + ((index * 37) % 175)}
              cy={91 - phase * 13 - (index % 3) * 10}
              r="4"
              fill="currentColor"
            />
          ))}
        </g>
      );
    }
    const count = kind === "throughput" ? 8 + phase * 12 : 5 + phase * 5;
    return (
      <g>
        {Array.from({ length: count }, (_, index) => (
          <circle
            key={index}
            cx={24 + ((index * 61 + variant * 11) % 193)}
            cy={20 + ((index * 43 + phase * 13) % 98)}
            r={kind === "throughput" ? 3 : 3 + (index % 3)}
            fill="currentColor"
            opacity={0.35 + (index % 3) * 0.2}
          />
        ))}
      </g>
    );
  }
  if (kind === "trail") {
    const paths = [
      "M 23 110 L 60 83",
      "M 23 110 Q 88 18, 128 57",
      "M 23 110 Q 88 18, 128 57 T 216 35",
    ];
    return (
      <g fill="none" stroke="currentColor">
        <path
          d={paths[phase]}
          strokeWidth="12"
          opacity="0.3"
          strokeLinecap="round"
        />
        <path d={paths[phase]} strokeWidth="3" />
        <circle
          cx={[60, 128, 216][phase]}
          cy={[83, 57, 35][phase]}
          r="6"
          fill="currentColor"
        />
      </g>
    );
  }
  if (kind === "fog") {
    return (
      <g>
        <rect
          x="15"
          y="25"
          width="210"
          height="90"
          rx="20"
          fill="currentColor"
          opacity={0.07 + phase * 0.13}
        />
        <circle
          cx="64"
          cy="64"
          r="20"
          fill="none"
          stroke="currentColor"
          opacity={0.55 - phase * 0.16}
        />
        <circle
          cx="175"
          cy="78"
          r="15"
          fill="none"
          stroke="currentColor"
          opacity={0.55 - phase * 0.16}
        />
      </g>
    );
  }
  if (kind === "light") {
    return (
      <g fill="none" stroke="currentColor">
        <circle
          cx={65 + phase * 52}
          cy="32"
          r="12"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <path
          d={`M ${65 + phase * 52} 44 L 120 105 L ${176 + phase * 10} 37`}
          strokeWidth="3"
        />
        <path d="M 20 108 H 220" strokeWidth="4" />
        <circle
          cx={120 + phase * 14}
          cy="105"
          r={8 + phase * 5}
          fill="currentColor"
          fillOpacity="0.17"
        />
      </g>
    );
  }
  if (kind === "wave") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        {[0, 1, 2].map((index) => (
          <path
            key={index}
            d={`M 12 ${40 + index * 29} Q ${48 + phase * 8} ${13 + index * 29}, 84 ${40 + index * 29} T 156 ${40 + index * 29} T 228 ${40 + index * 29}`}
            opacity={0.85 - index * 0.18}
          />
        ))}
      </g>
    );
  }
  return null;
}

function SystemsScene({ kind, phase, slug }: SceneProps) {
  if (kind === "flock") {
    if (slug === "optimal-reciprocal-collision-avoidance") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <circle
            cx={40 + phase * 57}
            cy={70 - phase * 8}
            r="10"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <circle
            cx={200 - phase * 55}
            cy={70 + phase * 8}
            r="10"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path d="M 20 70 H 220" strokeDasharray="5 5" opacity="0.35" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        {[0, 1, 2, 3, 4].map((index) => (
          <path
            key={index}
            d={`M ${38 + index * 36 - phase * (index % 2) * 4} ${25 + (index % 3) * 38 + phase * (2 - (index % 3)) * 7} l 13 5 l -13 5`}
          />
        ))}
      </g>
    );
  }
  if (kind === "rig") {
    if (slug === "procedural-wind-animation") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path
            d={`M 120 119 Q ${118 + phase * 8} 75 ${120 + phase * 12} 36 M ${119 + phase * 6} 77 L ${82 + phase * 8} 50 M ${120 + phase * 8} 70 L ${161 + phase * 10} 44 M ${120 + phase * 10} 52 L ${100 + phase * 7} 26`}
          />
        </g>
      );
    }
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path
          d={`M 70 112 L 105 70 L ${136 + phase * 19} ${44 + phase * 10} L ${168 + phase * 19} ${74 - phase * 14}`}
        />
        {[
          [70, 112],
          [105, 70],
          [136 + phase * 19, 44 + phase * 10],
          [168 + phase * 19, 74 - phase * 14],
        ].map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="5" fill="currentColor" />
        ))}
      </g>
    );
  }
  if (kind === "cloth") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        {[0, 1, 2].map((row) => (
          <path
            key={row}
            d={`M 25 ${27 + row * 39} Q 112 ${27 + row * 39 + phase * 13}, 215 ${27 + row * 39}`}
          />
        ))}
        {[0, 1, 2, 3, 4].map((column) => (
          <path
            key={column}
            d={`M ${25 + column * 47} 27 Q ${25 + column * 47 + phase * 7} 75 ${25 + column * 47} 105`}
          />
        ))}
      </g>
    );
  }
  if (kind === "fluid") {
    return (
      <g fill="none" stroke="currentColor">
        <path
          d={`M 25 95 C 85 ${25 + phase * 11}, 118 ${130 - phase * 12}, 216 46`}
          strokeWidth="5"
        />
        <circle
          cx={58 + phase * 55}
          cy={86 - phase * 17}
          r={16 + phase * 5}
          fill="currentColor"
          fillOpacity="0.17"
        />
      </g>
    );
  }
  if (kind === "physics") {
    if (slug === "buoyancy") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M 16 82 Q 55 69, 95 82 T 175 82 T 224 82" />
          <rect
            x="97"
            y={69 - phase * 13}
            width="46"
            height="47"
            rx="4"
            fill="currentColor"
            fillOpacity="0.15"
          />
        </g>
      );
    }
    if (slug === "verlet-integration") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path
            d="M 35 110 L 102 77 L 174 43"
            strokeDasharray="6 5"
            opacity="0.5"
          />
          {[
            [35, 110],
            [102, 77],
            [174, 43],
          ].map(([x, y], index) => (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={index === phase ? 9 : 5}
              fill="currentColor"
              fillOpacity={index === phase ? 0.5 : 0.18}
            />
          ))}
        </g>
      );
    }
    if (slug === "joints") {
      return (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        >
          <path
            d={`M 35 92 L 95 ${75 - phase * 6} L 155 ${52 + phase * 9} L 215 77`}
          />
          {[
            [35, 92],
            [95, 75 - phase * 6],
            [155, 52 + phase * 9],
            [215, 77],
          ].map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="6" fill="currentColor" />
          ))}
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor">
        <path d="M 15 115 H 225" strokeWidth="3" />
        <rect
          x={35 + phase * 65}
          y={58 - phase * 5}
          width="38"
          height="40"
          rx="4"
          fill="currentColor"
          fillOpacity="0.2"
          strokeWidth="3"
        />
      </g>
    );
  }
  if (kind === "growth") {
    if (slug === "hydraulic-erosion" || slug === "thermal-erosion") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="4">
          <path
            d={`M 20 108 L 75 46 L ${113 + phase * 7} ${50 + phase * 13} L 160 91 L 220 110`}
          />
          <path d="M 15 120 H 225" opacity="0.35" />
        </g>
      );
    }
    return (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <path d="M 120 120 V 82" />
        <path d={phase === 0 ? "" : "M 120 82 L 90 47 M 120 82 L 155 43"} />
        <path
          d={
            phase === 2
              ? "M 90 47 L 73 25 M 90 47 L 105 20 M 155 43 L 136 20 M 155 43 L 175 25"
              : ""
          }
        />
      </g>
    );
  }
  return null;
}

function InfrastructureScene({ kind, phase, slug }: SceneProps) {
  if (kind === "pipeline" || kind === "class") {
    if (slug === "object-pool") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="78" y="35" width="84" height="76" rx="7" />
          <path
            d="M 25 72 H 76 M 164 72 H 215 M 198 88 Q 220 121, 119 127 Q 30 127, 30 83"
            strokeDasharray="5 5"
          />
          {[0, 1, 2].map((index) => (
            <circle
              key={index}
              cx={95 + index * 25 + phase * 3}
              cy="73"
              r="7"
              fill="currentColor"
              fillOpacity={index === phase ? 0.5 : 0.15}
            />
          ))}
        </g>
      );
    }
    if (slug === "structure-of-arrays") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3].map((column) => (
              <rect
                key={`${row}-${column}`}
                x={24 + column * 50}
                y={23 + row * 34}
                width="43"
                height="28"
                rx="3"
                fill="currentColor"
                fillOpacity={row === phase ? 0.32 : 0.06}
              />
            ))
          )}
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            x={18 + index * 76}
            y="42"
            width="58"
            height="56"
            rx="6"
            fill="currentColor"
            fillOpacity={index === phase ? 0.25 : 0.05}
          />
        ))}
        <path d="M 76 70 H 94 M 86 64 L 94 70 L 86 76 M 152 70 H 170 M 162 64 L 170 70 L 162 76" />
      </g>
    );
  }
  if (kind === "mesh") {
    if (slug === "level-of-detail") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M 26 112 L 79 26 L 132 112 Z M 26 112 L 79 67 L 132 112 M 79 26 V 67"
            opacity={phase === 0 ? 0.8 : 0.25}
          />
          <path
            d="M 155 105 L 186 55 L 217 105 Z"
            opacity={phase === 2 ? 0.8 : 0.25}
          />
        </g>
      );
    }
    if (slug === "mesh-particles") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2">
          {[0, 1, 2].map((index) => (
            <path
              key={index}
              d={`M ${76 + index * 33 + phase * (index - 1) * 14} ${45 + phase * 17} l 24 9 l -12 22 Z`}
              fill="currentColor"
              fillOpacity="0.15"
            />
          ))}
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M 23 108 L 60 32 L 115 63 L 174 35 L 218 105 L 140 115 Z M 23 108 L 115 63 L 140 115 L 174 35 L 115 63 L 60 32"
          opacity={0.45 + phase * 0.2}
        />
        <circle
          cx={90 + phase * 35}
          cy={70 - phase * 7}
          r="5"
          fill="currentColor"
        />
      </g>
    );
  }
  if (kind === "collision") {
    if (slug === "ray-casting" || slug === "continuous-collision-detection") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <path d={`M 23 88 H ${78 + phase * 58}`} />
          <circle cx={78 + phase * 58} cy="88" r="6" fill="currentColor" />
          <rect x="182" y="54" width="35" height="67" rx="4" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <rect
          x={30 + phase * 35}
          y="52"
          width="42"
          height="42"
          rx="4"
          fill="currentColor"
          fillOpacity="0.17"
        />
        <rect x="153" y="42" width="48" height="62" rx="4" />
        <path d="M 20 111 H 220" opacity="0.35" />
      </g>
    );
  }
  if (kind === "camera") {
    if (slug === "frustum") {
      return (
        <g fill="none" stroke="currentColor" strokeWidth="3">
          <rect x="30" y="22" width="150" height="96" rx="4" />
          <circle
            cx={80 + phase * 65}
            cy="72"
            r="11"
            fill="currentColor"
            fillOpacity={phase === 2 ? 0.07 : 0.35}
          />
          <path d="M 180 22 V 118" strokeDasharray="5 5" />
        </g>
      );
    }
    return (
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <rect x={20 + phase * 18} y="25" width="155" height="90" rx="5" />
        <circle
          cx={65 + phase * 55}
          cy="83"
          r="11"
          fill="currentColor"
          fillOpacity="0.3"
        />
        <path d="M 10 116 H 225" opacity="0.35" />
      </g>
    );
  }
  return null;
}

function AnimationFrame({
  animation,
  phase,
  slug,
}: {
  animation: KeywordAnimation;
  phase: Phase;
  slug: string;
}) {
  const sceneProps = {
    kind: animation.kind,
    phase,
    variant: animation.variant,
    slug,
  };
  return (
    <svg viewBox="0 0 240 140" className="w-full" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="238"
        height="138"
        rx="10"
        fill="none"
        stroke="currentColor"
        opacity="0.2"
      />
      <FieldAndSurfaceScene {...sceneProps} />
      <ShapeAndTimingScene {...sceneProps} />
      <EffectsScene {...sceneProps} />
      <SystemsScene {...sceneProps} />
      <InfrastructureScene {...sceneProps} />
    </svg>
  );
}

function KeywordStoryboard({
  keyword,
  locale,
}: {
  keyword: Keyword;
  locale: Locale;
}) {
  const { animation } = keyword;
  const labels =
    locale === "ja" ? ["開始", "変化", "結果"] : ["Start", "Change", "Result"];
  const captions = [animation.start, animation.middle, animation.end];
  return (
    <figure className="rounded-xl border border-border bg-card p-5 sm:p-7">
      <p className="mb-5 text-sm font-semibold" lang="ja">
        例: {animation.subject}
      </p>
      <ol className="grid gap-4 sm:grid-cols-3">
        {([0, 1, 2] as const).map((phase) => (
          <li key={phase} className="min-w-0 space-y-2">
            <AnimationFrame
              animation={animation}
              phase={phase}
              slug={keyword.slug}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              {phase + 1}. {labels[phase]}
            </p>
            <p className="text-sm" lang="ja">
              {captions[phase]}
            </p>
          </li>
        ))}
      </ol>
      <figcaption
        className="mt-5 border-t border-border pt-4 text-sm"
        lang="ja"
      >
        {animation.impact}。
        <span className="mt-2 block text-xs text-muted-foreground">
          時間変化を示す模式図です。実際の描画結果や処理速度を再現したものではありません。
        </span>
      </figcaption>
    </figure>
  );
}

export function KeywordAnimation({
  keyword,
  locale,
}: {
  keyword: Keyword;
  locale: Locale;
}) {
  const preset = demoPresets.get(keyword.slug);
  if (!preset) {
    throw new Error(`Missing keyword demo: ${keyword.slug}`);
  }
  return (
    <div className="space-y-4">
      <KeywordDemo
        key={keyword.slug}
        slug={keyword.slug}
        name={locale === "ja" ? keyword.name : keyword.english}
        animation={keyword.animation}
        preset={preset}
        illustrative={
          illustrativeFamilies.has(preset.family) ||
          illustrativeSlugs.has(keyword.slug)
        }
        locale={locale}
      />
      <details className="rounded-xl border border-border">
        <summary className="cursor-pointer px-5 py-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {locale === "ja" ? "コマ送りで解説を読む" : "Read the storyboard"}
        </summary>
        <KeywordStoryboard keyword={keyword} locale={locale} />
      </details>
    </div>
  );
}
