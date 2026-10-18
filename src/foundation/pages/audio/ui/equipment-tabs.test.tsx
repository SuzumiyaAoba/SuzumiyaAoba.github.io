// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import { audioEquipment } from "../model/equipment";
import type { AudioModel } from "../model/viewer";
import { AudioViewer } from "./audio-viewer";
import { EquipmentTabs } from "./equipment-tabs";

const { mounted, disposed } = vi.hoisted(() => ({
  mounted: vi.fn<(model: AudioModel) => void>(),
  disposed: vi.fn<(model: AudioModel) => void>(),
}));

vi.mock(import("./audio-viewer"), async () => {
  const { useEffect } = await import("react");
  return {
    AudioViewer({ model }) {
      useEffect(() => {
        mounted(model);
        return () => disposed(model);
      }, [model]);
      return <canvas data-model={model} aria-label={model} />;
    },
  };
});

let container: HTMLDivElement;
let root: Root | null;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/audio/");
  mounted.mockClear();
  disposed.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  container.remove();
  window.history.replaceState(null, "", "/audio/");
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => {
    root?.render(
      <>
        <AudioViewer
          model="system"
          locale="ja"
          manufacturer="Audio"
          name="接続全体"
          finish=""
          description=""
        />
        <EquipmentTabs locale="ja" />
      </>
    );
  });
}

function tab(name: string) {
  const element = [
    ...container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ].find((candidate) => candidate.textContent === name);
  if (!element) {
    throw new Error(`Product tab not found: ${name}`);
  }
  return element;
}

async function select(name: string) {
  await act(async () => tab(name).click());
}

function renderedModels() {
  return [...container.querySelectorAll("canvas")].map(
    (canvas) => canvas.dataset["model"]
  );
}

it("初回はシステム全体と最初の製品だけを描画する", async () => {
  await render();
  expect(renderedModels()).toStrictEqual(["system", "node-n130"]);
  expect(mounted.mock.calls.map(([model]) => model)).toStrictEqual([
    "system",
    "node-n130",
  ]);
  expect(container.querySelectorAll('[role="tab"]')).toHaveLength(
    audioEquipment.length
  );
  expect(tab("NODE (N130)").getAttribute("aria-selected")).toBe("true");
});

it.each([
  ["Cinnamon USB 2.0 A–B", "audioquest-cinnamon"],
  ["50Ω BNC Semi-Rigid", "cybershaft-bnc"],
] as const)(
  "%s を選んで初めて単体を描画し、前の製品を破棄する",
  async (name, model) => {
    await render();
    const surface = container.querySelector('[role="tabpanel"] canvas');
    await select(name);
    expect(renderedModels()).toStrictEqual(["system", model]);
    expect(disposed).toHaveBeenCalledWith("node-n130");
    expect(disposed).not.toHaveBeenCalledWith("system");
    expect(
      mounted.mock.calls.map(([mountedModel]) => mountedModel)
    ).toStrictEqual(["system", "node-n130", model]);
    expect(window.location.hash).toBe(`#${model}`);
    expect(container.querySelector('[role="tabpanel"] canvas')).toBe(surface);
    await select("NODE (N130)");
    expect(renderedModels()).toStrictEqual(["system", "node-n130"]);
    expect(disposed).toHaveBeenCalledWith(model);
  }
);

it("矢印キーでフォーカスを移動しても、選択するまでは描画しない", async () => {
  await render();
  const first = tab("NODE (N130)");
  await act(async () => {
    first.focus();
    first.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "End",
        bubbles: true,
        cancelable: true,
      })
    );
  });
  const last = container.querySelector<HTMLButtonElement>(
    '[role="tablist"] [role="tab"]:last-child'
  );
  expect(document.activeElement).toBe(last);
  expect(last?.tabIndex).toBe(0);
  expect(last?.getAttribute("aria-selected")).toBe("false");
  expect(mounted).toHaveBeenCalledTimes(2);
  await act(async () => {
    last?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
        cancelable: true,
      })
    );
  });
  expect(document.activeElement).toBe(first);
});

it("製品への直接リンクで、その製品のタブを開く", async () => {
  window.history.replaceState(null, "", "#sigma-pro");
  await render();
  expect(renderedModels()).toStrictEqual(["system", "sigma-pro"]);
  expect(tab("SIGMA Pro").getAttribute("aria-selected")).toBe("true");
});
