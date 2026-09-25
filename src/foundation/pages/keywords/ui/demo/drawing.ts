import { clamp, mix, random, TAU } from "../../lib/demo-math";
import type { Point } from "../../lib/demo-math";

export type Palette = {
  background: string;
  surface: string;
  grid: string;
  muted: string;
  ink: string;
  accent: string;
  secondary: string;
  warm: string;
};
export type Scene = {
  ctx: CanvasRenderingContext2D;
  palette: Palette;
  time: number;
  amount: number;
  slug: string;
};
export type Renderer = (scene: Scene) => void;
export const WIDTH = 480;
export const HEIGHT = 300;

export const alpha = (color: string, opacity: number) =>
  `${color}${Math.round(clamp(opacity) * 255)
    .toString(16)
    .padStart(2, "0")}`;

export function line(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string,
  width = 2,
  close = false
) {
  ctx.beginPath();
  for (const [index, point] of points.entries()) {
    if (index === 0) {
      ctx.moveTo(...point);
    } else {
      ctx.lineTo(...point);
    }
  }
  if (close) {
    ctx.closePath();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function polygon(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  color: string
) {
  ctx.beginPath();
  for (const [index, point] of points.entries()) {
    if (index === 0) {
      ctx.moveTo(...point);
    } else {
      ctx.lineTo(...point);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string | CanvasGradient
) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, radius), 0, TAU);
  ctx.fillStyle = color;
  ctx.fill();
}

export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity = 1
) {
  const gradient = ctx.createRadialGradient(
    x,
    y,
    0,
    x,
    y,
    Math.max(0.1, radius)
  );
  gradient.addColorStop(0, alpha(color, opacity));
  gradient.addColorStop(0.3, alpha(color, opacity * 0.35));
  gradient.addColorStop(1, alpha(color, 0));
  circle(ctx, x, y, radius, gradient);
}

export function text(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  color: string,
  size = 12
) {
  ctx.fillStyle = color;
  ctx.font = `${size}px ui-monospace, system-ui, sans-serif`;
  ctx.fillText(label, x, y);
}

export function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  radius = 4
) {
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), radius);
  ctx.fillStyle = color;
  ctx.fill();
}

export function arrow(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  width = 2
) {
  line(ctx, [start, end], color, width);
  const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
  polygon(
    ctx,
    [
      end,
      [end[0] - 7 * Math.cos(angle - 0.5), end[1] - 7 * Math.sin(angle - 0.5)],
      [end[0] - 7 * Math.cos(angle + 0.5), end[1] - 7 * Math.sin(angle + 0.5)],
    ],
    color
  );
}

export function background({ ctx, palette: p }: Scene, floor = true) {
  ctx.fillStyle = p.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  for (let x = 0; x < WIDTH; x += 30) {
    line(
      ctx,
      [
        [x, 0],
        [x, HEIGHT],
      ],
      alpha(p.grid, 0.35),
      0.5
    );
  }
  for (let y = 0; y < HEIGHT; y += 30) {
    line(
      ctx,
      [
        [0, y],
        [WIDTH, y],
      ],
      alpha(p.grid, 0.35),
      0.5
    );
  }
  if (floor) {
    ctx.fillStyle = p.surface;
    ctx.fillRect(0, 249, WIDTH, 51);
    line(
      ctx,
      [
        [0, 249],
        [WIDTH, 249],
      ],
      p.grid
    );
    for (let x = -120; x < WIDTH + 120; x += 60) {
      line(
        ctx,
        [
          [240 + (x - 240) * 0.8, 249],
          [x, 300],
        ],
        p.grid,
        1
      );
    }
  }
}

export function character(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  phase = 0,
  scale = 1
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  circle(ctx, 0, -31, 8, color);
  line(
    ctx,
    [
      [0, -21],
      [0, -5],
    ],
    color,
    9
  );
  const stride = Math.sin(phase) * 10;
  line(
    ctx,
    [
      [-stride, 10],
      [0, -5],
      [stride, 10],
    ],
    color,
    5
  );
  line(
    ctx,
    [
      [-12, -12 + stride * 0.5],
      [0, -19],
      [12, -12 - stride * 0.5],
    ],
    color,
    4
  );
  ctx.restore();
}

export function tree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  sway = 0
) {
  line(
    ctx,
    [
      [x, y],
      [x + sway * 0.4, y - scale * 23],
    ],
    color,
    3 * scale
  );
  polygon(
    ctx,
    [
      [x - scale * 13, y - scale * 9],
      [x + sway, y - scale * 44],
      [x + scale * 13, y - scale * 9],
    ],
    color
  );
  polygon(
    ctx,
    [
      [x - scale * 10 + sway * 0.5, y - scale * 23],
      [x + sway, y - scale * 53],
      [x + scale * 10 + sway * 0.5, y - scale * 23],
    ],
    color
  );
}

export function landscape(scene: Scene, offset = 0) {
  const { ctx, palette: p } = scene;
  for (let layer = 0; layer < 3; layer++) {
    const points: Point[] = [[0, 250]];
    for (let x = 0; x <= WIDTH; x += 6) {
      points.push([
        x,
        110 +
          layer * 48 -
          Math.sin(x * 0.013 + layer * 3 + offset) * (45 - layer * 8) -
          Math.sin(x * 0.038 + layer) * 12,
      ]);
    }
    points.push([WIDTH, 250]);
    polygon(ctx, points, alpha(p.secondary, 0.1 + layer * 0.11));
  }
}

export function spark(scene: Scene, x: number, y: number, radius = 3) {
  glow(scene.ctx, x, y, radius * 5, scene.palette.accent, 0.55);
  circle(scene.ctx, x, y, radius, scene.palette.ink);
}

type RGB = readonly [number, number, number];
export const rgb = (hex: string): RGB => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];
export const mixRgb = (a: RGB, b: RGB, t: number): RGB => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
];
const rasters = new WeakMap<
  CanvasRenderingContext2D,
  {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    pixels: ImageData;
  }
>();

/** A small texture is enlarged smoothly; shader-like fields stay inexpensive. */
export function raster(
  scene: Scene,
  sample: (x: number, y: number) => RGB,
  x = 0,
  y = 0,
  w = WIDTH,
  h = HEIGHT
) {
  let buffer = rasters.get(scene.ctx);
  if (!buffer) {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 75;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    buffer = { canvas, ctx, pixels: ctx.createImageData(120, 75) };
    rasters.set(scene.ctx, buffer);
  }
  for (let row = 0; row < 75; row++) {
    for (let column = 0; column < 120; column++) {
      const [red, green, blue] = sample(column / 120, row / 75);
      const index = (row * 120 + column) * 4;
      buffer.pixels.data[index] = red;
      buffer.pixels.data[index + 1] = green;
      buffer.pixels.data[index + 2] = blue;
      buffer.pixels.data[index + 3] = 255;
    }
  }
  buffer.ctx.putImageData(buffer.pixels, 0, 0);
  scene.ctx.drawImage(buffer.canvas, x, y, w, h);
}

export function stars(scene: Scene) {
  for (let i = 0; i < 35; i++) {
    circle(
      scene.ctx,
      random(i * 2) * WIDTH,
      random(i * 2 + 1) * 180,
      0.8,
      alpha(scene.palette.ink, 0.4)
    );
  }
}
