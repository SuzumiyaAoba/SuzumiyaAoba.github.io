export type SeriesData = {
  year: string;
  values: Record<string, number | null>;
};

export type SheetData = {
  metadata: {
    title: string;
    toc_title?: string;
  };
  headers: string[];
  series: SeriesData[];
};

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
