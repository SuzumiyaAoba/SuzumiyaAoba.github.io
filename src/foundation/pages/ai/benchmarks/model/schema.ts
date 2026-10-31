import { z } from "zod";

const sourceUrl = z
  .url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    "Sources must use HTTPS"
  );
const price = z.number().nonnegative().nullable();

const resultSchema = z.object({
  id: z.string().min(1),
  model: z.string().min(1),
  provider: z.string().min(1),
  modelUrl: sourceUrl,
  score: z.number().min(0).max(100),
  costPerTaskUsd: price,
  inputPerMillionUsd: price,
  outputPerMillionUsd: price,
  harness: z.string().nullable(),
  effort: z.string().trim().min(1).nullable(),
});

const benchmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  methodology: z.string().min(1),
  version: z.string().min(1),
  sourceUrl,
  dataSourceUrl: sourceUrl,
  sourceUpdatedAt: z.iso.date(),
  archived: z.boolean(),
  results: z
    .array(resultSchema)
    .min(1)
    .refine(
      (results) =>
        new Set(results.map((result) => result.id)).size === results.length,
      "Model results must have unique IDs within each benchmark"
    ),
});

export const benchmarkDatasetSchema = z.object({
  retrievedAt: z.iso.date(),
  source: z.string().min(1),
  selection: z.string().min(1),
  benchmarks: z
    .array(benchmarkSchema)
    .min(1)
    .refine(
      (benchmarks) =>
        new Set(benchmarks.map((benchmark) => benchmark.id)).size ===
        benchmarks.length,
      "Benchmarks must have unique IDs"
    ),
});

export type BenchmarkResult = z.infer<typeof resultSchema>;
export type Benchmark = z.infer<typeof benchmarkSchema>;
export type BenchmarkDataset = z.infer<typeof benchmarkDatasetSchema>;
