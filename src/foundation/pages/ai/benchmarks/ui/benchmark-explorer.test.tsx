// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { benchmarkDataset } from "../model/test-fixtures";
import { BenchmarkExplorer } from "./benchmark-explorer";

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(<BenchmarkExplorer dataset={benchmarkDataset} />)
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

function element(selector: string) {
  const target = container.querySelector(selector);
  if (!target) {
    throw new Error(`Element not found: ${selector}`);
  }
  return target;
}

function control(id: string) {
  const target = element(`#${id}`);
  if (
    !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)
  ) {
    throw new Error(`Form control not found: ${id}`);
  }
  return target;
}

async function select(id: string, value: string) {
  await act(async () => {
    const target = control(id);
    target.value = value;
    target.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function search(value: string) {
  await act(async () => {
    const target = control("benchmark-search");
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set?.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function resultModels() {
  return [
    ...container.querySelectorAll(
      'section[aria-labelledby="benchmark-results"] tbody th a'
    ),
  ].map((link) => link.textContent);
}

describe("ベンチマークの操作", () => {
  it("検索と開発元を結果表・横断一覧に反映し、該当なしから絞り込みを解除できる", async () => {
    await search(" ALPHA ");
    expect(resultModels()).toStrictEqual(["Alpha ↗"]);
    expect(element("summary").textContent).toContain("1 モデル");
    await select("benchmark-provider", "Lab B");
    expect(element("output").textContent).toBe("0 / 3 件");
    expect(element("summary").textContent).toContain("0 モデル");
    expect(container.textContent).toContain(
      "条件に一致するモデルがありません。"
    );
    await act(async () =>
      element("button").dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      )
    );
    expect(control("benchmark-search").value).toBe("");
    expect(control("benchmark-provider").value).toBe("");
    expect(resultModels()).toStrictEqual(["Alpha ↗", "Beta ↗", "Gamma ↗"]);
    expect(element("summary").textContent).toContain("3 モデル");
  });

  it("評価を切り替えると費用軸を初期化し、検索・開発元・並び順を保つ", async () => {
    await select("benchmark-sort", "cost");
    await select("benchmark-provider", "Lab A");
    await search("Alpha");
    await select("benchmark-select", "knowledge");
    expect(element("#selected-benchmark").textContent).toBe("Knowledge");
    expect(control("benchmark-cost-metric").value).toBe("output");
    expect(
      element('#benchmark-cost-metric option[value="input"]')
    ).toHaveProperty("disabled", true);
    expect(control("benchmark-sort").value).toBe("cost");
    expect(control("benchmark-provider").value).toBe("Lab A");
    expect(control("benchmark-search").value).toBe("Alpha");
    expect(element("output").textContent).toBe("1 / 2 件");
    await select("benchmark-select", "coding");
    expect(control("benchmark-cost-metric").value).toBe("task");
  });

  it("選択した費用軸で並べ替え、0ドルを有効値・未公表を末尾として扱う", async () => {
    await select("benchmark-sort", "cost");
    expect(resultModels()).toStrictEqual(["Beta ↗", "Alpha ↗", "Gamma ↗"]);
    await select("benchmark-cost-metric", "output");
    expect(resultModels()).toStrictEqual(["Alpha ↗", "Beta ↗", "Gamma ↗"]);
    await search("Gamma");
    expect(resultModels()).toStrictEqual(["Gamma ↗"]);
    expect(container.querySelector("figure")).toBeNull();
    expect(container.textContent).toContain(
      "この条件で比較できる費用データはありません。"
    );
    expect(element("details tbody td").textContent).toContain("3位");
  });

  it("グラフをキーボードで選択でき、0ドルがある場合は対数目盛を線形に戻す", async () => {
    const beta = element('g[role="button"][aria-label^="Beta、"]');
    await act(async () => {
      beta.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
    });
    expect(beta.getAttribute("aria-pressed")).toBe("true");
    expect(element("figcaption").textContent).toContain("Beta");
    expect(container.querySelectorAll("[data-model-point]")).toHaveLength(2);
    await act(async () =>
      element('input[type="checkbox"]').dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      )
    );
    expect(container.textContent).toContain(
      "費用に0が含まれるため線形目盛で表示しています。"
    );
    await select("benchmark-cost-metric", "output");
    expect(container.textContent).not.toContain(
      "費用に0が含まれるため線形目盛で表示しています。"
    );
    expect(element("figcaption").textContent).toContain("Beta");
    await search("Alpha");
    expect(element("figcaption").textContent).toContain("Alpha");
    expect(element("figcaption").textContent).not.toContain("Beta");
  });
});
