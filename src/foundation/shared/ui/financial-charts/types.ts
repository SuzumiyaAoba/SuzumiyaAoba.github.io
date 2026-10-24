import { z } from "zod";

const SeriesDataSchema = z.object({
  year: z.string(),
  values: z.record(z.string(), z.number().nullable()),
});

export const SheetDataSchema = z.object({
  metadata: z.object({
    title: z.string(),
    toc_title: z.string().optional(),
  }),
  headers: z.array(z.string()),
  series: z.array(SeriesDataSchema),
});

export type SheetData = z.infer<typeof SheetDataSchema>;

export type MetricGroup = {
  name: string;
  metrics: string[];
};

export type ChartConfig = {
  yAxisMin?: number;
  yAxisMax?: number;
  yAxisLabel?: string;
  startYear?: number;
  colors?: string[];
  labelMap?: Record<string, string>; // ヘッダー名→表示用ラベルのマッピング
};
