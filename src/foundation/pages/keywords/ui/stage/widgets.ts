import { Mesh, MeshBasicMaterial, SphereGeometry } from "three";
import type { ColorRepresentation } from "three";
import { marker } from "./kit";
import type { DemoContext } from "./types";

type GraphSeries = {
  fn: (t: number) => number;
  color: string;
  label?: string;
  dashed?: boolean;
};

const SVG = "http://www.w3.org/2000/svg";
const WIDTH = 200;
const HEIGHT = 112;
const PAD_LEFT = 14;
const PAD_BOTTOM = 12;

const svgElement = <K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: Record<string, string | number>
) => {
  const element = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
};

/**
 * HUD（右下）に置く小さなグラフ。横軸は t = 0〜1（xMax で変更可）。
 * setSeries で関数を差し替え、setMarker で現在位置の点を動かす。
 */
export function hudGraph(
  context: DemoContext,
  options: {
    title: string;
    min?: number;
    max?: number;
    xMax?: number;
    xLabel?: string;
    samples?: number;
  }
) {
  const min = options.min ?? 0;
  const max = options.max ?? 1;
  const xMax = options.xMax ?? 1;
  const samples = options.samples ?? 100;
  const plotWidth = WIDTH - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_BOTTOM;
  const sx = (t: number) => PAD_LEFT + (t / xMax) * plotWidth;
  const sy = (value: number) =>
    plotHeight - ((value - min) / (max - min)) * plotHeight;

  const container = document.createElement("figure");
  container.className = "keyword-stage-graph";
  const caption = document.createElement("figcaption");
  caption.textContent = options.title;
  const svg = svgElement("svg", { viewBox: `0 -6 ${WIDTH} ${HEIGHT + 8}` });
  const axis = { stroke: "#51607a", "stroke-width": 1 };
  svg.append(
    svgElement("line", {
      x1: PAD_LEFT,
      x2: WIDTH,
      y1: sy(0),
      y2: sy(0),
      ...axis,
    }),
    svgElement("line", {
      x1: PAD_LEFT,
      x2: PAD_LEFT,
      y1: sy(min),
      y2: sy(max),
      ...axis,
    })
  );
  if (min < 1 && max >= 1) {
    svg.append(
      svgElement("line", {
        x1: PAD_LEFT,
        x2: WIDTH,
        y1: sy(1),
        y2: sy(1),
        stroke: "#51607a",
        "stroke-width": 1,
        "stroke-dasharray": "3 3",
      })
    );
  }
  const text = (content: string, x: number, y: number, anchor = "end") => {
    const node = svgElement("text", {
      x,
      y,
      "text-anchor": anchor,
      fill: "#8f9eb3",
      "font-size": 9,
    });
    node.textContent = content;
    return node;
  };
  svg.append(text("0", PAD_LEFT - 3, sy(0) + 3));
  if (min < 1 && max >= 1) {
    svg.append(text("1", PAD_LEFT - 3, sy(1) + 3));
  }
  if (options.xLabel) {
    svg.append(text(options.xLabel, WIDTH, HEIGHT + 1));
  }
  const cursor = svgElement("line", {
    y1: sy(min),
    y2: sy(max),
    stroke: "#e8eef6",
    "stroke-opacity": 0.35,
    "stroke-dasharray": "2 3",
  });
  svg.append(cursor);
  const seriesGroup = svgElement("g", { fill: "none", "stroke-width": 2 });
  const dotGroup = svgElement("g", {});
  svg.append(seriesGroup, dotGroup);
  const legend = document.createElement("div");
  legend.className = "keyword-stage-graph-legend";
  container.append(caption, svg, legend);
  context.hud(container);

  let current: readonly GraphSeries[] = [];
  const dots: SVGCircleElement[] = [];

  const setSeries = (series: readonly GraphSeries[]) => {
    current = series;
    seriesGroup.replaceChildren();
    dotGroup.replaceChildren();
    legend.replaceChildren();
    dots.length = 0;
    for (const item of series) {
      let d = "";
      for (let sample = 0; sample <= samples; sample++) {
        const t = (sample / samples) * xMax;
        const value = Math.min(max + 0.5, Math.max(min - 0.5, item.fn(t)));
        d += `${sample === 0 ? "M" : "L"}${sx(t).toFixed(1)} ${sy(value).toFixed(1)}`;
      }
      seriesGroup.append(
        svgElement("path", {
          d,
          stroke: item.color,
          "stroke-linejoin": "round",
          ...(item.dashed ? { "stroke-dasharray": "4 3" } : {}),
        })
      );
      const dot = svgElement("circle", { r: 3.2, fill: item.color });
      dots.push(dot);
      dotGroup.append(dot);
      if (item.label) {
        const entry = document.createElement("span");
        entry.className = "keyword-stage-graph-key";
        entry.style.setProperty("--key-color", item.color);
        entry.textContent = item.label;
        legend.append(entry);
      }
    }
  };

  const setMarker = (t: number) => {
    const clamped = Math.min(xMax, Math.max(0, t));
    cursor.setAttribute("x1", sx(clamped).toFixed(1));
    cursor.setAttribute("x2", sx(clamped).toFixed(1));
    for (const [index, item] of current.entries()) {
      const dot = dots[index];
      if (dot) {
        const value = Math.min(max, Math.max(min, item.fn(clamped)));
        dot.setAttribute("cx", sx(clamped).toFixed(1));
        dot.setAttribute("cy", sy(value).toFixed(1));
      }
    }
  };

  const setVisible = (visible: boolean) => {
    container.hidden = !visible;
  };

  const setTitle = (title: string) => {
    caption.textContent = title;
  };

  return { setSeries, setMarker, setVisible, setTitle, element: container };
}

/** ドラッグできる制御点。見た目は光る球と、当たり判定用の少し大きい透明球。 */
export function handle(color: ColorRepresentation, radius = 0.11) {
  const visual = marker(color, radius);
  const hit = new Mesh(
    new SphereGeometry(radius * 2.4, 12, 8),
    new MeshBasicMaterial({ visible: false })
  );
  visual.add(hit);
  return visual;
}

/**
 * 時間とともに値を流していくグラフ。push(values) で各系列の最新値を足す。
 */
export function historyGraph(
  context: DemoContext,
  options: {
    title: string;
    min: number;
    max: number;
    length?: number;
    series: readonly { color: string; label?: string; dashed?: boolean }[];
  }
) {
  const length = options.length ?? 240;
  const graph = hudGraph(context, {
    title: options.title,
    min: options.min,
    max: options.max,
    samples: length - 1,
  });
  const buffers = options.series.map(() => Array.from({ length }, () => 0));
  let started = false;
  const valueAt = (buffer: readonly number[], t: number) =>
    buffer[Math.min(length - 1, Math.round(t * (length - 1)))] ?? 0;
  const push = (values: readonly number[]) => {
    for (const [index, buffer] of buffers.entries()) {
      const value = Math.min(
        options.max,
        Math.max(options.min, values[index] ?? 0)
      );
      // 最初の値で埋めておき、空の区間が 0 に張り付いて見えないようにする
      if (!started) {
        buffer.fill(value);
      }
      buffer.shift();
      buffer.push(value);
    }
    started = true;
    graph.setSeries(
      options.series.map((item, index) => ({
        ...item,
        fn: (t: number) => valueAt(buffers[index] ?? [], t),
      }))
    );
    graph.setMarker(1);
  };
  const clear = () => {
    started = false;
  };
  return {
    push,
    clear,
    setVisible: graph.setVisible,
    setTitle: graph.setTitle,
  };
}
