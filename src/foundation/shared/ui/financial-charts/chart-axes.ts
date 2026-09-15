import { axisBottom, axisLeft } from "d3-axis";
import type { Axis, AxisDomain, AxisScale } from "d3-axis";
import type { Selection } from "d3-selection";

/** 各チャートのスケールを使い、年ラベル・目盛り・グリッドの表示を揃える。 */
export function appendChartAxes<Domain extends string | number>(
  group: Selection<SVGGElement, unknown, null, undefined>,
  {
    x,
    y,
    width,
    height,
    yAxisLabel = "%",
    xTickValues,
  }: {
    x: AxisScale<Domain>;
    y: AxisScale<number>;
    width: number;
    height: number;
    yAxisLabel?: string;
    xTickValues?: Domain[];
  }
) {
  function appendGrid<T extends AxisDomain>(
    axis: Axis<T>,
    transform: string | null
  ) {
    group
      .append("g")
      .attr("class", "grid")
      .attr("transform", transform)
      .call(axis.tickFormat(() => ""))
      .call((grid) => {
        grid.select(".domain").remove();
      })
      .call((grid) => {
        grid
          .selectAll(".tick line")
          .attr("stroke", "currentColor")
          .attr("stroke-opacity", 0.1);
      });
  }

  function createXAxis() {
    const axis = axisBottom(x);
    return xTickValues ? axis.tickValues(xTickValues) : axis;
  }

  appendGrid(createXAxis().tickSize(-height), `translate(0,${height})`);
  group
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(createXAxis().tickFormat((value) => `${value}年`))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  appendGrid(axisLeft(y).tickSize(-width), null);
  group
    .append("g")
    .call(axisLeft(y).tickFormat((value) => `${value}${yAxisLabel}`));
}
