import { Delaunay } from "d3";
import {
  clamp,
  mix,
  radicalInverse,
  random,
  TAU,
  valueNoise,
} from "../../lib/demo-math";
import type { Point } from "../../lib/demo-math";
import { alpha, box, circle, line, polygon, text, tree } from "./drawing";
import type { Scene } from "./drawing";

const scattered: Point[] = Array.from({ length: 160 }, (_, i) => [
  random(i * 2),
  random(i * 2 + 1),
]);

/** Best-candidate blue-noise samples, kept deterministic for fair comparisons. */
function spacedSamples(minimum: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < 2000 && points.length < 160; i++) {
    const candidate: Point = [random(i * 2), random(i * 2 + 1)];
    if (
      points.every(
        (other) =>
          Math.hypot(candidate[0] - other[0], candidate[1] - other[1]) >=
          minimum
      )
    ) {
      points.push(candidate);
    }
  }
  return points;
}
const poissonPoints = spacedSamples(0.064);
const bluePoints = spacedSamples(0.052);
const fractureSites: Point[] = Array.from({ length: 25 }, (_, i) => [
  140 + random(i) * 200,
  50 + random(i + 91) * 180,
]);
const fractureCells = [
  ...Delaunay.from(
    fractureSites,
    (point) => point[0],
    (point) => point[1]
  )
    .voronoi([130, 40, 350, 240])
    .cellPolygons(),
];

export function samplePoint(
  slug: string,
  index: number,
  amount: number
): Point {
  const u = random(index * 2);
  const v = random(index * 2 + 1);
  let x = u;
  let y = v;
  switch (slug) {
    case "poisson-disk-sampling":
    case "point-relaxation": {
      const point = poissonPoints[index % poissonPoints.length] ?? [u, v];
      [x, y] = point;
      break;
    }
    case "blue-noise": {
      const point = bluePoints[index % bluePoints.length] ?? [u, v];
      [x, y] = point;
      break;
    }
    case "stratified": {
      x = ((index % 13) + u) / 13;
      y = (Math.floor(index / 13) + v) / 13;
      break;
    }
    case "low-discrepancy-sequence": {
      x = radicalInverse(index + 1, 2);
      y = radicalInverse(index + 1, 3);
      break;
    }
    case "gaussian": {
      const r = Math.sqrt(-2 * Math.log(Math.max(0.0001, u))) * 0.17;
      x = 0.5 + Math.cos(v * TAU) * r;
      y = 0.5 + Math.sin(v * TAU) * r;
      break;
    }
    case "importance-sampling": {
      x = u ** 0.28;
      y = v;
      break;
    }
    default: {
      break;
    }
  }
  return [mix(u, x, amount), mix(v, y, amount)];
}

export function drawSampling(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const count = Math.min(150, Math.floor(8 + t * 20));
  if (
    slug === "uniform-disk" ||
    slug === "uniform-sphere-sampling" ||
    slug === "cosine-weighted-hemisphere-sampling"
  ) {
    circle(ctx, 240, 148, 102, alpha(p.secondary, 0.1));
    for (let i = 0; i < count; i++) {
      const u = random(i * 2);
      const angle = random(i * 2 + 1) * TAU;
      let x = 0;
      let y = 0;
      if (slug === "uniform-sphere-sampling") {
        const z = mix(Math.cos(u * Math.PI), 1 - 2 * u, a);
        const radius = Math.sqrt(1 - z * z);
        x = Math.cos(angle + t * 0.3) * radius * 100;
        y = z * 100;
      } else if (slug === "cosine-weighted-hemisphere-sampling") {
        const theta = mix((u * Math.PI) / 2, Math.asin(Math.sqrt(u)), a);
        x = Math.cos(angle) * Math.sin(theta) * 110;
        y = -Math.cos(theta) * 110;
      } else {
        const radius = mix(u, Math.sqrt(u), a) * 100;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }
      circle(
        ctx,
        240 + x,
        (slug === "cosine-weighted-hemisphere-sampling" ? 230 : 148) + y,
        2.5,
        p.accent
      );
    }
  } else if (slug === "alias-method") {
    const counters = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      const u = random(i);
      const first = mix(1 / 3, 0.65, a);
      const second = mix(2 / 3, 0.9, a);
      const kind = u < first ? 0 : u < second ? 1 : 2;
      counters[kind] = (counters[kind] ?? 0) + 1;
      circle(
        ctx,
        40 + (i % 25) * 16,
        55 + Math.floor(i / 25) * 17,
        4,
        [p.accent, p.secondary, p.warm][kind] ?? p.ink
      );
    }
    for (const [i, countValue] of counters.entries()) {
      box(
        ctx,
        65 + i * 135,
        238 - countValue,
        70,
        countValue,
        [p.accent, p.secondary, p.warm][i] ?? p.ink
      );
      text(ctx, `${countValue}`, 85 + i * 135, 262, p.ink);
    }
  } else {
    if (slug === "stratified") {
      for (let i = 0; i <= 13; i++) {
        line(
          ctx,
          [
            [30 + i * 32, 30],
            [30 + i * 32, 245],
          ],
          p.grid,
          0.7
        );
        line(
          ctx,
          [
            [30, 30 + i * 16.5],
            [446, 30 + i * 16.5],
          ],
          p.grid,
          0.7
        );
      }
    }
    if (slug === "importance-sampling") {
      box(ctx, 375, 25, 70, 225, alpha(p.warm, 0.2));
    }
    for (let i = 0; i < count; i++) {
      const point = samplePoint(slug, i, a);
      const x = 35 + point[0] * 410;
      const y = 37 + point[1] * 200;
      if (slug === "poisson-disk-sampling") {
        tree(ctx, x, y, 0.42, p.accent);
      } else {
        circle(ctx, x, y, 2.4, p.accent);
      }
    }
  }
  text(ctx, `${count} SAMPLES`, 22, 283, p.muted, 11);
}

function drawBranches(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const growth = clamp(t / 6) * (1 + a * 5);
  const grow = (start: Point, angle: number, length: number, depth: number) => {
    if (depth > growth || depth > 6) {
      return;
    }
    const fraction = clamp(growth - depth);
    const end: Point = [
      start[0] + Math.cos(angle) * length * fraction,
      start[1] + Math.sin(angle) * length * fraction,
    ];
    line(
      ctx,
      [start, end],
      depth < 2 ? p.warm : p.accent,
      Math.max(1, 7 - depth)
    );
    if (fraction < 1) {
      return;
    }
    const bend =
      slug === "space-colonization-algorithm"
        ? 0.25 + random(depth * 7 + start[0]) * 0.5
        : 0.48;
    grow(end, angle - bend, length * 0.72, depth + 1);
    grow(end, angle + bend, length * 0.72, depth + 1);
  };
  grow([240, 245], -Math.PI / 2, 71, 0);
  if (slug === "space-colonization-algorithm") {
    for (let i = 0; i < 70; i++) {
      const angle = random(i) * TAU;
      const radius = Math.sqrt(random(i + 6)) * 105;
      circle(
        ctx,
        240 + Math.cos(angle) * radius,
        99 + Math.sin(angle) * radius * 0.65,
        1.5,
        alpha(p.muted, 0.6)
      );
    }
  }
}

export function drawGeneration(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "l-system" || slug === "space-colonization-algorithm") {
    drawBranches(scene);
    return;
  }
  if (slug === "point-relaxation" || slug === "density-masked-scattering") {
    for (let i = 0; i < 110; i++) {
      const point =
        slug === "point-relaxation"
          ? samplePoint(slug, i, a * clamp(t / 5))
          : (scattered[i] ?? [0, 0]);
      if (
        slug === "density-masked-scattering" &&
        random(i + 33) > mix(1, valueNoise(point[0] * 3, point[1] * 3), a)
      ) {
        continue;
      }
      tree(
        ctx,
        30 + point[0] * 420,
        65 + point[1] * 185,
        0.35 + clamp(t / 3) * 0.2,
        p.accent,
        Math.sin(t + i) * 2
      );
    }
    return;
  }
  if (slug === "binary-space-partitioning") {
    const divide = (
      x: number,
      y: number,
      w: number,
      h: number,
      depth: number
    ) => {
      line(
        ctx,
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        p.accent,
        1,
        true
      );
      if (depth >= Math.floor(a * clamp(t / 5) * 5)) {
        box(ctx, x + 6, y + 6, w - 12, h - 12, alpha(p.secondary, 0.25), 1);
        return;
      }
      if (w > h) {
        const split = 0.4 + random(depth + x) * 0.2;
        divide(x, y, w * split, h, depth + 1);
        divide(x + w * split, y, w * (1 - split), h, depth + 1);
      } else {
        const split = 0.4 + random(depth + y) * 0.2;
        divide(x, y, w, h * split, depth + 1);
        divide(x, y + h * split, w, h * (1 - split), depth + 1);
      }
    };
    divide(35, 35, 410, 210, 0);
    return;
  }
  const columns = 22;
  const rows = 12;
  const progress = clamp(t / 5);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index / (rows * columns) > progress) {
        continue;
      }
      const x = 30 + col * 19;
      const y = 34 + row * 18;
      const n = valueNoise(col * 0.25, row * 0.25);
      if (slug === "wave-function-collapse" || slug === "wang-tiles") {
        box(ctx, x, y, 18, 17, alpha(p.secondary, 0.25), 1);
        if (slug === "wang-tiles") {
          line(
            ctx,
            [
              [x + 1, y],
              [x + 17, y],
            ],
            (
              a > 0.5
                ? random(col + row * 100 + 7000) > 0.45
                : random(index + 29) > 0.5
            )
              ? p.warm
              : p.secondary,
            2
          );
          line(
            ctx,
            [
              [x, y + 1],
              [x, y + 16],
            ],
            (
              a > 0.5
                ? random(col + row * 100) > 0.45
                : random(index + 13) > 0.5
            )
              ? p.warm
              : p.secondary,
            2
          );
          line(
            ctx,
            [
              [x + 18, y + 1],
              [x + 18, y + 16],
            ],
            random(col + 1 + row * 100) > 0.45 ? p.warm : p.secondary,
            2
          );
          line(
            ctx,
            [
              [x + 1, y + 17],
              [x + 17, y + 17],
            ],
            random(col + (row + 1) * 100 + 7000) > 0.45 ? p.warm : p.secondary,
            2
          );
        }
        const sharedRight = random(col + 1 + row * 100) > 0.45;
        const sharedBottom = random(col + (row + 1) * 100 + 7000) > 0.45;
        const left =
          a > 0.5 ? random(col + row * 100) > 0.45 : random(index + 13) > 0.5;
        const top =
          a > 0.5
            ? random(col + row * 100 + 7000) > 0.45
            : random(index + 29) > 0.5;
        for (const [connected, end] of [
          [left, [x, y + 8]],
          [top, [x + 9, y]],
          [sharedRight, [x + 19, y + 8]],
          [sharedBottom, [x + 9, y + 18]],
        ] as const) {
          if (connected) {
            line(ctx, [[x + 9, y + 8], end], p.accent, 3);
          }
        }
      } else {
        let height = n;
        if (slug === "island-falloff") {
          height -= a * Math.hypot((col - 10.5) / 12, (row - 5.5) / 7) * 0.7;
        }
        if (slug === "cellular-automata") {
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (random(col + dx + (row + dy) * 100) > 0.48) {
                neighbors += 1;
              }
            }
          }
          height = mix(random(index), neighbors >= 5 ? 0.8 : 0.1, a);
        }
        const color =
          height < 0.3 ? p.secondary : height < 0.6 ? p.accent : p.warm;
        const painted = slug === "biome-map" && a < 0.5 ? p.accent : color;
        box(ctx, x, y, 18, 17, alpha(painted, 0.35 + height * 0.5), 1);
      }
    }
  }
}

export function drawMesh(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "marching-squares") {
    const field = (x: number, y: number) =>
      Math.hypot(x - 240 - Math.sin(t) * 30, y - 145) -
      55 -
      Math.sin(t * 1.3) * 20;
    for (let y = 35; y < 240; y += 14) {
      for (let x = 30; x < 445; x += 14) {
        const corners: readonly Point[] = [
          [x, y],
          [x + 14, y],
          [x + 14, y + 14],
          [x, y + 14],
        ];
        if (a < 0.5) {
          box(
            ctx,
            x,
            y,
            12,
            12,
            alpha(p.accent, field(x + 7, y + 7) < 0 ? 0.7 : 0.08),
            0
          );
          continue;
        }
        const crossings: Point[] = [];
        for (let i = 0; i < 4; i++) {
          const start = corners[i];
          const end = corners[(i + 1) % 4];
          if (!(start && end)) {
            continue;
          }
          const d1 = field(...start);
          const d2 = field(...end);
          if (d1 * d2 < 0) {
            const u = d1 / (d1 - d2);
            crossings.push([
              mix(start[0], end[0], u),
              mix(start[1], end[1], u),
            ]);
          }
        }
        line(ctx, crossings, p.accent, 3);
      }
    }
    return;
  }
  if (slug === "voronoi-fracture") {
    const progress = a * clamp((t - 1) / 3);
    for (const cell of fractureCells) {
      const center = fractureSites[cell.index] ?? [240, 140];
      const dx = (center[0] - 240) * progress;
      const dy = (center[1] - 140) * progress * 0.7 + progress ** 2 * 45;
      const points: Point[] = cell.map(([x, y]) => [x + dx, y + dy]);
      polygon(ctx, points, alpha(p.secondary, 0.65));
      line(ctx, points, alpha(p.ink, 0.65), 1, true);
    }
    return;
  }
  if (slug === "dual-quaternion-skinning") {
    const twist = Math.sin(t * 0.8) * Math.PI;
    for (let row = 0; row < 23; row++) {
      const u = row / 22;
      const angle = twist * (u - 0.5);
      const width =
        48 * mix(Math.max(0.15, Math.abs(Math.cos(twist * 0.5))), 1, a);
      const left: Point = [
        240 - Math.cos(angle) * width,
        247 - u * 195 - Math.sin(angle) * 11,
      ];
      const right: Point = [
        240 + Math.cos(angle) * width,
        247 - u * 195 + Math.sin(angle) * 11,
      ];
      line(ctx, [left, right], row % 2 === 0 ? p.accent : p.secondary, 3);
      circle(ctx, ...left, 2, p.warm);
      circle(ctx, ...right, 2, p.ink);
    }
    return;
  }
  if (
    slug === "sweep" ||
    slug === "as-rigid-as-possible-deformation" ||
    slug === "dual-quaternion-skinning"
  ) {
    for (let row = 0; row < 18; row++) {
      const u = row / 17;
      const bend = Math.sin(t) * u * u * 90;
      const shrink =
        slug === "dual-quaternion-skinning"
          ? mix(Math.max(0.12, Math.abs(Math.cos(t * 0.7))), 1, a)
          : mix(0.45, 1, a);
      const width = slug === "sweep" ? a * 28 : 27 * shrink;
      const x = 210 + bend;
      const y = 237 - u * 180;
      line(
        ctx,
        [
          [x - width, y],
          [x + width, y],
        ],
        p.accent,
        2
      );
      if (row > 0) {
        const prevU = (row - 1) / 17;
        const prevX = 210 + Math.sin(t) * prevU * prevU * 90;
        line(
          ctx,
          [
            [prevX - width, 237 - prevU * 180],
            [x - width, y],
          ],
          p.secondary,
          1
        );
        line(
          ctx,
          [
            [prevX + width, 237 - prevU * 180],
            [x + width, y],
          ],
          p.secondary,
          1
        );
      }
    }
    return;
  }
  if (slug === "marching-cubes") {
    const radius = 66 + Math.sin(t) * 18;
    for (let row = 1; row < 13; row++) {
      const latitude = (row / 13) * Math.PI;
      const ring = Math.sin(latitude) * radius;
      const points: Point[] = [];
      for (let column = 0; column < 25; column++) {
        const angle = (column / 24) * TAU + t * 0.3;
        points.push([
          240 + Math.cos(angle) * ring,
          145 + Math.cos(latitude) * radius + Math.sin(angle) * ring * 0.3,
        ]);
      }
      for (const point of points) {
        circle(ctx, ...point, 1.8, p.accent);
      }
      line(ctx, points, alpha(p.secondary, a * 0.8), 1);
    }
    text(ctx, `ISOSURFACE ${radius.toFixed(0)}`, 22, 281, p.muted, 11);
    return;
  }
  if (slug === "delaunay-triangulation") {
    const points: Point[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 14; col++) {
        const index = row * 14 + col;
        const x = 42 + col * 29 + Math.sin(t + index) * 6;
        const y =
          65 + row * 18 - Math.sin(col * 0.5 + t) * Math.sin(row * 0.4) * 30;
        points.push([x, y]);
        circle(ctx, x, y, 2, p.accent);
      }
    }
    const triangulation = Delaunay.from(
      points,
      (point) => point[0],
      (point) => point[1]
    );
    ctx.beginPath();
    triangulation.render(ctx);
    ctx.strokeStyle = alpha(p.secondary, a * 0.8);
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }
  const segments =
    slug === "mesh-decimation"
      ? Math.round(mix(56, 9, a * clamp(t / 6)))
      : Math.round(mix(7, 56, a));
  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * TAU + t * 0.3;
    const rough =
      slug === "laplacian-smoothing"
        ? Math.sin(angle * 3) * 13 + (1 - a) * (random(i) - 0.5) * 36
        : 0;
    points.push([
      240 + Math.cos(angle) * (85 + rough),
      143 + Math.sin(angle) * (85 + rough),
    ]);
  }
  polygon(ctx, points, alpha(p.secondary, 0.25));
  line(ctx, points, p.accent, 2, true);
  for (const point of points) {
    line(ctx, [[240, 143], point], alpha(p.secondary, 0.4), 1);
    circle(ctx, ...point, 2.5, p.ink);
  }
  text(ctx, `${segments} SEGMENTS`, 22, 281, p.muted, 11);
}
