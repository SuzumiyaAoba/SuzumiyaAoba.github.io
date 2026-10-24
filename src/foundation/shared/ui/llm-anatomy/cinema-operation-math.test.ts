import { expect, it } from "vite-plus/test";
import { cinemaTermState } from "./cinema-operation-math";

it("到着前の積を部分和へ加えず、同時に飛ぶ項は最大2個に保つ", () => {
  const terms = [0.3, -0.8, 1.2, 0.5].map((product) => ({ product }));
  for (let step = 0; step <= 100; step += 1) {
    const frame = cinemaTermState(terms, step / 100);
    expect(
      frame.items.filter((item) => item.moving).length
    ).toBeLessThanOrEqual(2);
    expect(frame.partialSum).toBe(
      terms
        .slice(0, frame.receivedCount)
        .reduce((sum, term) => sum + term.product, 0)
    );
  }
  expect(cinemaTermState(terms, 0).partialSum).toBe(0);
  expect(cinemaTermState(terms, 1).partialSum).toBe(1.2);
});

it("16項でも項を飛ばさず、到着順に実際の積を積算する", () => {
  const terms = Array.from({ length: 16 }, (_, index) => ({
    product: (index - 5) / 7,
  }));
  let previousCount = 0;
  for (let step = 0; step <= 1000; step += 1) {
    const frame = cinemaTermState(terms, step / 1000);
    expect(frame.receivedCount - previousCount).toBeLessThanOrEqual(1);
    expect(frame.receivedCount).toBeGreaterThanOrEqual(previousCount);
    previousCount = frame.receivedCount;
  }
  expect(cinemaTermState(terms, 1).complete).toBe(true);
  expect(previousCount).toBe(16);
});
