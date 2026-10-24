// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vite-plus/test";
import { GenerationComputation } from "./generation-computation";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";
import type { StoryStage } from "./generation-story-timeline";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const selection = chooseGeneration(trace, 0.62);

function render(stage: StoryStage, progress: number): HTMLDivElement {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <GenerationComputation
      trace={trace}
      selection={selection}
      stage={stage}
      progress={progress}
    />
  );
  return host;
}

it("LayerNormのεをゼロへ丸めず、因果マスクの無限大を数学記号で表示する", () => {
  const normalization = render("attention", 0.02);
  expect(
    normalization.querySelector('[data-computation-scalar-input="ε"] dd')
      ?.textContent
  ).toBe("1.00e-5");

  const mask = render("attention", 0.4);
  expect(
    mask.querySelector(
      '[data-computation-matrix="mask後スコア：未来は−∞"] [data-matrix-row="0"][data-matrix-column="1"]'
    )?.textContent
  ).toBe("−∞");
  expect(normalization.textContent).not.toContain("NaN");
  expect(normalization.textContent).not.toContain("Infinity");
  expect(mask.textContent).not.toContain("NaN");
  expect(mask.textContent).not.toContain("Infinity");
});

it("Attention出力の転送中は受け渡し元と先を示し、直前に計算した出力を残す", () => {
  const host = render("attention", 0.8);
  expect(host.querySelector("[data-computation-context]")?.textContent).toBe(
    "LN₁→Attentionの出力 → 残差加算①の入力（直前の計算結果）"
  );
  expect(
    host.querySelector<HTMLElement>("[data-generation-computation]")?.dataset[
      "generationComputation"
    ]
  ).toBe("attention");
  expect(host.querySelector("h2")?.textContent).toBe(
    "2ヘッドを連結し、Wₒで4成分へ"
  );
  const output = host.querySelectorAll(
    '[data-computation-vector="Attentionの出力 A"] [data-output-component] > span:last-child'
  );
  expect([...output].map((cell) => cell.textContent)).toStrictEqual(
    trace.attention.at(-1)?.map((value) => value.toFixed(3))
  );
  expect(
    host.querySelector('[data-computation-matrix="Attention出力A（全位置）"]')
  ).not.toBeNull();
  expect(
    host.querySelector('[data-computation-vector="保持したH⁰"]')
  ).toBeNull();
});

it("語彙IDを成分番号や近似値と区別し、復元後も整数として保持する", () => {
  const ids = Array.from({ length: 8 }, (_, id) => `ID ${id}`);
  const probabilities = render("probabilities", 0.2);
  expect(
    [
      ...probabilities.querySelectorAll(
        '[data-computation-vector="各IDの確率 π"] li > span:first-child'
      ),
    ].map((label) => label.textContent)
  ).toStrictEqual(ids);
  expect(
    [
      ...probabilities.querySelectorAll(
        '[data-computation-matrix="IDごとのスコア・指数・確率"] th[scope="row"]'
      ),
    ].map((label) => label.textContent)
  ).toStrictEqual(ids);
  expect(
    [
      ...probabilities.querySelectorAll<HTMLElement>("[data-probability-id]"),
    ].map((bar) => bar.dataset["probabilityId"])
  ).toStrictEqual(Array.from({ length: 8 }, (_, id) => String(id)));

  const output = render("output", 0.6);
  const weights = output.querySelector(
    '[data-computation-matrix="共有埋め込み表 E（8×4）"]'
  );
  expect(
    [...(weights?.querySelectorAll('th[scope="row"]') ?? [])].map(
      (label) => label.textContent
    )
  ).toStrictEqual(ids);
  expect(
    [...(weights?.querySelectorAll('th[scope="col"]') ?? [])].map(
      (label) => label.textContent
    )
  ).toStrictEqual(["行＼列", "1", "2", "3", "4"]);

  const decoded = render("decode", 0.3);
  expect(decoded.querySelector("[data-computation-scalar]")?.textContent).toBe(
    "整数ID 2から復元 → 「猫」"
  );
  expect(
    decoded.querySelector(
      '[data-computation-vector="復元後も保持する整数ID"] [data-output-component] > span:last-child'
    )?.textContent
  ).toBe("2");
  const returned = render("return", 0.3);
  expect(returned.querySelector("[data-computation-scalar]")?.textContent).toBe(
    "次の予測の入力ID列 = [0, 1, 2, 2]"
  );
});
