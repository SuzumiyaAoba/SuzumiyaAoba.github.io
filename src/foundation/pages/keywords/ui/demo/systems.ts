import { clamp, fract, mix, random } from "../../lib/demo-math";
import type { Point } from "../../lib/demo-math";
import {
  alpha,
  arrow,
  box,
  character,
  circle,
  glow,
  line,
  polygon,
  text,
  tree,
} from "./drawing";
import type { Scene } from "./drawing";

const columns = 17;
const rows = 9;
const walls = new Set<number>();
for (let row = 0; row < rows; row++) {
  if (row !== 6) {
    walls.add(row * columns + 6);
  }
  if (row !== 2) {
    walls.add(row * columns + 11);
  }
}
const startCell = columns * 4 + 1;
const goalCell = columns * 4 + 15;
const position = (index: number): Point => [
  35 + (index % columns) * 25,
  49 + Math.floor(index / columns) * 23,
];

/** Breadth-first shortest paths on this uniform-cost four-neighbour grid. */
function searchGrid() {
  const distances = new Map<number, number>([[startCell, 0]]);
  const parents = new Map<number, number>();
  const queue = [startCell];
  for (const current of queue) {
    if (current === undefined) {
      continue;
    }
    for (const offset of [-1, 1, -columns, columns]) {
      const next = current + offset;
      if (
        next < 0 ||
        next >= columns * rows ||
        walls.has(next) ||
        distances.has(next)
      ) {
        continue;
      }
      if (
        Math.abs(offset) === 1 &&
        Math.floor(current / columns) !== Math.floor(next / columns)
      ) {
        continue;
      }
      distances.set(next, (distances.get(current) ?? 0) + 1);
      parents.set(next, current);
      queue.push(next);
    }
  }
  const route = [goalCell];
  let current = goalCell;
  while (current !== startCell) {
    const parent = parents.get(current);
    if (parent === undefined) {
      break;
    }
    route.unshift(parent);
    current = parent;
  }
  return { distances, route };
}
const gridSearch = searchGrid();

function drawPathfinding(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const progress = clamp(t / 7);
  for (let cell = 0; cell < columns * rows; cell++) {
    const [x, y] = position(cell);
    const depth = gridSearch.distances.get(cell) ?? 1000;
    const naiveDistance =
      Math.abs((cell % columns) - 1) + Math.abs(Math.floor(cell / columns) - 4);
    const reach = mix(naiveDistance, depth, a) <= t * 5;
    box(
      ctx,
      x - 10,
      y - 9,
      20,
      18,
      walls.has(cell)
        ? p.secondary
        : alpha(
            p.accent,
            reach && slug === "dijkstra-s-algorithm" ? 0.35 : 0.07
          ),
      2
    );
    if (slug === "navigation-mesh" && !walls.has(cell)) {
      polygon(
        ctx,
        [
          [x - 12, y - 11],
          [x + 12, y - 11],
          [x + 12, y + 11],
        ],
        alpha(p.secondary, a * 0.25)
      );
      line(
        ctx,
        [
          [x - 12, y - 11],
          [x + 12, y + 11],
        ],
        alpha(p.accent, a * 0.4),
        1
      );
    }
  }
  const route = gridSearch.route.map(position);
  const begin = position(startCell);
  const end = position(goalCell);
  const scaled = progress * (route.length - 1);
  const left = route[Math.floor(scaled)] ?? end;
  const right =
    route[Math.min(route.length - 1, Math.floor(scaled) + 1)] ?? end;
  const point: Point = [
    mix(
      mix(begin[0], end[0], progress),
      mix(left[0], right[0], fract(scaled)),
      a
    ),
    mix(
      mix(begin[1], end[1], progress),
      mix(left[1], right[1], fract(scaled)),
      a
    ),
  ];
  if (slug !== "dijkstra-s-algorithm") {
    line(ctx, a > 0.5 ? route : [begin, end], alpha(p.accent, 0.5), 2);
    circle(ctx, ...point, 6, p.accent);
  }
  circle(ctx, ...begin, 4, p.ink);
  circle(ctx, ...end, 6, p.warm);
}

export function drawNavigation(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (["a-search", "dijkstra-s-algorithm", "navigation-mesh"].includes(slug)) {
    drawPathfinding(scene);
    return;
  }
  if (slug === "optimal-reciprocal-collision-avoidance") {
    for (let i = 0; i < 12; i++) {
      const direction = i % 2 === 0 ? 1 : -1;
      const progress = fract(t / 7);
      const x = direction > 0 ? 60 + progress * 360 : 420 - progress * 360;
      const y =
        112 +
        Math.floor(i / 2) * 14 +
        direction * a * Math.sin(progress * Math.PI) * 32;
      character(ctx, x, y, direction > 0 ? p.accent : p.warm, t * 8, 0.5);
    }
    return;
  }
  if (slug === "funnel-algorithm") {
    const route: Point[] = [
      [45, 212],
      [110, 120],
      [170, 182],
      [237, 73],
      [317, 123],
      [415, 67],
    ];
    line(
      ctx,
      [
        [40, 235],
        [150, 225],
        [260, 150],
        [440, 100],
      ],
      p.secondary,
      3
    );
    line(
      ctx,
      [
        [15, 190],
        [125, 70],
        [225, 26],
        [425, 30],
      ],
      p.secondary,
      3
    );
    const smoothRoute: Point[] = [
      [45, 212],
      [170, 157],
      [270, 90],
      [415, 67],
    ];
    const points = a > 0.5 ? smoothRoute : route;
    line(ctx, points, p.accent, 3);
    const u = fract(t / 6) * (points.length - 1);
    const left = points[Math.floor(u)] ?? points[0];
    const right = points[Math.floor(u) + 1] ?? points.at(-1);
    if (left && right) {
      circle(
        ctx,
        mix(left[0], right[0], fract(u)),
        mix(left[1], right[1], fract(u)),
        6,
        p.warm
      );
    }
    return;
  }
  const phase = Math.floor(t / 2) % 4;
  const actions =
    slug === "goal-oriented-action-planning"
      ? ["FIND KEY", "TAKE KEY", "OPEN DOOR", "REACH GOAL"]
      : ["PATROL", "DETECT", "CHASE", "RETURN"];
  const active = a > 0.5 ? phase : 0;
  if (slug === "behavior-tree") {
    for (let branch = 0; branch < 4; branch++) {
      line(
        ctx,
        [
          [240, 96],
          [74 + branch * 115, 72],
        ],
        active === branch ? p.accent : p.muted,
        active === branch ? 2 : 1
      );
    }
    box(ctx, 198, 84, 84, 27, p.surface);
    text(ctx, "SELECTOR", 207, 102, p.warm, 11);
  }
  for (const [index, label] of actions.entries()) {
    const x = 22 + index * 115;
    box(ctx, x, 31, 104, 37, active === index ? p.accent : p.surface, 5);
    text(ctx, label, x + 8, 54, active === index ? p.background : p.muted, 10);
    if (index < 3) {
      arrow(ctx, [x + 105, 49], [x + 115, 49], p.muted, 1);
    }
  }
  const targetX = 350 + Math.sin(t) * 35;
  let x = 100 + Math.sin(t) * 42;
  if (active === 2) {
    x = mix(100, targetX - 35, fract(t / 2));
  }
  if (active === 3) {
    x = mix(targetX - 35, 100, fract(t / 2));
  }
  if (slug === "goal-oriented-action-planning") {
    x = mix(75 + Math.sin(t) * 35, 75 + t * 40, a);
    box(ctx, 340, 151, 12, 94, p.warm);
    circle(ctx, 170, 220, 6, p.warm);
  }
  if (slug === "environment-query") {
    box(ctx, 290, 154, 28, 93, p.secondary);
    for (let i = 0; i < 6; i++) {
      circle(
        ctx,
        120 + i * 49,
        180 + Math.sin(i) * 25,
        5,
        i === 3 && a > 0.5 ? p.accent : p.muted
      );
    }
    x = mix(x, 272, a * clamp(t / 4));
  }
  character(ctx, x, 236, p.accent, t * 8);
  character(ctx, targetX, 236, p.warm, t * 5);
  if (slug === "blackboard-architecture") {
    for (let i = 0; i < 3; i++) {
      const enemyX = 85 + i * 95;
      character(ctx, enemyX, 170, p.secondary, 0, 0.75);
      arrow(ctx, [enemyX, 141], [238, 95], alpha(p.accent, a), 1);
    }
    text(
      ctx,
      a > 0.5 ? `SHARED: TARGET x=${Math.round(targetX)}` : "LOCAL INFORMATION",
      114,
      97,
      p.ink,
      11
    );
  }
}

export function drawCollision(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "ray-casting" || slug === "continuous-collision-detection") {
    const wall = 300;
    box(ctx, wall, 73, 10, 165, p.secondary);
    const rawX = 40 + fract(t / 2) * 400;
    const x = mix(rawX, Math.min(rawX, wall - 5), a);
    if (slug === "ray-casting") {
      const angle = Math.sin(t) * 0.24;
      const endX = mix(450, wall, a);
      line(
        ctx,
        [
          [45, 163],
          [endX, 163 + Math.tan(angle) * (endX - 45)],
        ],
        p.accent,
        3
      );
      glow(ctx, endX, 163 + Math.tan(angle) * (endX - 45), 18, p.accent, 0.6);
    } else {
      circle(ctx, x, 151, 6, p.warm);
      line(
        ctx,
        [
          [Math.max(40, x - 120), 151],
          [x, 151],
        ],
        alpha(p.accent, a),
        2
      );
      for (const sample of [220, 340]) {
        circle(ctx, sample, 151, 5, alpha(p.muted, 0.5));
      }
      text(ctx, "PREVIOUS → CURRENT", 170, 199, p.muted, 11);
    }
    return;
  }
  const many = [
    "bounding-volume-hierarchy",
    "spatial-hashing",
    "sweep-and-prune",
    "morton-code",
    "broad-phase",
  ].includes(slug);
  if (many) {
    const count = 34;
    const objects = Array.from(
      { length: count },
      (_, i) =>
        [
          35 + random(i) * 405 + Math.sin(t + i) * 10,
          45 + random(i + 54) * 175,
        ] as const
    );
    const probe: Point = [240 + Math.sin(t * 0.7) * 145, 142];
    if (slug === "spatial-hashing" || slug === "morton-code") {
      for (let x = 30; x <= 450; x += 42) {
        line(
          ctx,
          [
            [x, 30],
            [x, 240],
          ],
          p.grid,
          1
        );
      }
      for (let y = 30; y <= 240; y += 42) {
        line(
          ctx,
          [
            [30, y],
            [450, y],
          ],
          p.grid,
          1
        );
      }
    }
    for (const [i, point] of objects.entries()) {
      const candidate =
        Math.abs(point[0] - probe[0]) < 60 &&
        Math.abs(point[1] - probe[1]) < 60;
      circle(ctx, ...point, 7, a > 0.5 && !candidate ? p.muted : p.accent);
      if (a < 0.5 || candidate) {
        line(ctx, [point, probe], alpha(p.accent, 0.14), 1);
      }
      if (slug === "sweep-and-prune") {
        line(
          ctx,
          [
            [point[0] - 8, 260 + (i % 4) * 5],
            [point[0] + 8, 260 + (i % 4) * 5],
          ],
          a > 0.5 && !candidate ? p.muted : p.accent,
          2
        );
      }
      if (slug === "morton-code") {
        text(
          ctx,
          `${a > 0.5 ? Math.floor(point[0] / 42) + Math.floor(point[1] / 42) * 16 : i}`,
          point[0] + 9,
          point[1] + 3,
          p.muted,
          9
        );
      }
    }
    if (slug === "bounding-volume-hierarchy") {
      for (let i = 0; i < 4; i++) {
        line(
          ctx,
          [
            [30 + i * 105, 30],
            [135 + i * 105, 30],
            [135 + i * 105, 235],
            [30 + i * 105, 235],
          ],
          alpha(p.warm, a * 0.5),
          1,
          true
        );
      }
    }
    circle(ctx, ...probe, 12, p.warm);
    return;
  }
  const leftX = 120 + (1 - Math.cos(t)) * 62;
  const angle = t * 0.5;
  const points: Point[] = Array.from({ length: 4 }, (_, i) => [
    leftX + Math.cos(angle + (i * Math.PI) / 2) * 48,
    151 + Math.sin(angle + (i * Math.PI) / 2) * 48,
  ]);
  const touching = leftX > 244;
  polygon(ctx, points, alpha(p.accent, 0.4));
  box(ctx, 289, 111, 60, 80, alpha(p.secondary, 0.5), 1);
  if (slug === "axis-aligned-bounding-box") {
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const x1 = Math.min(...xs);
    const x2 = Math.max(...xs);
    const y1 = Math.min(...ys);
    const y2 = Math.max(...ys);
    line(
      ctx,
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      alpha(p.warm, a),
      2,
      true
    );
  } else if (slug === "separating-axis-theorem") {
    for (const point of points) {
      line(ctx, [point, [point[0], 258]], alpha(p.muted, a * 0.4), 1);
    }
    line(
      ctx,
      [
        [leftX - 48, 258],
        [leftX + 48, 258],
      ],
      alpha(p.accent, a),
      5
    );
    line(
      ctx,
      [
        [289, 267],
        [349, 267],
      ],
      alpha(p.warm, a),
      5
    );
  } else {
    arrow(ctx, [leftX + 45, 151], [289, 151], alpha(p.warm, a));
    text(
      ctx,
      `SEPARATION ${Math.max(0, 289 - leftX - 45).toFixed(0)}`,
      152,
      265,
      p.muted,
      11
    );
  }
  text(
    ctx,
    touching ? "CONTACT" : "SEPARATED",
    196,
    49,
    touching ? p.warm : p.accent,
    12
  );
}

function drawBuffers(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a } = scene;
  const step = Math.floor(t * 2);
  const writeB = step % 2 === 0;
  for (let buffer = 0; buffer < 2; buffer++) {
    const x = 50 + buffer * 235;
    text(ctx, `BUFFER ${buffer === 0 ? "A" : "B"}`, x + 27, 53, p.ink, 13);
    const reading = a > 0.5 ? (buffer === 0) === writeB : buffer === 0;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const phase = reading ? step : step + 1;
        const distance = Math.hypot(col - 3, row - 3);
        box(
          ctx,
          x + col * 20,
          77 + row * 20,
          17,
          17,
          alpha(p.accent, 0.12 + Math.max(0, Math.sin(distance - phase)) * 0.7),
          1
        );
      }
    }
    text(
      ctx,
      a > 0.5
        ? reading
          ? "READ"
          : "WRITE"
        : buffer === 0
          ? "READ + WRITE"
          : "UNUSED",
      x + 20,
      244,
      reading ? p.accent : p.warm,
      11
    );
  }
  arrow(
    ctx,
    writeB ? [201, 144] : [278, 144],
    writeB ? [278, 144] : [201, 144],
    alpha(p.warm, a),
    3
  );
}

export function drawPerformance(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "ping-pong-buffers") {
    drawBuffers(scene);
    return;
  }
  if (slug === "level-of-detail" || slug === "frustum") {
    const cameraX = t * 35;
    if (slug === "frustum") {
      line(
        ctx,
        [
          [70, 39],
          [380, 39],
          [380, 244],
          [70, 244],
        ],
        p.warm,
        2,
        true
      );
    }
    for (let i = 0; i < 40; i++) {
      const depth = 0.3 + random(i) * 0.7;
      const x = (random(i + 21) * 850 - cameraX) % 540;
      const y = 97 + depth * 145;
      if (slug === "frustum" && (x < 70 || x > 380) && a > 0.5) {
        circle(ctx, x, y, 2, p.muted);
        continue;
      }
      if (slug === "level-of-detail" && depth < 0.6 && a > 0.5) {
        polygon(
          ctx,
          [
            [x - 5, y],
            [x, y - 19],
            [x + 5, y],
          ],
          p.accent
        );
      } else {
        tree(ctx, x, y, depth * 0.85, p.accent, Math.sin(t + i) * 2);
      }
    }
    return;
  }
  if (slug === "overdraw") {
    for (let i = 0; i < 25; i++) {
      const x = 120 + random(i) * 230 + Math.sin(t + i) * 16;
      const y = 85 + random(i + 43) * 120;
      if (a > 0.5) {
        circle(ctx, x, y, 40, alpha(p.warm, 0.12));
      } else {
        glow(ctx, x, y, 60, p.secondary, 0.2);
      }
    }
    text(
      ctx,
      a > 0.5 ? "HEATMAP: OVERLAPPING FRAGMENTS" : "TRANSPARENT PARTICLES",
      40,
      275,
      p.muted,
      11
    );
    return;
  }
  if (slug === "parallel-prefix-sum") {
    let total = 0;
    for (let i = 0; i < 12; i++) {
      const alive = random(i + Math.floor(t)) > 0.45;
      if (alive) {
        total += 1;
      }
      const x = 30 + i * 35;
      box(ctx, x, 73, 29, 31, alive ? p.accent : p.surface, 3);
      text(ctx, alive ? "1" : "0", x + 10, 94, alive ? p.background : p.muted);
      if (a > 0.5) {
        text(ctx, `${total}`, x + 9, 147, p.warm);
        if (alive) {
          arrow(
            ctx,
            [x + 14, 165],
            [45 + (total - 1) * 38, 208],
            alpha(p.accent, 0.5),
            1
          );
          box(ctx, 32 + (total - 1) * 38, 215, 29, 28, p.accent);
        }
      }
    }
    text(ctx, "ALIVE FLAGS → PREFIX SUM → COMPACT", 64, 278, p.muted, 11);
    return;
  }
  if (slug === "structure-of-arrays") {
    const labels = ["X", "Y", "V"];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 12; col++) {
        const component = a > 0.5 ? row : col % 3;
        const active = Math.floor(t * 3) % 12 === col;
        box(
          ctx,
          35 + col * 35,
          69 + row * 48,
          29,
          34,
          active
            ? p.ink
            : ([p.accent, p.secondary, p.warm][component] ?? p.ink),
          3
        );
        text(
          ctx,
          labels[component] ?? "",
          44 + col * 35,
          91 + row * 48,
          p.background
        );
      }
    }
    text(
      ctx,
      a > 0.5 ? "CONTIGUOUS POSITIONS → UPDATE" : "X Y V / X Y V / X Y V",
      82,
      267,
      p.muted
    );
    return;
  }
  const progress = fract(t / 3);
  const pooled = slug === "object-pool";
  for (let i = 0; i < 32; i++) {
    const x = 35 + (i % 16) * 27;
    const y = 58 + Math.floor(i / 16) * 30;
    const batched = a > 0.5;
    const active = batched ? i % 8 <= progress * 8 : i <= progress * 32;
    box(ctx, x, y, 20, 20, active ? p.accent : p.grid, 3);
    if (active) {
      circle(
        ctx,
        30 + fract(t * 0.2 + random(i)) * 420,
        166 + random(i + 44) * 73,
        3,
        p.accent
      );
    }
  }
  if (a > 0.5) {
    line(
      ctx,
      [
        [28, 47],
        [460, 47],
        [460, 119],
        [28, 119],
      ],
      p.secondary,
      1,
      true
    );
  }
  const label = pooled
    ? a > 0.5
      ? "REUSE → ACTIVE → RETURN"
      : "CREATE → ACTIVE → DESTROY"
    : slug === "compute-shader"
      ? a > 0.5
        ? "PARALLEL WORK GROUPS"
        : "SERIAL UPDATE"
      : slug === "gpu-instancing"
        ? a > 0.5
          ? "1 MESH × 32 INSTANCES"
          : "32 SEPARATE DRAW REQUESTS"
        : a > 0.5
          ? "GPU COUNT → INDIRECT DRAW"
          : "CPU COUNT → DRAW";
  text(ctx, label, 40, 276, p.ink, 11);
}

export function drawData(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a } = scene;
  const x = 290 + Math.sin(t) * 65;
  box(ctx, 27, 61, 200, 166, p.surface, 9);
  text(
    ctx,
    a > 0.5 ? "CharacterState (POCO)" : "CharacterView",
    42,
    87,
    p.accent,
    13
  );
  text(ctx, `X: ${Math.round(x)}`, 46, 121, p.ink);
  text(ctx, `Y: ${Math.round(215 + Math.sin(t * 2) * 7)}`, 46, 147, p.ink);
  text(ctx, "Health: 100", 46, 173, p.ink);
  text(
    ctx,
    a > 0.5 ? "DATA → SAVE / LOAD" : "DATA + DISPLAY",
    46,
    206,
    p.muted,
    10
  );
  arrow(ctx, [232, 144], [277, 144], p.warm);
  character(ctx, x, 215 + Math.sin(t * 2) * 7, p.accent, t * 5, 1.5);
  if (a > 0.5) {
    box(ctx, 320, 53, 115, 44, p.surface);
    text(ctx, "JSON / TEST", 331, 80, p.warm, 11);
    arrow(ctx, [227, 86], [317, 76], p.muted);
  }
}
