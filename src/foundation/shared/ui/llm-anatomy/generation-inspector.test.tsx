// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { GenerationInspector } from "./generation-inspector";

const WHITESPACE = /\s+/gu;
let host: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function mount() {
  act(() => root?.render(<GenerationInspector />));
}

function normalizedText(element: Element | null): string {
  return element?.textContent?.replace(WHITESPACE, " ").trim() ?? "";
}

function buttonWithText(text: string): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find(
    (candidate) => normalizedText(candidate) === text
  );
  if (!button) {
    throw new Error(`操作ボタンが見つからない: ${text}`);
  }
  return button;
}

function clickButton(text: string) {
  act(() => buttonWithText(text).click());
}

function tableWithCaption(text: string): HTMLTableElement {
  const table = [...host.querySelectorAll("table")].find((candidate) =>
    normalizedText(candidate.caption).includes(text)
  );
  if (!table) {
    throw new Error(`計算表が見つからない: ${text}`);
  }
  return table;
}

function setRange(labelPrefix: string, value: string) {
  const label = [...host.querySelectorAll("label")].find((candidate) =>
    normalizedText(candidate).startsWith(labelPrefix)
  );
  const input = label?.querySelector("input");
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`範囲入力が見つからない: ${labelPrefix}`);
  }
  act(() => {
    if (!descriptor?.set) {
      throw new Error("範囲入力の値を設定できない");
    }
    descriptor.set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("Attentionで先頭位置を選ぶと未来の重みが0になり、ヘッド切替が計算表へ反映される", () => {
  mount();
  clickButton("3 Attention");
  clickButton("1：私 · ID 0");
  const table = tableWithCaption("選んだ位置から各位置へのAttention");
  const rows = [...table.querySelectorAll("tbody tr")];
  expect(normalizedText(rows[0]?.querySelectorAll("td")[2] ?? null)).toBe(
    "1.000"
  );
  for (const row of rows.slice(1)) {
    expect(normalizedText(row)).toContain("（未来）");
    expect(normalizedText(row.querySelectorAll("td")[1] ?? null)).toContain(
      "−∞"
    );
    expect(normalizedText(row.querySelectorAll("td")[2] ?? null)).toBe("0.000");
    expect(normalizedText(row.querySelectorAll("td")[4] ?? null)).toBe(
      "[0.000, 0.000]"
    );
  }
  const firstHead = normalizedText(table);
  clickButton("Head 2");
  expect(buttonWithText("Head 2").getAttribute("aria-pressed")).toBe("true");
  expect(normalizedText(table)).not.toBe(firstHead);
  expect(host.textContent).toContain("head 2");
});

it("入力を猫から犬へ変えると、同じ経路で計算する語彙logitと確率が変わる", () => {
  mount();
  clickButton("7 語彙のスコア");
  const catLogits = normalizedText(tableWithCaption("各語彙IDのlogit"));
  clickButton("8 確率");
  const catProbabilities = normalizedText(tableWithCaption("各語彙IDのlogit"));

  clickButton("「私は犬」から始める");
  expect(normalizedText(host.querySelector("[data-flow-input]"))).toContain(
    "[0, 1, 3] → 私は犬"
  );
  expect(buttonWithText("1 入力ID").getAttribute("aria-current")).toBe("step");
  clickButton("7 語彙のスコア");
  expect(normalizedText(tableWithCaption("各語彙IDのlogit"))).not.toBe(
    catLogits
  );
  clickButton("8 確率");
  expect(normalizedText(tableWithCaption("各語彙IDのlogit"))).not.toBe(
    catProbabilities
  );
});

it("温度を変えるとlogitを保ったまま語彙の確率分布が変わる", () => {
  mount();
  clickButton("8 確率");
  const table = tableWithCaption("各語彙IDのlogit");
  const beforeRows = [
    ...table.querySelectorAll<HTMLTableRowElement>("tbody tr"),
  ];
  const logits = beforeRows.map((row) => normalizedText(row.cells[1] ?? null));
  const probabilities = beforeRows.map((row) =>
    normalizedText(row.cells[3] ?? null)
  );
  setRange("温度 T", "0.2");
  const afterRows = [
    ...table.querySelectorAll<HTMLTableRowElement>("tbody tr"),
  ];
  expect(
    afterRows.map((row) => normalizedText(row.cells[1] ?? null))
  ).toStrictEqual(logits);
  expect(
    afterRows.map((row) => normalizedText(row.cells[3] ?? null))
  ).not.toStrictEqual(probabilities);
  expect(host.textContent).toContain("温度 T：0.2");
});

it("終了IDを抽選すると復元文字列を増やさず、次のIDの追加を止める", () => {
  mount();
  clickButton("10 文字列へ復元");
  setRange("抽選値 r", "0.999");
  expect(normalizedText(host.querySelector("[data-flow-result]"))).toContain(
    "選択ID 7 → 〈終了〉：ここで生成を止める"
  );
  expect(normalizedText(host.querySelector("output"))).toBe("私は猫");
  expect(buttonWithText("選んだIDを追加して次へ").disabled).toBe(true);
  expect(host.textContent).toContain("終了IDは文字列へ追加しない");
});

it("確定したIDから文字片を復元し、同じIDを入力列へ追加して次の計算へ進む", () => {
  mount();
  clickButton("10 文字列へ復元");
  setRange("抽選値 r", "0");
  expect(normalizedText(host.querySelector("[data-flow-result]"))).toBe(
    "選択ID 0 → 私 → 私は猫私"
  );
  expect(normalizedText(host.querySelector("output"))).toBe("私は猫私");
  expect(buttonWithText("選んだIDを追加して次へ").disabled).toBe(false);
  clickButton("選んだIDを追加して次へ");
  expect(normalizedText(host.querySelector("[data-flow-input]"))).toContain(
    "[0, 1, 2, 0] → 私は猫私"
  );
  expect(buttonWithText("1 入力ID").getAttribute("aria-current")).toBe("step");
  expect(buttonWithText("4：私 · ID 0").getAttribute("aria-pressed")).toBe(
    "true"
  );
});

it("再生は1段階ずつ進み、一時停止とアンマウントで予約した進行を解除する", () => {
  vi.useFakeTimers();
  mount();
  clickButton("順に再生する");
  act(() => {
    vi.advanceTimersByTime(2399);
  });
  expect(buttonWithText("1 入力ID").getAttribute("aria-current")).toBe("step");
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(buttonWithText("2 埋め込み").getAttribute("aria-current")).toBe(
    "step"
  );
  clickButton("一時停止");
  act(() => {
    vi.advanceTimersByTime(10_000);
  });
  expect(buttonWithText("2 埋め込み").getAttribute("aria-current")).toBe(
    "step"
  );
  expect(vi.getTimerCount()).toBe(0);
  clickButton("順に再生する");
  expect(vi.getTimerCount()).toBe(1);
  act(() => root?.unmount());
  root = undefined;
  expect(vi.getTimerCount()).toBe(0);
});
