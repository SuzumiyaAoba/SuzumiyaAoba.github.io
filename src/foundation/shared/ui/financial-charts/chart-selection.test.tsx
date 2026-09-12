// @vitest-environment jsdom

import { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LineChart } from "./LineChart";
import { StackedBarChart } from "./StackedBarChart";
import type { SheetData } from "./types";

const data: SheetData = {
  metadata: { title: "Test chart" },
  headers: ["Year", "A", "B", "Empty", "Missing"],
  series: [
    { year: "2020", values: { A: 10, Empty: null } },
    { year: "2021", values: { A: 20, B: 0, Empty: null } },
  ],
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function button(label: string) {
  const target = [...container.querySelectorAll("button")].find(
    (item) => item.textContent === label,
  );
  if (!target) throw new Error(`Button not found: ${label}`);
  return target;
}

async function click(label: string) {
  await act(async () => button(label).click());
}

describe.each([
  ["LineChart", LineChart],
  ["StackedBarChart", StackedBarChart],
] as const)("%s の凡例", (_name, Chart) => {
  async function render(chartData = data, grouped = false) {
    await act(async () =>
      root.render(
        <StrictMode>
          <Chart
            data={chartData}
            {...(grouped ? { groups: [{ name: "All", metrics: chartData.headers }] } : {})}
          />
        </StrictMode>,
      ),
    );
  }

  it("実数値がある項目だけを表示し、ゼロの値は有効なデータとして扱う", async () => {
    await render(data, true);
    expect([...container.querySelectorAll("button")].map((item) => item.textContent)).toEqual([
      "All",
      "A",
      "B",
    ]);
    expect(button("B").getAttribute("aria-pressed")).toBe("true");
  });

  it("全項目を解除した状態で再描画しても選択やグラフが復活しない", async () => {
    await render();
    await click("A");
    await click("B");
    await render({ ...data });
    expect(button("A").getAttribute("aria-pressed")).toBe("false");
    expect(button("B").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll("circle, rect")).toHaveLength(0);
    await click("A");
    expect(button("A").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll("circle, rect").length).toBeGreaterThan(0);
  });

  it("最後のグループも一括で非表示にし、再び表示できる", async () => {
    await render(data, true);
    await click("All");
    expect(button("A").getAttribute("aria-pressed")).toBe("false");
    expect(button("B").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll("circle, rect")).toHaveLength(0);
    await click("All");
    expect(button("A").getAttribute("aria-pressed")).toBe("true");
    expect(button("B").getAttribute("aria-pressed")).toBe("true");
  });

  it("データ更新時は非表示の選択を保ち、新しい項目を表示する", async () => {
    await render();
    await click("A");
    await render({ ...data, series: [] });
    expect(container.querySelectorAll("button, circle, rect")).toHaveLength(0);
    await render({
      ...data,
      headers: ["A", "C"],
      series: [{ year: "2022", values: { A: 30, C: 40 } }],
    });
    expect(button("A").getAttribute("aria-pressed")).toBe("false");
    expect(button("C").getAttribute("aria-pressed")).toBe("true");
    expect([...container.querySelectorAll("button")].map((item) => item.textContent)).toEqual([
      "A",
      "C",
    ]);
  });
});

it("折れ線の欠損値をゼロのデータ点として描画しない", async () => {
  await act(async () => root.render(<LineChart data={data} />));
  expect(container.querySelectorAll("circle")).toHaveLength(3);
});
