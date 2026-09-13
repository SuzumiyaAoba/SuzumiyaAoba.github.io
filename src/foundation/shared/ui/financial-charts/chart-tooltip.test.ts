// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vite-plus/test";
import { createChartTooltip } from "./chart-tooltip";

afterEach(() => {
  document.body.replaceChildren();
});

describe("chart tooltip ownership", () => {
  it("再表示で重複せず、後片付けは他のグラフのツールチップを消さない", () => {
    const first = createChartTooltip();
    const second = createChartTooltip();
    const event = new MouseEvent("mouseover", { clientX: 100, clientY: 50 });
    first.show(event, "First", "10%");
    second.show(event, "Second", "20%");
    first.show(event, "Updated", "30%");
    expect(document.querySelectorAll(".tooltip")).toHaveLength(2);
    expect(document.body.textContent).not.toContain("First");
    first.hide();
    expect(document.querySelectorAll(".tooltip")).toHaveLength(1);
    expect(document.body.textContent).toBe("Second20%");
    second.hide();
    second.hide();
    expect(document.querySelectorAll(".tooltip")).toHaveLength(0);
  });

  it("ラベルのHTML文字はマークアップとして扱わず、位置をマウスに合わせる", () => {
    const tooltip = createChartTooltip();
    tooltip.show(
      new MouseEvent("mouseover", { clientX: 100, clientY: 50 }),
      "<img src=x>",
      "<b>10%</b>",
    );
    expect(document.querySelector("img, b")).toBeNull();
    expect(document.body.textContent).toBe("<img src=x><b>10%</b>");
    const element = document.querySelector<HTMLElement>(".tooltip");
    expect(element?.style.left).toBe("110px");
    expect(element?.style.top).toBe("22px");
  });
});
