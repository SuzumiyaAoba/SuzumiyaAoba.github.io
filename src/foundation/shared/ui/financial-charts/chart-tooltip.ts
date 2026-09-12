import { select } from "d3-selection";

/** 一つの描画処理が所有するツールチップ。hide は effect の後片付けにも使う。 */
export function createChartTooltip() {
  let element: HTMLDivElement | null = null;

  const hide = () => {
    element?.remove();
    element = null;
  };

  const show = (event: MouseEvent, title: string, detail: string) => {
    hide();
    const tooltip = select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "var(--card)")
      .style("color", "var(--foreground)")
      .style("border", "1px solid var(--border)")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`);

    tooltip.append("strong").text(title);
    tooltip.append("br");
    element = tooltip.node();
    element?.append(document.createTextNode(detail));
  };

  return { show, hide };
}
