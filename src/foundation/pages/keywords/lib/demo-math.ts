export type Point = readonly [number, number];
export const TAU = Math.PI * 2;
export const clamp = (n: number, low = 0, high = 1) =>
  Math.max(low, Math.min(high, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const fract = (n: number) => n - Math.floor(n);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const random = (seed: number) =>
  fract(Math.sin(seed * 127.1 + 311.7) * 43_758.5453);
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const u = smooth(fract(x));
  const v = smooth(fract(y));
  return mix(
    mix(random(ix + iy * 157), random(ix + 1 + iy * 157), u),
    mix(random(ix + (iy + 1) * 157), random(ix + 1 + (iy + 1) * 157), u),
    v
  );
}

const gradient = (x: number, y: number, dx: number, dy: number) => {
  const angle = random(x + y * 157) * TAU;
  return Math.cos(angle) * dx + Math.sin(angle) * dy;
};

export function perlin(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = fract(x);
  const dy = fract(y);
  return mix(
    mix(gradient(ix, iy, dx, dy), gradient(ix + 1, iy, dx - 1, dy), fade(dx)),
    mix(
      gradient(ix, iy + 1, dx, dy - 1),
      gradient(ix + 1, iy + 1, dx - 1, dy - 1),
      fade(dx)
    ),
    fade(dy)
  );
}

export function simplex(x: number, y: number): number {
  const skew = ((x + y) * (Math.sqrt(3) - 1)) / 2;
  const i = Math.floor(x + skew);
  const j = Math.floor(y + skew);
  const unskew = ((i + j) * (3 - Math.sqrt(3))) / 6;
  const dx = x - i + unskew;
  const dy = y - j + unskew;
  const i1 = dx > dy ? 1 : 0;
  const j1 = 1 - i1;
  const g = (3 - Math.sqrt(3)) / 6;
  let sum = 0;
  for (const [ox, oy, px, py] of [
    [0, 0, dx, dy],
    [i1, j1, dx - i1 + g, dy - j1 + g],
    [1, 1, dx - 1 + 2 * g, dy - 1 + 2 * g],
  ] as const) {
    const falloff = Math.max(0, 0.5 - px * px - py * py);
    sum += falloff ** 4 * gradient(i + ox, j + oy, px, py);
  }
  return 70 * sum;
}

export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amplitude = 0.5;
  let sampleX = x;
  let sampleY = y;
  for (let octave = 0; octave < octaves; octave++) {
    sum += amplitude * perlin(sampleX, sampleY);
    sampleX = sampleX * 2.03 + 13;
    sampleY = sampleY * 2.03 + 7;
    amplitude *= 0.5;
  }
  return sum;
}

export function bezier(
  t: number,
  points: readonly [Point, Point, Point, Point]
): Point {
  const [a, b, c, d] = points;
  const u = 1 - t;
  return [
    u ** 3 * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t ** 3 * d[0],
    u ** 3 * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t ** 3 * d[1],
  ];
}

export function hermite(
  t: number,
  start: Point,
  end: Point,
  tangentStart: Point,
  tangentEnd: Point
): Point {
  const a = 2 * t ** 3 - 3 * t * t + 1;
  const b = t ** 3 - 2 * t * t + t;
  const c = -2 * t ** 3 + 3 * t * t;
  const d = t ** 3 - t * t;
  return [
    a * start[0] + b * tangentStart[0] + c * end[0] + d * tangentEnd[0],
    a * start[1] + b * tangentStart[1] + c * end[1] + d * tangentEnd[1],
  ];
}

export function distance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** Invert a sampled cumulative distance table; the result is a curve parameter. */
export function arcParameter(
  progress: number,
  curve: (t: number) => Point
): number {
  const lengths = [0];
  let total = 0;
  let previous = curve(0);
  for (let i = 1; i <= 120; i++) {
    const point = curve(i / 120);
    total += distance(point, previous);
    lengths.push(total);
    previous = point;
  }
  const target = clamp(progress) * total;
  const index = lengths.findIndex((length) => length >= target);
  if (index <= 0) {
    return 0;
  }
  const lower = lengths[index - 1] ?? 0;
  const upper = lengths[index] ?? total;
  return (index - 1 + (target - lower) / Math.max(0.0001, upper - lower)) / 120;
}

export function springResponse(t: number, damping: number): number {
  const frequency = 8;
  if (damping >= 1) {
    return 1 - (1 + frequency * t) * Math.exp(-frequency * t);
  }
  const damped = frequency * Math.sqrt(1 - damping * damping);
  return (
    1 -
    Math.exp(-damping * frequency * t) *
      (Math.cos(damped * t) +
        ((damping * frequency) / damped) * Math.sin(damped * t))
  );
}

export function radicalInverse(index: number, base: number): number {
  let result = 0;
  let scale = 1 / base;
  let remaining = index;
  while (remaining > 0) {
    result += (remaining % base) * scale;
    remaining = Math.floor(remaining / base);
    scale /= base;
  }
  return result;
}

export function solveTwoBone(
  root: Point,
  target: Point,
  length: number
): Point {
  const direction = Math.atan2(target[1] - root[1], target[0] - root[0]);
  const bend = Math.acos(clamp(distance(root, target) / (2 * length), 0, 1));
  return [
    root[0] + Math.cos(direction - bend) * length,
    root[1] + Math.sin(direction - bend) * length,
  ];
}
