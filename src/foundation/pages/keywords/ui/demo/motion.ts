import {
  arcParameter,
  bezier,
  clamp,
  fract,
  hermite,
  mix,
  random,
  smooth,
  springResponse,
  TAU,
} from "../../lib/demo-math";
import type { Point } from "../../lib/demo-math";
import {
  alpha,
  arrow,
  box,
  circle,
  glow,
  line,
  polygon,
  spark,
  text,
} from "./drawing";
import type { Scene } from "./drawing";
import { drawFlow } from "./surfaces";

const handles: readonly [Point, Point, Point, Point] = [
  [50, 220],
  [90, 30],
  [350, 30],
  [430, 210],
];

export function curvePoint(slug: string, u: number, bend = 1): Point {
  if (slug === "cubic-hermite-curve") {
    return hermite(
      u,
      [50, 218],
      [430, 105],
      [330, -440 * bend],
      [100, 340 * bend]
    );
  }
  if (slug === "non-uniform-rational-b-spline") {
    const weight = Math.SQRT1_2;
    const denominator = (1 - u) ** 2 + 2 * weight * u * (1 - u) + u * u;
    return [
      (80 * (1 - u) ** 2 + 2 * weight * 80 * u * (1 - u) + 360 * u * u) /
        denominator,
      (240 * (1 - u) ** 2 + 2 * weight * 30 * u * (1 - u) + 30 * u * u) /
        denominator,
    ];
  }
  if (slug === "b-spline") {
    const controls: readonly Point[] = [
      [-160, 240],
      [50, 200],
      [140, 35],
      [260, 45 + bend * 55],
      [370, 220],
      [590, 230],
    ];
    const segment = Math.min(2, Math.floor(u * 3));
    const v = u * 3 - segment;
    const a = controls[segment] ?? handles[0];
    const b = controls[segment + 1] ?? handles[1];
    const c = controls[segment + 2] ?? handles[2];
    const d = controls[segment + 3] ?? handles[3];
    const weights = [
      (1 - v) ** 3 / 6,
      (3 * v ** 3 - 6 * v * v + 4) / 6,
      (-3 * v ** 3 + 3 * v * v + 3 * v + 1) / 6,
      v ** 3 / 6,
    ];
    return [
      a[0] * (weights[0] ?? 0) +
        b[0] * (weights[1] ?? 0) +
        c[0] * (weights[2] ?? 0) +
        d[0] * (weights[3] ?? 0),
      a[1] * (weights[0] ?? 0) +
        b[1] * (weights[1] ?? 0) +
        c[1] * (weights[2] ?? 0) +
        d[1] * (weights[3] ?? 0),
    ];
  }
  if (slug === "catmull-rom-spline") {
    const controls: readonly Point[] = [
      [50, 200],
      [150, 60],
      [280, 195],
      [430, 70],
    ];
    const segment = Math.min(2, Math.floor(u * 3));
    const v = u * 3 - segment;
    const p0 = controls[Math.max(0, segment - 1)] ?? handles[0];
    const p1 = controls[segment] ?? handles[1];
    const p2 = controls[segment + 1] ?? handles[2];
    const p3 = controls[Math.min(3, segment + 2)] ?? handles[3];
    return hermite(
      v,
      p1,
      p2,
      [(p2[0] - p0[0]) / 2, (p2[1] - p0[1]) / 2],
      [(p3[0] - p1[0]) / 2, (p3[1] - p1[1]) / 2]
    );
  }
  return bezier(
    u,
    slug === "arc-length-parameterization"
      ? [
          [40, 220],
          [420, 235],
          [40, 10],
          [440, 50],
        ]
      : handles
  );
}

function drawTiming(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const u = clamp(fract(t / 4) * 1.35);
  let value = u;
  if (slug === "lerp") {
    value = mix(u < 0.5 ? 0 : 1, u, a);
  }
  if (slug === "smoothstep") {
    value = mix(u, smooth(u), a);
  }
  if (slug === "easing") {
    value = mix(u, 1 - Math.exp(-6 * u) * Math.cos(u * 12), a);
  }
  if (slug === "slerp") {
    const start = (170 * Math.PI) / 180;
    const end = (-170 * Math.PI) / 180;
    const angle = mix(mix(start, end, u), start + (u * Math.PI) / 9, a);
    circle(ctx, 240, 150, 70, alpha(p.secondary, 0.13));
    arrow(
      ctx,
      [240, 150],
      [240 + Math.cos(start) * 90, 150 + Math.sin(start) * 90],
      p.muted
    );
    arrow(
      ctx,
      [240, 150],
      [240 + Math.cos(end) * 90, 150 + Math.sin(end) * 90],
      p.warm
    );
    ctx.save();
    ctx.translate(240, 150);
    ctx.rotate(angle);
    polygon(
      ctx,
      [
        [45, 0],
        [-25, -22],
        [-13, 0],
        [-25, 22],
      ],
      p.accent
    );
    ctx.restore();
    text(ctx, "170° → −170°", 172, 265, p.ink);
    return;
  }
  line(
    ctx,
    [
      [55, 166],
      [416, 166],
    ],
    p.grid,
    2
  );
  for (const x of [65, 385]) {
    circle(ctx, x, 166, 5, p.muted);
  }
  const x = 65 + value * 320;
  if (slug === "smoothstep") {
    ctx.globalAlpha = clamp(value);
    box(ctx, 95, 65, 290, 130, p.surface, 12);
    text(ctx, "QUEST COMPLETE", 139, 128, p.accent, 19);
    text(ctx, "+ 250 XP", 187, 163, p.ink, 16);
    ctx.globalAlpha = 1;
  } else {
    glow(ctx, x, 146, 40, p.accent, 0.3);
    box(
      ctx,
      x - 29,
      119,
      58 + (slug === "lerp" ? value * 22 : 0),
      54,
      p.accent,
      12
    );
    text(ctx, "★", x - 10, 154, p.background, 24);
  }
  const graph: Point[] = [];
  for (let i = 0; i <= 100; i++) {
    const v = i / 100;
    const shaped =
      slug === "easing"
        ? 1 - Math.exp(-6 * v) * Math.cos(v * 12)
        : slug === "smoothstep"
          ? smooth(v)
          : v;
    graph.push([55 + v * 350, 277 - shaped * 50]);
  }
  line(ctx, graph, alpha(p.accent, 0.7));
  circle(ctx, 55 + u * 350, 277 - value * 50, 4, p.warm);
}

export function drawCurves(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (["lerp", "smoothstep", "easing", "slerp"].includes(slug)) {
    drawTiming(scene);
    return;
  }
  const progress = fract(t / 4);
  const curve = (u: number) => curvePoint(slug, u, Math.sin(t) * 0.5 + 1);
  const path = (u: number): Point => {
    const point = curve(u);
    if (slug === "arc-length-parameterization") {
      return point;
    }
    const start = curve(0);
    const end = curve(1);
    if (slug === "catmull-rom-spline") {
      const segment = Math.min(2, Math.floor(u * 3));
      const v = u * 3 - segment;
      const left = curve(segment / 3);
      const right = curve((segment + 1) / 3);
      return [
        mix(mix(left[0], right[0], v), point[0], a),
        mix(mix(left[1], right[1], v), point[1], a),
      ];
    }
    return [
      mix(mix(start[0], end[0], u), point[0], a),
      mix(mix(start[1], end[1], u), point[1], a),
    ];
  };
  line(
    ctx,
    Array.from({ length: 100 }, (_, i) => path(i / 99)),
    alpha(p.accent, 0.3),
    2
  );
  if (slug === "be-zier-curve") {
    line(ctx, handles, p.grid);
    for (const handle of handles) {
      circle(ctx, ...handle, 4, p.warm);
    }
  }
  if (slug === "catmull-rom-spline") {
    for (const u of [0, 1 / 3, 2 / 3, 1]) {
      circle(ctx, ...curve(u), 6, p.warm);
    }
  }
  if (slug === "cubic-hermite-curve") {
    arrow(ctx, [50, 218], [95, 144], p.warm);
    arrow(ctx, [407, 51], [430, 105], p.warm);
  }
  let u = progress;
  if (slug === "arc-length-parameterization") {
    u = mix(progress, arcParameter(progress, curve), a);
  }
  for (let i = 1; i < 18; i++) {
    const v = Math.max(0, u - i * 0.012);
    const next = path(Math.min(1, v + 0.012));
    line(ctx, [path(v), next], alpha(p.accent, 1 - i / 18), 6 * (1 - i / 22));
  }
  const point = path(u);
  spark(scene, ...point, 5);
  text(
    ctx,
    slug === "arc-length-parameterization"
      ? `DISTANCE ${Math.round(progress * 100)}%`
      : `PATH ${Math.round(progress * 100)}%`,
    22,
    280,
    p.muted
  );
}

type Bird = { x: number; y: number; vx: number; vy: number };
const flockCache = new Map<number, Bird[][]>();

function flock(amount: number): Bird[][] {
  const cached = flockCache.get(amount);
  if (cached) {
    return cached;
  }
  let birds: Bird[] = Array.from({ length: 24 }, (_, i) => ({
    x: 80 + random(i) * 280,
    y: 60 + random(i + 80) * 150,
    vx: Math.cos(i) * 24,
    vy: Math.sin(i) * 24,
  }));
  const frames = [birds];
  for (let frame = 0; frame < 240; frame++) {
    const previousBirds = birds;
    birds = previousBirds.map((bird, i) => {
      let sx = 0;
      let sy = 0;
      let ax = 0;
      let ay = 0;
      let cx = 0;
      let cy = 0;
      let count = 0;
      for (const [j, other] of previousBirds.entries()) {
        if (i === j) {
          continue;
        }
        const dx = bird.x - other.x;
        const dy = bird.y - other.y;
        const d = Math.hypot(dx, dy);
        if (d < 95) {
          ax += other.vx;
          ay += other.vy;
          cx += other.x;
          cy += other.y;
          count += 1;
        }
        if (d < 25 && d > 0) {
          sx += dx / (d * d);
          sy += dy / (d * d);
        }
      }
      let { vx } = bird;
      let { vy } = bird;
      if (count > 0) {
        vx +=
          amount *
          (sx * 26 + (ax / count - vx) * 0.07 + (cx / count - bird.x) * 0.015);
        vy +=
          amount *
          (sy * 26 + (ay / count - vy) * 0.07 + (cy / count - bird.y) * 0.015);
      }
      vx += (240 - bird.x) * 0.002;
      vy += (145 - bird.y) * 0.003;
      const speed = Math.max(1, Math.hypot(vx, vy));
      const desired = clamp(speed, 24, 48);
      vx = (vx / speed) * desired;
      vy = (vy / speed) * desired;
      return { x: bird.x + vx / 30, y: bird.y + vy / 30, vx, vy };
    });
    frames.push(birds);
  }
  if (flockCache.size > 3) {
    flockCache.clear();
  }
  flockCache.set(amount, frames);
  return frames;
}

export function drawMotion(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "flow-field-following") {
    drawFlow(scene);
    return;
  }
  if (slug === "boids") {
    const birds = flock(a)[Math.min(240, Math.floor(t * 30))] ?? [];
    for (const bird of birds) {
      const angle = Math.atan2(bird.vy, bird.vx);
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(angle);
      polygon(
        ctx,
        [
          [8, 0],
          [-6, -5],
          [-3, 0],
          [-6, 5],
        ],
        p.accent
      );
      ctx.restore();
    }
    return;
  }
  if (
    ["spring-damper", "critical-damping", "exponential-damping", "pd"].includes(
      slug
    )
  ) {
    const local = fract(t / 4) * 4;
    const target = 342;
    const value =
      slug === "exponential-damping"
        ? mix(1, 1 - Math.exp(-local * 3), a)
        : springResponse(
            local,
            slug === "critical-damping" ? mix(0.18, 1, a) : mix(0.01, 0.45, a)
          );
    line(
      ctx,
      [
        [target, 45],
        [target, 240],
      ],
      p.muted,
      1
    );
    text(ctx, "TARGET", target - 23, 32, p.muted, 10);
    const x = 110 + value * (target - 110);
    if (slug === "pd") {
      circle(ctx, 240, 180, 35, p.secondary);
      const angle = -Math.PI + value * 2.5;
      arrow(
        ctx,
        [240, 180],
        [240 + Math.cos(angle) * 78, 180 + Math.sin(angle) * 78],
        p.accent,
        12
      );
    } else {
      const spring: Point[] = [[25, 165]];
      for (let i = 0; i < 22; i++) {
        spring.push([25 + ((x - 50) * i) / 22, 165 + (i % 2 === 0 ? -9 : 9)]);
      }
      line(ctx, spring, p.secondary, 2);
      box(ctx, x - 25, 140, 50, 50, p.accent, 10);
    }
    return;
  }
  const target: Point = [
    360 + Math.sin(t * 0.9) * 35,
    110 + Math.sin(t * 0.7) * 55,
  ];
  let x = 50;
  let y = 205;
  let vx = 30;
  let vy = 0;
  const trail: Point[] = [];
  for (let step = 0; step < t * 60; step++) {
    const elapsed = step / 60;
    let tx = 360 + Math.sin(elapsed * 0.9) * 35;
    let ty = 110 + Math.sin(elapsed * 0.7) * 55;
    if (slug === "pursuit") {
      tx += a * Math.cos(elapsed * 0.9) * 55;
      ty += a * Math.cos(elapsed * 0.7) * 60;
    }
    if (slug === "wander-steering") {
      const angle = mix(
        random(Math.floor(elapsed * 2)) * TAU,
        Math.sin(elapsed * 0.9) * 2.5,
        a
      );
      tx = x + Math.cos(angle) * 80;
      ty = y + Math.sin(angle) * 80;
    }
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const speed = slug === "seek" ? mix(90, Math.min(90, dist * 1.4), a) : 70;
    let ax = (dx / dist) * speed - vx;
    let ay = (dy / dist) * speed - vy;
    if (
      slug === "obstacle-avoidance-steering" &&
      x > 130 &&
      x < 285 &&
      y > 95
    ) {
      ax -= a * 35;
      ay -= a * 155;
    }
    vx += ax / 30;
    vy += ay / 30;
    x += vx / 60;
    y += vy / 60;
    if (step % 3 === 0) {
      trail.push([x, y]);
    }
  }
  if (slug === "obstacle-avoidance-steering") {
    circle(ctx, 240, 164, 40, p.secondary);
  }
  line(ctx, trail, alpha(p.accent, 0.4), 2);
  circle(ctx, ...target, 10, p.warm);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(vy, vx));
  polygon(
    ctx,
    [
      [14, 0],
      [-10, -7],
      [-6, 0],
      [-10, 7],
    ],
    p.accent
  );
  ctx.restore();
  if (slug === "pursuit") {
    arrow(
      ctx,
      target,
      [
        target[0] + Math.cos(t * 0.9) * 55 * a,
        target[1] + Math.cos(t * 0.7) * 60 * a,
      ],
      p.muted
    );
  }
}

const ribbonPoint = (age: number): Point => [
  240 + Math.cos(age * 2.4) * 130,
  145 + Math.sin(age * 2.4) * 70,
];

export function drawParticles(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "ribbon") {
    const path = ribbonPoint;
    for (let i = 45; i > 0; i--) {
      line(
        ctx,
        [path(t - i * 0.015), path(t - (i - 1) * 0.015)],
        alpha(p.accent, a * (1 - i / 46) * 0.7),
        26 * (1 - i / 46)
      );
    }
    const point = path(t);
    line(ctx, [[240, 200], point], p.ink, 5);
    spark(scene, ...point, 5);
    return;
  }
  if (slug === "billboard") {
    const angle = t * 0.8;
    for (let i = 0; i < 6; i++) {
      const width = mix(Math.abs(Math.cos(angle + i * 0.2)), 1, a);
      ctx.save();
      ctx.translate(95 + i * 59, 155 + Math.sin(i) * 30);
      ctx.scale(Math.max(0.015, width), 1);
      glow(ctx, 0, 0, 46, p.secondary, 0.5);
      circle(ctx, 0, 0, 15, alpha(p.accent, 0.2));
      ctx.restore();
    }
    text(ctx, `CAMERA ${Math.round(t * 46)}°`, 22, 278, p.muted);
    return;
  }
  if (slug === "flipbook") {
    const frame = Math.min(7, Math.floor(fract(t / 2.5) * 8));
    const shown = Math.floor(frame * a);
    for (let i = 0; i < 18; i++) {
      const angle = random(i) * TAU;
      const radius = shown * 10 * random(i + 7);
      glow(
        ctx,
        240 + Math.cos(angle) * radius,
        146 + Math.sin(angle) * radius,
        15 + shown * 3,
        shown > 4 ? p.muted : p.warm,
        0.4 * (1 - shown / 10)
      );
    }
    for (let i = 0; i < 8; i++) {
      box(ctx, 96 + i * 37, 256, 30, 21, shown === i ? p.accent : p.grid);
      text(
        ctx,
        `${i + 1}`,
        106 + i * 37,
        271,
        shown === i ? p.background : p.muted,
        11
      );
    }
    return;
  }
  if (slug === "soft-particles") {
    for (let i = 0; i < 14; i++) {
      const x = 170 + random(i) * 140 + Math.sin(t + i) * 14;
      const y = 228 - random(i + 9) * 40;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 480, 249);
      ctx.clip();
      glow(ctx, x, y, 40, p.ink, 0.3 * mix(1, clamp((249 - y) / 35), a));
      ctx.restore();
    }
    if (a > 0) {
      const fade = ctx.createLinearGradient(0, 212, 0, 249);
      fade.addColorStop(0, alpha(p.background, 0));
      fade.addColorStop(1, alpha(p.background, a));
      ctx.fillStyle = fade;
      ctx.fillRect(80, 212, 320, 37);
    }
    return;
  }
  const rain = slug === "velocity-alignment";
  if (slug === "surface") {
    circle(ctx, 240, 168, 55, p.secondary);
  }
  if (slug === "sub-emitters") {
    box(ctx, 365, 60, 10, 189, p.secondary);
  }
  for (let i = 0; i < 65; i++) {
    const age = fract(t * 0.35 + random(i)) * 2;
    const angle = random(i + 30) * TAU;
    let x = 240 + Math.cos(angle) * age * 85;
    let y = 150 + Math.sin(angle) * age * 65 + age * age * 22;
    if (slug === "surface") {
      x = 240 + Math.cos(angle) * a * 55 + Math.cos(angle) * age * 20;
      y = 168 + Math.sin(angle) * a * 55 - age * 67;
    }
    if (rain) {
      x = fract(random(i + 30) + age * 0.2) * 480;
      y = fract(random(i + 80) + age) * 249;
    }
    const size =
      slug === "size" ? mix(4, 1 + Math.sin((age / 2) * Math.PI) * 7, a) : 2.5;
    const opacity = slug === "size" ? mix(1, 1 - age / 2, a) : 1 - age / 2;
    if (slug === "sub-emitters") {
      x = 45 + age * 260;
      y = 125 + age * 25;
      if (x > 365) {
        const secondary = age - 320 / 260;
        x = 365 - secondary * (15 + random(i) * 110) * a;
        y = 156 + Math.sin(angle) * secondary * 130 * a;
        if (a === 0) {
          continue;
        }
      }
    }
    if (slug === "mesh-particles") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + t * a * 2);
      polygon(
        ctx,
        [
          [-7, -5],
          [4, -9 * a - 1],
          [9, 4],
          [-3, 9],
        ],
        alpha(p.secondary, opacity)
      );
      line(
        ctx,
        [
          [-7, -5],
          [1, 1],
          [9, 4],
        ],
        alpha(p.ink, opacity),
        1
      );
      ctx.restore();
    } else if (slug === "stretched-billboard" || rain) {
      const vx = rain ? 0.35 : Math.cos(angle);
      const vy = rain ? 1 : Math.sin(angle);
      line(
        ctx,
        [
          [x, y],
          [
            x - vx * (rain ? 20 * a : 24 * a),
            y - (rain ? mix(17, 20, a) : vy * 24 * a),
          ],
        ],
        alpha(p.warm, opacity),
        2
      );
      circle(ctx, x, y, 1.4, alpha(p.ink, opacity));
    } else {
      glow(ctx, x, y, size * 3, p.warm, opacity * 0.5);
      circle(ctx, x, y, size, alpha(p.warm, opacity));
    }
  }
}
