import {
  clamp,
  fbm,
  fract,
  mix,
  perlin,
  random,
  simplex,
  smooth,
  TAU,
  valueNoise,
} from "../../lib/demo-math";
import type { Point } from "../../lib/demo-math";
import {
  alpha,
  arrow,
  box,
  character,
  circle,
  glow,
  landscape,
  line,
  mixRgb,
  polygon,
  raster,
  rgb,
  spark,
  text,
} from "./drawing";
import type { Scene } from "./drawing";

function noiseValue(
  slug: string,
  x: number,
  y: number,
  time: number,
  amount: number
) {
  const raw = random(Math.floor(x) + Math.floor(y) * 157);
  switch (slug) {
    case "perlin": {
      return mix(raw, 0.5 + perlin(x, y), amount);
    }
    case "simplex-noise": {
      return mix(raw, 0.5 + simplex(x, y) * 0.5, amount);
    }
    case "value-noise": {
      return mix(raw, valueNoise(x, y), amount);
    }
    case "fractal-brownian-motion": {
      return 0.5 + mix(perlin(x, y) * 0.6, fbm(x, y) * 1.6, amount);
    }
    case "turbulence-noise": {
      return mix(
        0.5 + fbm(x, y),
        Math.abs(perlin(x, y)) + Math.abs(perlin(x * 2, y * 2)) * 0.5,
        amount
      );
    }
    case "ridged-multifractal-noise": {
      return mix(
        0.5 + perlin(x, y),
        (1 - Math.abs(perlin(x, y) * 2)) ** 3,
        amount
      );
    }
    case "domain-warping": {
      return 0.5 + Math.sin(x * 3 + amount * fbm(x + time, y) * 14) * 0.4;
    }
    case "periodic": {
      const u = fract(x / 4);
      const left = valueNoise(u * 4, y);
      const right = valueNoise(u * 4 - 4, y);
      return mix(left, mix(left, right, smooth(u)), amount);
    }
    case "worley": {
      let nearest = 9;
      let second = 9;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ix = Math.floor(x) + dx;
          const iy = Math.floor(y) + dy;
          const seed = ix + iy * 157;
          const px = ix + 0.5 + 0.4 * Math.sin(time * 0.6 + random(seed) * TAU);
          const py =
            iy + 0.5 + 0.4 * Math.cos(time * 0.6 + random(seed + 41) * TAU);
          const d = Math.hypot(px - x, py - y);
          if (d < nearest) {
            second = nearest;
            nearest = d;
          } else if (d < second) {
            second = d;
          }
        }
      }
      return mix(0.25, clamp((second - nearest) * 3), amount);
    }
    default: {
      return 0.5;
    }
  }
}

export function drawFlow(scene: Scene) {
  const { ctx, palette: p, amount: a, time: t, slug } = scene;
  const curl = slug === "curl-noise";
  const river = slug === "flow-map";
  if (river) {
    line(
      ctx,
      [
        [-20, 225],
        [100, 230],
        [235, 90],
        [370, 100],
        [490, 190],
      ],
      alpha(p.secondary, 0.3),
      90
    );
  }
  for (let i = 0; i < 90; i++) {
    const age = fract(t * 0.19 + random(i)) * 4;
    let x = 240 + (random(i + 91) - 0.5) * 45;
    let y = 257;
    if (!curl) {
      x = random(i + 3) * 480;
      y = random(i + 7) * 280;
    }
    const tail: Point[] = [];
    for (let step = 0; step < 36; step++) {
      const dt = age / 36;
      const nx = x * 0.014;
      const ny = y * 0.014;
      const epsilon = 0.03;
      const dx =
        (perlin(nx, ny + epsilon) - perlin(nx, ny - epsilon)) / (2 * epsilon);
      const dy =
        -(perlin(nx + epsilon, ny) - perlin(nx - epsilon, ny)) / (2 * epsilon);
      x +=
        dt * (curl ? a * dx * 65 : 40 + a * Math.sin(y * 0.025 + t * 0.2) * 42);
      y += dt * (curl ? -50 + a * dy * 48 : a * Math.sin(x * 0.018) * 48);
      if (step > 27) {
        tail.push([x, y]);
      }
    }
    const opacity = Math.sin((age / 4) * Math.PI);
    if (curl) {
      glow(ctx, x, y, 8 + age * 5, p.secondary, opacity * 0.15);
    }
    line(ctx, tail, alpha(p.accent, opacity * 0.6), river ? 3 : 1.5);
    circle(ctx, x, y, 1.5, alpha(p.ink, opacity));
  }
  if (curl) {
    box(ctx, 218, 252, 44, 10, p.grid);
    glow(ctx, 240, 249, 32, p.warm, 0.4);
  }
}

export function drawNoise(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "curl-noise") {
    drawFlow(scene);
    return;
  }
  const low = rgb(p.background);
  const middle = rgb(p.secondary);
  const high = rgb(slug === "domain-warping" ? p.warm : p.accent);
  const timeOffset =
    slug === "periodic"
      ? mix(t * 0.32, Math.sin(((t % 8) * TAU) / 8) * 0.75, a)
      : t * 0.32;
  raster(
    scene,
    (x, y) => {
      const n = clamp(noiseValue(slug, x * 5, y * 4 + timeOffset, t, a));
      return n < 0.5
        ? mixRgb(low, middle, n * 1.6)
        : mixRgb(middle, high, (n - 0.5) * 2);
    },
    20,
    30,
    440,
    205
  );
  if (slug === "periodic") {
    line(
      ctx,
      [
        [372, 30],
        [372, 235],
      ],
      alpha(p.ink, 0.8),
      1
    );
    text(ctx, "TILE EDGE", 332, 255, p.ink, 10);
  }
  if (
    ["perlin", "ridged-multifractal-noise", "fractal-brownian-motion"].includes(
      slug
    )
  ) {
    const points: Point[] = [[20, 235]];
    for (let x = 20; x <= 460; x += 3) {
      points.push([x, 216 - noiseValue(slug, x * 0.013, t * 0.3, t, a) * 78]);
    }
    points.push([460, 235]);
    polygon(ctx, points, alpha(p.background, 0.85));
    line(ctx, points.slice(1, -1), p.accent, 2);
  }
}

export function drawMaterials(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "flow-map") {
    drawFlow(scene);
    return;
  }
  if (slug === "dissolve") {
    const progress = (1 - Math.cos((t * TAU) / 8)) / 2;
    for (let y = 62; y < 240; y += 4) {
      for (let x = 160; x < 320; x += 4) {
        const inHead = Math.hypot(x - 240, y - 87) < 26;
        const inBody = Math.abs(x - 240) < 37 && y > 117 && y < 192;
        const inLegs =
          Math.abs(x - 240) < 34 && Math.abs(x - 240) > 8 && y >= 192;
        if (!(inHead || inBody || inLegs)) {
          continue;
        }
        const noise = valueNoise(x * 0.04, y * 0.04);
        if (noise < progress * a) {
          continue;
        }
        ctx.fillStyle = alpha(
          noise < progress * a + 0.08 && a > 0 ? p.warm : p.accent,
          mix(1 - progress, 1, a)
        );
        ctx.fillRect(x, y, 4, 4);
      }
    }
    text(ctx, `THRESHOLD ${progress.toFixed(2)}`, 22, 277, p.muted);
    return;
  }
  if (slug === "vertex-displacement") {
    for (let row = 0; row <= 12; row++) {
      const points: Point[] = [];
      for (let col = 0; col <= 24; col++) {
        points.push([
          85 + col * 13,
          57 + row * 12 + a * Math.sin(col * 0.3 - t * 2 + row * 0.2) * col,
        ]);
      }
      line(ctx, points, alpha(p.accent, 0.6), 1.5);
    }
    for (let col = 0; col <= 24; col++) {
      const points: Point[] = [];
      for (let row = 0; row <= 12; row++) {
        points.push([
          85 + col * 13,
          57 + row * 12 + a * Math.sin(col * 0.3 - t * 2 + row * 0.2) * col,
        ]);
      }
      line(ctx, points, alpha(p.secondary, 0.6), 1);
    }
    line(
      ctx,
      [
        [82, 48],
        [82, 247],
      ],
      p.ink,
      4
    );
    return;
  }
  if (slug === "polar-coordinates") {
    ctx.save();
    ctx.translate(240, 143);
    ctx.rotate(t * a * 0.45);
    for (const radius of [46, 65, 94]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * TAU;
      polygon(
        ctx,
        [
          [Math.cos(angle) * 68, Math.sin(angle) * 68],
          [Math.cos(angle + 0.1) * 87, Math.sin(angle + 0.1) * 87],
          [Math.cos(angle - 0.1) * 87, Math.sin(angle - 0.1) * 87],
        ],
        alpha(p.accent, 0.7)
      );
    }
    ctx.rotate(-t * a);
    const points: Point[] = Array.from({ length: 7 }, (_, i) => [
      Math.cos((i * TAU) / 3) * 42,
      Math.sin((i * TAU) / 3) * 42,
    ]);
    line(ctx, points, p.warm, 2);
    ctx.restore();
    glow(ctx, 240, 143, 68, p.accent, 0.2);
    return;
  }
  if (slug === "channel-packing") {
    for (let i = 0; i < 4; i++) {
      const x = a > 0.5 ? 190 + (i % 2) * 42 : 60 + i * 98;
      const y = a > 0.5 ? 66 + Math.floor(i / 2) * 42 : 72;
      box(
        ctx,
        x,
        y,
        38,
        38,
        [p.accent, p.secondary, p.warm, p.muted][i] ?? p.ink
      );
      text(
        ctx,
        ["R", "G", "B", "A"][i] ?? "",
        x + 14,
        y + 25,
        p.background,
        15
      );
      arrow(ctx, [x + 19, y + 42], [200 + i * 27, 203], alpha(p.muted, 0.6));
    }
    glow(ctx, 240, 221, 38, p.warm, 0.6 + Math.sin(t * 2) * 0.3);
    circle(ctx, 240, 221, 15, p.accent);
    text(
      ctx,
      a > 0.5 ? "1 TEXTURE / 4 MASKS" : "4 TEXTURES / 4 MASKS",
      145,
      277,
      p.ink
    );
    return;
  }
  const low = rgb(p.background);
  const high = rgb(p.accent);
  const second = rgb(p.secondary);
  raster(
    scene,
    (x, y) => {
      let u = x * 9;
      let v = y * 6;
      if (slug === "uv-scrolling") {
        u -= t * a;
      }
      if (slug === "triplanar") {
        u *= mix(0.1 + Math.abs(Math.cos(t * 0.5)), 1, a);
        v += a * Math.sin(t * 0.5);
      }
      if (slug === "parallax-mapping") {
        u += a * Math.sin(t) * valueNoise(u, v) * 0.9;
      }
      if (slug === "screen-space-distortion") {
        u +=
          a * Math.sin(v * 3 - t * 3) * Math.exp(-(((x - 0.5) * 4) ** 2)) * 0.5;
      }
      if (slug === "texture-bombing") {
        v += t * 0.35;
        u += a * (random(Math.floor(v) + Math.floor(u) * 113) - 0.5);
        v += a * random(Math.floor(u) + 71);
      }
      const checker = (Math.floor(u) + Math.floor(v)) % 2 === 0;
      const vein = 0.5 + Math.sin(u * 4 + Math.sin(v * 3)) * 0.5;
      return mixRgb(low, checker ? high : second, 0.2 + vein * 0.55);
    },
    48,
    40,
    384,
    198
  );
  if (slug === "parallax-mapping" || slug === "triplanar") {
    arrow(ctx, [160 + Math.sin(t) * 90, 278], [240, 234], p.warm);
  }
}

export function drawFields(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  const separation = 0.32 + 0.2 * Math.cos(t * 0.8);
  if (slug === "sphere-tracing") {
    const center: Point = [345, 150 + Math.sin(t) * 25];
    circle(ctx, ...center, 48, alpha(p.accent, 0.4));
    let x = 35;
    const progress = fract(t / 4);
    for (let i = 0; i < 30; i++) {
      const d = Math.hypot(x - center[0], 150 - center[1]) - 48;
      if (d < 0.5) {
        break;
      }
      const step = mix(9, d, a);
      if (i / 12 > progress) {
        break;
      }
      ctx.beginPath();
      ctx.arc(x, 150, Math.max(1, step), 0, TAU);
      ctx.strokeStyle = alpha(p.secondary, 0.3);
      ctx.lineWidth = 1;
      ctx.stroke();
      circle(ctx, x, 150, 3, p.warm);
      x += step;
    }
    arrow(ctx, [20, 150], [x, 150], p.ink);
    spark(scene, x, 150);
    return;
  }
  if (slug === "multi-channel-signed-distance-field") {
    const scale = 0.8 + (1 - Math.cos((t * TAU) / 8)) * 1.6;
    ctx.save();
    ctx.translate(240, 153);
    ctx.scale(scale, scale);
    if (a < 0.5) {
      const rows = ["01110", "11011", "11011", "11111", "11011", "11011"];
      for (const [row, bits] of rows.entries()) {
        for (let col = 0; col < bits.length; col++) {
          if (bits.charAt(col) === "1") {
            box(ctx, col * 8 - 20, row * 8 - 24, 8, 8, p.accent, 0);
          }
        }
      }
    } else {
      ctx.font = "bold 68px sans-serif";
      ctx.fillStyle = p.accent;
      ctx.textAlign = "center";
      ctx.fillText("A", 0, 24);
    }
    ctx.restore();
    text(ctx, `${scale.toFixed(1)}× ZOOM`, 22, 277, p.muted);
    return;
  }
  const low = rgb(p.background);
  const high = rgb(p.accent);
  const rim = rgb(p.warm);
  raster(
    scene,
    (u, v) => {
      let x = (u - 0.5) * 2.6;
      const y = (v - 0.5) * 1.8;
      if (slug === "domain-deformation") {
        x += a * Math.sin(y * 5 + t) * 0.25;
      }
      if (slug === "domain-repetition") {
        x += t * 0.12;
        const size = mix(4, 0.5, a);
        x = fract(x / size + 0.5) * size - size * 0.5;
      }
      const d1 = Math.hypot(x - separation, y) - 0.35;
      const d2 = Math.hypot(x + separation, y) - 0.35;
      let d = Math.hypot(x, y) - 0.48;
      switch (slug) {
        case "signed-distance-field": {
          d -= a * Math.sin(t * 2) * 0.13;
          break;
        }
        case "constructive-solid-geometry": {
          d = mix(
            d,
            Math.max(d, -(Math.hypot(x - Math.sin(t) * 0.4, y) - 0.28)),
            a
          );
          break;
        }
        case "smooth-union": {
          const k = Math.max(0.001, a * 0.5);
          const h = clamp(0.5 + (0.5 * (d2 - d1)) / k);
          d = mix(d2, d1, h) - k * h * (1 - h);
          break;
        }
        case "metaballs": {
          d = mix(
            Math.min(d1, d2),
            1 - 0.1 / (d1 + 0.35) ** 2 - 0.1 / (d2 + 0.35) ** 2,
            a
          );
          break;
        }
        case "domain-repetition": {
          d = Math.hypot(x, y) - 0.15;
          break;
        }
        case "domain-deformation": {
          d = Math.max(Math.abs(x) - 0.25, Math.abs(y) - 0.62);
          break;
        }
        case "sdf-gradient": {
          const normal = clamp(0.4 + x * Math.sin(t) + y * 0.4);
          return d < 0 ? mixRgb(low, high, mix(0.5, normal, a)) : low;
        }
        case "jump-flooding-algorithm": {
          d = Math.min(d1 + 0.34, d2 + 0.34, Math.hypot(x, y - 0.45) - 0.01);
          return mixRgb(
            low,
            high,
            d < mix(0.02, fract(t / 4) * 1.5, a) ? 0.2 + fract(d * 8) * 0.6 : 0
          );
        }
        default: {
          break;
        }
      }
      if (Math.abs(d) < 0.015) {
        return rim;
      }
      return d < 0
        ? mixRgb(low, high, 0.55 + clamp(-d) * 0.4)
        : mixRgb(low, high, Math.exp(-d * 9) * 0.15);
    },
    20,
    25,
    440,
    224
  );
}

export function drawLighting(scene: Scene) {
  const { palette: p, time: t, amount: a, slug } = scene;
  const low = rgb(p.background);
  const lit = rgb(p.accent);
  const white = rgb(p.ink);
  const warm = rgb(p.warm);
  const lx = Math.sin(t * 0.8) * 0.8;
  const lz = Math.sqrt(1 - lx * lx) * 0.8;
  raster(
    scene,
    (u, v) => {
      const x = (u - 0.5) * 3;
      const y = (v - 0.5) * 2;
      const r2 = x * x + y * y;
      if (r2 > 0.7) {
        return low;
      }
      const z = Math.sqrt(1 - r2 / 0.7);
      const perturbed =
        slug === "normal-mapping" ? a * perlin(x * 15 + t, y * 15) * 0.6 : 0;
      let diffuse = clamp(x * lx - y * 0.45 + z * lz + perturbed);
      if (slug === "toon") {
        diffuse = mix(diffuse, Math.floor(diffuse * 3) / 3, a);
      }
      let color = mixRgb(
        low,
        lit,
        slug === "physically-based-rendering"
          ? mix(0.5, diffuse * 0.75 + 0.1, a)
          : diffuse * 0.65 + 0.12
      );
      const roughness = slug === "ggx" ? mix(0.12, 0.55, a) : 0.3;
      const halfLength = Math.hypot(lx, -0.45, lz + 1);
      const nh = clamp(
        ((x * lx) / Math.sqrt(0.7) -
          (y * 0.45) / Math.sqrt(0.7) +
          z * (lz + 1)) /
          halfLength
      );
      const r4 = roughness ** 4;
      const ggx = r4 / (Math.PI * (nh * nh * (r4 - 1) + 1) ** 2);
      let specular = clamp(ggx * 0.35);
      if (slug === "anisotropic-reflection") {
        specular = mix(
          specular,
          Math.exp(-((x - lx * 0.3) ** 2 * 3 + (y + 0.18) ** 2 * 140)),
          a
        );
      }
      if (slug === "fresnel") {
        specular = mix(0.12, 0.04 + 0.96 * (1 - z) ** 5, a);
      }
      if (slug === "rim-lighting") {
        specular += a * (1 - z) ** 3;
      }
      if (slug === "clear-coat") {
        const coating = Math.exp(
          -((x - lx * 0.34) ** 2 + (y + 0.17) ** 2) * 200
        );
        specular = specular * 0.35 + a * coating;
      }
      if (slug === "subsurface-scattering") {
        color = mixRgb(
          color,
          warm,
          a * clamp(-x * lx - y * 0.3 + 0.25) * (1 - z) * 1.5
        );
      }
      if (slug === "image-based-lighting") {
        color = mixRgb(
          color,
          y < 0 ? white : warm,
          a * (0.15 + 0.25 * Math.abs(Math.sin(x * 4 + t)))
        );
      }
      if (slug === "physically-based-rendering") {
        specular *= a;
      }
      return mixRgb(color, white, clamp(specular));
    },
    30,
    25,
    420,
    230
  );
  glow(scene.ctx, 240 + lx * 160, 25, 25, p.warm, 0.8);
}

export function drawVolume(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  if (slug === "volume-ray-marching") {
    const low = rgb(p.background);
    const cloud = rgb(p.ink);
    raster(
      scene,
      (u, v) => {
        const x = (u - 0.5) * 3;
        const y = (v - 0.5) * 2;
        let transmittance = 1;
        for (let step = 0; step < 14; step++) {
          const z = (step / 13 - 0.5) * 2;
          const density = Math.max(
            0,
            0.8 -
              Math.hypot(x, y * 1.4, z) +
              fbm(x * 3 + t * 0.3, y * 3 + z * 2) * 0.8
          );
          transmittance *= Math.exp(-density * 0.32);
        }
        const flat = clamp(0.7 - Math.hypot(x, y * 1.4)) * 0.7;
        return mixRgb(low, cloud, mix(flat, 1 - transmittance, a));
      },
      20,
      25,
      440,
      222
    );
    return;
  }
  landscape(scene);
  const sunX = 90 + t * 35;
  if (slug === "rayleigh-scattering") {
    const sky = ctx.createLinearGradient(0, 0, 0, 245);
    sky.addColorStop(0, alpha(p.secondary, 0.5));
    sky.addColorStop(1, alpha(p.warm, a * (0.3 + t / 12)));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 480, 245);
  }
  glow(
    ctx,
    sunX,
    70 + Math.sin(t * 0.5) * 35,
    slug === "mie-scattering" ? 15 + a * 100 : 28,
    p.warm,
    0.8
  );
  if (slug === "premultiplied-alpha") {
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 59;
      const y = 145 + Math.sin(t + i) * 24;
      glow(ctx, x, y, 32, a < 0.5 ? p.background : p.warm, 0.9);
      glow(ctx, x, y, 23, p.warm, 0.6);
    }
    return;
  }
  if (slug === "weighted-blended-order-independent-transparency") {
    const layers = [0, 1, 2];
    if (a < 0.5 && Math.floor(t) % 2 === 0) {
      layers.reverse();
    }
    for (const i of layers) {
      circle(
        ctx,
        190 + i * 50 + Math.sin(t + i) * 10,
        145,
        62,
        alpha([p.accent, p.warm, p.secondary][i] ?? p.ink, 0.45)
      );
    }
    text(
      ctx,
      a < 0.5 ? "ORDER: CHANGING" : "ORDER: INDEPENDENT (MODEL)",
      22,
      278,
      p.ink
    );
    return;
  }
  for (let i = 0; i < 28; i++) {
    const x = fract(random(i) + t * 0.02) * 560 - 40;
    const y = 130 + random(i + 42) * 100;
    const density =
      slug === "beer-lambert-law" ? 1 - Math.exp(-a * (0.2 + t / 4)) : a;
    const direction =
      slug === "henyey-greenstein-phase-function"
        ? 0.2 + 0.8 * Math.max(0, Math.cos(t * 0.8)) ** 4
        : 1;
    glow(
      ctx,
      x,
      y,
      60 + random(i + 18) * 60,
      p.secondary,
      density * direction * 0.16
    );
  }
  if (slug === "volumetric-fog") {
    const lightX = 110 + Math.sin(t * 0.7) * 65;
    const lightY = 105;
    for (let layer = 12; layer > 0; layer--) {
      polygon(
        ctx,
        [
          [lightX, lightY],
          [lightX + 280, 60 + layer * 5],
          [lightX + 280, 220 - layer * 3],
        ],
        alpha(p.warm, a * 0.025)
      );
    }
    glow(ctx, lightX, lightY, 20, p.warm, 0.7);
  }
  if (slug === "god-rays") {
    for (let i = 0; i < 7; i++) {
      const x = 60 + i * 57 + Math.sin(t * 0.4) * 14;
      polygon(
        ctx,
        [
          [x, 20],
          [x + 14, 20],
          [x + 140, 248],
          [x + 88, 248],
        ],
        alpha(p.warm, a * 0.055)
      );
    }
    for (let trunk = 0; trunk < 6; trunk++) {
      box(ctx, 15 + trunk * 93, 0, 15, 248, p.surface, 0);
      circle(ctx, 25 + trunk * 90, 0, 55, p.surface);
    }
  }
  if (slug === "aerial-perspective") {
    box(ctx, 0, 60, 480, 117, alpha(p.secondary, a * 0.35), 0);
  }
  for (let i = 0; i < 3; i++) {
    character(
      ctx,
      130 + i * 100,
      240 - i * 35,
      alpha(p.ink, 1 - a * i * 0.25),
      t,
      1 - i * 0.18
    );
  }
}

export function drawPost(scene: Scene) {
  const { ctx, palette: p, time: t, amount: a, slug } = scene;
  landscape(scene, t * 0.1);
  const x = 65 + fract(t / 4) * 350;
  if (slug === "bloom" || slug === "tone-mapping") {
    line(
      ctx,
      [
        [40, 192],
        [x, 95],
      ],
      p.accent,
      4
    );
    glow(ctx, x, 95, 10 + a * 74, p.accent, 0.9);
    if (slug === "tone-mapping") {
      for (let i = 8; i > 0; i--) {
        circle(
          ctx,
          270,
          145,
          i * 8,
          alpha(i > 4 ? p.warm : p.ink, mix(1, 1 / (1 + i * 0.16), a))
        );
      }
    }
  } else {
    if (slug === "motion-blur") {
      for (let i = 10; i > 0; i--) {
        character(
          ctx,
          x - i * a * 5,
          215,
          alpha(p.accent, (1 - i / 11) * 0.13 * a),
          t * 10
        );
      }
    }
    if (slug === "chromatic-aberration") {
      character(ctx, x - a * 11 * Math.sin(t * 4), 215, p.warm, t * 10);
      character(ctx, x + a * 11 * Math.sin(t * 4), 215, p.secondary, t * 10);
    }
    if (slug === "depth-of-field") {
      ctx.filter = `blur(${a * (1 + Math.sin(t)) * 4}px)`;
    }
    character(ctx, x, 215, p.accent, t * 10);
    ctx.filter = "none";
    for (let i = 0; i < 3; i++) {
      if (slug === "ssao") {
        glow(ctx, 130 + i * 110, 239, 34, p.background, a);
      }
      if (slug === "depth-of-field") {
        ctx.filter = `blur(${a * (1 - Math.sin(t)) * (i + 1) * 1.5}px)`;
      }
      box(ctx, 110 + i * 110, 161 - i * 22, 38, 78, p.secondary);
      ctx.filter = "none";
      if (slug === "depth") {
        line(
          ctx,
          [
            [110 + i * 110, 239 - i * 22],
            [110 + i * 110, 161 - i * 22],
            [148 + i * 110, 161 - i * 22],
            [148 + i * 110, 239 - i * 22],
          ],
          alpha(p.warm, a),
          3
        );
      }
    }
    if (slug === "screen-space-reflections") {
      ctx.save();
      ctx.translate(0, 494);
      ctx.scale(1, -0.5);
      ctx.globalAlpha = a * 0.35;
      character(ctx, x, 480, p.accent, t * 10);
      ctx.restore();
    }
    if (slug === "temporal-anti-aliasing") {
      const px = 220 + Math.sin(t) * 60;
      line(
        ctx,
        [
          [a > 0.5 ? px : Math.round(px / 6) * 6, 40],
          [px + 95, 200],
        ],
        p.ink,
        1.2
      );
    }
  }
  if (slug === "color-grading") {
    ctx.fillStyle = alpha(p.warm, a * (0.2 + 0.15 * Math.sin(t)));
    ctx.fillRect(0, 0, 480, 249);
  }
}
