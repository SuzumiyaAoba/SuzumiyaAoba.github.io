// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { CINEMA_DURATION, CINEMA_OPERATIONS } from "./cinema-timeline";
import { ContinuousFlow } from "./continuous-flow";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const selection = chooseGeneration(trace, 0.62);

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
  vi.unstubAllGlobals();
});

async function render(elapsed: number) {
  await act(async () => {
    root?.render(
      <ContinuousFlow trace={trace} selection={selection} elapsed={elapsed} />
    );
  });
}

function nodes(): SVGGElement[] {
  return [...host.querySelectorAll<SVGGElement>("[data-flow-node]")];
}

function camera(): number[] {
  const svg = host.querySelector("[data-flow-camera]");
  const viewBox = svg?.getAttribute("viewBox");
  if (!viewBox) {
    throw new Error("連続したワールドを表示するカメラがありません。");
  }
  return viewBox.split(" ").map(Number);
}

function calculation(id: string): number {
  const node = host.querySelector<SVGGElement>(`[data-flow-node="${id}"]`);
  return Number(node?.dataset["flowCalculation"]);
}

it("全25計算器を最初から最後まで同じ場所とDOMに残し、場面を差し替えない", async () => {
  await render(0);
  const initial = nodes();
  const firstCamera = camera();
  const connectionCount = host.querySelectorAll(
    "[data-flow-connection]"
  ).length;
  expect(initial).toHaveLength(25);
  expect(host.querySelector('[data-flow-node="qkv-value"]')).not.toBeNull();
  expect(host.querySelector('[data-flow-node="return"]')).not.toBeNull();
  expect(calculation("tokenize")).toBe(0);
  const transforms = initial.map((node) => node.getAttribute("transform"));

  await render(CINEMA_DURATION);
  const completed = nodes();
  expect(completed).toHaveLength(initial.length);
  for (const [index, node] of completed.entries()) {
    expect(node).toBe(initial[index]);
    expect(node.getAttribute("transform")).toBe(transforms[index]);
  }
  expect(host.querySelectorAll("[data-flow-connection]")).toHaveLength(
    connectionCount
  );
  expect(camera()).not.toStrictEqual(firstCamera);
  expect(calculation("tokenize")).toBe(1);
  expect(calculation("return")).toBe(1);
});

it.each(["qkv-key", "contract", "decode"])(
  "%sの開始境界を越えても同じ回路を保ち、描画したカメラの位置と倍率を連続させる",
  async (id) => {
    const operation = CINEMA_OPERATIONS.find(
      (candidate) => candidate.id === id
    );
    if (!operation) {
      throw new Error(`検証対象の演算${id}がありません。`);
    }
    await render(operation.start - 0.001);
    const initial = nodes();
    const before = camera();

    await render(operation.start + 0.001);
    const continued = nodes();
    const after = camera();
    expect(continued).toHaveLength(25);
    for (const [index, node] of continued.entries()) {
      expect(node).toBe(initial[index]);
    }
    expect(before).toHaveLength(4);
    for (const [index, coordinate] of after.entries()) {
      expect(Number.isFinite(coordinate)).toBe(true);
      expect(Math.abs(coordinate - (before[index] ?? Number.NaN))).toBeLessThan(
        0.05
      );
    }
  }
);
