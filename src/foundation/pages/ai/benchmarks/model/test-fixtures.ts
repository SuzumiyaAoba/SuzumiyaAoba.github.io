import type { Benchmark, BenchmarkDataset, BenchmarkResult } from "./schema";

export const alphaResult: BenchmarkResult = {
  id: "alpha",
  model: "Alpha",
  provider: "Lab A",
  modelUrl: "https://example.com/alpha",
  score: 90,
  costPerTaskUsd: 0.5,
  inputPerMillionUsd: 1,
  outputPerMillionUsd: 0.1,
  harness: null,
  effort: "high",
};

const betaResult: BenchmarkResult = {
  ...alphaResult,
  id: "beta",
  model: "Beta",
  provider: "Lab B",
  score: 80,
  costPerTaskUsd: 0,
  outputPerMillionUsd: 2,
  effort: null,
};

export const codingBenchmark: Benchmark = {
  id: "coding",
  name: "Coding",
  category: "コーディング",
  description: "コーディングの評価",
  methodology: "同一の評価条件",
  version: "v1",
  source: "Example",
  scoreType: "percentage",
  scoreLabel: "正答率（%）",
  sourceUrl: "https://example.com/coding",
  dataSourceUrl: "https://example.com/data",
  sourceUpdatedAt: null,
  archived: false,
  results: [
    alphaResult,
    betaResult,
    {
      ...alphaResult,
      id: "gamma",
      model: "Gamma",
      score: 70,
      costPerTaskUsd: null,
      inputPerMillionUsd: null,
      outputPerMillionUsd: null,
    },
  ],
};

export const benchmarkDataset: BenchmarkDataset = {
  retrievedAt: "2026-01-01",
  source: "Example",
  selection: "テスト用の評価結果",
  benchmarks: [
    codingBenchmark,
    {
      ...codingBenchmark,
      id: "knowledge",
      name: "Knowledge",
      results: [
        {
          ...alphaResult,
          score: 50,
          effort: "max",
          costPerTaskUsd: null,
          inputPerMillionUsd: null,
        },
        { ...betaResult, costPerTaskUsd: null, inputPerMillionUsd: null },
      ],
    },
  ],
};
