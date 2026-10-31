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
  score: z.number(),
  costPerTaskUsd: price,
  inputPerMillionUsd: price,
  outputPerMillionUsd: price,
  harness: z.string().nullable(),
  effort: z.string().trim().min(1).nullable(),
  configuration: z.string().trim().min(1).nullable().optional(),
});

const scoreTypeSchema = z.enum(["percentage", "elo", "net-score"]);

const benchmarkSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    description: z.string().min(1),
    methodology: z.string().min(1),
    selection: z.string().min(1).optional(),
    version: z.string().min(1),
    source: z.string().min(1),
    scoreType: scoreTypeSchema,
    scoreLabel: z.string().min(1),
    costMethodology: z.string().min(1).optional(),
    costCalculationUrl: sourceUrl.optional(),
    sourceUrl,
    dataSourceUrl: sourceUrl,
    sourceUpdatedAt: z.iso.date().nullable(),
    archived: z.boolean(),
    results: z
      .array(resultSchema)
      .min(1)
      .refine(
        (results) =>
          new Set(results.map((result) => result.id)).size === results.length,
        "Model results must have unique IDs within each benchmark"
      ),
  })
  .superRefine((benchmark, context) => {
    const minimum = benchmark.scoreType === "net-score" ? -100 : 0;
    for (const [index, result] of benchmark.results.entries()) {
      if (
        result.score < minimum ||
        (benchmark.scoreType !== "elo" && result.score > 100)
      ) {
        context.addIssue({
          code: "custom",
          path: ["results", index, "score"],
          message: `Score is outside the range for ${benchmark.scoreType}`,
        });
      }
    }
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
export type ScoreType = z.infer<typeof scoreTypeSchema>;
