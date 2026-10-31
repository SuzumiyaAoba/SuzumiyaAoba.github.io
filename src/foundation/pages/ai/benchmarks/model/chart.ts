import type { BenchmarkResult } from "./schema";

export function createCostScale(costs: number[], logarithmic: boolean) {
  const useLog =
    logarithmic && costs.length > 0 && costs.every((cost) => cost > 0);
  if (useLog) {
    const minimum = Math.floor(Math.log10(Math.min(...costs)));
    const maximum = Math.max(
      minimum + 1,
      Math.ceil(Math.log10(Math.max(...costs)))
    );
    return {
      logarithmic: true,
      ticks: Array.from(
        { length: maximum - minimum + 1 },
        (_, index) => 10 ** (minimum + index)
      ),
      position: (cost: number) =>
        (Math.log10(cost) - minimum) / (maximum - minimum),
    };
  }
  const maximum = Math.max(1, ...costs) * 1.05;
  return {
    logarithmic: false,
    ticks: Array.from({ length: 5 }, (_, index) => (maximum * index) / 4),
    position: (cost: number) => cost / maximum,
  };
}

const labelRowHeight = 32;
const labelHalfHeight = labelRowHeight / 2;

type PositionedPoint = {
  result: BenchmarkResult;
  cost: number;
  x: number;
  y: number;
};

function placeLabels(
  points: PositionedPoint[],
  side: "left" | "right",
  top: number,
  height: number
) {
  let previousY = top - labelHalfHeight;
  const labels = points
    .toSorted(
      (a, b) => a.y - b.y || a.x - b.x || a.result.id.localeCompare(b.result.id)
    )
    .map((point) => {
      const labelY = Math.max(point.y, previousY + labelRowHeight);
      previousY = labelY;
      return { ...point, side, labelY };
    });
  let nextY = top + height + labelHalfHeight;
  for (const label of labels.toReversed()) {
    label.labelY = Math.min(label.labelY, nextY - labelRowHeight);
    nextY = label.labelY;
  }
  return labels;
}

/** 点を費用順で左右に分け、ラベル間に2行分の空間を確保する。 */
export function createCostChartLayout(
  points: { result: BenchmarkResult; cost: number }[],
  logarithmic: boolean
) {
  const sideCount = Math.ceil(points.length / 2);
  const plot = {
    left: 260,
    top: 36,
    width: 580,
    height: Math.max(360, sideCount * labelRowHeight),
  };
  const scale = createCostScale(
    points.map(({ cost }) => cost),
    logarithmic
  );
  const positions = points
    .map((point) => ({
      ...point,
      x: plot.left + plot.width * scale.position(point.cost),
      y: plot.top + plot.height * (1 - point.result.score / 100),
    }))
    .toSorted(
      (a, b) => a.x - b.x || a.y - b.y || a.result.id.localeCompare(b.result.id)
    );
  return {
    width: 1100,
    height: plot.top + plot.height + 72,
    plot,
    scale,
    points: [
      ...placeLabels(
        positions.slice(0, sideCount),
        "left",
        plot.top,
        plot.height
      ),
      ...placeLabels(
        positions.slice(sideCount),
        "right",
        plot.top,
        plot.height
      ),
    ],
  };
}
