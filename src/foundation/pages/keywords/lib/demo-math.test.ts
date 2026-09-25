import { describe, expect, it } from "vite-plus/test";
import {
  arcParameter,
  bezier,
  distance,
  hermite,
  perlin,
  simplex,
  springResponse,
} from "./demo-math";
import type { Point } from "./demo-math";

const curve = (u: number) =>
  bezier(u, [
    [0, 0],
    [5, 140],
    [20, -90],
    [400, 0],
  ]);
const variance = (values: number[]) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return (
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  );
};

describe("interactive demo mathematics", () => {
  it("keeps Hermite endpoints and their requested tangent directions", () => {
    const start: Point = [10, 30];
    const end: Point = [400, 70];
    const tangentStart: Point = [80, -240];
    const tangentEnd: Point = [40, 170];
    expect(hermite(0, start, end, tangentStart, tangentEnd)).toStrictEqual(
      start
    );
    expect(hermite(1, start, end, tangentStart, tangentEnd)).toStrictEqual(end);
    const next = hermite(0.00001, start, end, tangentStart, tangentEnd);
    expect((next[0] - start[0]) / 0.00001).toBeCloseTo(tangentStart[0], 1);
    expect((next[1] - start[1]) / 0.00001).toBeCloseTo(tangentStart[1], 1);
  });

  it("reduces speed variation when traversing a curve by arc length", () => {
    const distances = (remap: (u: number) => number) =>
      Array.from({ length: 40 }, (_, i) =>
        distance(curve(remap(i / 40)), curve(remap((i + 1) / 40)))
      );
    const direct = distances((u) => u);
    const even = distances((u) => arcParameter(u, curve));
    expect(variance(even)).toBeLessThan(variance(direct) * 0.02);
    expect(arcParameter(0, curve)).toBe(0);
    expect(arcParameter(1, curve)).toBeCloseTo(1, 8);
  });

  it("keeps gradient noises continuous when crossing a lattice boundary", () => {
    for (const noise of [perlin, simplex]) {
      expect(
        Math.abs(noise(1 - 0.00001, 0.3) - noise(1 + 0.00001, 0.3))
      ).toBeLessThan(0.0002);
      expect(noise(-2.4, 9.1)).toBe(noise(-2.4, 9.1));
      expect(Number.isFinite(noise(-2.4, 9.1))).toBe(true);
    }
  });

  it("shows overshoot for an underdamped spring and monotonic settling at critical damping", () => {
    const critical = Array.from({ length: 80 }, (_, i) =>
      springResponse(i / 40, 1)
    );
    const spring = Array.from({ length: 80 }, (_, i) =>
      springResponse(i / 40, 0.2)
    );
    expect(critical[0]).toBe(0);
    expect(
      critical.every(
        (value, i) => value <= 1 && value >= (critical[i - 1] ?? 0)
      )
    ).toBe(true);
    expect(critical.at(-1)).toBeGreaterThan(0.999);
    expect(Math.max(...spring)).toBeGreaterThan(1.3);
  });
});
