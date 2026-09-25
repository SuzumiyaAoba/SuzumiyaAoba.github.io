import {
  clamp,
  fract,
  mix,
  random,
  solveTwoBone,
  TAU,
} from "../../lib/demo-math";
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
  raster,
  rgb,
  mixRgb,
  text,
  tree,
} from "./drawing";
import type { Scene } from "./drawing";

export function drawNature(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "procedural-wind-animation") {
    for (let i = 0; i < 12; i++) {
      tree(
        ctx,
        32 + i * 38,
        244,
        1 + random(i) * 1.3,
        i % 2 === 0 ? p.accent : p.secondary,
        Math.sin(t * 1.8 + i * 0.6) * a * 14
      );
    }
    return;
  }
  if (slug === "hydraulic-erosion" || slug === "thermal-erosion") {
    const progress = a * clamp(t / 6);
    const points: Point[] = [[25, 249]];
    for (let x = 25; x < 455; x += 3) {
      const hill = 55 + Math.abs(x - 240) * 0.75;
      const groove = Math.sin(x * 0.16) * 14 + Math.sin(x * 0.41) * 7;
      points.push([
        x,
        Math.min(
          240,
          hill +
            (slug === "hydraulic-erosion"
              ? Math.max(0, groove) * progress * 3
              : progress * (65 - Math.abs(x - 240) * 0.3))
        ),
      ]);
    }
    points.push([455, 249]);
    polygon(ctx, points, p.secondary);
    line(ctx, points.slice(1, -1), p.accent, 2);
    for (let i = 0; i < 30; i++) {
      const age = fract(t * 0.6 + random(i));
      const x = 240 + (random(i + 9) - 0.5) * 350 * age;
      const y = 50 + Math.abs(x - 240) * 0.75 + age * 40;
      circle(ctx, x, y, 2, slug === "hydraulic-erosion" ? p.accent : p.warm);
    }
    return;
  }
  if (slug === "caustics") {
    const low = rgb(p.surface);
    const high = rgb(p.accent);
    raster(
      scene,
      (x, y) => {
        const n = Math.abs(
          Math.sin(x * 22 + Math.sin(y * 14 + t)) +
            Math.cos(y * 21 - Math.sin(x * 13 - t))
        );
        return mixRgb(low, high, a * Math.exp(-n * 9));
      },
      25,
      40,
      430,
      207
    );
    return;
  }
  if (
    slug === "height-field-wave-simulation" ||
    slug === "shallow-water-equations"
  ) {
    for (let row = 0; row < 21; row++) {
      const points: Point[] = [];
      for (let column = 0; column < 57; column++) {
        const x = 15 + column * 8;
        const y = 35 + row * 10;
        const d = Math.hypot(x - 240, (y - 140) * 1.5);
        const wave =
          Math.sin(d * 0.08 - t * 4) *
          Math.exp(-Math.abs(d - fract(t / 3) * 220) * 0.016) *
          a *
          10;
        const blocked =
          slug === "shallow-water-equations" &&
          x > 260 &&
          Math.abs(y - 140) < 35;
        points.push([x, y + (blocked ? wave * (1 - a) : wave)]);
      }
      line(ctx, points, alpha(p.accent, 0.55), 1);
    }
    if (slug === "shallow-water-equations") {
      box(ctx, 258, 105, 15, 70, p.warm);
    }
    return;
  }
  const wave = (x: number, phase: number) =>
    Math.sin(x * 0.023 - t * 2 + phase) * 17 +
    (slug === "fft-ocean"
      ? a *
        (Math.sin(x * 0.061 + t * 2.5) * 9 + Math.sin(x * 0.139 - t * 4) * 5)
      : 0);
  for (let row = 0; row < 7; row++) {
    const points: Point[] = [[0, 249]];
    for (let x = -15; x <= 495; x += 5) {
      const offset =
        slug === "gerstner-waves"
          ? a * Math.cos(x * 0.023 - t * 2 + row * 0.4) * 14
          : 0;
      points.push([x + offset, 120 + row * 16 + wave(x, row * 0.4)]);
    }
    points.push([480, 249]);
    polygon(ctx, points, alpha(p.secondary, 0.25));
    line(ctx, points.slice(1, -1), alpha(p.accent, 0.6), 1.5);
  }
  if (slug === "buoyancy") {
    const y = mix(91, 108 + wave(240, 0), a);
    ctx.save();
    ctx.translate(240, y);
    ctx.rotate(a * Math.cos(240 * 0.023 - t * 2) * 0.35);
    box(ctx, -21, -23, 42, 32, p.warm, 2);
    ctx.restore();
  }
  if (slug === "whitewater") {
    for (let i = 0; i < 90; i++) {
      const x = random(i) * 480;
      const crest = Math.sin(x * 0.023 - t * 2);
      if (crest < -0.6) {
        circle(
          ctx,
          x,
          120 + wave(x, 0) - random(i + 4) * 12,
          1.5,
          alpha(p.ink, a)
        );
      }
    }
  }
}

function drawCloth(scene: Scene) {
  const { ctx, palette: p, amount: a, time: t, slug } = scene;
  const stretchy = slug === "extended-pbd";
  const xpd = stretchy ? 1 + a * 0.35 : 1;
  for (let row = 0; row < 12; row++) {
    const points: Point[] = [];
    for (let col = 0; col < 18; col++) {
      const influence = row / 11;
      const sag =
        slug === "mass-spring-system"
          ? Math.sin(t * 4) * Math.exp(-fract(t / 4) * 3) * a * 28
          : Math.sin(t * 2 + col * 0.35) * 15 * a;
      points.push([
        95 + col * 17 + Math.sin(t + row * 0.3) * influence * 24 * a,
        45 + row * 14 * xpd + influence * sag,
      ]);
    }
    line(ctx, points, alpha(p.accent, 0.8), 1.5);
    for (const point of points) {
      circle(ctx, ...point, 1.8, p.accent);
    }
  }
  for (const x of [95, 384]) {
    circle(ctx, x, 45, 5, p.warm);
  }
  if (slug === "position-based-dynamics" && a < 0.5) {
    text(ctx, "NO DISTANCE CONSTRAINTS", 100, 267, p.muted, 11);
  }
}

export function drawPhysics(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (
    ["position-based-dynamics", "extended-pbd", "mass-spring-system"].includes(
      slug
    )
  ) {
    drawCloth(scene);
    return;
  }
  const u = fract(t / 4) * 4;
  if (slug === "verlet-integration" || slug === "joints") {
    const points: Point[] = [[240, 40]];
    let x = 240;
    let y = 40;
    for (let i = 0; i < 8; i++) {
      const angle = Math.sin(t * 1.6 + i * 0.17) * a * 0.7;
      x += Math.sin(angle) * 24;
      y += Math.cos(angle) * 24;
      points.push([x, y]);
    }
    line(ctx, points, p.accent, slug === "joints" ? 9 : 3);
    for (const point of points) {
      circle(ctx, ...point, 5, p.warm);
    }
    return;
  }
  if (slug === "shape-matching") {
    const restore = mix(0, 1 - Math.exp(-u * 3) * Math.cos(u * 6), a);
    const points: Point[] = Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * TAU;
      return [
        240 + Math.cos(angle) * mix(94, 58, restore),
        187 + Math.sin(angle) * mix(22, 58, restore),
      ];
    });
    polygon(ctx, points, alpha(p.accent, 0.25));
    line(ctx, points, p.accent, 2, true);
    for (const point of points) {
      circle(ctx, ...point, 3, p.ink);
    }
    return;
  }
  if (slug === "runge-kutta") {
    let x = 1;
    let y = 0;
    const points: Point[] = [];
    const steps = Math.floor(t / 0.08);
    for (let i = 0; i < steps; i++) {
      const dt = 0.08;
      const nx = x + dt * y;
      const ny = y - dt * x;
      const k1x = y;
      const k1y = -x;
      const k2x = y + (dt * k1y) / 2;
      const k2y = -(x + (dt * k1x) / 2);
      const k3x = y + (dt * k2y) / 2;
      const k3y = -(x + (dt * k2x) / 2);
      const k4x = y + dt * k3y;
      const k4y = -(x + dt * k3x);
      const rkX = x + (dt * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6;
      const rkY = y + (dt * (k1y + 2 * k2y + 2 * k3y + k4y)) / 6;
      x = mix(nx, rkX, a);
      y = mix(ny, rkY, a);
      points.push([240 + x * 65, 150 + y * 65]);
    }
    line(ctx, points, p.accent, 2);
    circle(ctx, 240 + x * 65, 150 + y * 65, 7, p.warm);
    return;
  }
  if (slug === "fixed-timestep") {
    const renderSteps = Math.floor(t * 12) + Math.floor(t * 7);
    const progress = mix(renderSteps * 3.9, t * 80, a);
    character(ctx, 40 + (progress % 390), 236, p.accent, t * 9);
    text(
      ctx,
      a > 0.5 ? "SIMULATION: 60 STEPS / s" : "RENDER: VARIABLE INTERVAL",
      22,
      277,
      p.muted,
      11
    );
    return;
  }
  if (slug === "friction") {
    const velocity = Math.max(0, 125 - a * 52 * u);
    const stop = a > 0 ? Math.min(u, 125 / (a * 52)) : u;
    const x = 45 + 125 * stop - 0.5 * a * 52 * stop ** 2;
    box(ctx, x, 207, 38, 40, p.warm, 3);
    arrow(ctx, [x + 19, 192], [x + 19 + velocity * 0.4, 192], p.accent);
    return;
  }
  const flight = fract(t / 2) * 2;
  const y = Math.min(236, 45 + 20 * flight + a * 90 * flight * flight);
  for (let i = 1; i < 10; i++) {
    const v = Math.max(0, flight - i * 0.06);
    circle(
      ctx,
      100 + v * 130,
      Math.min(236, 45 + 20 * v + a * 90 * v * v),
      3,
      alpha(p.accent, 0.3)
    );
  }
  circle(ctx, 100 + flight * 130, y, 12, p.accent);
}

export function drawFluids(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "reaction-diffusion") {
    const low = rgb(p.background);
    const high = rgb(p.accent);
    raster(
      scene,
      (x, y) => {
        const radius = Math.hypot(x - 0.5, y - 0.5);
        const phase =
          Math.sin(x * 32 + Math.sin(y * 18)) *
          Math.cos(y * 30 + Math.sin(x * 13));
        const growth = a * t * 0.07;
        return mixRgb(
          low,
          high,
          radius < 0.1 + growth && phase > -0.15 && phase < 0.45 ? 0.85 : 0.07
        );
      },
      40,
      30,
      400,
      220
    );
    return;
  }
  const liquid = [
    "smoothed-particle-hydrodynamics",
    "position-based-fluids",
    "particle-in-cell",
    "affine-particle-in-cell",
    "material-point-method",
  ].includes(slug);
  if (slug === "pressure-projection") {
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 11; col++) {
        const x = 55 + col * 37;
        const y = 48 + row * 29;
        const dx = (x - 240) / 20;
        const dy = (y - 145) / 20;
        arrow(
          ctx,
          [x, y],
          [
            x + mix(dx, -dy, a) * (1 + Math.sin(t) * 0.2),
            y + mix(dy, dx, a) * (1 + Math.sin(t) * 0.2),
          ],
          p.accent,
          1.5
        );
      }
    }
    return;
  }
  if (liquid) {
    line(
      ctx,
      [
        [65, 65],
        [65, 242],
        [415, 242],
        [415, 65],
      ],
      p.muted,
      4
    );
  }
  for (let i = 0; i < 140; i++) {
    const seedX = random(i);
    const seedY = random(i + 143);
    let x = 240 + (seedX - 0.5) * 90;
    let y = 225 - fract(t * 0.19 + seedY) * 200;
    if (liquid) {
      const collapse = clamp(t * 0.7);
      x = mix(165 + seedX * 120, 83 + seedX * 310, collapse);
      y = mix(55 + seedY * 160, 211 + seedY * 25, collapse);
      const ripple = Math.sin(x * 0.02 - t * 2) * a * 28 * (1 - seedY);
      y += ripple;
      if (slug === "material-point-method") {
        const compression = clamp(t / 4);
        x = mix(x, 170 + seedX * 140 + (seedX - 0.5) * compression * 60, a);
        const settled = 229 - (1 - Math.abs(seedX - 0.5) * 2) * 70 * seedY;
        y = mix(y, mix(45 + seedY * 130, settled, compression), a);
      }
      if (slug === "affine-particle-in-cell") {
        const angle = t * mix(Math.exp(-t), 1, a);
        const radius = Math.sqrt(seedX) * 86;
        x = 240 + Math.cos(seedY * TAU + angle) * radius;
        y = 150 + Math.sin(seedY * TAU + angle) * radius;
      }
      if (slug === "position-based-fluids") {
        x = mix(x, 95 + (i % 20) * 15, a);
        y = mix(y, 230 - Math.floor(i / 20) * 7 + ripple, a);
      }
      if (slug === "smoothed-particle-hydrodynamics") {
        glow(ctx, x, y, 13, p.secondary, a * 0.16);
      }
      if (slug === "particle-in-cell" && i % 8 === 0) {
        arrow(
          ctx,
          [Math.round(x / 25) * 25, Math.round(y / 25) * 25],
          [x + a * 13, y - a * 10],
          alpha(p.warm, a),
          1
        );
      }
    } else {
      const age = (225 - y) / 200;
      const strength =
        slug === "vorticity-confinement" ? mix(Math.exp(-t * 0.3), 1, a) : a;
      x += Math.sin(age * 8 - t) * age * 70 * strength;
      y += Math.cos(seedX * 9 + age * 8) * 20 * strength;
      if (slug === "vorticity-confinement") {
        x += Math.sin(seedY * 18 + t * 2.5) * a * 17;
        y += Math.cos(seedY * 18 + t * 2.5) * a * 17;
      }
      if (slug === "semi-lagrangian-advection") {
        const angle = t * a * 0.8 + seedX * TAU;
        x = 240 + Math.cos(angle) * (25 + seedY * 95);
        y = 145 + Math.sin(angle) * (25 + seedY * 75);
      }
      glow(ctx, x, y, 14 + age * 15, p.secondary, 0.1);
    }
    circle(ctx, x, y, liquid ? 2.8 : 1.5, alpha(p.accent, liquid ? 0.8 : 0.5));
  }
}

const walkingGround = (position: number) =>
  232 - Math.sin(position * 0.014) * 25;

export function drawAnimation(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const target: Point = [300 + Math.sin(t) * 75, 120 + Math.cos(t * 0.7) * 55];
  if (slug === "forward-and-backward-reaching-ik") {
    const root: Point = [80, 230];
    const points: Point[] = Array.from({ length: 9 }, (_, i) => [
      80 + i * 31,
      230,
    ]);
    // FABRIK alternates backwards and forwards length projections.
    for (let pass = 0; pass < 12; pass++) {
      points[8] = [mix(328, target[0], a), mix(230, target[1], a)];
      for (let i = 7; i >= 0; i--) {
        const point = points[i] ?? root;
        const next = points[i + 1] ?? root;
        const d = Math.max(
          0.001,
          Math.hypot(point[0] - next[0], point[1] - next[1])
        );
        points[i] = [
          next[0] + ((point[0] - next[0]) * 31) / d,
          next[1] + ((point[1] - next[1]) * 31) / d,
        ];
      }
      points[0] = root;
      for (let i = 1; i < 9; i++) {
        const point = points[i] ?? root;
        const prev = points[i - 1] ?? root;
        const d = Math.max(
          0.001,
          Math.hypot(point[0] - prev[0], point[1] - prev[1])
        );
        points[i] = [
          prev[0] + ((point[0] - prev[0]) * 31) / d,
          prev[1] + ((point[1] - prev[1]) * 31) / d,
        ];
      }
    }
    line(ctx, points, p.accent, 12);
    for (const point of points) {
      circle(ctx, ...point, 4, p.ink);
    }
    circle(ctx, ...target, 7, p.warm);
    return;
  }
  if (slug === "foot-ik") {
    const x = 125 + t * 26;
    const ground = walkingGround;
    const groundPoints: Point[] = Array.from({ length: 49 }, (_, i) => [
      i * 10,
      ground(i * 10),
    ]);
    polygon(ctx, [[0, 250], ...groundPoints, [480, 250]], p.secondary);
    const hips: Point = [x, ground(x) - 78];
    character(ctx, x, hips[1] - 9, p.accent, 0, 1.3);
    for (const phase of [0, Math.PI]) {
      const footX = x + Math.sin(t * 4 + phase) * 25;
      const stepHeight = Math.max(0, Math.cos(t * 4 + phase)) * 13;
      const foot: Point = [footX, mix(232, ground(footX), a) - stepHeight];
      const knee = solveTwoBone(hips, foot, 48);
      line(ctx, [hips, knee, foot], phase === 0 ? p.accent : p.ink, 6);
      line(
        ctx,
        [foot, [foot[0] + 15, foot[1] - a * Math.cos(footX * 0.014) * 4]],
        p.warm,
        4
      );
    }
    return;
  }
  if (slug === "two-bone") {
    const ground = 227 - Math.sin(t * 0.8) * 28;
    polygon(
      ctx,
      [
        [125, 249],
        [380, 249],
        [380, ground - 24],
        [125, ground + 24],
      ],
      p.secondary
    );
    const root: Point = [235, 115];
    const foot: Point = [mix(265, 275, a), mix(225, ground - 5, a)];
    const knee = solveTwoBone(root, foot, 62);
    character(ctx, 235, 102, p.accent, 0, 1.2);
    line(ctx, [root, knee, foot], p.accent, 9);
    line(ctx, [foot, [foot[0] + 20, foot[1] - a * 3]], p.warm, 6);
    circle(ctx, ...knee, 5, p.ink);
    return;
  }
  if (slug === "full-body-ik") {
    const lean = a * (target[0] - 290) * 0.25;
    const shoulder: Point = [230 + lean, 125];
    const hand: Point = [mix(285, target[0], a), mix(132, target[1], a)];
    const elbow = solveTwoBone(shoulder, hand, 60);
    character(ctx, 230 + lean, 156, p.accent, lean * 0.05, 1.5);
    line(ctx, [shoulder, elbow, hand], p.accent, 7);
    circle(ctx, ...target, 8, p.warm);
    return;
  }
  if (slug === "vertex-animation-textures") {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 7; col++) {
        const id = row * 7 + col;
        const collapse = a * clamp((t - row * 0.17) / 4);
        const x = 188 + col * 15 + (random(id) - 0.5) * collapse * 145;
        const y = mix(75 + row * 16, 234 - random(id + 9) * 18, collapse);
        box(ctx, x, y, 12, 12, row < 3 ? p.warm : p.accent, 2);
      }
    }
    return;
  }
  const progress = fract(t / 4);
  let x = 110 + progress * 260;
  let stride = t * 10;
  if (slug === "root-motion") {
    stride = t * mix(17, 10, a);
  }
  if (slug === "motion-warping") {
    x = 110 + progress * mix(170, 290, a);
    box(ctx, 400, 172, 16, 75, p.warm);
  }
  if (slug === "motion-matching") {
    const direction = Math.sin(t * 0.8);
    x = 240 + direction * 150;
    stride = t * mix(10, Math.abs(Math.cos(t * 0.8)) * 11, a);
  }
  if (slug === "inertialization") {
    const phase = fract(t / 4) * 4;
    const weight = phase < 2 ? 1 : mix(0, Math.exp(-(phase - 2) * 4), a);
    stride = Math.sin(t * 10) * weight;
    x = 190;
  }
  const breath = slug === "additive-animation" ? a * Math.sin(t * 2) * 5 : 0;
  if (slug === "additive-animation") {
    x = 240;
    stride = 0;
  }
  for (let i = 0; i < 9; i++) {
    circle(ctx, 60 + i * 45, 247, 2, p.muted);
  }
  character(ctx, x, 233 - breath, p.accent, stride, 1.6);
}

export function drawCamera(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const local = fract(t / 4) * 4;
  const jump = [
    "coyote-time",
    "input",
    "corner-correction",
    "jump-apex-hang-time",
  ].includes(slug);
  if (jump) {
    const phase = local / 4;
    let x = 80 + phase * 290;
    let y = 232 - Math.sin(phase * Math.PI) * 118;
    if (slug === "coyote-time") {
      box(ctx, 15, 245, 150, 55, p.secondary, 0);
      box(ctx, 325, 245, 155, 55, p.secondary, 0);
      y =
        phase < 0.3
          ? 232
          : mix(
              232 + (phase - 0.3) * 220,
              232 - Math.sin(((phase - 0.3) / 0.7) * Math.PI) * 108,
              a
            );
    }
    if (slug === "input") {
      const afterLanding = clamp((phase - 0.5) * 2);
      y =
        phase < 0.5
          ? 100 + phase * 264
          : 232 - a * Math.sin(afterLanding * Math.PI) * 120;
    }
    if (slug === "corner-correction") {
      box(ctx, 205, 75, 130, 32, p.secondary, 2);
      x = mix(210, 185, a);
      y = mix(Math.max(155, y), y, a);
    }
    if (slug === "jump-apex-hang-time") {
      y = 232 - 125 * Math.sin(Math.PI * phase) ** mix(1, 0.6, a);
    }
    character(ctx, x, y, p.accent, t * 10);
    text(
      ctx,
      slug === "input" ? "INPUT → LAND → JUMP" : "JUMP INPUT",
      22,
      281,
      p.warm,
      11
    );
    return;
  }
  const worldX = 150 + t * 88;
  const wobble = Math.sin(t * 4) * 13;
  let camera = worldX - 220;
  if (slug === "camera-dead-zone") {
    camera = mix(worldX + wobble - 220, worldX - 220, a);
    box(ctx, 180, 72, 110, 167, alpha(p.accent, 0.08));
  }
  if (slug === "camera-lookahead") {
    camera += a * 80;
  }
  if (slug === "camera-confiner") {
    camera = mix(camera, Math.min(camera, 430), a);
  }
  if (slug === "spline-dolly") {
    camera += Math.sin(t) * a * 40;
  }
  const impulse =
    slug === "impulse-camera-shake"
      ? a * Math.sin(local * 44) * Math.exp(-local * 3) * 18
      : 0;
  ctx.save();
  ctx.translate(impulse, impulse * 0.6);
  for (let layer = 0; layer < 3; layer++) {
    const parallax =
      slug === "parallax-scrolling"
        ? mix(1, 0.2 + layer * 0.35, a)
        : 0.3 + layer * 0.25;
    for (let i = 0; i < 16; i++) {
      const x = i * 105 - camera * parallax;
      tree(
        ctx,
        x,
        165 + layer * 40,
        1 + layer * 0.5,
        alpha(p.secondary, 0.25 + layer * 0.25)
      );
    }
  }
  if (slug === "camera-confiner") {
    box(ctx, 900 - camera, 0, 500, 249, p.background, 0);
    line(
      ctx,
      [
        [900 - camera, 0],
        [900 - camera, 249],
      ],
      p.warm,
      3
    );
  }
  character(ctx, worldX + wobble - camera, 233, p.accent, t * 10);
  ctx.restore();
}
