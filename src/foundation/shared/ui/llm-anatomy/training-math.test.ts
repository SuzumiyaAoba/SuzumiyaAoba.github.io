import { expect, it } from "vite-plus/test";
import {
  advanceTraining,
  createTrainingRun,
  MAX_TRAINING_STEPS,
  trainingSnapshot,
  trainingStep,
} from "./training-math";
import type {
  TrainingTarget,
  TrainingWeightRow,
  TrainingWeights,
} from "./training-math";

const TARGETS: readonly TrainingTarget[] = [0, 1, 2];

function displacedWeights(
  weights: TrainingWeights,
  row: TrainingTarget,
  column: 0 | 1,
  displacement: number
): TrainingWeights {
  const shiftedRow: TrainingWeightRow = [
    weights[row][0] + (column === 0 ? displacement : 0),
    weights[row][1] + (column === 1 ? displacement : 0),
  ];
  return [
    row === 0 ? shiftedRow : weights[0],
    row === 1 ? shiftedRow : weights[1],
    row === 2 ? shiftedRow : weights[2],
  ];
}

it("固定特徴からlogitを求め、3候補の確率を正規化する", () => {
  const { current } = createTrainingRun();
  expect(current.logits).toStrictEqual([1, 0.19999999999999998, -0.4]);
  expect(
    current.probabilities.reduce((sum, value) => sum + value, 0)
  ).toBeCloseTo(1, 14);
  expect(current.loss).toBeCloseTo(-Math.log(current.probabilities[0]), 14);
  expect(
    current.logitGradients.reduce((sum, value) => sum + value, 0)
  ).toBeCloseTo(0, 14);
});

it("正解確率がアンダーフローしてもlogsumexpで有限の損失を得る", () => {
  const snapshot = trainingSnapshot(
    [
      [1000, 0],
      [0, 0],
      [-1000, 0],
    ],
    2
  );
  expect(snapshot.probabilities).toStrictEqual([1, 0, 0]);
  expect(snapshot.loss).toBe(2000);
  expect(snapshot.logitGradients).toStrictEqual([1, 0, -1]);
});

it.each(TARGETS)("正解 %s の全重みの解析勾配を中心差分と照合する", (target) => {
  expect.assertions(6);
  const { current } = createTrainingRun(target);
  const epsilon = 1e-6;
  for (const row of TARGETS) {
    for (const column of [0, 1] as const) {
      const plus = displacedWeights(current.weights, row, column, epsilon);
      const minus = displacedWeights(current.weights, row, column, -epsilon);
      const numerical =
        (trainingSnapshot(plus, target).loss -
          trainingSnapshot(minus, target).loss) /
        (2 * epsilon);
      expect(current.weightGradients[row][column]).toBeCloseTo(numerical, 8);
    }
  }
});

it.each(TARGETS)(
  "正解 %s の損失を下げ、logitではなく全行の重みを更新する",
  (target) => {
    expect.assertions(15);
    const { current } = createTrainingRun(target);
    const next = trainingStep(current, 0.1);
    expect(next.loss).toBeLessThan(current.loss);
    expect(next.probabilities[target]).toBeGreaterThan(
      current.probabilities[target]
    );
    for (const row of TARGETS) {
      for (const column of [0, 1] as const) {
        expect(next.weights[row][column]).toBeCloseTo(
          current.weights[row][column] -
            0.1 * current.weightGradients[row][column],
          14
        );
        expect(next.weights[row][column]).not.toBe(
          current.weights[row][column]
        );
      }
    }
    expect(current.weights).toStrictEqual([
      [0.8, 0.4],
      [0.3, -0.2],
      [-0.5, 0.2],
    ]);
  }
);

it("重みと損失の履歴を同期させ、20ステップで更新を止める", () => {
  let run = createTrainingRun(2);
  const initial = run.current;
  for (let step = 0; step < MAX_TRAINING_STEPS; step += 1) {
    run = advanceTraining(run, 0.5);
  }
  expect(run.step).toBe(MAX_TRAINING_STEPS);
  expect(run.losses).toHaveLength(MAX_TRAINING_STEPS + 1);
  expect(run.losses[0]).toBe(initial.loss);
  expect(run.losses.at(-1)).toBe(run.current.loss);
  expect(run.losses.at(-2)).toBe(run.previous?.loss);
  expect(run.current.loss).toBeLessThan(initial.loss);
  expect(run.lastLearningRate).toBe(0.5);
  expect(advanceTraining(run, 0.5)).toBe(run);
});

it("正解を変えた試行では同じ初期重みに戻し、損失を再計算する", () => {
  const first = advanceTraining(createTrainingRun(0), 0.5);
  const changed = createTrainingRun(1);
  expect(changed.step).toBe(0);
  expect(changed.previous).toBeNull();
  expect(changed.current.weights).toStrictEqual(
    createTrainingRun(0).current.weights
  );
  expect(changed.current.weights).not.toStrictEqual(first.current.weights);
  expect(changed.losses).toStrictEqual([changed.current.loss]);
  expect(changed.current.loss).toBeCloseTo(
    -Math.log(changed.current.probabilities[1]),
    14
  );
});

it.each([0, -1, Infinity, Number.NaN])(
  "不正な学習率 %s を拒否する",
  (learningRate) => {
    const { current } = createTrainingRun();
    expect(() => trainingStep(current, learningRate)).toThrow("学習率");
  }
);
