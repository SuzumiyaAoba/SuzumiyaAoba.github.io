import { select } from "d3-selection";

type PatternShape = {
  tag: "line" | "circle" | "rect";
  paint: "stroke" | "fill";
  attributes: Record<string, string | number>;
};

const patternLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
): PatternShape => ({
  tag: "line",
  paint: "stroke",
  attributes: { x1, y1, x2, y2, "stroke-width": width },
});

const PATTERNS: PatternShape[][] = [
  [patternLine(0, 4, 8, 4, 2)],
  [patternLine(4, 0, 4, 8, 2)],
  [patternLine(0, 0, 8, 8, 2)],
  [patternLine(0, 8, 8, 0, 2)],
  [{ tag: "circle", paint: "fill", attributes: { cx: 4, cy: 4, r: 2 } }],
  [patternLine(0, 4, 8, 4, 1), patternLine(4, 0, 4, 8, 1)],
  [
    {
      tag: "rect",
      paint: "stroke",
      attributes: { width: 8, height: 8, fill: "none", "stroke-width": 1 },
    },
  ],
  [
    {
      tag: "rect",
      paint: "fill",
      attributes: { x: 0, y: 0, width: 8, height: 3 },
    },
  ],
  [
    {
      tag: "rect",
      paint: "fill",
      attributes: { x: 0, y: 0, width: 3, height: 8 },
    },
  ],
  [patternLine(0, 0, 8, 8, 1), patternLine(0, 8, 8, 0, 1)],
];

/** SVG ごとの名前空間で模様を登録し、データと凡例が共有する塗り参照を返す。 */
export function appendChartPatterns(
  svg: SVGSVGElement,
  colors: readonly string[],
  namespace: string
) {
  const defs = select(svg).append("defs");
  const patternId = (index: number) =>
    `${namespace}-pattern-${index % PATTERNS.length}`;

  for (const [index, shapes] of PATTERNS.entries()) {
    const pattern = defs
      .append("pattern")
      .attr("id", patternId(index))
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 8)
      .attr("height", 8);
    for (const shape of shapes) {
      const element = pattern
        .append(shape.tag)
        .attr(shape.paint, colors[index % colors.length] ?? "#000");
      for (const [name, value] of Object.entries(shape.attributes)) {
        element.attr(name, value);
      }
    }
  }

  return (index: number) => `url(#${patternId(index)})`;
}
