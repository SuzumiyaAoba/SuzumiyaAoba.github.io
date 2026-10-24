"use client";

import { useId, useState } from "react";
import { Button } from "@/shared/ui/button";
import { svgNumber } from "./svg-number";
import {
  advanceTraining,
  createTrainingRun,
  MAX_TRAINING_STEPS,
  TRAINING_CANDIDATES,
  TRAINING_FEATURES,
  trainingStep,
} from "./training-math";
import type {
  TrainingSnapshot,
  TrainingTarget,
  TrainingWeightRow,
} from "./training-math";
import { DemoFrame } from "./visual-frame";

const TARGETS: readonly TrainingTarget[] = [0, 1, 2];
const FEATURE_COLUMNS = [0, 1] as const;

function signed(value: number) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(3)}`;
}

function ProbabilityComparison({
  before,
  after,
}: {
  before: number;
  after: number;
}) {
  return (
    <div className="space-y-1">
      <span className="whitespace-nowrap">
        {(before * 100).toFixed(1)}% → {(after * 100).toFixed(1)}%
      </span>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        className="h-3 w-full"
      >
        <rect width="100" height="12" className="fill-muted" />
        <rect
          width={svgNumber(before * 100)}
          height="5"
          className="fill-chart-2"
        />
        <rect
          y="7"
          width={svgNumber(after * 100)}
          height="5"
          className="fill-primary"
        />
      </svg>
    </div>
  );
}

function WeightUpdateCell({
  before,
  after,
  gradient,
  featureIndex,
  learningRate,
}: {
  before: TrainingWeightRow;
  after: TrainingWeightRow;
  gradient: TrainingWeightRow;
  featureIndex: 0 | 1;
  learningRate: number;
}) {
  const derivative = gradient[featureIndex];
  return (
    <td className="space-y-1 p-3 align-top">
      <div className="relative overflow-hidden rounded-md border p-2">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            width="100"
            height="100"
            fillOpacity={svgNumber(Math.abs(derivative) * 0.35)}
            className={derivative < 0 ? "fill-primary" : "fill-chart-2"}
          />
        </svg>
        <span className="relative font-medium whitespace-nowrap">
          {before[featureIndex].toFixed(3)} → {after[featureIndex].toFixed(3)}
        </span>
      </div>
      <div className="text-xs whitespace-nowrap text-muted-foreground">
        勾配 {signed(derivative)}
      </div>
      <div className="text-xs whitespace-nowrap">
        更新量 {signed(-learningRate * derivative)}
      </div>
    </td>
  );
}

function TrainingCalculation({
  before,
  after,
  target,
  learningRate,
}: {
  before: TrainingSnapshot;
  after: TrainingSnapshot;
  target: TrainingTarget;
  learningRate: number;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <caption className="mb-2 text-left text-xs text-muted-foreground">
            出力の変化。確率の棒は上が更新前、下が更新後である。
          </caption>
          <thead>
            <tr className="border-b text-left">
              <th scope="col" className="p-2">
                候補
              </th>
              <th scope="col" className="p-2">
                logit z：前 → 後
              </th>
              <th scope="col" className="w-1/3 p-2">
                確率 p：前 → 後
              </th>
              <th scope="col" className="p-2">
                勾配 p − y
              </th>
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((index) => (
              <tr key={TRAINING_CANDIDATES[index]} className="border-b">
                <th scope="row" className="p-2 text-left whitespace-nowrap">
                  {TRAINING_CANDIDATES[index]}
                  {index === target ? "（正解）" : ""}
                </th>
                <td className="p-2 whitespace-nowrap">
                  {before.logits[index].toFixed(3)} →{" "}
                  {after.logits[index].toFixed(3)}
                </td>
                <td className="p-2">
                  <ProbabilityComparison
                    before={before.probabilities[index]}
                    after={after.probabilities[index]}
                  />
                </td>
                <td className="p-2">{signed(before.logitGradients[index])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <caption className="mb-2 text-left text-xs text-muted-foreground">
            実際に変更する重み W。色の濃さは勾配の絶対値を表す。 ∂L/∂Wᵢⱼ = (pᵢ −
            yᵢ)hⱼ、更新量 = −η ∂L/∂Wᵢⱼ。
          </caption>
          <thead>
            <tr className="border-b text-left">
              <th scope="col" className="p-3">
                出力の行 i
              </th>
              {FEATURE_COLUMNS.map((featureIndex) => (
                <th
                  key={featureIndex}
                  scope="col"
                  className="p-3 whitespace-nowrap"
                >
                  Wᵢ{featureIndex + 1}（h{featureIndex + 1} ={" "}
                  {TRAINING_FEATURES[featureIndex]}）
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TARGETS.map((index) => (
              <tr key={TRAINING_CANDIDATES[index]} className="border-b">
                <th scope="row" className="p-3 text-left whitespace-nowrap">
                  {TRAINING_CANDIDATES[index]}
                </th>
                {FEATURE_COLUMNS.map((featureIndex) => (
                  <WeightUpdateCell
                    key={featureIndex}
                    before={before.weights[index]}
                    after={after.weights[index]}
                    gradient={before.weightGradients[index]}
                    featureIndex={featureIndex}
                    learningRate={learningRate}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        正解の行では p − 1 &lt; 0、それ以外の行では p &gt; 0 となる。 この例では
        h の両成分が正なので、正解の重みは増え、他の重みは減る。 変更した W から
        z = Wh を計算し直すと、正解の確率が上がる。
      </p>
    </div>
  );
}

function LossHistory({ losses }: { losses: readonly number[] }) {
  const id = useId();
  const maximum = Math.max(1, losses[0] ?? 1);
  const points = losses.map((loss, step) => ({
    step,
    x: 50 + (step / MAX_TRAINING_STEPS) * 460,
    y: 130 - (loss / maximum) * 100,
  }));
  const lastPoint = points.at(-1);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-medium">
        実行済みのステップと損失 L
      </figcaption>
      <svg
        // SVG図はimg要素に置き換えられないため、画像としての意味を明示する。
        // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        viewBox="0 0 560 164"
        className="h-auto w-full"
      >
        <title id={`${id}-title`}>学習による損失の推移</title>
        <desc id={`${id}-description`}>
          {losses
            .map((loss, step) => `${step}ステップ：${loss.toFixed(3)}`)
            .join("、")}
        </desc>
        <path d="M50 20 V130 H520" fill="none" className="stroke-border" />
        <path
          d="M50 80 H520 M50 30 H520"
          fill="none"
          className="stroke-border"
          strokeDasharray="4 4"
        />
        <text
          x="42"
          y="34"
          textAnchor="end"
          className="fill-muted-foreground text-xs"
        >
          {maximum.toFixed(1)}
        </text>
        <text
          x="42"
          y="134"
          textAnchor="end"
          className="fill-muted-foreground text-xs"
        >
          0
        </text>
        <text
          x="50"
          y="154"
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          0
        </text>
        <text
          x="280"
          y="154"
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          10
        </text>
        <text
          x="510"
          y="154"
          textAnchor="middle"
          className="fill-muted-foreground text-xs"
        >
          20 step
        </text>
        <polyline
          points={points
            .map(({ x, y }) => `${svgNumber(x)},${svgNumber(y)}`)
            .join(" ")}
          fill="none"
          strokeWidth="3"
          className="stroke-primary"
        />
        {points.map(({ step, x, y }) => (
          <circle
            key={step}
            cx={svgNumber(x)}
            cy={svgNumber(y)}
            r="3"
            className="fill-primary"
          />
        ))}
        {lastPoint ? (
          <text
            x={svgNumber(lastPoint.x + 8)}
            y={svgNumber(lastPoint.y - 10)}
            className="fill-foreground text-xs"
          >
            {losses.at(-1)?.toFixed(3)}
          </text>
        ) : null}
      </svg>
    </figure>
  );
}

export function LlmTrainingDemo() {
  const id = useId();
  const [run, setRun] = useState(() => createTrainingRun());
  const [learningRate, setLearningRate] = useState(0.5);
  const atLimit = run.step >= MAX_TRAINING_STEPS;
  const before = atLimit ? (run.previous ?? run.current) : run.current;
  const after = atLimit ? run.current : trainingStep(run.current, learningRate);
  const shownLearningRate = atLimit
    ? (run.lastLearningRate ?? learningRate)
    : learningRate;

  return (
    <DemoFrame
      title="予測の誤差を、重みの更新までたどる"
      description="特徴 h = [1, 0.5] を固定し、3候補の出力層 W（3行×2列、バイアスなし）だけを学習する説明用モデルである。GPT-3の実測ではない。更新則は基本的なSGDであり、GPT-3が用いたAdamではない。"
      label="損失と勾配による学習の可視化"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`${id}-target`} className="block text-sm font-medium">
            この例の正解
          </label>
          <select
            id={`${id}-target`}
            value={run.target}
            aria-describedby={`${id}-reset-note`}
            onChange={(event) => {
              const target = TARGETS.find(
                (value) => value === Number(event.target.value)
              );
              if (target !== undefined) {
                setRun(createTrainingRun(target));
              }
            }}
            className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            {TARGETS.map((target) => (
              <option key={TRAINING_CANDIDATES[target]} value={target}>
                {TRAINING_CANDIDATES[target]}
              </option>
            ))}
          </select>
          <p id={`${id}-reset-note`} className="text-xs text-muted-foreground">
            正解を変えると、同じ初期重みから学習し直す。
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-rate`} className="block text-sm font-medium">
            学習率 η：{learningRate.toFixed(2)}
          </label>
          <input
            id={`${id}-rate`}
            type="range"
            min="0.05"
            max="1"
            step="0.05"
            value={learningRate}
            disabled={atLimit}
            onChange={(event) => setLearningRate(Number(event.target.value))}
            className="h-8 w-full accent-primary"
          />
          <p className="text-xs text-muted-foreground">
            学習率を変えると、次の更新量が変わる。
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={atLimit}
          onClick={() =>
            setRun((current) => advanceTraining(current, learningRate))
          }
        >
          1ステップ更新する
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setRun(createTrainingRun(run.target))}
        >
          初期重みに戻す
        </Button>
      </div>
      <output
        className="block rounded-md bg-muted p-3 text-sm tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        実行済み {run.step} / {MAX_TRAINING_STEPS} ステップ。 現在の損失 L =
        −log p（{TRAINING_CANDIDATES[run.target]}）={" "}
        {run.current.loss.toFixed(3)}。 正解の確率は{" "}
        {(run.current.probabilities[run.target] * 100).toFixed(1)}%。
        {atLimit
          ? "更新上限に達した。正解の変更かリセットで最初から試せる。"
          : ""}
      </output>
      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {atLimit
            ? `最後に実行した更新：${run.step - 1} → ${run.step}`
            : `次の更新のプレビュー：${run.step} → ${run.step + 1}（未実行）`}
        </p>
        <p className="text-sm text-muted-foreground">
          zᵢ = Wᵢ₁ × 1 + Wᵢ₂ × 0.5、p = softmax(z)、η ={" "}
          {shownLearningRate.toFixed(2)}。 損失は {before.loss.toFixed(3)} →{" "}
          {after.loss.toFixed(3)} となる。
        </p>
      </div>
      <TrainingCalculation
        before={before}
        after={after}
        target={run.target}
        learningRate={shownLearningRate}
      />
      <LossHistory losses={run.losses} />
      <p className="text-xs text-muted-foreground">
        ここで更新するのは各候補のlogitそのものではなく、入力からlogitを作る重みWである。
        同じWは別の入力にも使われる。実際の学習では多くの文脈を用い、誤差を出力層より前にも伝えてモデル全体の重みを更新する。
        このグラフは同じ1例の学習損失であり、未知の文章への性能は示さない。表示値は丸め、内部計算には丸め前の値を使う。
      </p>
    </DemoFrame>
  );
}
