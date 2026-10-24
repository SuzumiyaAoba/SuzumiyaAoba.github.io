// @vitest-environment jsdom

/* oxlint-disable eslint/no-await-in-loop -- 同じReact rootのDOM連続性を検証するため、各描画の完了を待って順番に更新する。 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vite-plus/test";
import {
  chooseGeneration,
  decodeFlow,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";
import { GenerationStory } from "./generation-story";
import { STORY_PHASES } from "./generation-story-timeline";
import type { StoryStage } from "./generation-story-timeline";

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

async function render(stage: StoryStage, progress: number) {
  await act(async () => {
    root?.render(
      <GenerationStory
        trace={trace}
        selection={selection}
        stage={stage}
        progress={progress}
      />
    );
  });
}

function element(selector: string): HTMLElement | SVGElement {
  const result = host.querySelector<HTMLElement | SVGElement>(selector);
  if (!result) {
    throw new Error(`計算図の要素が見つかりません: ${selector}`);
  }
  return result;
}

it("全phaseで12演算と14接続と同じpacketを残し、計算済みの結果も元のノードに保持する", async () => {
  await render("input", 0);
  const nodes = [...host.querySelectorAll<SVGElement>("[data-route-node]")];
  const edges = [...host.querySelectorAll<SVGElement>("[data-route-edge]")];
  const packet = element("[data-packet='primary']");
  const transforms = new Set<string | null>();
  const stored = new Map<
    string,
    { node: SVGElement; key: string; text: string | null }
  >();
  expect(nodes).toHaveLength(12);
  expect(edges).toHaveLength(14);
  expect(host.querySelectorAll("[data-edge-kind='main']")).toHaveLength(11);
  expect(host.querySelectorAll("[data-edge-kind='residual']")).toHaveLength(2);
  expect(host.querySelectorAll("[data-edge-kind='loop']")).toHaveLength(1);

  for (const phase of STORY_PHASES) {
    await render(phase.stage, 0.8);
    expect(host.querySelectorAll("[data-route-node]")).toHaveLength(12);
    expect(host.querySelectorAll("[data-route-edge]")).toHaveLength(14);
    for (const previous of stored.values()) {
      expect(previous.node.dataset["resultKey"]).toBe(previous.key);
      expect(
        previous.node.querySelector("[data-stored-result]")?.textContent ?? null
      ).toBe(previous.text);
    }
    for (const node of nodes) {
      const id = node.dataset["routeNode"];
      if (!id) {
        throw new Error("演算ノードにIDがありません。");
      }
      expect(element(`[data-route-node='${id}']`)).toBe(node);
      const key = node.dataset["resultKey"];
      const text =
        node.querySelector("[data-stored-result]")?.textContent ?? null;
      if (key) {
        stored.set(id, { node, key, text });
      }
    }
    for (const edge of edges) {
      expect(element(`[data-route-edge='${edge.dataset["routeEdge"]}']`)).toBe(
        edge
      );
    }
    expect(element("[data-packet='primary']")).toBe(packet);
    transforms.add(packet.getAttribute("transform"));
  }
  expect(transforms.size).toBe(11);
  expect(stored.size).toBe(12);
}, 15_000);

const transfers: readonly {
  stage: StoryStage;
  progress: number;
  source: string;
  target: StoryStage;
  targetProgress?: number;
  key: string;
}[] = [
  {
    stage: "input",
    progress: 0.8,
    source: "input",
    target: "embedding",
    key: "ids",
  },
  {
    stage: "embedding",
    progress: 0.8,
    source: "embedding",
    target: "attention",
    key: "h0",
  },
  {
    stage: "attention",
    progress: 0.8,
    source: "attention",
    target: "attention-add",
    key: "attention",
  },
  {
    stage: "attention-add",
    progress: 0.8,
    source: "attention-add",
    target: "mlp",
    key: "u",
  },
  { stage: "mlp", progress: 0.8, source: "mlp", target: "mlp-add", key: "mlp" },
  {
    stage: "mlp-add",
    progress: 0.8,
    source: "mlp-add",
    target: "output",
    key: "h-prime",
  },
  {
    stage: "output",
    progress: 0.35,
    source: "final-norm",
    target: "output",
    targetProgress: 0.6,
    key: "last-hidden",
  },
  {
    stage: "output",
    progress: 0.8,
    source: "output",
    target: "probabilities",
    key: "logits",
  },
  {
    stage: "probabilities",
    progress: 0.8,
    source: "probabilities",
    target: "selection",
    key: "probabilities",
  },
  {
    stage: "selection",
    progress: 0.8,
    source: "selection",
    target: "decode",
    key: "selected-id",
  },
  {
    stage: "decode",
    progress: 0.8,
    source: "decode",
    target: "return",
    key: "decoded",
  },
];

it.each(transfers)(
  "$sourceの出力$keyが移動して次段の入力になる",
  async (transfer) => {
    await render(transfer.stage, transfer.progress);
    const packet = element("[data-packet='primary']");
    const edgeTarget =
      transfer.target === "output" && transfer.source === "mlp-add"
        ? "final-norm"
        : transfer.target;
    expect(packet.dataset["packetEdge"]).toBe(
      `${transfer.source}-to-${edgeTarget}`
    );
    expect(packet.dataset["packetKey"]).toBe(transfer.key);
    expect(
      element(`[data-route-node='${transfer.source}']`).dataset["resultKey"]
    ).toBe(transfer.key);
    expect(element("[data-transfer-key]").dataset["transferKey"]).toBe(
      transfer.key
    );
    const transferSummary = element("[data-payload-readout]").textContent;

    await render(transfer.target, transfer.targetProgress ?? 0);
    const targetInput = element(
      "[data-connection-readout] [data-payload-readout]"
    );
    expect(targetInput.dataset["payloadReadout"]).toBe(transfer.key);
    expect(targetInput.textContent).toBe(transferSummary);
  }
);

it("2本の残差ではH⁰とUを保持し、それぞれの加算時にだけ合流する", async () => {
  await render("embedding", 0.8);
  const h0 = element("[data-residual-packet='h0']");
  const u = element("[data-residual-packet='u']");
  expect(h0.dataset["residualVisible"]).toBe("true");
  expect(u.dataset["residualVisible"]).toBe("false");

  await render("attention-add", 0.2);
  expect(element("[data-residual-packet='h0']")).toBe(h0);
  expect(h0.dataset["residualVisible"]).toBe("true");
  expect(element("[data-current-computation]").textContent).toContain(
    "迂回したH⁰をここで加える"
  );
  await render("attention-add", 0.8);
  expect(h0.dataset["residualVisible"]).toBe("false");
  expect(u.dataset["residualVisible"]).toBe("true");
  expect(
    element("[data-route-node='attention-add']").dataset["resultKey"]
  ).toBe("u");

  await render("mlp-add", 0.2);
  expect(element("[data-residual-packet='u']")).toBe(u);
  expect(u.dataset["residualVisible"]).toBe("true");
  expect(element("[data-current-computation]").textContent).toContain(
    "迂回したUをここで加える"
  );
  await render("mlp-add", 0.8);
  expect(u.dataset["residualVisible"]).toBe("false");
  expect(element("[data-route-node='mlp-add']").dataset["resultKey"]).toBe(
    "h-prime"
  );
});

it("選んだIDを含む次のID列が入力へ戻り、文字列表示と再計算前の状態を区別する", async () => {
  await render("return", 1);
  const nextIds = [...DEFAULT_FLOW_IDS, selection.id];
  expect(element("[data-packet='primary']").dataset["packetKey"]).toBe(
    "next-ids"
  );
  expect(element("[data-packet='primary']").dataset["packetEdge"]).toBe(
    "return-to-input"
  );
  const input = element("[data-route-node='input']");
  expect(input.dataset["resultKey"]).toBe("next-ids");
  expect(input.textContent).toContain(`[${nextIds.join(", ")}]`);
  expect(input.textContent).toContain("次の予測の入力");
  expect(element("[data-decoded-output]").textContent).toContain(
    `${decodeFlow(DEFAULT_FLOW_IDS)}${selection.piece}`
  );
  expect(element("[data-decoded-output]").textContent).toContain(
    `次の入力に追加する値：ID ${selection.id}`
  );
  expect(element("[data-next-input-ready]").textContent).toContain(
    "長くなった入力での再計算はまだ行っていない"
  );
  expect(element("[data-route-node='embedding']").dataset["resultKey"]).toBe(
    "h0"
  );
});
