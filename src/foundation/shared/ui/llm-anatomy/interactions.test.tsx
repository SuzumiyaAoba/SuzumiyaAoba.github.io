// @vitest-environment jsdom

import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { act } from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { LlmBlockDemo } from "./architecture-demo";
import { LlmAttentionDemo } from "./attention-demo";
import { LlmEmbeddingDemo, LlmMlpDemo } from "./representation-demos";
import { evaluateMlp } from "./representation-math";
import { LlmSamplingDemo } from "./sampling-demo";
import { LlmTrainingDemo } from "./training-demo";
import { LlmArchitecture3D } from "./structure-demo";

const WHITESPACE = /\s+/gu;
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

function mount(element: ReactElement) {
  act(() => root.render(element));
}

function clickButton(text: string) {
  const button = [...host.querySelectorAll("button")].find((candidate) =>
    candidate.textContent?.includes(text)
  );
  if (!button) {
    throw new Error(`操作ボタンが見つからない: ${text}`);
  }
  act(() => button.click());
  return button;
}

function selectValue(value: string) {
  const select = host.querySelector("select");
  if (!select) {
    throw new Error("選択欄が見つからない");
  }
  act(() => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function setRange(value: string) {
  const input = host.querySelector('input[type="range"]');
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  );
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("範囲入力が見つからない");
  }
  act(() => {
    if (!descriptor?.set) {
      throw new Error("範囲入力の値を設定できない");
    }
    descriptor.set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function outputText() {
  return (
    host.querySelector("output")?.textContent?.replace(WHITESPACE, " ") ?? ""
  );
}

it("3D図を1ブロックへ展開し、残差接続とMLPの次元変換を確認できる", () => {
  mount(<LlmArchitecture3D />);
  expect(host.textContent).toContain("96ブロック");
  expect(host.querySelectorAll('[data-residual="true"]')).toHaveLength(0);
  clickButton("1ブロックを展開");
  expect(host.querySelectorAll('[data-residual="true"]')).toHaveLength(2);
  selectValue("mlp");
  expect(outputText()).toContain("49,152");
  expect(outputText()).toContain("12,288");
  clickButton("モデル全体");
  expect(host.querySelector('option[value="blocks-2-95"]')).not.toBeNull();
});

it("3D図の回転と視点のリセットが投影へ反映される", () => {
  mount(<LlmArchitecture3D />);
  const initial = host.querySelector("polygon")?.getAttribute("points");
  expect(initial).toBeTruthy();
  setRange("20");
  expect(host.querySelector("polygon")?.getAttribute("points")).not.toBe(
    initial
  );
  clickButton("視点を戻す");
  expect(host.querySelector("polygon")?.getAttribute("points")).toBe(initial);
});

it("同じトークンの位置を変えると、埋め込み行を共有したまま加算結果が変わる", () => {
  mount(<LlmEmbeddingDemo />);
  expect(outputText()).toContain("位置3");
  const before = host.querySelectorAll("table")[1]?.textContent;
  clickButton("6：ノートを");
  expect(outputText()).toContain("位置6");
  expect(outputText()).toContain("ID 2");
  expect(host.querySelectorAll("table")[1]?.textContent).not.toBe(before);
  const selectedRow = host.querySelector("tr.bg-accent");
  expect(selectedRow?.textContent).toContain("2：ノートを");
});

it("ブロックの経路を変えると、その経路の形状と残差加算を表示する", () => {
  mount(<LlmBlockDemo />);
  expect(host.querySelector("table")?.textContent).toContain("denseの場合");
  clickButton("MLPの経路");
  expect(host.querySelector("table")?.textContent).toContain("GELU");
  expect(host.querySelector("table")?.textContent).not.toContain("denseの場合");
  expect(host.textContent).toContain("h′ = u + MLP(LN₂(u))");
});

it("最初の位置のAttentionは自分のVと一致し、マスク解除で未来のVも寄与する", () => {
  mount(<LlmAttentionDemo />);
  selectValue("0");
  expect(outputText()).toContain("(1.000, 0.200)");
  clickButton("因果マスク：有効");
  expect(outputText()).not.toContain("(1.000, 0.200)");
  expect(host.textContent).toContain("全位置を参照する");
});

it("MLPの入力とGELUを変更すると、表示する出力と計算式が一致する", () => {
  mount(<LlmMlpDemo />);
  setRange("1.5");
  clickButton("GELUを省いて比較する");
  const expected = evaluateMlp([1.5, -0.4], false).output.map(
    (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`
  );
  expect(outputText()).toContain(`GELU省略の出力 m = [${expected.join(", ")}]`);
  expect(host.textContent).toContain("z = W₁a + b₁");
});

it("乱数を固定したまま温度を変えると、変化した累積区間の候補を選ぶ", () => {
  mount(<LlmSamplingDemo />);
  expect(outputText()).toContain("読む");
  setRange("0.5");
  expect(outputText()).toContain("返す");
  setRange("2");
  expect(outputText()).toContain("買う");
});

it("重みの更新を実行すると履歴が増え、正解変更で初期状態に戻る", () => {
  mount(<LlmTrainingDemo />);
  expect(outputText()).toContain("実行済み 0 / 20");
  clickButton("1ステップ更新する");
  expect(outputText()).toContain("実行済み 1 / 20");
  const points = host
    .querySelector("polyline")
    ?.getAttribute("points")
    ?.split(" ");
  expect(points).toHaveLength(2);
  selectValue("2");
  expect(outputText()).toContain("実行済み 0 / 20");
  expect(outputText()).toContain("買う");
  const resetPoints = host
    .querySelector("polyline")
    ?.getAttribute("points")
    ?.split(" ");
  expect(resetPoints).toHaveLength(1);
});
