export const TRAINING_CANDIDATES = ["返す", "読む", "買う"] as const;
export const TRAINING_FEATURES = [1, 0.5] as const;
export const MAX_TRAINING_STEPS = 20;

export type TrainingTarget = 0 | 1 | 2;
export type TrainingVector = readonly [number, number, number];
export type TrainingWeightRow = readonly [number, number];
export type TrainingWeights = readonly [
  TrainingWeightRow,
  TrainingWeightRow,
  TrainingWeightRow,
];

const INITIAL_WEIGHTS: TrainingWeights = [
  [0.8, 0.4],
  [0.3, -0.2],
  [-0.5, 0.2],
];

export type TrainingSnapshot = {
  target: TrainingTarget;
  weights: TrainingWeights;
  logits: TrainingVector;
  probabilities: TrainingVector;
  loss: number;
  logitGradients: TrainingVector;
  weightGradients: TrainingWeights;
};

export type TrainingRun = {
  target: TrainingTarget;
  step: number;
  current: TrainingSnapshot;
  previous: TrainingSnapshot | null;
  lastLearningRate: number | null;
  losses: readonly number[];
};

function featureProduct(row: TrainingWeightRow) {
  return row[0] * TRAINING_FEATURES[0] + row[1] * TRAINING_FEATURES[1];
}

function weightGradient(gradient: number): TrainingWeightRow {
  return [gradient * TRAINING_FEATURES[0], gradient * TRAINING_FEATURES[1]];
}

export function trainingSnapshot(
  weights: TrainingWeights,
  target: TrainingTarget
): TrainingSnapshot {
  if (!Number.isInteger(target) || target < 0 || target > 2) {
    throw new Error("正解は3候補のいずれかである必要がある。");
  }
  if (!weights.every((row) => row.every(Number.isFinite))) {
    throw new Error("重みには有限の数値が必要である。");
  }

  const logits: TrainingVector = [
    featureProduct(weights[0]),
    featureProduct(weights[1]),
    featureProduct(weights[2]),
  ];
  const maximum = Math.max(...logits);
  const exponentials: TrainingVector = [
    Math.exp(logits[0] - maximum),
    Math.exp(logits[1] - maximum),
    Math.exp(logits[2] - maximum),
  ];
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const probabilities: TrainingVector = [
    exponentials[0] / denominator,
    exponentials[1] / denominator,
    exponentials[2] / denominator,
  ];
  const logitGradients: TrainingVector = [
    probabilities[0] - Number(target === 0),
    probabilities[1] - Number(target === 1),
    probabilities[2] - Number(target === 2),
  ];

  return {
    target,
    weights,
    logits,
    probabilities,
    // -log(p_y) を直接計算せず、確率のアンダーフローでも損失を保つ。
    loss: maximum - logits[target] + Math.log(denominator),
    logitGradients,
    weightGradients: [
      weightGradient(logitGradients[0]),
      weightGradient(logitGradients[1]),
      weightGradient(logitGradients[2]),
    ],
  };
}

function updateRow(
  row: TrainingWeightRow,
  gradient: TrainingWeightRow,
  learningRate: number
): TrainingWeightRow {
  return [
    row[0] - learningRate * gradient[0],
    row[1] - learningRate * gradient[1],
  ];
}

export function trainingStep(
  snapshot: TrainingSnapshot,
  learningRate: number
): TrainingSnapshot {
  if (!Number.isFinite(learningRate) || learningRate <= 0) {
    throw new Error("学習率には正の有限値が必要である。");
  }
  return trainingSnapshot(
    [
      updateRow(snapshot.weights[0], snapshot.weightGradients[0], learningRate),
      updateRow(snapshot.weights[1], snapshot.weightGradients[1], learningRate),
      updateRow(snapshot.weights[2], snapshot.weightGradients[2], learningRate),
    ],
    snapshot.target
  );
}

export function createTrainingRun(target: TrainingTarget = 0): TrainingRun {
  const current = trainingSnapshot(INITIAL_WEIGHTS, target);
  return {
    target,
    step: 0,
    current,
    previous: null,
    lastLearningRate: null,
    losses: [current.loss],
  };
}

export function advanceTraining(
  run: TrainingRun,
  learningRate: number
): TrainingRun {
  if (run.step >= MAX_TRAINING_STEPS) {
    return run;
  }
  const current = trainingStep(run.current, learningRate);
  return {
    target: run.target,
    step: run.step + 1,
    current,
    previous: run.current,
    lastLearningRate: learningRate,
    losses: [...run.losses, current.loss],
  };
}
