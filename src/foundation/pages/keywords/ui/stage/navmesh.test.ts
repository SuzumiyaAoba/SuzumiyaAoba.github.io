import { describe, expect, it } from "vitest";
import { funnel } from "./navmesh";

describe("funnel", () => {
  it("records the current boundaries as each portal tightens the funnel", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 3, y: 0 };
    const firstPortal = { left: { x: 1, y: 1 }, right: { x: 1, y: -1 } };
    const secondPortal = { left: { x: 2, y: 1 }, right: { x: 2, y: -1 } };
    const { path, steps } = funnel([
      { left: start, right: start },
      firstPortal,
      secondPortal,
      { left: end, right: end },
    ]);

    expect(path).toStrictEqual([start, end]);
    expect(steps[0]).toStrictEqual({
      apex: start,
      ...firstPortal,
      portal: 1,
      path: [start],
    });
    expect(steps[1]).toStrictEqual({
      apex: start,
      ...secondPortal,
      portal: 2,
      path: [start],
    });
    expect(steps.at(-1)).toStrictEqual({
      apex: end,
      left: end,
      right: end,
      portal: 3,
      path: [start, end],
    });
  });

  it("returns no path or steps when there are no portals", () => {
    expect(funnel([])).toStrictEqual({ path: [], steps: [] });
  });
});
